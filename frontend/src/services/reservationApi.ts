import { privateApi } from '@/services/instances/axiosConfig'
import type { PublicReservationResponse } from './publicApi'

// Re-export type for convenience
export type Reservation = PublicReservationResponse

export const getMyReservations = async (): Promise<Reservation[]> => {
  const response = await privateApi.get('/reservations/my-reservations')
  return response.data.data
}

export const getReservationById = async (id: string): Promise<Reservation> => {
  const response = await privateApi.get(`/reservations/${id}`)
  return response.data.data
}

export const createReservation = async (data: any): Promise<Reservation> => {
  const response = await privateApi.post('/reservations', data)
  return response.data.data
}
