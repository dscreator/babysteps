import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { progressService } from '../services/progressService'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const dashboardData = await progressService.getDashboardData(userId)
    res.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Detailed progress by subject
router.get('/detailed/:subject', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { subject } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject. Must be math, english, or essay' })
    }

    const progress = await progressService.getUserProgress(userId, subject as 'math' | 'english' | 'essay')
    res.json({ progress })
  } catch (error) {
    console.error('Error fetching detailed progress:', error)
    res.status(500).json({ 
      error: 'Failed to fetch detailed progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// All subjects progress
router.get('/all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const allProgress = await progressService.getAllUserProgress(userId)
    res.json({ progress: allProgress })
  } catch (error) {
    console.error('Error fetching all progress:', error)
    res.status(500).json({ 
      error: 'Failed to fetch all progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update progress for a subject
router.put('/update/:subject', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { subject } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject. Must be math, english, or essay' })
    }

    const updatedProgress = await progressService.updateUserProgress(userId, subject as 'math' | 'english' | 'essay')
    res.json({ progress: updatedProgress })
  } catch (error) {
    console.error('Error updating progress:', error)
    res.status(500).json({ 
      error: 'Failed to update progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Progress snapshots for trend analysis
router.get('/snapshots', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { subject, days } = req.query
    const daysNumber = days ? parseInt(days as string) : 30

    const snapshots = await progressService.getProgressSnapshots(
      userId,
      subject as 'math' | 'english' | 'essay' | undefined,
      daysNumber
    )
    res.json({ snapshots })
  } catch (error) {
    console.error('Error fetching progress snapshots:', error)
    res.status(500).json({ 
      error: 'Failed to fetch progress snapshots',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create progress snapshot
router.post('/snapshots/:subject', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { subject } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject. Must be math, english, or essay' })
    }

    const snapshot = await progressService.createProgressSnapshot(userId, subject as 'math' | 'english' | 'essay')
    res.status(201).json({ snapshot })
  } catch (error) {
    console.error('Error creating progress snapshot:', error)
    res.status(500).json({ 
      error: 'Failed to create progress snapshot',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Legacy endpoints for backward compatibility
router.post('/goals', (req: Request, res: Response) => {
  res.json({ message: 'Goals endpoint - to be implemented in task 9.2' })
})

router.get('/analytics/performance', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Return dashboard data for now - can be expanded in task 9.1
    const dashboardData = await progressService.getDashboardData(userId)
    res.json({ 
      performance: {
        overallProgress: dashboardData.overallProgress,
        recentSessions: dashboardData.recentSessions,
        streakDays: dashboardData.streakDays,
        weeklyGoalProgress: dashboardData.weeklyGoalProgress
      }
    })
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    res.status(500).json({ 
      error: 'Failed to fetch performance analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as progressRoutes }