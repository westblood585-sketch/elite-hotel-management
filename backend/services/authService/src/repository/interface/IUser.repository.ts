import IUser from '../../interfaces/IUser'
import { IBaseRepository } from './IBase.repository'

interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  updateUserField(
    email: string,
    field: string,
    value: string | boolean
  ): Promise<IUser | null>
  findAllByRole(role: string, options?: { page: number; limit: number }): Promise<IUser[]>
  findByPhoneNumber(phoneNumber: string): Promise<IUser | null>
  findByEmailWithPassword(email: string): Promise<IUser | null>
  updateByEmail(
    email: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null>
}

export default IUserRepository
