import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { CustomeRequest } from '../interfaces/CustomRequest'

export function authorizeRole(allowed: string[]) {
  return (req: CustomeRequest, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user || !user.role) return next(new AppError('Unauthorized', 401))
    if (!allowed.includes(user.role))
      return next(new AppError('Forbidden', 403))
    next()
  }
}
