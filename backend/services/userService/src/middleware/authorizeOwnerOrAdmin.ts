import { Response, NextFunction } from 'express'
import { HttpStatus } from '../enums/http.status'
import CustomError from '../utils/CustomError'
import { CustomeRequest } from '../interfaces/CustomRequest'

/**
 * Middleware to allow either Admin or the owner of the resource
 */
export const authorizeOwnerOrAdmin = () => {
  return (req: CustomeRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const userRole = req.user?.role
    const paramId = req.params.id

    if (!userId) {
      throw new CustomError('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    // Allow if Admin
    if (userRole === 'admin') {
      return next()
    }

    // Allow if owner (user matches requested id)
    if (userId === paramId) {
      return next()
    }

    // Otherwise deny
    throw new CustomError(
      'You do not have permission to perform this action',
      HttpStatus.UNAUTHORIZED
    )
  }
}
