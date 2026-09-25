// src/services/implementation/guest.service.ts
import { IGuestService, GuestListQuery } from '../interface/IGuest.service'
import { IGuestRepository } from '../../repository/interface/IGuest.repository'
import { GuestDocument } from '../../models/guest.model'
import CustomError from '../../utils/CustomError'
import { HttpStatus } from '../../enums/http.status'
import { IMediaService } from '../interface/IMedia.service'

export class GuestService implements IGuestService {
  private guestRepo: IGuestRepository
  private media: IMediaService

  constructor(guestRepo: IGuestRepository, mediaService: IMediaService) {
    this.guestRepo = guestRepo
    this.media = mediaService
  }

  private coerce(payload: any) {
    if (payload?.preferences?.smoking != null) {
      payload.preferences.smoking = ['true', '1', true, 1].includes(
        payload.preferences.smoking
      )
    }
    return payload
  }

  async create(
    payload: Partial<GuestDocument>,
    idProofImage?: Express.Multer.File
  ) {
    payload = this.coerce(payload)
    if (!payload?.firstName || !payload?.phoneNumber) {
      throw new CustomError(
        'firstName and phoneNumber are required',
        HttpStatus.BAD_REQUEST
      )
    }
    // Prevent duplicate by email/phone if provided
    const existing = await this.guestRepo.findByEmailOrPhone(
      payload.email as any,
      payload.phoneNumber as any
    )
    if (existing) {
      throw new CustomError(
        'Guest already exists with provided email/phone',
        HttpStatus.CONFLICT
      )
    }

    if (idProofImage) {
      const uploaded = await this.media.uploadImage(
        idProofImage.buffer,
        idProofImage.originalname,
        process.env.AWS_S3_FOLDER || 'hotel/guests/'
      )
      payload.idProof = {
        ...(payload.idProof || {}),
        image: { publicId: uploaded.publicId, url: uploaded.url },
      }
    }

    return this.guestRepo.create(payload as any)
  }

  getById(id: string) {
    return this.guestRepo.findById(id)
  }

  async list(query: GuestListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? query.limit : 20
    const skip = (page - 1) * limit

    const filter: any = {}
    if (typeof query.isBlacklisted === 'boolean')
      filter.isBlacklisted = query.isBlacklisted
    
    // Use regex for more flexible search (name, email, phone)
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i')
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex }
      ]
    }

    // Field projection: only select necessary fields for listing
    const projection = {
      firstName: 1,
      lastName: 1,
      email: 1,
      phoneNumber: 1,
      isBlacklisted: 1,
      createdAt: 1,
      updatedAt: 1,
      'idProof.type': 1,
      status: 1,
      isIdVerified: 1,
      lastVisit: 1,
    }

    // Build sort object
    let sort: any = { createdAt: -1 }
    if (query.sort && query.sort.length > 0) {
      sort = {}
      query.sort.forEach((s) => {
        sort[s.column] = s.direction === 'asc' ? 1 : -1
      })
    }

    const [data, total] = await Promise.all([
      this.guestRepo.findAll(
        filter,
        { 
          skip, 
          limit, 
          sort,
          projection 
        }
      ),
      this.guestRepo.count(filter),
    ])
    return { data, total, page, limit }
  }

  async patch(id: string, payload: Partial<GuestDocument>) {
    payload = this.coerce(payload)
    const patched = await this.guestRepo.update(id, payload)
    if (!patched) throw new CustomError('Guest not found', HttpStatus.NOT_FOUND)
    return patched
  }

  async delete(id: string) {
    const existing = await this.guestRepo.findById(id)
    if (!existing)
      throw new CustomError('Guest not found', HttpStatus.NOT_FOUND)
    if (existing.idProof?.image?.publicId) {
      await this.media.deleteImage(existing.idProof.image.publicId)
    }
    await this.guestRepo.delete(id)
  }

  async updateIdProofImage(id: string, file: Express.Multer.File) {
    if (!file) throw new CustomError('No file uploaded', HttpStatus.BAD_REQUEST)
    const existing = await this.guestRepo.findById(id)
    if (!existing)
      throw new CustomError('Guest not found', HttpStatus.NOT_FOUND)

    if (existing.idProof?.image?.publicId) {
      await this.media.deleteImage(existing.idProof.image.publicId)
    }
    const uploaded = await this.media.uploadImage(
      file.buffer,
      file.originalname,
      process.env.AWS_S3_FOLDER || 'hotel/guests/'
    )
    await this.guestRepo.update(id, {
      'idProof.image': {
        publicId: uploaded.publicId,
        url: uploaded.url,
      },
    } as any)
    return uploaded
  }

  async removeIdProofImage(id: string) {
    const existing = await this.guestRepo.findById(id)
    if (!existing)
      throw new CustomError('Guest not found', HttpStatus.NOT_FOUND)
    if (existing.idProof?.image?.publicId) {
      await this.media.deleteImage(existing.idProof.image.publicId)
      await this.guestRepo.update(id, {
        'idProof.image': null,
      } as any)
    }
  }

  async ensureGuestForBooking(payload: {
    firstName: string
    lastName?: string
    email?: string
    phoneNumber: string
    idProof?: { type?: string; number?: string }
  }) {
    if (!payload.firstName || !payload.phoneNumber) {
      throw new CustomError(
        'firstName and phoneNumber are required',
        HttpStatus.BAD_REQUEST
      )
    }
    const existing = await this.guestRepo.findByEmailOrPhone(
      payload.email,
      payload.phoneNumber
    )
    if (existing) return existing
    return this.guestRepo.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      idProof: payload.idProof || undefined,
    } as any)
  }

  async updateLastVisit(id: string) {
    await this.guestRepo.update(id, { lastVisit: new Date() } as any)
  }
}
