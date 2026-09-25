// src/services/implementation/user.service.ts
import { IUserService } from '../interface/IUser.service'
import IUser from '../../interfaces/IUser'
import CustomError from '../../utils/CustomError'
import { HttpStatus } from '../../enums/http.status'
import { IMediaService } from '../interface/IMedia.service'
import { UserRepository } from '../../repositories/implementation/user.repository'
import { UserEventPublisher } from '../../publishers/user.publisher'
import { UserEventType } from '../../events/user.events'

// Max file size for avatars: 5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

// Helper function to escape regex special characters
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class UserService implements IUserService {
  private userRepo: UserRepository
  private mediaService: IMediaService
  private eventPublisher: UserEventPublisher

  constructor(
    userRepo: UserRepository,
    mediaService: IMediaService,
    eventPublisher: UserEventPublisher
  ) {
    this.userRepo = userRepo
    this.mediaService = mediaService
    this.eventPublisher = eventPublisher
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    const created = await this.userRepo.create(data)
    
    // Publish USER_CREATED event
    await this.eventPublisher.publishUserEvent({
      eventType: UserEventType.USER_CREATED,
      userId: created._id.toString(),
      timestamp: new Date(),
      data: created as any
    })
    
    return created
  }

  async getById(id: string): Promise<IUser | null> {
    const user = await this.userRepo.findByIdLean(id)
    return user
  }

  async list(query: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isApproved?: string
    sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
  }) {
    const page = query.page && query.page > 0 ? query.page : 1
    // Limit maximum items per page to prevent large data dumps
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const filter: any = {}
    if (query.search) {
      // Escape regex to prevent ReDoS attacks
      const sanitizedSearch = escapeRegex(query.search)
      filter.$or = [
        { fullName: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { phoneNumber: { $regex: sanitizedSearch, $options: 'i' } },
      ]
    }
    if (query.role) filter.role = query.role
    if (query.isApproved) filter.isApproved = query.isApproved

    // Build sort object
    let sort: any = { createdAt: -1 } // Default sort
    if (query.sort && query.sort.length > 0) {
      sort = {}
      query.sort.forEach((s) => {
        sort[s.column] = s.direction === 'asc' ? 1 : -1
      })
    }

    const [data, total] = await Promise.all([
      this.userRepo.findAll(filter, {
        skip,
        limit,
        sort,
        projection: { password: 0 },
      }),
      this.userRepo.count(filter),
    ])
    return { data, total, page, limit }
  }

  async patch(id: string, payload: Partial<IUser>): Promise<IUser | null> {
    // Prevent password updates here; password change happens in AuthService
    if ((payload as any).password) delete (payload as any).password
    const patched = await this.userRepo.update(id, payload)
    if (!patched) throw new CustomError('User not found', HttpStatus.NOT_FOUND)

    // Publish USER_UPDATED event
    await this.eventPublisher.publishUserEvent({
      eventType: UserEventType.USER_UPDATED,
      userId: patched._id.toString(),
      timestamp: new Date(),
      data: patched as any,
      metadata: {
        updatedFields: Object.keys(payload)
      }
    })

    return patched
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepo.findById(id)
    if (!existing) throw new CustomError('User not found', HttpStatus.NOT_FOUND)
    // remove avatar from cloud if exists
    if ((existing as any).avatar?.publicId) {
      await this.mediaService.deleteImage((existing as any).avatar.publicId)
    }
    await this.userRepo.delete(id)

    // Publish USER_DELETED event
    await this.eventPublisher.publishUserEvent({
      eventType: UserEventType.USER_DELETED,
      userId: id,
      timestamp: new Date(),
      data: existing as any 
    })
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File
  ): Promise<{ publicId: string; url: string }> {
    if (!file) throw new CustomError('No file uploaded', HttpStatus.BAD_REQUEST)

    // Validate file size before processing
    if (file.size > MAX_AVATAR_SIZE) {
      throw new CustomError(
        `File size exceeds maximum allowed size of ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST
      )
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new CustomError(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        HttpStatus.BAD_REQUEST
      )
    }

    const existing = await this.userRepo.findById(id)
    if (!existing) throw new CustomError('User not found', HttpStatus.NOT_FOUND)

    // delete old avatar if present
    if ((existing as any).avatar?.publicId) {
      await this.mediaService.deleteImage((existing as any).avatar.publicId)
    }

    const uploaded = await this.mediaService.uploadImage(
      file.buffer,
      file.originalname,
      process.env.AWS_S3_FOLDER || 'user/avatars'
    )
    const updated = await this.userRepo.update(id, {
      avatar: { publicId: uploaded.publicId, url: uploaded.url },
    })
    if (!updated)
      throw new CustomError(
        'Failed to update avatar',
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    // Publish USER_AVATAR_UPDATED event
    await this.eventPublisher.publishUserEvent({
      eventType: UserEventType.USER_AVATAR_UPDATED,
      userId: id,
      timestamp: new Date(),
      data: updated as any
    })

    return uploaded
  }

  async uploadPublicAvatar(
    file: Express.Multer.File
  ): Promise<{ publicId: string; url: string }> {
    if (!file) throw new CustomError('No file uploaded', HttpStatus.BAD_REQUEST)

    if (file.size > MAX_AVATAR_SIZE) {
      throw new CustomError(
        `File size exceeds maximum allowed size of ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST
      )
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new CustomError(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        HttpStatus.BAD_REQUEST
      )
    }

    const uploaded = await this.mediaService.uploadImage(
      file.buffer,
      file.originalname,
      process.env.AWS_S3_FOLDER || 'user/avatars'
    )
    return uploaded
  }

  async removeAvatar(id: string): Promise<void> {
    const existing = await this.userRepo.findById(id)
    if (!existing) throw new CustomError('User not found', HttpStatus.NOT_FOUND)
    if ((existing as any).avatar?.publicId) {
      await this.mediaService.deleteImage((existing as any).avatar.publicId)
      const updated = await this.userRepo.update(id, { avatar: null })
      
      // Publish USER_AVATAR_UPDATED event
      if(updated) {
        await this.eventPublisher.publishUserEvent({
          eventType: UserEventType.USER_AVATAR_UPDATED,
          userId: id,
          timestamp: new Date(),
          data: updated as any
        })
      }
    }
  }

  async getUserContact(
    userId: string
  ): Promise<{ email: string; phoneNumber: string }> {
    const user = await this.userRepo.findByIdLean(userId)
    if (!user) throw new CustomError('User not found', HttpStatus.NOT_FOUND)
    return { email: user.email, phoneNumber: user.phoneNumber }
  }
}
