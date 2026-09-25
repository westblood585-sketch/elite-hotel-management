// src/services/interface/IGuest.service.ts
import { GuestDocument } from '../../models/guest.model'

export type GuestListQuery = {
  page?: number
  limit?: number
  search?: string
  isBlacklisted?: boolean
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
}

export interface IGuestService {
  create(
    payload: Partial<GuestDocument>,
    idProofImage?: Express.Multer.File
  ): Promise<GuestDocument>
  getById(id: string): Promise<GuestDocument | null>
  list(query: GuestListQuery): Promise<{
    data: GuestDocument[]
    total: number
    page: number
    limit: number
  }>
  patch(
    id: string,
    payload: Partial<GuestDocument>
  ): Promise<GuestDocument | null>
  delete(id: string): Promise<void>

  updateIdProofImage(
    id: string,
    file: Express.Multer.File
  ): Promise<{ publicId: string; url: string }>
  removeIdProofImage(id: string): Promise<void>

  // Booking-time helper: returns existing or creates new guest
  ensureGuestForBooking(payload: {
    firstName: string
    lastName?: string
    email?: string
    phoneNumber: string
    idProof?: { type?: string; number?: string }
  }): Promise<GuestDocument>

  updateLastVisit(id: string): Promise<void>
}
