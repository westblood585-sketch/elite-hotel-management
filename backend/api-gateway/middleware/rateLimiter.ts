// middleware/rateLimiter.ts
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import slowDown from 'express-slow-down'

/**
 * General API rate limiter - applies to all endpoints
 * 100 requests per 15 minutes
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain IPs (optional - for testing)
  skip: (req) => {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || []
    return trustedIPs.includes(req.ip || '')
  },
})

/**
 * Strict limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

/**
 * Moderate limiter for write operations (POST, PUT, PATCH, DELETE)
 * 20 requests per hour
 */
export const writeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many write operations, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to write operations
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  },
})

/**
 * Lenient limiter for read operations (GET)
 * 200 requests per 15 minutes
 */
export const readLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET',
})

/**
 * Speed limiter - progressively slow down requests before blocking
 * Adds delay to responses after threshold
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after threshold
  maxDelayMs: 5000, // Maximum delay of 5 seconds
})

/**
 * Heavy operation limiter (for file uploads, bulk operations)
 * 5 requests per hour
 */
export const heavyOperationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many heavy operations, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
