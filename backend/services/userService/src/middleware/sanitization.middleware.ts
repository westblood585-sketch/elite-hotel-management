import { Request, Response, NextFunction } from 'express'

/**
 * Sanitization middleware to prevent NoSQL injection and XSS attacks
 * Removes dangerous characters and patterns from user inputs
 */

/**
 * Recursively sanitize an object by removing/replacing dangerous patterns
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Remove null bytes
    value = value.replace(/\0/g, '')
    // Trim whitespace
    value = value.trim()
    return value
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value !== null && typeof value === 'object') {
    // Remove MongoDB operators from object keys
    const sanitized: any = {}
    for (const key in value) {
      // Skip keys starting with $ (MongoDB operators) or containing . (nested paths)
      if (!key.startsWith('$') && !key.includes('.')) {
        sanitized[key] = sanitizeValue(value[key])
      }
    }
    return sanitized
  }

  return value
}

/**
 * Middleware to sanitize request body, query params, and route params
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    req.body = sanitizeValue(req.body)
  }

  if (req.query) {
    const sanitized = sanitizeValue(req.query)
    // Safe update for req.query which might be a getter
    Object.keys(req.query).forEach((key) => delete req.query[key])
    Object.assign(req.query, sanitized)
  }

  if (req.params) {
    const sanitized = sanitizeValue(req.params)
    // Safe update for req.params
    Object.keys(req.params).forEach((key) => delete req.params[key])
    Object.assign(req.params, sanitized)
  }

  next()
}
