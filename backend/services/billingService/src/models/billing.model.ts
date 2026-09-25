// src/models/billing.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface LedgerEntry {
  type: string
  amount: number
  note?: string
  createdAt: Date
}

export interface BillingDoc extends Document {
  _id: mongoose.Types.ObjectId
  paymentId: string
  reservationId: string
  guestId: string
  guestContact?: {
    email?: string
    phoneNumber?: string
  }
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'refunded' | 'failed' | 'void' | 'archived'
  ledger: LedgerEntry[]
  archived: boolean
  archivedAt?: Date
  disputeId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const LedgerEntrySchema = new Schema<LedgerEntry>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'initiated',
        'payment',
        'refund',
        'failure',
        'charge',
        'credit',
        'adjustment',
        'status_change',
      ],
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const BillingSchema = new Schema<BillingDoc>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reservationId: {
      type: String,
      required: true,
      index: true,
    },
    guestId: {
      type: String,
      required: true,
      index: true,
    },
    guestContact: {
      email: { type: String },
      phoneNumber: { type: String },
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed', 'void', 'archived'],
      default: 'pending',
      index: true,
    },
    ledger: {
      type: [LedgerEntrySchema],
      default: [],
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: 'Dispute',
    },
  },
  {
    timestamps: true,
  }
)

// Index for filtering by date range
BillingSchema.index({ createdAt: -1 })

// Compound index for common queries
BillingSchema.index({ status: 1, archived: 1 })

export const BillingModel = mongoose.model<BillingDoc>('Billing', BillingSchema)
