import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { parentService } from '../services/parentService'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { validateRequest } from '../utils/validation'
import { z } from 'zod'

const router = Router()

// Rate limiting for parent auth endpoints
const parentAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Validation schemas
const createParentAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentEmail: z.string().email()
})

const parentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const linkStudentSchema = z.object({
  studentEmail: z.string().email(),
  accessCode: z.string().optional()
})

const grantAccessSchema = z.object({
  accessCode: z.string().min(1)
})

const notificationPreferencesSchema = z.object({
  progressMilestones: z.boolean(),
  studyReminders: z.boolean(),
  weeklyReports: z.boolean(),
  emailFrequency: z.enum(['daily', 'weekly', 'monthly'])
})

// Create parent account
router.post('/register',
  parentAuthLimiter,
  validateRequest(createParentAccountSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await parentService.createParentAccount(req.body)
      
      res.status(201).json({
        message: 'Parent account created successfully',
        parent: result.parent,
        session: {
          access_token: result.session?.access_token,
          refresh_token: result.session?.refresh_token,
          expires_at: result.session?.expires_at
        }
      })
    } catch (error) {
      console.error('Parent registration error:', error)
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Parent account creation failed' 
      })
    }
  }
)

// Parent login
router.post('/login',
  parentAuthLimiter,
  validateRequest(parentLoginSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await parentService.loginParent(req.body)
      
      res.json({
        message: 'Parent login successful',
        parent: result.parent,
        session: {
          access_token: result.session?.access_token,
          refresh_token: result.session?.refresh_token,
          expires_at: result.session?.expires_at
        }
      })
    } catch (error) {
      console.error('Parent login error:', error)
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Parent login failed' 
      })
    }
  }
)

// Get linked students
router.get('/students',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Parent not authenticated' })
      }

      const students = await parentService.getLinkedStudents(req.user.userId)
      res.json({ students })
    } catch (error) {
      console.error('Get linked students error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get linked students' 
      })
    }
  }
)

// Request access to student account
router.post('/students/link',
  authenticateToken,
  validateRequest(linkStudentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Parent not authenticated' })
      }

      await parentService.requestStudentAccess(req.user.userId, req.body.studentEmail)
      res.json({ message: 'Student access requested successfully' })
    } catch (error) {
      console.error('Link student error:', error)
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to request student access' 
      })
    }
  }
)

// Get parent dashboard data for a specific student
router.get('/dashboard/:studentId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Parent not authenticated' })
      }

      const dashboardData = await parentService.getParentDashboardData(
        req.user.userId, 
        req.params.studentId
      )
      res.json(dashboardData)
    } catch (error) {
      console.error('Get parent dashboard error:', error)
      res.status(403).json({ 
        error: error instanceof Error ? error.message : 'Failed to get dashboard data' 
      })
    }
  }
)

// Update notification preferences
router.put('/preferences/notifications',
  authenticateToken,
  validateRequest(notificationPreferencesSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Parent not authenticated' })
      }

      await parentService.updateNotificationPreferences(req.user.userId, req.body)
      res.json({ message: 'Notification preferences updated successfully' })
    } catch (error) {
      console.error('Update notification preferences error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update notification preferences' 
      })
    }
  }
)

export { router as parentRoutes }

// Student-side endpoints for managing parent access
export const studentParentRoutes = Router()

// Grant parent access (student endpoint)
studentParentRoutes.post('/grant-access',
  authenticateToken,
  validateRequest(grantAccessSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Student not authenticated' })
      }

      await parentService.grantStudentAccess(req.user.userId, req.body.accessCode)
      res.json({ message: 'Parent access granted successfully' })
    } catch (error) {
      console.error('Grant parent access error:', error)
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to grant parent access' 
      })
    }
  }
)