import { Router, Request, Response } from 'express'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { notificationService } from '../services/notificationService'
import { validateRequest } from '../utils/validation'
import { z } from 'zod'

const router = Router()

// Validation schemas
const triggerNotificationSchema = z.object({
  type: z.enum(['progress_milestone', 'study_reminder', 'weekly_report']),
  data: z.record(z.any())
})

const testNotificationSchema = z.object({
  type: z.enum(['progress_milestone', 'study_reminder', 'weekly_report', 'access_request']),
  recipientEmail: z.string().email().optional()
})

// Trigger a notification manually (for testing or admin purposes)
router.post('/trigger',
  authenticateToken,
  validateRequest(triggerNotificationSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      await notificationService.processNotificationTrigger({
        type: req.body.type,
        userId: req.user.userId,
        data: req.body.data
      })

      res.json({ message: 'Notification triggered successfully' })
    } catch (error) {
      console.error('Trigger notification error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to trigger notification' 
      })
    }
  }
)

// Test notification endpoint (development/admin only)
router.post('/test',
  authenticateToken,
  validateRequest(testNotificationSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // Only allow in development or for admin users
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test notifications not available in production' })
      }

      const { type, recipientEmail } = req.body
      const userId = req.user.userId

      let testData: any = {}

      switch (type) {
        case 'progress_milestone':
          testData = {
            subject: 'Math',
            achievement: 'Scored above 85% for the first time!',
            score: 87,
            improvement: 12
          }
          break

        case 'study_reminder':
          testData = {
            daysSinceLastPractice: 3,
            streakAtRisk: true,
            examDaysRemaining: 45
          }
          break

        case 'weekly_report':
          testData = {
            weeklyStats: {
              totalPracticeTime: 180,
              sessionsCompleted: 8,
              averageScore: 78,
              subjectBreakdown: {
                math: { time: 80, score: 82 },
                english: { time: 60, score: 75 },
                essay: { time: 40, score: 77 }
              }
            },
            improvements: [
              'Showing consistent improvement in algebra',
              'Reading comprehension scores increased by 8%'
            ],
            recommendations: [
              'Focus more on geometry practice',
              'Continue with current vocabulary study routine'
            ]
          }
          break

        case 'access_request':
          testData = {
            studentEmail: req.user.email,
            parentEmail: recipientEmail || 'parent@example.com',
            accessCode: 'TEST1234'
          }
          break
      }

      await notificationService.processNotificationTrigger({
        type,
        userId,
        data: testData
      })

      res.json({ 
        message: 'Test notification sent successfully',
        type,
        data: testData
      })
    } catch (error) {
      console.error('Test notification error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to send test notification' 
      })
    }
  }
)

// Get notification history for a user (future enhancement)
router.get('/history',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      // This would fetch notification history from a notifications table
      // For now, return empty array as this feature isn't implemented yet
      res.json({ notifications: [] })
    } catch (error) {
      console.error('Get notification history error:', error)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get notification history' 
      })
    }
  }
)

export { router as notificationRoutes }