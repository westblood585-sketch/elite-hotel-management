import { Document } from 'mongoose'

export interface IRoom {
  roomId?: number // numeric id (auto-incremented)
  name: string
  type: string
  price: number
  image?: string
  description?: string
  amenities?: string[]
  size?: string
  capacity?: string
  rating?: number
  available?: boolean
}

export interface IRoomDocument extends IRoom, Document {}
