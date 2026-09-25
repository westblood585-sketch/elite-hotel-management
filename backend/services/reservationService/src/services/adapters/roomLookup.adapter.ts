// src/services/adapters/roomLookup.adapter.ts
import axios from 'axios'
import { IRoomLookupService } from '../interface/IReservation.service'

export class RoomLookupAdapter implements IRoomLookupService {
  private baseUrl: string

  constructor(
    baseUrl = process.env.ROOM_SERVICE_URL || 'http://localhost:4003'
  ) {
    this.baseUrl = baseUrl
  }

  async ensureRoomExists(roomId: string) {
    try {
      const res = await axios.get(`${this.baseUrl}/${roomId}`)
      const room = res.data?.data

      if (!room) throw new Error('Room not found')

      return {
        id: room._id,
        price: room.price,
        available: room.available,
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error('Room not found')
      }
      throw new Error('Failed to fetch room details')
    }
  }

  async getAllRooms() {
    try {
      // Request a high limit to ensure we get all rooms for availability checking
      const res = await axios.get(`${this.baseUrl}/?limit=1000`)
      const rooms = res.data?.data

      if (!Array.isArray(rooms)) {
        console.error('RoomLookupAdapter: Invalid response format', res.data)
        throw new Error('Invalid response format: expected an array of rooms')
      }

      return rooms.map((room: any) => ({
        id: room._id,
        price: room.price,
        available: room.available,
        number: Number(room.number || 0),
        type: room.type || 'unknown',
        category: room.category || 'unknown',
        name: room.name,
        description: room.description,
        image: room.image,
        images: (room.images && room.images.length > 0) ? room.images : (room.image ? [room.image] : []),
        amenities: room.amenities,
        size: room.size,
        capacity: room.capacity,
        rating: room.rating,
      }))
    } catch (err: any) {
      console.error('RoomLookupAdapter: Failed to fetch rooms', err.message)
      throw new Error('Failed to fetch all rooms')
    }
  }
}
