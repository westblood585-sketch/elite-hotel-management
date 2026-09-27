// services/userApi.ts
import { privateApi } from '@/services/instances/axiosConfig'

export interface UserProfile {
  _id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  isVerified: boolean
  isApproved: string
  avatar?: {
    publicId: string
    url: string
  }
  createdAt: string
  updatedAt?: string
}

export interface UpdateProfileData {
  fullName?: string
  phoneNumber?: string
}

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<UserProfile> => {
  const response = await privateApi.get(`/users/${id}`)
  return response.data.data
}

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  id: string,
  data: UpdateProfileData
): Promise<UserProfile> => {
  const response = await privateApi.patch(`/users/${id}`, data)
  return response.data.data
}

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  id: string,
  file: File
): Promise<{ publicId: string; url: string }> => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await privateApi.post(`/users/${id}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

/**
 * Upload public avatar (for signup)
 */
export const uploadPublicAvatar = async (
  file: File
): Promise<{ publicId: string; url: string }> => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await privateApi.post('/users/public/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

/**
 * Remove user avatar
 */
export const removeAvatar = async (id: string): Promise<void> => {
  await privateApi.delete(`/users/${id}/avatar`)
}

/**
 * Get users by role
 */
export const getUsersByRole = async (
  role: string,
  page: number = 1,
  limit: number = 20
): Promise<UserProfile[]> => {
  const response = await privateApi.get(`/auth/users?role=${role}&page=${page}&limit=${limit}`)
  return response.data.data
}
