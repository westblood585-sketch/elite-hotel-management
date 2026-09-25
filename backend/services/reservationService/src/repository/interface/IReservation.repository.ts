// src/repository/interface/IReservation.repository.ts
import { IBaseRepository } from './IBase.repository'
import { ReservationDocument } from '../../models/reservation.model'

export interface IReservationRepository
  extends IBaseRepository<ReservationDocument> {
  findOverlaps(params: {
    roomId: string
    checkIn: Date
    checkOut: Date
    excludeId?: string
    includeStatuses?: string[]
  }): Promise<ReservationDocument[]>
  findByCode(code: string): Promise<ReservationDocument | null>
}
