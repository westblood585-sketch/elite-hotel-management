import mongoose, { Schema, Document } from 'mongoose'

export type CallStatus = 'pending' | 'active' | 'ended' | 'rejected' | 'missed'
export type UserType = 'guest' | 'staff'

export interface IVideoChatSession extends Document {
  sessionId: string
  callerId: string
  receiverId: string
  callerType: UserType
  receiverType: UserType
  status: CallStatus
  startTime: Date
  endTime?: Date
  duration?: number // in seconds
  recordingUrl?: string
  metadata?: {
    reason?: string
    notes?: string
    quality?: 'excellent' | 'good' | 'fair' | 'poor'
  }
  createdAt: Date
  updatedAt: Date
}

const VideoChatSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    callerId: {
      type: String,
      required: true,
      index: true,
    },
    receiverId: {
      type: String,
      required: true,
      index: true,
    },
    callerType: {
      type: String,
      enum: ['guest', 'staff'],
      required: true,
    },
    receiverType: {
      type: String,
      enum: ['guest', 'staff'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'rejected', 'missed'],
      default: 'pending',
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
    },
    recordingUrl: {
      type: String,
    },
    metadata: {
      reason: String,
      notes: String,
      quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
      },
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
VideoChatSessionSchema.index({ callerId: 1, createdAt: -1 })
VideoChatSessionSchema.index({ receiverId: 1, createdAt: -1 })
VideoChatSessionSchema.index({ status: 1, createdAt: -1 })

// Compound index for finding user's call history
VideoChatSessionSchema.index({ callerId: 1, status: 1 })
VideoChatSessionSchema.index({ receiverId: 1, status: 1 })

export default mongoose.model<IVideoChatSession>('VideoChatSession', VideoChatSessionSchema)
