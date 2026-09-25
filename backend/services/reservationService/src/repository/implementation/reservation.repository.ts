// src/repository/implementation/reservation.repository.ts
import BaseRepository from './base.repository'
import { IReservationRepository } from '../interface/IReservation.repository'
import {
  Reservation,
  ReservationDocument,
} from '../../models/reservation.model'
import { Types } from 'mongoose'
import IReservation from '../../interfaces/IReservation'

export class ReservationRepository
  extends BaseRepository<ReservationDocument>
  implements IReservationRepository
{
  constructor() {
    super(Reservation)
  }

  findByCode(code: string) {
    return Reservation.findOne({ code }).exec()
  }

  findOverlaps({
    roomId,
    checkIn,
    checkOut,
    excludeId,
    includeStatuses = ['PendingPayment', 'Confirmed', 'CheckedIn'],
  }: {
    roomId: IReservation['roomId']
    checkIn: IReservation['checkIn']
    checkOut: IReservation['checkOut']
    excludeId?: Types.ObjectId | string
    includeStatuses?: string[]
  }) {
    const filter: {
      roomId: Types.ObjectId
      status: { $in: string[] }
      $and: [{ checkIn: { $lt: Date } }, { checkOut: { $gt: Date } }]
      _id?: { $ne: Types.ObjectId }
    } = {
      roomId: new Types.ObjectId(roomId),
      status: { $in: includeStatuses },
      $and: [{ checkIn: { $lt: checkOut } }, { checkOut: { $gt: checkIn } }],
    }
    if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) }
    return Reservation.find(filter).exec()
  }
}
