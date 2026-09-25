import { IRoomService, ListQuery } from '../interface/IRoom.service'
import { IRoomRepository } from '../../repository/interface/IRoom.repository'
import CustomError from '../../utils/CustomError'
import { HttpStatus } from '../../enums/http.status'
import { RoomDocument } from '../../models/room.model'
import { IMediaService } from '../interface/IMedia.service'
import { cacheService } from '../../utils/cache.service'

export class RoomService implements IRoomService {
  private roomRepository: IRoomRepository
  private mediaService: IMediaService

  constructor(roomRepository: IRoomRepository, mediaService: IMediaService) {
    this.roomRepository = roomRepository
    this.mediaService = mediaService
  }

  private coerceBody(payload: any): any {
    // Handle amenities sent as stringified JSON or comma-separated
    if (typeof payload.amenities === 'string') {
      try {
        const parsed = JSON.parse(payload.amenities)
        if (Array.isArray(parsed)) payload.amenities = parsed
      } catch {
        payload.amenities = payload.amenities
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    }
    if (payload.number) payload.number = Number(payload.number)
    if (payload.price) payload.price = Number(payload.price)
    if (payload.rating) payload.rating = Number(payload.rating)
    if (payload.available != null)
      payload.available = ['true', '1', true, 1].includes(payload.available)
    return payload
  }

  async createRoom(payload: Partial<RoomDocument>, files?: Express.Multer.File[]) {
    payload = this.coerceBody(payload)

    if (payload.number == null) {
      throw new CustomError('Room number required', HttpStatus.BAD_REQUEST)
    }
    const exists = await this.roomRepository.findByNumber(
      payload.number as number
    )
    if (exists) {
      throw new CustomError('Room number already exists', HttpStatus.CONFLICT)
    }

    const uploadedImages = []
    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await this.mediaService.uploadImage(
          file.buffer,
          file.originalname
        )
        uploadedImages.push({
          publicId: uploaded.publicId,
          url: uploaded.url,
        })
      }
    }
    
    // Set both image (for backward compatibility) and images
    if (uploadedImages.length > 0) {
      ;(payload as any).image = uploadedImages[0]
      ;(payload as any).images = uploadedImages
    }

    const newRoom = await this.roomRepository.create(payload)
    // Invalidate list caches when a new room is created
    cacheService.invalidateRoomCaches()
    return newRoom
  }

  async getRoomById(id: string) {
    const cacheKey = `room:${id}`
    const cached = cacheService.get<RoomDocument>(cacheKey)
    if (cached) {
      return cached
    }

    const room = await this.roomRepository.findById(id)
    if (room) {
      cacheService.set(cacheKey, room)
    }
    return room
  }

  async listRooms(query: ListQuery) {
    const {
      page = 1,
      limit = 20,
      type,
      minPrice,
      maxPrice,
      available,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query

    const filter: any = {}
    if (type) filter.type = type
    if (available !== undefined) filter.available = available
    if (minPrice != null || maxPrice != null) {
      filter.price = {}
      if (minPrice != null) filter.price.$gte = minPrice
      if (maxPrice != null) filter.price.$lte = maxPrice
    }
    // Use text search for better performance when search query exists
    if (search) {
      filter.$text = { $search: search }
    }

    const skip = (page - 1) * limit
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
    if (query.sort && query.sort.length > 0) {
      // Override with multi-column sort if provided
      const multiSort: any = {}
      query.sort.forEach((s) => {
        multiSort[s.column] = s.direction === 'asc' ? 1 : -1
      })
      Object.assign(sort, multiSort)
    }

    // Create cache key based on query parameters
    const cacheKey = `rooms:${JSON.stringify({ page, limit, type, minPrice, maxPrice, available, sortBy, sortOrder, search, sort })}`
    const cached = cacheService.get<{ data: RoomDocument[]; total: number; page: number; limit: number }>(cacheKey)
    if (cached) {
      return cached
    }

    const [data, total] = await Promise.all([
      this.roomRepository.findAll(filter, { skip, limit, sort }),
      this.roomRepository.count(filter),
    ])
    const result = { data, total, page, limit }
    cacheService.set(cacheKey, result, 180) // Cache for 3 minutes (shorter than default)
    return result
  }

  async patchRoom(
    id: string,
    payload: Partial<RoomDocument>,
    files?: Express.Multer.File[]
  ) {
    payload = this.coerceBody(payload)
    const existing = await this.roomRepository.findById(id)
    if (!existing) throw new CustomError('Room not found', HttpStatus.NOT_FOUND)

    if (files && files.length > 0) {
      // Upload new images
      const newImages = []
      for (const file of files) {
        const uploaded = await this.mediaService.uploadImage(
          file.buffer,
          file.originalname
        )
        newImages.push({
          publicId: uploaded.publicId,
          url: uploaded.url,
        })
      }

      // Append to existing images
      const currentImages = existing.images || []
      const updatedImages = [...currentImages, ...newImages]
      
      ;(payload as any).images = updatedImages
      // Update primary image if it wasn't set or if we want to update it to the first new one
      if (!existing.image || !existing.image.url) {
        ;(payload as any).image = newImages[0]
      }
    }

    const updated = await this.roomRepository.patch(id, payload)
    // Invalidate caches for this room and all list caches
    cacheService.del(`room:${id}`)
    cacheService.invalidateRoomCaches()
    return updated
  }

  async deleteRoom(id: string): Promise<void> {
    const existing = await this.roomRepository.findById(id)
    if (!existing) throw new CustomError('Room not found', HttpStatus.NOT_FOUND)

    if (existing.image?.publicId) {
      await this.mediaService.deleteImage(existing.image.publicId)
    }
    await this.roomRepository.delete(id)
    // Invalidate caches for this room and all list caches
    cacheService.del(`room:${id}`)
    cacheService.invalidateRoomCaches()
  }
}
