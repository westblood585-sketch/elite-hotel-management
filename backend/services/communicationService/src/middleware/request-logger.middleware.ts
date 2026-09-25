import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import logger from '../utils/logger.service'
import { context } from '../utils/context'

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string
      startTime?: number
    }
  }
}

/**
 * Middleware to add correlation IDs and log HTTP requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate or reuse correlation ID for request tracing
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4()

  req.correlationId = correlationId
  req.startTime = Date.now()

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId)

  // Initialize context store
  const store = new Map<string, any>()
  store.set('correlationId', correlationId)

  context.run(store, () => {
    // Log request
    logger.info('HTTP Request', {
      correlationId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - (req.startTime || Date.now())
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info'

      logger[logLevel]('HTTP Response', {
        correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      })
    })

    next()
  })
}

export default requestLogger
