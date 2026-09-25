import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '../enums/http.status'

/**
 * Request timeout middleware
 * Automatically terminates requests that exceed the specified timeout duration
 * @param timeoutMs - Timeout duration in milliseconds (default: 30000ms = 30s)
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          success: false,
          message: 'Request timeout - operation took too long to complete',
        })
      }
    }, timeoutMs)

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout)
    })

    // Clear timeout on response close
    res.on('close', () => {
      clearTimeout(timeout)
    })

    next()
  }
}
