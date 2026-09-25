// src/services/interface/IUser.service.ts
import IUser from '../../interfaces/IUser'

export interface IPaginatedUsers {
  data: IUser[]
  total: number
  page: number
  limit: number
}

export interface IUserService {
  create(data: Partial<IUser>): Promise<IUser>
  getById(id: string): Promise<IUser | null>
  list(query: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isApproved?: string
  }): Promise<IPaginatedUsers>
  patch(id: string, payload: Partial<IUser>): Promise<IUser | null>
  delete(id: string): Promise<void>
  updateAvatar(
    id: string,
    file: Express.Multer.File
  ): Promise<{ publicId: string; url: string }>
  uploadPublicAvatar(
    file: Express.Multer.File
  ): Promise<{ publicId: string; url: string }>
  removeAvatar(id: string): Promise<void>
}
