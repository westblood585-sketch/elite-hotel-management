import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import slowDown from 'express-slow-down'

/**
 * Global rate limiter - applies to all routes
 * 1000 requests per 15 minutes per IP
 */
export const globalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests from counting (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests from counting (optional)
  skipFailedRequests: false,
})

/**
 * Auth routes rate limiter - stricter limits for authentication endpoints
 * 20 requests per 15 minutes per IP
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to also track by route
  keyGenerator: (req) => {
    return `${req.ip}-${req.path}`
  },
})

/**
 * Sensitive operations rate limiter (login, signup, password reset)
 * 5 requests per 15 minutes per IP
 */
export const sensitiveRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per window
  message: {
    success: false,
    message: 'Too many attempts for this sensitive operation, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Track by IP + endpoint for more granular control
    return `${req.ip}-${req.path}`
  },
})

/**
 * OTP endpoints rate limiter
 * 3 requests per 10 minutes per IP
 */
export const otpRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Max 3 requests per window
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later',
    retryAfter: '10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Also consider email if available in body
    const email = req.body?.email || 'no-email'
    return `${req.ip}-${email}`
  },
})

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 requests per window
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-password-reset`
  },
})

/**
 * Speed limiter - progressively slows down responses
 * Adds delay after 50 requests in 15 minutes
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // Max delay of 5 seconds
})

/**
 * Create a custom rate limiter with specific configuration
 */
export const createCustomRateLimiter = (
  windowMs: number,
  max: number,
  message: string
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: `${windowMs / 60000} minutes`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}
