import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { contentService } from '../services/content/contentService'
import { practiceService } from '../services/practiceService'
import {
  validateQueryParams,
  validateGetProblems,
  validateGetPassages,
  validateGetVocabulary,
  validateGetPrompts,
  createValidationMiddleware,
  validateCreateSession,
  validateUpdateSession,
  validateEndSession,
  validateSubmitAnswer,
  validateRecordInteraction
} from '../utils/practiceValidation'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Session management routes
router.post('/sessions', createValidationMiddleware(validateCreateSession), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const session = await practiceService.createSession(userId, req.validatedData)
    res.status(201).json({ session })
  } catch (error) {
    console.error('Error creating practice session:', error)
    res.status(500).json({ 
      error: 'Failed to create practice session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { sessionId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const session = await practiceService.getSessionById(sessionId, userId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json({ session })
  } catch (error) {
    console.error('Error fetching practice session:', error)
    res.status(500).json({ 
      error: 'Failed to fetch practice session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.put('/sessions/:sessionId', createValidationMiddleware(validateUpdateSession), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { sessionId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const session = await practiceService.updateSession(sessionId, userId, req.validatedData)
    res.json({ session })
  } catch (error) {
    console.error('Error updating practice session:', error)
    res.status(500).json({ 
      error: 'Failed to update practice session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/sessions/:sessionId/end', createValidationMiddleware(validateEndSession), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { sessionId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const session = await practiceService.endSession(sessionId, userId, req.validatedData)
    res.json({ session })
  } catch (error) {
    console.error('Error ending practice session:', error)
    res.status(500).json({ 
      error: 'Failed to end practice session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { subject, limit, offset, includeActive } = req.query
    const options = {
      subject: subject as 'math' | 'english' | 'essay' | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      includeActive: includeActive === 'true'
    }

    const sessions = await practiceService.getUserSessions(userId, options)
    res.json({ sessions })
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    res.status(500).json({ 
      error: 'Failed to fetch user sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/sessions/active', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const session = await practiceService.getActiveSession(userId)
    res.json({ session })
  } catch (error) {
    console.error('Error fetching active session:', error)
    res.status(500).json({ 
      error: 'Failed to fetch active session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Answer submission
router.post('/submit', createValidationMiddleware(validateSubmitAnswer), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await practiceService.submitAnswer(userId, req.validatedData)
    res.json(result)
  } catch (error) {
    console.error('Error submitting answer:', error)
    res.status(500).json({ 
      error: 'Failed to submit answer',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Math practice routes
router.get('/math/problems', async (req: Request, res: Response) => {
  try {
    const params = validateQueryParams(validateGetProblems, req.query)
    const problems = await contentService.getMathProblems(params)
    res.json({ problems })
  } catch (error) {
    console.error('Error fetching math problems:', error)
    res.status(500).json({ 
      error: 'Failed to fetch math problems',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/math/problems/:problemId', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params
    const problem = await contentService.getMathProblemById(problemId)
    
    if (!problem) {
      return res.status(404).json({ error: 'Math problem not found' })
    }

    res.json({ problem })
  } catch (error) {
    console.error('Error fetching math problem:', error)
    res.status(500).json({ 
      error: 'Failed to fetch math problem',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/math/random', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 5
    const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined
    
    const problems = await contentService.getRandomMathProblems(count, gradeLevel)
    res.json({ problems })
  } catch (error) {
    console.error('Error fetching random math problems:', error)
    res.status(500).json({ 
      error: 'Failed to fetch random math problems',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// English practice routes
router.get('/english/passages', async (req: Request, res: Response) => {
  try {
    const params = validateQueryParams(validateGetPassages, req.query)
    const passages = await contentService.getReadingPassages(params)
    res.json({ passages })
  } catch (error) {
    console.error('Error fetching reading passages:', error)
    res.status(500).json({ 
      error: 'Failed to fetch reading passages',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/english/passages/:passageId', async (req: Request, res: Response) => {
  try {
    const { passageId } = req.params
    const result = await contentService.getReadingPassageWithQuestions(passageId)
    
    if (!result) {
      return res.status(404).json({ error: 'Reading passage not found' })
    }

    res.json(result)
  } catch (error) {
    console.error('Error fetching reading passage:', error)
    res.status(500).json({ 
      error: 'Failed to fetch reading passage',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/english/vocabulary', async (req: Request, res: Response) => {
  try {
    const params = validateQueryParams(validateGetVocabulary, req.query)
    const words = await contentService.getVocabularyWords(params)
    res.json({ words })
  } catch (error) {
    console.error('Error fetching vocabulary words:', error)
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary words',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/english/random', async (req: Request, res: Response) => {
  try {
    const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined
    
    const result = await contentService.getRandomReadingPassage(gradeLevel)
    res.json(result)
  } catch (error) {
    console.error('Error fetching random reading passage:', error)
    res.status(500).json({ 
      error: 'Failed to fetch random reading passage',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Essay practice routes
router.get('/essay/prompts', async (req: Request, res: Response) => {
  try {
    const params = validateQueryParams(validateGetPrompts, req.query)
    const prompts = await contentService.getEssayPrompts(params)
    res.json({ prompts })
  } catch (error) {
    console.error('Error fetching essay prompts:', error)
    res.status(500).json({ 
      error: 'Failed to fetch essay prompts',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/essay/prompts/:promptId', async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params
    const prompt = await contentService.getEssayPromptById(promptId)
    
    if (!prompt) {
      return res.status(404).json({ error: 'Essay prompt not found' })
    }

    res.json({ prompt })
  } catch (error) {
    console.error('Error fetching essay prompt:', error)
    res.status(500).json({ 
      error: 'Failed to fetch essay prompt',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// AI interactions
router.post('/interactions', createValidationMiddleware(validateRecordInteraction), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const interaction = await practiceService.recordAIInteraction(userId, req.validatedData)
    res.status(201).json({ interaction })
  } catch (error) {
    console.error('Error recording AI interaction:', error)
    res.status(500).json({ 
      error: 'Failed to record AI interaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Hint usage tracking
router.post('/sessions/:sessionId/hints', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { sessionId } = req.params
    const { questionId, hintIndex, timeSpent } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!questionId || hintIndex === undefined) {
      return res.status(400).json({ error: 'questionId and hintIndex are required' })
    }

    await practiceService.trackHintUsage(userId, sessionId, questionId, hintIndex, timeSpent)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error tracking hint usage:', error)
    res.status(500).json({ 
      error: 'Failed to track hint usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/sessions/:sessionId/interactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { sessionId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const interactions = await practiceService.getSessionInteractions(sessionId, userId)
    res.json({ interactions })
  } catch (error) {
    console.error('Error fetching session interactions:', error)
    res.status(500).json({ 
      error: 'Failed to fetch session interactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { subject } = req.query
    const stats = await practiceService.getSessionStats(
      userId, 
      subject as 'math' | 'english' | 'essay' | undefined
    )
    res.json({ stats })
  } catch (error) {
    console.error('Error fetching session stats:', error)
    res.status(500).json({ 
      error: 'Failed to fetch session stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Content statistics
router.get('/content/stats', async (req: Request, res: Response) => {
  try {
    const stats = await contentService.getContentStats()
    res.json({ stats })
  } catch (error) {
    console.error('Error fetching content stats:', error)
    res.status(500).json({ 
      error: 'Failed to fetch content stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// English analytics
router.get('/analytics/english', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { timeRange } = req.query
    const analytics = await practiceService.getEnglishAnalytics(
      userId, 
      timeRange as 'week' | 'month' | 'all' | undefined
    )
    res.json({ analytics })
  } catch (error) {
    console.error('Error fetching English analytics:', error)
    res.status(500).json({ 
      error: 'Failed to fetch English analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as practiceRoutes }