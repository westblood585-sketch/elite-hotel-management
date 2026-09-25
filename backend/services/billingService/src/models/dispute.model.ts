// src/models/dispute.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface DisputeDoc extends Document {
  billingId: mongoose.Types.ObjectId
  reason: string
  status: 'open' | 'under_review' | 'resolved' | 'rejected'
  resolutionNote?: string
  createdBy: string // Admin user ID who flagged the dispute
  resolvedBy?: string // Admin user ID who resolved the dispute
  createdAt: Date
  updatedAt: Date
}

const DisputeSchema = new Schema<DisputeDoc>(
  {
    billingId: {
      type: Schema.Types.ObjectId,
      ref: 'Billing',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open',
      index: true,
    },
    resolutionNote: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    resolvedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Index for finding disputes by billing
DisputeSchema.index({ billingId: 1, status: 1 })

export const DisputeModel = mongoose.model<DisputeDoc>('Dispute', DisputeSchema)
