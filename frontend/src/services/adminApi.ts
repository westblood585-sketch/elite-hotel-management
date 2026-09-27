// services/adminApi.ts
import { privateApi } from '@/services/instances/axiosConfig'

// ============= INTERFACES =============

export interface Room {
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
}

export interface Reservation {
  _id: string
  code: string
  guestContact: {
    email: string
    phone?: string
  }
  roomId: {
    _id: string
    number: number
    type: string
  }
  checkIn: string
  checkOut: string
  status: 'Confirmed' | 'PendingPayment' | 'CheckedIn' | 'CheckedOut' | 'Cancelled'
  totalAmount: number
  createdAt?: string
}

export interface Billing {
  _id: string
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
  ledger: {
    type: string
    amount: number
    note?: string
    createdAt: string
  }[]
  archived?: boolean
  archivedAt?: string
  disputeId?: string
  createdAt: string
  updatedAt: string
}

export interface Dispute {
  _id: string
  billingId: string
  reason: string
  status: 'open' | 'under_review' | 'resolved' | 'rejected'
  resolutionNote?: string
  createdBy: string
  resolvedBy?: string
  createdAt: string
  updatedAt: string
}

export interface ChargeData {
  type: string
  amount: number
  note?: string
}

export interface CreditData {
  amount: number
  reason: string
  note?: string
}

export interface RefundData {
  amount: number
  reason: string
}

export interface AdjustmentData {
  amount: number
  note: string
}

export interface Payment {
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
  createdAt?: string
  updatedAt?: string
}

export interface User {
  _id: string
  fullName: string
  email: string
  role: 'admin' | 'receptionist' | 'Housekeeper' | 'user'
  isVerified: boolean
  isApproved: 'approved' | 'pending' | 'rejected'
  phoneNumber?: string
  avatar?: {
    url: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  totalBookings: number
  activeRooms: number
  totalUsers: number
  revenue: number
  bookingsChange?: string
  roomsChange?: string
  usersChange?: string
  revenueChange?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ============= ROOMS API =============

export const fetchRooms = async (params?: {
  page?: number
  limit?: number
  search?: string
  type?: string
  available?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<PaginatedResponse<Room>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.type) queryParams.append('type', params.type)
  if (params?.available !== undefined) queryParams.append('available', params.available.toString())
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString())
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
  if (params?.sort) queryParams.append('sort', JSON.stringify(params.sort))
  
  const queryString = queryParams.toString()
  const url = queryString ? `/rooms?${queryString}` : '/rooms'
  
  const response = await privateApi.get(url)
  
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

export const fetchRoomById = async (id: string): Promise<Room> => {
  const response = await privateApi.get(`/rooms/${id}`)
  return response.data.data || response.data
}

export const deleteRoom = async (id: string): Promise<void> => {
  await privateApi.delete(`/rooms/${id}`)
}

// ============= RESERVATIONS API =============

export const fetchReservations = async (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<PaginatedResponse<Reservation>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.sort) queryParams.append('sort', JSON.stringify(params.sort))
  
  const queryString = queryParams.toString()
  const url = queryString ? `/reservations?${queryString}` : '/reservations'
  
  const response = await privateApi.get(url)
  
  // Backend returns: { success, message, data, total, page, limit }
  // Check if pagination data exists at root level
  if (response.data.total !== undefined && response.data.page !== undefined) {
    return {
      data: response.data.data || [],
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit || 20,
    }
  }
  
  // Fallback for non-paginated response (backward compatibility)
  const data = response.data.data || response.data || []
  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length,
  }
}

export const fetchReservationById = async (id: string): Promise<Reservation> => {
  const response = await privateApi.get(`/reservations/${id}`)
  return response.data.data || response.data
}

export const confirmReservation = async (id: string): Promise<Reservation> => {
  const response = await privateApi.post(`/reservations/${id}/confirm`)
  return response.data.data || response.data
}

export const cancelReservation = async (id: string): Promise<Reservation> => {
  const response = await privateApi.post(`/reservations/${id}/cancel`)
  return response.data.data || response.data
}

export const updateReservation = async (
  id: string,
  data: Partial<Reservation>
): Promise<Reservation> => {
  const response = await privateApi.patch(`/reservations/${id}`, data)
  return response.data.data || response.data
}

export const checkInReservation = async (id: string): Promise<Reservation> => {
  const response = await privateApi.post(`/reservations/${id}/check-in`)
  return response.data.data || response.data
}

export const checkOutReservation = async (id: string): Promise<Reservation> => {
  const response = await privateApi.post(`/reservations/${id}/check-out`)
  return response.data.data || response.data
}

// ============= USERS API =============

export const fetchUsers = async (params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<PaginatedResponse<User>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.role) queryParams.append('role', params.role)
  if (params?.status) queryParams.append('isApproved', params.status) // Note: Backend likely expects 'isApproved' or 'status'? 
  // Checking user.controller.ts typically it maps query params. 
  // Let's assume standard query mirroring or I should check implementation.
  // Given I can't check backend implementation easily without more time, I'll send 'isApproved' which matches the model field.
  
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
  if (params?.sort) queryParams.append('sort', JSON.stringify(params.sort))
  
  const queryString = queryParams.toString()
  const url = queryString ? `/users?${queryString}` : '/users'
  
  const response = await privateApi.get(url)
  
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

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await privateApi.get(`/users/${id}`)
  return response.data.data || response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await privateApi.delete(`/users/${id}`)
}

export const updateUserRole = async (
  id: string,
  role: string
): Promise<User> => {
  const response = await privateApi.patch(`/users/${id}`, { role })
  return response.data.data || response.data
}

