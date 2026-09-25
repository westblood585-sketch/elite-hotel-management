// middleware/security.ts
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { Request, Response, NextFunction } from 'express'

/**
 * Helmet configuration with strict security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
})

/**
 * MongoDB NoSQL injection protection
 */
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] Sanitized suspicious key "${key}" from ${req.ip}`)
  },
})

/**
 * Request size validation middleware
 */
export const validateRequestSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = req.headers['content-length']

  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024)
    const maxSize = req.path.includes('upload') ? 10 : 0.1 // 10MB for uploads, 100KB for others

    if (sizeInMB > maxSize) {
      res.status(413).json({
        success: false,
        message: `Request payload too large. Maximum allowed: ${maxSize}MB`,
      })
      return
    }
  }

  return next()
}

/**
 * Security headers logging (development only)
 */
export const logSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    res.on('finish', () => {
      console.log(`[Security Headers] ${req.method} ${req.path}`, {
        csp: res.getHeader('Content-Security-Policy'),
        hsts: res.getHeader('Strict-Transport-Security'),
        xFrame: res.getHeader('X-Frame-Options'),
      })
    })
  }
  next()
}
