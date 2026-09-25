import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import { v4 as uuidv4 } from 'uuid'

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracking and debugging
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4()
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
}

/**
 * Security headers middleware using Helmet
 * Protects against common web vulnerabilities
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for now
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // HSTS - force HTTPS (31536000 = 1 year)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // Disable client-side caching
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  // XSS Protection (legacy browsers)
  xssFilter: true,
})

/**
 * Request size limiter
 * Prevents large payload attacks
 */
export const requestSizeLimiter = {
  // Limit JSON payloads to 10KB
  json: { limit: '10kb' },
  // Limit URL-encoded data to 10KB
  urlencoded: { limit: '10kb', extended: true },
}

/**
 * Security logging middleware
 * Logs suspicious activities
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // XSS attempt
    /(\bor\b|\band\b).*?=.*?/gi, // SQL injection
    /\.\.\/|\.\.\\/g, // Path traversal
    /__proto__|constructor|prototype/gi, // Prototype pollution
  ]

  const body = JSON.stringify(req.body || {})
  const query = JSON.stringify(req.query || {})
  const params = JSON.stringify(req.params || {})

  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(body) || pattern.test(query) || pattern.test(params)
  )

  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected:`, {
      requestId: req.headers['x-request-id'],
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    })
  }

  next()
}

/**
 * Blocked IPs middleware (can be extended with database/Redis)
 */
const blockedIPs = new Set<string>()

export const ipBlocker = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown'

  if (blockedIPs.has(clientIP)) {
    console.warn(`[SECURITY] Blocked IP attempted access: ${clientIP}`)
    return res.status(403).json({
      success: false,
      message: 'Access forbidden',
    })
  }

  next()
}

/**
 * Add IP to blocklist
 */
export const blockIP = (ip: string): void => {
  blockedIPs.add(ip)
  console.warn(`[SECURITY] IP blocked: ${ip}`)
}

/**
 * Remove IP from blocklist
 */
export const unblockIP = (ip: string): void => {
  blockedIPs.delete(ip)
  console.info(`[SECURITY] IP unblocked: ${ip}`)
}

/**
 * Health check endpoint handler
 */
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'API Gateway',
  })
}
