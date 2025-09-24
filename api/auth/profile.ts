import { VercelRequest, VercelResponse } from '@vercel/node'
import { withMiddleware, handleError, validateMethod } from '../_lib/middleware'
import { authService } from '../../backend/src/services/authService'
import { updateProfileSchema } from '../../backend/src/utils/validation'

// Helper to extract user from token
async function getUserFromToken(req: VercelRequest) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  // You'll need to implement token verification
  // This is a simplified version - implement proper JWT verification
  return { userId: 'user-id-from-token' }
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(req, res, ['GET', 'PUT'])) return

  try {
    const user = await getUserFromToken(req)
    
    if (req.method === 'GET') {
      const profile = await authService.getProfile(user.userId)
      res.json({ user: profile })
    } else if (req.method === 'PUT') {
      // Validate request body for updates
      const validation = updateProfileSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        })
      }

      const updatedProfile = await authService.updateProfile(user.userId, req.body)
      res.json({ 
        message: 'Profile updated successfully',
        user: updatedProfile 
      })
    }
  } catch (error) {
    handleError(res, error, 'Profile operation failed')
  }
}

export default withMiddleware(handler)