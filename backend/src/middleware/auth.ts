import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const userData = await authService.verifyToken(token)
    req.user = userData
    next()
  } catch (error) {
    console.error('Token verification failed:', error)
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const userData = await authService.verifyToken(token)
      req.user = userData
    }
    
    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}