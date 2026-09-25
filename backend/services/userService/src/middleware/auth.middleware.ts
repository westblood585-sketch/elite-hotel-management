import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { CustomeRequest } from '../interfaces/CustomRequest'
import CustomError from '../utils/CustomError'
import { HttpStatus } from '../enums/http.status'

/**
 * Authenticate JWT token from Authorization header
 * Verifies token signature and expiration, extracts user payload
 */
const authenticateToken = async (
  req: CustomeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    
    if (!authHeader) {
      throw new CustomError(
        'Access denied. No token provided',
        HttpStatus.UNAUTHORIZED
      )
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      throw new CustomError(
        'Invalid token format. Expected: Bearer <token>',
        HttpStatus.UNAUTHORIZED
      )
    }

    const secret = process.env.ACCESS_TOKEN_SECRET
    
    if (!secret) {
      console.error('CRITICAL: ACCESS_TOKEN_SECRET is not defined in environment')
      throw new CustomError(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    // Synchronous verification - throws error if invalid or expired
    const decoded = jwt.verify(token, secret) as JwtPayload
    
    // Validate payload structure
    if (!decoded.id) {
      throw new CustomError(
        'Invalid token payload',
        HttpStatus.UNAUTHORIZED
      )
    }

    // Attach user info to request
    req.user = decoded
    
    next()
  } catch (error) {
    // Handle JWT-specific errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError('Invalid token', HttpStatus.UNAUTHORIZED))
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError('Token expired', HttpStatus.UNAUTHORIZED))
    }
    if (error instanceof jwt.NotBeforeError) {
      return next(new CustomError('Token not yet valid', HttpStatus.UNAUTHORIZED))
    }
    
    // Pass other errors to global error handler
    next(error)
  }
}

export default authenticateToken
