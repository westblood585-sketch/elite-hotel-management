import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

/**
 * Middleware to sanitize request inputs against XSS attacks
 * Sanitizes body, query params, and URL params
 */
export const sanitizeInputs = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }

  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    const sanitized = sanitizeObject(req.query)
    Object.keys(req.query).forEach((key) => delete req.query[key])
    Object.assign(req.query, sanitized)
  }

  // Sanitize URL params
  if (req.params && typeof req.params === 'object') {
    const sanitized = sanitizeObject(req.params)
    Object.keys(req.params).forEach((key) => delete req.params[key])
    Object.assign(req.params, sanitized)
  }

  next()
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export default sanitizeInputs
