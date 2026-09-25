import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { CustomeRequest } from '../interfaces/CustomRequest'
import logger from '../utils/logger.service'

const authenticateToken = async (
  req: CustomeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided' 
      })
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.ACCESS_TOKEN_SECRET
    
    if (!secret) {
      logger.error('ACCESS_TOKEN_SECRET is not configured')
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      })
    }

    // Synchronously verify
    const decoded = jwt.verify(token, secret) as JwtPayload
    
    if (!decoded.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      })
    }

    // Stateless Auth: Trust the token. 
    // Removed local DB lookup and caching to support database isolation.
    req.user = { id: decoded.id, ...decoded }
    next()
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      })
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      })
    }
    
    logger.error('Authentication error', { error })
    // If we call next(error), it goes to error handler.
    // Ensure error handler sends JSON response.
    // For safety, let's return 500 here if no error handler is trusted.
    // But reservationService has global handler.
    next(error)
  }
}

export default authenticateToken
