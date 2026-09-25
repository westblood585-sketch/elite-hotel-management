import { Request, Response, NextFunction } from 'express'
import { AppError } from './AppError'

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(err)
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message })
  }
  console.error(err)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
}
