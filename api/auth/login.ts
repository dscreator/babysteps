import { VercelRequest, VercelResponse } from '@vercel/node'
import { withMiddleware, handleError, validateMethod } from '../_lib/middleware'
import { authService } from '../../backend/src/services/authService'
import { loginSchema } from '../../backend/src/utils/validation'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(req, res, ['POST'])) return

  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      })
    }

    const result = await authService.login(req.body)
    
    res.json({
      message: 'Login successful',
      user: result.user,
      session: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
        expires_at: result.session?.expires_at
      }
    })
  } catch (error) {
    handleError(res, error, 'Login failed')
  }
}

export default withMiddleware(handler)