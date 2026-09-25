import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  statusCode?: number
}

/**
 * Global error handler middleware
 * Provides different error detail levels for development vs production
 * Prevents sensitive information leakage in production
 */
const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Log error with context (use proper logger in production)
  if (isDevelopment) {
    console.error('🔴 Error Details:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode,
      message: err.message,
      stack: err.stack,
    })
  } else {
    // Production: Log less detail to console, should use proper logging service
    console.error('Error:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode,
      message: statusCode === 500 ? 'Internal server error' : message,
    })
  }

  // Response format
  const errorResponse: any = {
    success: false,
    message: statusCode === 500 && !isDevelopment 
      ? 'Internal server error' 
      : message,
  }

  // Include stack trace only in development
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack
    errorResponse.error = err.name
  }

  res.status(statusCode).json(errorResponse)
}

export default errorHandler
