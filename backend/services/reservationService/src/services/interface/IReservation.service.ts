// src/services/interface/IReservation.service.ts
import { ReservationDocument } from '../../models/reservation.model'

export type QuoteRequest = {
  roomId: string
  checkIn: Date
  checkOut: Date
  adults?: number
  children?: number
  currency?: string
  promoCode?: string
}

export type CreateReservationInput = {
  guestId?: string
  roomId: string
  checkIn: Date | string
  checkOut: Date | string
  adults: number
  children?: number
  notes?: string
  source?: 'Online' | 'FrontDesk' | 'OTA'
  requiresPrepayment?: boolean
  paymentProvider?: 'Stripe' | 'Razorpay' | 'Offline'
  currency?: string
  guestDetails?: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
}

export interface IRoomLookupService {
  ensureRoomExists(
    roomId: string
  ): Promise<{ id: string; price: number; available?: boolean }>
  getAllRooms(): Promise<
    Array<{
      id: string
      number: number
      type: string
      price: number
      available: boolean
      name?: string
      description?: string
      image?: { url: string } // Added this line
      images?: { url: string }[]
      amenities?: string[]
      size?: number
      capacity?: number
      rating?: number
      category?: string
    }>
  >
}

export interface IPaymentOrchestrator {
  createPaymentIntent(params: {
    provider: 'Stripe' | 'Razorpay'
    amount: number
    currency: string
    reservationCode: string
    customer: { guestId: string; email?: string; phoneNumber?: string }
    metadata?: Record<string, any>
  }): Promise<{
    id: string
    clientSecret?: string
    provider: 'Stripe' | 'Razorpay'
    extra?: any
  }>
}

export interface IReservationService {
  quote(
    input: QuoteRequest,
    jwtToken?: string
  ): Promise<{
    baseRate: number
    taxes: number
    fees: number
    total: number
    currency: string
  }>
  create(
    input: CreateReservationInput,
    createdBy?: string,
    jwtToken?: string
  ): Promise<
    ReservationDocument & { paymentClientSecret?: string; paymentOrder?: any }
  >
  createPublic(
    input: CreateReservationInput
  ): Promise<
    ReservationDocument & { paymentClientSecret?: string; paymentOrder?: any }
  >
  getById(id: string): Promise<ReservationDocument | null>
  getByCode(code: string): Promise<ReservationDocument | null>
  list(q: {
    page?: number
    limit?: number
    status?: string
    guestId?: string
    roomId?: string
    dateFrom?: Date
    dateTo?: Date
    search?: string
    sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
  }): Promise<{
    data: ReservationDocument[]
    total: number
    page: number
    limit: number
  }>
  patch(
    id: string,
    payload: Partial<ReservationDocument>
  ): Promise<ReservationDocument | null>

  confirm(id: string): Promise<ReservationDocument>
  cancel(id: string, reason?: string): Promise<ReservationDocument>
  checkIn(id: string): Promise<ReservationDocument>
  checkOut(id: string): Promise<ReservationDocument>

  checkAvailability(criteria: {
    checkIn: Date | string
    checkOut: Date | string
    adults?: number
    children?: number
    type?: string
  }): Promise<any[]>

  lookupGuest(email?: string, phoneNumber?: string): Promise<any | null>
  getUserReservations(userId: string): Promise<ReservationDocument[]>
  publicLookup(code: string, contact: string): Promise<ReservationDocument | null>
}
