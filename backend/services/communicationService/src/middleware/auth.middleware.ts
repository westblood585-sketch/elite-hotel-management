import { Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AuthenticatedRequest } from '../types'

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided' 
      })
    }

    const secret = process.env.ACCESS_TOKEN_SECRET
    if (!secret) {
      console.error('ACCESS_TOKEN_SECRET is not defined')
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      })
    }

    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = decoded

    if (!req.user.id) {
       return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload: Missing user ID' 
      })
    }
    
    // Stateless Auth: Trust token
    
    next()
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token' 
    })
  }
}
