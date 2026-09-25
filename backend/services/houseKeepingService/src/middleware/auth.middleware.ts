import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { CustomeRequest } from '../interfaces/CustomRequest'

const authenticateToken = (
  req: CustomeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers['authorization']
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Access denied . No token provided' })
    }
    const newToken = token?.split(' ')[1]
    // Debugging Secret Loading
    const secret = process.env.ACCESS_TOKEN_SECRET || "";

    if (!secret) {
      console.error('[AuthMiddleware] No secret defined! Checks ACCESS_TOKEN_SECRET and JWT_SECRET');
      throw new Error('Access token secret is not defined')
    }

    jwt.verify(newToken, secret, (err, user) => {
      if (err) {
        console.error('[AuthMiddleware] Token verification failed:', err.message);
        console.error('[AuthMiddleware] Token part:', newToken.substring(0, 10) + '...');
        return res.status(401).json({ message: 'Invalid token', error: err.message })
      }
      req.user = user as JwtPayload
      
      if (!req.user.id) {
        console.error('[AuthMiddleware] Token valid but no user ID');
        return res.status(401).json({ message: 'Unauthorized' })
      }

      next()
    })
  } catch (error) {
    console.error('Error found in authenticate token', error)
    return res.status(500).json({ message: 'Internal Server Error' }) // Return json response on crash
  }
}

export default authenticateToken
