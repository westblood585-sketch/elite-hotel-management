// src/models/payment.model.ts
import mongoose, { Document, Schema } from 'mongoose'

export interface PaymentDoc extends Document {
  _id: string
  reservationId: string
  guestId: string
  guestContact?: {
    email?: string
    phoneNumber?: string
  }
  amount: number
  currency: string
  provider: 'stripe' | 'razorpay'
  status: 'initiated' | 'succeeded' | 'failed' | 'refunded'
  metadata?: any
  refunded?: boolean
  refundTxId?: string
}

const PaymentSchema = new Schema<PaymentDoc>(
  {
    reservationId: { type: String, required: true },
    guestId: { type: String, required: true },
    guestContact: {
      email: String,
      phoneNumber: String,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'succeeded', 'failed', 'refunded'],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    refunded: { type: Boolean, default: false },
    refundTxId: { type: String },
  },
  { timestamps: true }
)

export const PaymentModel = mongoose.model<PaymentDoc>('Payment', PaymentSchema)
