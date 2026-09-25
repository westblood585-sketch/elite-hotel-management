import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipientRole: string // 'admin', 'receptionist', 'housekeeper'
  userId?: string // optional specific user
  title: string
  message: string
  type: string // 'info', 'success', 'warning', 'error'
  read: boolean
  metadata?: any
  createdAt: Date
}

const NotificationSchema: Schema = new Schema(
  {
    recipientRole: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
)
