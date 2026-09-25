// src/repository/interface/IGuest.repository.ts
import { IBaseRepository } from './IBase.repository'
import { GuestDocument } from '../../models/guest.model'

export interface IGuestRepository extends IBaseRepository<GuestDocument> {
  findById(id: string): Promise<GuestDocument | null>
  create(arg0: any): Promise<GuestDocument>
  findByEmail(email: string): Promise<GuestDocument | null>
  findByPhone(phoneNumber: string): Promise<GuestDocument | null>
  findByEmailOrPhone(
    email?: string,
    phoneNumber?: string
  ): Promise<GuestDocument | null>
}
