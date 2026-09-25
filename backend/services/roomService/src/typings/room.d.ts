export type RoomType = 'Standard' | 'Deluxe' | 'Premium' | 'Luxury'

export interface IRoomImage {
  publicId: string
  url: string
}

export interface IRoom {
  number: number
  name: string
  type: RoomType
  price: number
  image?: IRoomImage // Cloudinary info
  images?: IRoomImage[] // Multiple images support
  description?: string
  amenities: string[]
  size: number
  capacity: number
  category: 'Single' | 'Double' | 'Suite' | 'Family'
  rating?: number
  available: boolean
  createdAt?: Date
  updatedAt?: Date
}
