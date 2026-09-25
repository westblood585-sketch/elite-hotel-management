import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  statusCode?: number
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only log detailed errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
  } else {
    // In production, log only essential info
    console.error(`Error: ${err.message}`)
  }

  const statusCode = err.statusCode || 500
  
  // Sanitize error message for production
  let message = err.message || 'Internal server error'
  
  // Don't expose internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error'
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
}

export default errorHandler
