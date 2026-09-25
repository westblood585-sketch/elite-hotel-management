import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'


// Custom UserPayload interface
export interface UserPayload extends JwtPayload {
  id: string
  role: string
  email?: string
}

// Extend Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: UserPayload
}

/**
 * Authentication middleware - validates JWT tokens
 * Stateless version: Trusts signed JWTs without local DB lookup.
 */
const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract Authorization header
    const authHeader = req.headers['authorization']
    
    if (!authHeader) {
      res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided' 
      })
      return
    }

    // 2. Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token format. Expected "Bearer <token>"' 
      })
      return
    }

    // 3. Extract token
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'Access denied. Token is missing' 
      })
      return
    }

    // 4. Verify secret exists
    const secret = process.env.ACCESS_TOKEN_SECRET
    if (!secret) {
      console.error('CRITICAL: ACCESS_TOKEN_SECRET is not defined')
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      })
      return
    }

    // 5. Verify JWT token
    let decoded: UserPayload
    try {
      decoded = jwt.verify(token, secret) as UserPayload
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        res.status(401).json({ 
          success: false,
          message: 'Token expired. Please log in again',
          code: 'TOKEN_EXPIRED'
        })
        return
      }
      
      if (error instanceof JsonWebTokenError) {
        res.status(401).json({ 
          success: false,
          message: 'Invalid token',
          code: 'TOKEN_INVALID'
        })
        return
      }
      
      throw error // Re-throw unexpected errors
    }

    // 6. Validate token payload
    if (!decoded.id || !decoded.role) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token payload',
        code: 'INVALID_PAYLOAD'
      })
      return
    }

    // Stateless: We do not check User.findById() nor isVerified here.
    // The token is proof of authentication.

    // 7. Attach user to request
    req.user = decoded
    next()

  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during authentication' 
    })
  }
}

export default authenticateToken
