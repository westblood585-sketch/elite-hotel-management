import mongoose, { Schema, Document } from 'mongoose'

/**
 * Failed Login Attempts Model
 * Tracks failed authentication attempts for account lockout mechanism
 */
export interface IFailedAttempt extends Document {
  email: string
  attempts: number
  lastAttempt: Date
  lockedUntil?: Date
  ipAddress?: string
}

const failedAttemptSchema = new Schema<IFailedAttempt>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastAttempt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lockedUntil: {
      type: Date,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

// TTL index - auto-delete after 24 hours of last attempt
failedAttemptSchema.index(
  { lastAttempt: 1 },
  { expireAfterSeconds: 86400 } // 24 hours
)

export const FailedAttempt = mongoose.model<IFailedAttempt>(
  'FailedAttempt',
  failedAttemptSchema
)
