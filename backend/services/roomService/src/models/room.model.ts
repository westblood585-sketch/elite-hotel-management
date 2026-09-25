import { Schema, model, Document } from 'mongoose'
import { IRoom } from '../typings/room.d'

export interface RoomDocument extends IRoom, Document {}

const ImageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
)

const RoomSchema = new Schema<RoomDocument>(
  {
    number: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Standard', 'Deluxe', 'Premium', 'Luxury'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    image: { type: ImageSchema, required: false },
    images: { type: [ImageSchema], default: [] },
    description: { type: String },
    amenities: { type: [String], default: [] },
    size: { type: Number, required: true },
    capacity: { type: Number, required: true },
    category: { 
      type: String, 
      default: 'Double', 
      enum: ['Single', 'Double', 'Triple', 'Quad', 'Family', 'Suite'] 
    },
    rating: { type: Number, min: 0, max: 5 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Compound index for common query patterns
RoomSchema.index({ type: 1, price: 1, available: 1 })

// Text index for search functionality
RoomSchema.index({ name: 'text', description: 'text' })

export const Room = model<RoomDocument>('Room', RoomSchema)
