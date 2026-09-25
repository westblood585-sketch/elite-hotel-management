import mongoose, { Schema } from 'mongoose'
import IUser from '../interfaces/IUser'

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        return /^[0-9]{10,15}$/.test(v) // Allows only numbers with 10 to 15 digits
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true },
  isVerified: { type: Boolean, required: true, default: false },
  isApproved: {
    type: String,
    required: true,
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: null },
})

export const User = mongoose.model('User', userSchema)
