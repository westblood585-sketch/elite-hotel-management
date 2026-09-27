import { privateApi } from '@/services/instances/axiosConfig'

export interface Guest {
  _id: string
  firstName: string
  lastName?: string
  email?: string
  phoneNumber: string
  isBlacklisted: boolean
  status: 'Standard' | 'VIP' | 'Loyalty'
  isIdVerified: boolean
  dateOfBirth?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  lastVisit?: string
  createdAt?: string
  idProof?: {
    type?: string
    number?: string
    image?: {
      url: string
    }
  }
  preferences?: {
    smoking?: boolean
    roomType?: string
    bedType?: string
    notes?: string
  }
  notes?: string
}

export interface GuestListResponse {
  data: Guest[]
  total: number
  page: number
  limit: number
}

export const fetchGuests = async (params: {
  page?: number
  limit?: number
  search?: string
  isBlacklisted?: boolean
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}): Promise<GuestListResponse> => {
  const queryParams: any = { 
    page: params.page || 1, 
    limit: params.limit || 20 
  }
  if (params.search) queryParams.search = params.search
  if (params.isBlacklisted !== undefined) queryParams.isBlacklisted = params.isBlacklisted
  if (params.sort) queryParams.sort = JSON.stringify(params.sort)

  const response = await privateApi.get('/guests', { params: queryParams })
  // Backend returns: { success, message, data: [...], total, page, limit }
  return {
    data: response.data.data || [],
    total: response.data.total || 0,
    page: response.data.page || 1,
    limit: response.data.limit || 20
  }
}

export const fetchGuestById = async (id: string): Promise<Guest> => {
  const response = await privateApi.get(`/guests/${id}`)
  return response.data.data || response.data
}

export const createGuest = async (data: Partial<Guest> | FormData): Promise<Guest> => {
  const response = await privateApi.post('/guests', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  })
  return response.data.data || response.data
}

export const updateGuest = async (id: string, data: Partial<Guest>): Promise<Guest> => {
  const response = await privateApi.patch(`/guests/${id}`, data)
  return response.data.data || response.data
}

export const deleteGuest = async (id: string): Promise<void> => {
  await privateApi.delete(`/guests/${id}`)
}

export const updateGuestIdProofImage = async (id: string, file: File): Promise<Guest> => {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await privateApi.post(`/guests/${id}/id-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data.data || response.data
}
