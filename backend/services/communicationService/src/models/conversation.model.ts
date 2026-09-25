import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage {
  sender: 'user' | 'bot' | 'agent'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

export interface IConversation extends Document {
  conversationId: string
  userId: string
  userType: 'guest' | 'staff'
  messages: IMessage[]
  context: {
    guestId?: string
    reservationId?: string
    roomNumber?: string
    userName?: string
    checkInDate?: Date
    checkOutDate?: Date
    currentUrl?: string
  }
  status: 'active' | 'closed' | 'handoff'
  language: string
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema({
  sender: {
    type: String,
    enum: ['user', 'bot', 'agent'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: String, // [NEW] Optional image field
  timestamp: {
    type: Date,
    default: Date.now,
  },
  intent: String,
  confidence: Number,
})

const ConversationSchema: Schema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['guest', 'staff'],
      required: true,
    },
    messages: [MessageSchema],
    context: {
      guestId: String,
      reservationId: String,
      roomNumber: String,
      userName: String,
      checkInDate: Date,
      checkOutDate: Date,
      currentUrl: String, // [NEW]
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'handoff'],
      default: 'active',
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
ConversationSchema.index({ userId: 1, createdAt: -1 })
ConversationSchema.index({ status: 1, updatedAt: -1 })

export default mongoose.model<IConversation>('Conversation', ConversationSchema)