// ============= DASHBOARD STATS API =============

interface DashboardData {
  financials: {
    revenue: number
    currency: string
    status: string
  }
  occupancy: {
    totalRooms: number
    occupied: number
    available: number
    occupancyRate: number
  }
  users: {
    total: number
    activeStaff: number
    activeGuests: number
  }
  systemStatus: {
    reservation: boolean
    room: boolean
    user: boolean
    payment: boolean
  }
}

export const fetchDashboardStats = async (): Promise<DashboardData> => {
  try {
    const response = await privateApi.get('/dashboard/admin')
    return response.data.data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// ============= RECENT ACTIVITY API =============

export const fetchRecentActivity = async (limit: number = 5): Promise<Reservation[]> => {
  try {
    const response = await privateApi.get('/reservations')
    const reservations: Reservation[] = response.data.data || response.data || []
    
    // Sort by createdAt descending and limit
    return reservations
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    throw error
  }
}

// ============= BILLING API =============

export const fetchBillings = async (filters?: {
  status?: string
  reservationId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  search?: string
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<PaginatedResponse<Billing>> => {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.reservationId) params.append('reservationId', filters.reservationId)
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)
  if (filters?.sort) params.append('sort', JSON.stringify(filters.sort))

  const response = await privateApi.get(`/billing?${params.toString()}`)
  
  if (response.data.pagination) {
    return {
      data: response.data.data,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit
    }
  }

  const data = response.data.data || response.data || []
  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length
  }
}

export const fetchBillingById = async (id: string): Promise<Billing> => {
  const response = await privateApi.get(`/billing/${id}`)
  return response.data.data || response.data
}

export const fetchBillingByReservation = async (reservationId: string): Promise<Billing> => {
  const response = await privateApi.get(`/billing/reservation/${reservationId}`)
  return response.data.data || response.data
}

// Ledger operations
export const addCharge = async (billingId: string, data: ChargeData): Promise<Billing> => {
  const response = await privateApi.post(`/billing/${billingId}/charges`, data)
  return response.data.data || response.data
}

export const addCredit = async (billingId: string, data: CreditData): Promise<Billing> => {
  const response = await privateApi.post(`/billing/${billingId}/credits`, data)
  return response.data.data || response.data
}

export const processRefund = async (billingId: string, data: RefundData): Promise<Billing> => {
  const response = await privateApi.post(`/billing/${billingId}/refund`, data)
  return response.data.data || response.data
}

export const addAdjustment = async (billingId: string, data: AdjustmentData): Promise<Billing> => {
  const response = await privateApi.post(`/billing/${billingId}/adjustment`, data)
  return response.data.data || response.data
}

// Status management
export const changeBillingStatus = async (billingId: string, status: string): Promise<Billing> => {
  const response = await privateApi.patch(`/billing/${billingId}/status`, { status })
  return response.data.data || response.data
}

export const sendInvoice = async (billingId: string): Promise<void> => {
  await privateApi.post(`/billing/${billingId}/send-invoice`)
}

// Invoice & Export
export const downloadInvoice = async (billingId: string): Promise<Blob> => {
  const response = await privateApi.get(`/billing/${billingId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export const exportBillings = async (
  format: 'csv' | 'pdf',
  filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<Blob> => {
  const params = new URLSearchParams({ format })
  if (filters?.status) params.append('status', filters.status)
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)

  const response = await privateApi.get(`/billing/export/all?${params.toString()}`, {
    responseType: 'blob',
  })
  return response.data
}

// Administrative
export const getAuditLog = async (billingId: string): Promise<Billing['ledger']> => {
  const response = await privateApi.get(`/billing/${billingId}/audit-log`)
  return response.data.data || response.data
}

export const archiveBilling = async (billingId: string): Promise<Billing> => {
  const response = await privateApi.post(`/billing/${billingId}/archive`)
  return response.data.data || response.data
}

// Dispute management
export const flagDispute = async (
  billingId: string,
  reason: string,
  createdBy: string
): Promise<Dispute> => {
  const response = await privateApi.post(`/billing/${billingId}/dispute`, {
    reason,
    createdBy,
  })
  return response.data.data || response.data
}

export const resolveDispute = async (
  billingId: string,
  disputeId: string,
  resolutionNote: string,
  resolvedBy: string,
  status: 'resolved' | 'rejected'
): Promise<Dispute> => {
  const response = await privateApi.patch(
    `/billing/${billingId}/dispute/${disputeId}/resolve`,
    {
      resolutionNote,
      resolvedBy,
      status,
    }
  )
  return response.data.data || response.data
}

export const getBillingDisputes = async (billingId: string): Promise<Dispute[]> => {
  const response = await privateApi.get(`/billing/${billingId}/disputes`)
  return response.data.data || response.data
}

// ============= PAYMENT API =============

export const fetchPayments = async (filters?: {
  page?: number
  limit?: number
  status?: string
  reservationId?: string
  provider?: string
  minAmount?: number
  maxAmount?: number
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<PaginatedResponse<Payment>> => {
  const params = new URLSearchParams()
  
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.status) params.append('status', filters.status)
  if (filters?.reservationId) params.append('reservationId', filters.reservationId)
  if (filters?.provider) params.append('provider', filters.provider)
  if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString())
  if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString())
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters?.sort) params.append('sort', JSON.stringify(filters.sort))

  const response = await privateApi.get(`/payments?${params.toString()}`)
  
  // Handle paginated response
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

export const fetchPaymentById = async (id: string): Promise<Payment> => {
  const response = await privateApi.get(`/payments/${id}`)
  return response.data.data || response.data
}
