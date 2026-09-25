import { RoomDocument } from '../../models/room.model'

export type ListQuery = {
  page?: number
  limit?: number
  type?: string
  minPrice?: number
  maxPrice?: number
  available?: boolean
  sortBy?: 'price' | 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
  search?: string
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}

export interface IRoomService {
  createRoom(
    payload: Partial<RoomDocument>,
    files?: Express.Multer.File[]
  ): Promise<RoomDocument>
  getRoomById(id: string): Promise<RoomDocument | null>
  listRooms(
    query: ListQuery
  ): Promise<{
    data: RoomDocument[]
    total: number
    page: number
    limit: number
  }>
  patchRoom(
    id: string,
    payload: Partial<RoomDocument>,
    files?: Express.Multer.File[]
  ): Promise<RoomDocument | null>
  deleteRoom(id: string): Promise<void>
}
