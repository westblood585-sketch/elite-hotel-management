// src/models/user.model.ts
import mongoose, { Schema } from 'mongoose'
import IUser from '../interfaces/IUser'

const AvatarSchema = new Schema(
  {
    publicId: { type: String },
    url: { type: String },
  },
  { _id: false }
)

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Automatically convert to lowercase
      trim: true, // Remove whitespace
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^[0-9]{10,15}$/.test(v)
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    password: { type: String, required: true, select: false }, // Exclude by default
    role: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    isApproved: { type: String, required: true, default: 'pending' },
    avatar: { type: AvatarSchema, required: false },
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Indexes for performance optimization
userSchema.index({ email: 1 }) // Unique index (already created by unique: true)
userSchema.index({ phoneNumber: 1 }) // For phone number lookups
userSchema.index({ role: 1, isApproved: 1 }) // Compound index for admin queries
userSchema.index({ fullName: 'text' }) // Text index for search

export const User = mongoose.model('User', userSchema)
