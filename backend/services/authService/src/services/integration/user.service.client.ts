// src/services/integration/user.service.client.ts
import axios from 'axios'
import CustomError from '../../utils/CustomError'
import { HttpStatus } from '../../enums/http.status'

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002'

export class UserServiceClient {
  async createUser(userData: any) {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/`, userData)
      return response.data.data
    } catch (error: any) {
      if (error.response) {
        throw new CustomError(
          error.response.data.message || 'Failed to create user in UserService',
          error.response.status
        )
      }
      throw new CustomError('UserService unavailable', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async updateUser(id: string, updateData: any) {
    try {
        // Assuming UserService has a patch endpoint PATCH /:id
      const response = await axios.patch(`${USER_SERVICE_URL}/${id}`, updateData)
      return response.data.data
    } catch (error: any) {
       if (error.response) {
        throw new CustomError(
          error.response.data.message || 'Failed to update user in UserService',
          error.response.status
        )
      }
      throw new CustomError('UserService unavailable', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
