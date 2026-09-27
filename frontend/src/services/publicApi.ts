// services/publicApi.ts - Public API for guest bookings without authentication
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// Create axios instance without auth interceptors
export const publicApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
})

// ============= INTERFACES =============

export interface PublicRoom {
  _id: string
  number: number
  name: string
  type: 'Standard' | 'Deluxe' | 'Premium' | 'Luxury'
  price: number
  available: boolean
  image?: {
    url: string
  }
  images?: {
    url: string
    publicId?: string
  }[]
  description?: string
  amenities?: string[]
  size?: number
  capacity?: number
  category?: 'Single' | 'Double' | 'Triple' | 'Quad' | 'Family' | 'Suite'
  rating?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface GuestDetails {
  firstName: string
  lastName?: string
  email: string
  phoneNumber: string
}

export interface CreatePublicReservationPayload {
  roomId: string
  checkIn: string
  checkOut: string
  adults: number
  children?: number
  guestDetails: GuestDetails
  paymentProvider: 'Stripe' | 'Razorpay'
  requiresPrepayment: boolean
  currency?: string
  notes?: string
}

export interface PublicReservationResponse {
  _id: string
  code: string
  roomId: string
  guestId: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  status: 'PendingPayment' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled'
  totalAmount: number
  currency: string
  baseRate: number
  taxes: number
  fees: number
  requiresPrepayment: boolean
  paymentProvider?: string
  paymentIntentId?: string
  // Stripe-specific
  paymentClientSecret?: string
  // Razorpay-specific
  paymentOrder?: {
    id: string
    entity: string
    amount: number
    currency: string
    receipt?: string
    status: string
  }
  createdAt: string
}

// ============= ROOM API =============

export const fetchPublicRooms = async (params?: {
  page?: number
  limit?: number
  type?: string
  available?: boolean
  minPrice?: number
  maxPrice?: number
  checkIn?: string
  checkOut?: string
  search?: string
}): Promise<PaginatedResponse<PublicRoom>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.type) queryParams.append('type', params.type)
  if (params?.available !== undefined) queryParams.append('available', params.available.toString())
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString())
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())
  if (params?.search) queryParams.append('search', params.search)
  
  // Future enhancement: filter by availability for specific dates
  // if (params?.checkIn) queryParams.append('checkIn', params.checkIn)
  // if (params?.checkOut) queryParams.append('checkOut', params.checkOut)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/rooms?${queryString}` : '/rooms'
  
  const response = await publicApi.get(url)
  
  // Check if pagination data exists
  if (response.data.total !== undefined && response.data.page !== undefined) {
    return {
      data: response.data.data || [],
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit || 20,
    }
  }
  
  // Fallback for non-paginated response
  const data = response.data.data || response.data || []
  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length,
  }
}

export const fetchPublicRoomById = async (id: string): Promise<PublicRoom> => {
  const response = await publicApi.get(`/rooms/${id}`)
  return response.data.data || response.data
}

export const searchAvailableRooms = async (criteria: {
  checkIn: string
  checkOut: string
  adults?: number
  children?: number
  type?: string
}): Promise<PublicRoom[]> => {
  const response = await publicApi.post('/reservations/available-rooms', criteria)
  return response.data.data || []
}

// ============= RESERVATION API =============

export const createPublicReservation = async (
  payload: CreatePublicReservationPayload
): Promise<PublicReservationResponse> => {
  const response = await publicApi.post('/reservations/public', payload)
  return response.data.data || response.data
}

// ============= QUOTE API =============

export interface QuoteRequest {
  roomId: string
  checkIn: string
  checkOut: string
  adults?: number
  children?: number
  currency?: string
  promoCode?: string
}

export interface QuoteResponse {
  baseRate: number
  nights: number
  subtotal: number
  taxes: number
  fees: number
  discount: number
  total: number
  currency: string
  breakdown: {
    label: string
    amount: number
  }[]
}

export const getQuote = async (
  payload: QuoteRequest
): Promise<QuoteResponse> => {
  const response = await publicApi.post('/reservations/quote', payload)
  return response.data.data || response.data
}

export const lookupGuest = async (
  email?: string,
  phoneNumber?: string
): Promise<GuestDetails> => {
  const response = await publicApi.post('/reservations/public/guest-lookup', {
    email,
    phoneNumber,
  })
  return response.data.data
}

export const lookupPublicReservation = async (
  code: string,
  contact: string
): Promise<PublicReservationResponse> => {
  const response = await publicApi.post('/reservations/public/lookup', {
    code,
    contact
  })
  return response.data.data
}

export const downloadInvoice = async (reservationId: string): Promise<Blob> => {
  const response = await publicApi.get(`/billing/reservation/${reservationId}/download`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  })
  return response.data
}
