import mongoose, { Schema, Document } from 'mongoose'

export interface ChecklistItem {
  item: string
  completed: boolean
}

export interface HousekeepingTaskDoc extends Document {
  roomId: string
  reservationId?: string
  assignedTo?: string
  
  // Enhanced fields
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimatedDuration?: number // in minutes
  actualDuration?: number // tracked on completion
  completedBy?: string // who actually completed it
  completedAt?: Date
  
  // Cleaning checklist for quality control
  checklist?: ChecklistItem[]
  
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  images?: string[] // photos of completed work or issues
  idempotencyKey?: string // for deduplication
  
  createdAt: Date
  updatedAt: Date
}

const ChecklistItemSchema = new Schema({
  item: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false })

const HousekeepingSchema = new Schema<HousekeepingTaskDoc>(
  {
    roomId: { type: String, required: true, index: true },
    reservationId: { type: String, index: true },
    assignedTo: { type: String, index: true },
    
    taskType: {
      type: String,
      enum: ['cleaning', 'maintenance', 'inspection', 'turndown'],
      default: 'cleaning',
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      required: true
    },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number },
    completedBy: { type: String },
    completedAt: { type: Date },
    
    checklist: [ChecklistItemSchema],
    
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    images: [{ type: String }],
    idempotencyKey: { type: String, index: { unique: true, sparse: true } },
  },
  { timestamps: true }
)

// Indexes for efficient querying
HousekeepingSchema.index({ taskType: 1, status: 1 })
HousekeepingSchema.index({ priority: 1, status: 1 })
HousekeepingSchema.index({ completedBy: 1, completedAt: -1 })
HousekeepingSchema.index({ createdAt: -1 })

export const HousekeepingModel = mongoose.model<HousekeepingTaskDoc>(
  'HousekeepingTask',
  HousekeepingSchema
)
