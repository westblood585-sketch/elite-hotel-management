// src/repository/interface/IUser.repository.ts
import IUser from '../../interfaces/IUser'
import { IBaseRepository } from './IBase.repository'

export default interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByPhoneNumber(phoneNumber: string): Promise<IUser | null>
  findByIdLean(id: string): Promise<IUser | null>
  updateUserField(
    email: string,
    field: string,
    value: any
  ): Promise<IUser | null>
  updateByEmail(email: string, update: Partial<IUser>): Promise<IUser | null>
}
