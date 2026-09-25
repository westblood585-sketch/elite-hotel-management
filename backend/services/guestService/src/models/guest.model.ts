// src/models/guest.model.ts
import { Schema, model, Document } from 'mongoose'
import IGuest from '../interfaces/IGuest'

export interface GuestDocument extends IGuest, Document {}

const ImageSchema = new Schema(
  {
    publicId: { type: String },
    url: { type: String },
  },
  { _id: false }
)

const AddressSchema = new Schema(
  {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
)

const IdProofSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Passport', 'NationalID', 'DrivingLicense', 'Other'],
    },
    number: { type: String },
    image: { type: ImageSchema, default: null },
  },
  { _id: false }
)

const PreferencesSchema = new Schema(
  {
    smoking: { type: Boolean },
    roomType: {
      type: String,
      enum: ['Standard', 'Deluxe', 'Premium', 'Luxury'],
    },
    bedType: { type: String, enum: ['Single', 'Double', 'Queen', 'King'] },
    notes: { type: String, maxlength: 2000 },
  },
  { _id: false }
)

const GuestSchema = new Schema<GuestDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: (v: string) => /^[0-9]{10,15}$/.test(v),
        message: (props: any) => `${props.value} is not a valid phone number!`,
      },
    },
    dateOfBirth: { type: Date },
    address: { type: AddressSchema },
    idProof: { type: IdProofSchema, default: null },
    preferences: { type: PreferencesSchema },
    notes: { type: String, maxlength: 5000 },
    isBlacklisted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Standard', 'VIP', 'Loyalty'],
      default: 'Standard',
    },
    isIdVerified: { type: Boolean, default: false },
    lastVisit: { type: Date },
  },
  { timestamps: true }
)

// Performance indexes
// 1. Compound index for filtered listings with sorting
GuestSchema.index({ isBlacklisted: 1, createdAt: -1 })

// 2. Text index for full-text search on name and email
GuestSchema.index(
  { firstName: 'text', lastName: 'text', email: 'text' },
  { 
    weights: { firstName: 10, lastName: 8, email: 5 },
    name: 'guest_text_search'
  }
)

// 3. Unique sparse index on email (allows multiple null values, but unique non-null)
GuestSchema.index({ email: 1 }, { unique: true, sparse: true })

// 4. Index for phone number lookups (already indexed above, but ensuring it's there)
GuestSchema.index({ phoneNumber: 1 })

// 5. Compound index for quick booking lookups
GuestSchema.index({ email: 1, phoneNumber: 1 })

export const Guest = model<GuestDocument>('Guest', GuestSchema)
