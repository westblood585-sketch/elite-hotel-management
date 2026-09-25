import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { CustomeRequest } from '../interfaces/CustomRequest'

const authenticateToken = async (
  req: CustomeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided' 
      })
    }

    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. Invalid token format' 
      })
    }

    const secret = process.env.ACCESS_TOKEN_SECRET
    
    if (!secret) {
      console.error('CRITICAL: ACCESS_TOKEN_SECRET not configured')
      return res.status(500).json({ 
        success: false,
        message: 'Authentication service unavailable' 
      })
    }

    // Synchronously verify token
    let decoded: JwtPayload
    try {
      decoded = jwt.verify(token, secret) as JwtPayload
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      })
    }

    // Validate payload structure
    if (!decoded.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      })
    }

    // Stateless Auth: Trust the token signature.
    // We do NOT check the local DB for the user, as the user DB is isolated.
    req.user = decoded
    
    next()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error)
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed' 
    })
  }
}

export default authenticateToken
