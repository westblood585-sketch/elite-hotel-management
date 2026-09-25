import IUser from '../../interfaces/IUser'
import { User } from '../../models/user.model'
import IUserRepository from '../interface/IUser.repository'
import BaseRepository from './base.repository'

export class UserRepository
  extends BaseRepository<IUser>
  implements IUserRepository
{
  async findByEmail(email: string): Promise<IUser | null> {
    // Normalize email before querying
    const normalizedEmail = email.toLowerCase().trim()
    return await User.findOne({ email: normalizedEmail }).select('-password')
  }

  async findByIdLean(id: string): Promise<IUser | null> {
    // Always exclude password field
    return User.findById(id).select('-password').lean().exec()
  }

  async updateUserField(
    email: string,
    field: string,
    value: string
  ): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase().trim()
    const update = { $set: { [field]: value } }
    return await User.findOneAndUpdate({ email: normalizedEmail }, update, {
      new: true,
    }).select('-password')
  }

  async findByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    return await User.findOne({ phoneNumber }).select('-password')
  }

  async updateByEmail(
    email: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase().trim()
    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: updateData },
      { new: true, upsert: false }
    )
      .select('-password')
      .lean()

    return updatedUser
  }
}
