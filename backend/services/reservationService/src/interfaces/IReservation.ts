import { Types } from 'mongoose'

// src/interfaces/IReservation.ts
export type ReservationStatus =
  | 'PendingPayment'
  | 'Confirmed'
  | 'Cancelled'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'NoShow'

export default interface IReservation {
  code: string // human-friendly locator, e.g. RSV-20250823-AB12
  guestId: Types.ObjectId | string
  guestContact: {
    email: { type: String }
    phoneNumber: { type: String }
  }
  roomId: Types.ObjectId | string
  checkIn: Date
  checkOut: Date
  nights: number
  adults: number
  children?: number
  status: ReservationStatus
  source?: 'Online' | 'FrontDesk' | 'OTA' | 'Admin'
  notes?: string

  // pricing
  currency: string
  baseRate: number // nightly (might be ceiling/first-night)
  taxes: number
  fees: number
  totalAmount: number

  // prepayment / payment fields
  requiresPrepayment?: boolean
  paymentProvider?: 'Stripe' | 'Razorpay'
  paymentIntentId?: string // stripe paymentIntentId or razorpay orderId
  paymentCaptured?: boolean
  holdExpiresAt?: Date // optional: for payment hold/expiry logic

  // audit
  createdBy?: Types.ObjectId | string // userId of receptionist/admin for front desk bookings
  cancelledAt?: Date
  checkedInAt?: Date
  checkedOutAt?: Date

  createdAt?: Date
  updatedAt?: Date
}
