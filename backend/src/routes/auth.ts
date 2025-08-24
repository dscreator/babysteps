import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { authService } from '../services/authService'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { validateRequest, registerSchema, loginSchema, updateProfileSchema } from '../utils/validation'

const router = Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// User registration endpoint
router.post('/register', 
  authLimiter,
  validateRequest(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body)
      
      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        session: {
          access_token: result.session?.access_token,
          refresh_token: result.session?.refresh_token,
          expires_at: result.session?.expires_at
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      })
    }
  }
)

// User login endpoint
router.post('/login',
  authLimiter,
  validateRequest(loginSchema),
  async (req: Request, res: Response) => {
    try {
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
      console.error('Login error:', error)
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Login failed' 
      })
    }
  }
)

// User logout endpoint
router.post('/logout',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authHeader = req.headers.authorization
      const token = authHeader?.split(' ')[1]
      
      if (token) {
        await authService.logout(token)
      }
      
      res.json({ message: 'Logout successful' })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Logout failed' 
      })
    }
  }
)

// Get user profile endpoint
router.get('/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profile = await authService.getProfile(req.user.userId)
      res.json({ user: profile })
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to retrieve profile' 
      })
    }
  }
)

// Update user profile endpoint
router.put('/profile',
  authenticateToken,
  validateRequest(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const updatedProfile = await authService.updateProfile(req.user.userId, req.body)
      res.json({ 
        message: 'Profile updated successfully',
        user: updatedProfile 
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      })
    }
  }
)

// Verify token endpoint (for frontend to check if token is still valid)
router.get('/verify',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profile = await authService.getProfile(req.user.userId)
      res.json({ 
        valid: true,
        user: profile 
      })
    } catch (error) {
      console.error('Token verification error:', error)
      res.status(401).json({ 
        valid: false,
        error: 'Invalid token' 
      })
    }
  }
)

export { router as authRoutes }