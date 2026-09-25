// src/models/reservation.model.ts
import { Schema, model, Document, Types } from 'mongoose'
import IReservation, { ReservationStatus } from '../interfaces/IReservation'

export interface ReservationDocument extends IReservation, Document {
  _id: Types.ObjectId
}

const ReservationSchema = new Schema<ReservationDocument>(
  {
    code: { type: String, required: true, unique: true, index: true },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
      index: true,
    },
    guestContact: {
      email: { type: String, index: true },
      phoneNumber: { type: String, index: true },
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: [
        'PendingPayment',
        'Confirmed',
        'Cancelled',
        'CheckedIn',
        'CheckedOut',
        'NoShow',
      ],
      default: 'PendingPayment',
      index: true,
    },
    source: {
      type: String,
      enum: ['Online', 'FrontDesk', 'OTA', 'Admin'],
      default: 'FrontDesk',
    },
    notes: { type: String, maxlength: 5000 },

    currency: { type: String, required: true, default: 'INR' },
    baseRate: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0 },
    fees: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    requiresPrepayment: { type: Boolean, default: false },
    paymentProvider: {
      type: String,
      enum: ['Stripe', 'Razorpay', 'Offline'],
      required: false,
    },
    paymentIntentId: { type: String },
    paymentCaptured: { type: Boolean, default: false },
    holdExpiresAt: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
  },
  { timestamps: true }
)

// Query helper: overlapping date ranges
// overlap if (existing.checkIn < req.checkOut) && (existing.checkOut > req.checkIn)
ReservationSchema.index(
  { roomId: 1, checkIn: 1, checkOut: 1, status: 1 },
  { name: 'room_date_overlap' }
)

export const Reservation = model<ReservationDocument>(
  'Reservation',
  ReservationSchema
)
