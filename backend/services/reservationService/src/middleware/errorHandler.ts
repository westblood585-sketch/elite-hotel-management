import { Request, Response, NextFunction } from 'express'
import CustomError from '../utils/CustomError'
import { HttpStatus } from '../enums/http.status'
import logger from '../utils/logger.service'

const errorHandler = (
  err: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with correlation ID if available
  logger.error('Error Handler', {
    error: err.message,
    stack: err.stack,
    correlationId: (req as any).correlationId,
    path: req.path,
    method: req.method,
  })

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  }

  // Handle unexpected errors
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  })
}

export default errorHandler
