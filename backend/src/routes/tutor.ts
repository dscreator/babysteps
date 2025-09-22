import { Router, Response } from 'express'
import { z } from 'zod'
import { tutorService, HintRequest, ExplanationRequest } from '../services/ai/tutorService'
import { contextService } from '../services/ai/contextService'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// Apply authentication middleware to all tutor routes
router.use(authenticateToken)

// Validation schemas
const hintRequestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  subject: z.enum(['math', 'english', 'essay']),
  currentProblemId: z.string().optional(),
  userAnswer: z.string().optional(),
  attemptCount: z.number().min(1).default(1)
})

const explanationRequestSchema = z.object({
  concept: z.string().min(1, 'Concept is required'),
  subject: z.enum(['math', 'english', 'essay']),
  question: z.string().optional(),
  currentProblemId: z.string().optional(),
  userAnswer: z.string().optional(),
  isIncorrect: z.boolean().default(false)
})

const contextualHelpSchema = z.object({
  subject: z.enum(['math', 'english', 'essay']),
  helpType: z.enum(['stuck', 'confused', 'encouragement']),
  currentProblemId: z.string().optional()
})

// Generate hint for current problem
router.post('/hint', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const validatedData = hintRequestSchema.parse(req.body)
    const { question, subject, currentProblemId, userAnswer, attemptCount } = validatedData

    // Build context for the tutor
    const context = await contextService.buildTutorContext(userId, subject, currentProblemId)

    const hintRequest: HintRequest = {
      context,
      question,
      userAnswer,
      attemptCount
    }

    const response = await tutorService.generateHint(hintRequest)

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error generating hint:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to generate hint'
    })
  }
})

// Generate explanation for concept
router.post('/explain', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const validatedData = explanationRequestSchema.parse(req.body)
    const { concept, subject, question, currentProblemId, userAnswer, isIncorrect } = validatedData

    // Build context for the tutor
    const context = await contextService.buildTutorContext(userId, subject, currentProblemId)

    const explanationRequest: ExplanationRequest = {
      context,
      concept,
      question,
      userAnswer,
      isIncorrect
    }

    const response = await tutorService.generateExplanation(explanationRequest)

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error generating explanation:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to generate explanation'
    })
  }
})

// Generate contextual help
router.post('/help', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const validatedData = contextualHelpSchema.parse(req.body)
    const { subject, helpType, currentProblemId } = validatedData

    // Build context for the tutor
    const context = await contextService.buildTutorContext(userId, subject, currentProblemId)

    const response = await tutorService.generateContextualHelp(context, helpType)

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error generating contextual help:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to generate help'
    })
  }
})

// Get personalized recommendations
router.get('/recommendations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const subject = req.query.subject as 'math' | 'english' | 'essay'
    if (!subject || !['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({
        error: 'Valid subject parameter is required (math, english, or essay)'
      })
    }

    const { personalizationEngine } = await import('../services/ai/personalizationEngine')
    const recommendations = await personalizationEngine.generatePersonalizedRecommendations(userId, subject)

    res.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('Error getting recommendations:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get recommendations'
    })
  }
})

// Get user's learning analytics
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const subject = req.query.subject as 'math' | 'english' | 'essay'
    if (!subject || !['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({
        error: 'Valid subject parameter is required (math, english, or essay)'
      })
    }

    const { adaptiveLearningService } = await import('../services/ai/adaptiveLearningService')
    const { learningStyleService } = await import('../services/ai/learningStyleService')
    
    const [learningPatterns, learningStyle] = await Promise.all([
      adaptiveLearningService.analyzeUserLearningPatterns(userId, subject),
      learningStyleService.analyzeLearningStyle(userId)
    ])

    res.json({
      success: true,
      data: {
        learningPatterns,
        learningStyle
      }
    })
  } catch (error) {
    console.error('Error getting learning analytics:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get learning analytics'
    })
  }
})

// Check AI service availability
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { openaiService } = await import('../services/ai/openaiService')
    
    res.json({
      success: true,
      data: {
        aiServiceAvailable: openaiService.isAvailable(),
        features: {
          hints: true,
          explanations: true,
          contextualHelp: true,
          recommendations: true,
          analytics: true
        }
      }
    })
  } catch (error) {
    console.error('Error checking tutor status:', error)
    res.status(500).json({
      error: 'Failed to check service status'
    })
  }
})

// Get learning insights for a user
router.get('/insights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const subject = req.query.subject as 'math' | 'english' | 'essay'
    if (!subject || !['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({
        error: 'Valid subject parameter is required (math, english, or essay)'
      })
    }

    const { personalizationEngine } = await import('../services/ai/personalizationEngine')
    const insights = await personalizationEngine.generateLearningInsights(userId, subject)

    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    console.error('Error getting learning insights:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get learning insights'
    })
  }
})

// Adjust difficulty based on performance
router.post('/adjust-difficulty', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const adjustmentSchema = z.object({
      subject: z.enum(['math', 'english', 'essay']),
      currentDifficulty: z.number().min(1).max(10)
    })

    const { subject, currentDifficulty } = adjustmentSchema.parse(req.body)

    const { adaptiveLearningService } = await import('../services/ai/adaptiveLearningService')
    const adjustment = await adaptiveLearningService.adjustDifficulty(userId, subject, currentDifficulty)

    res.json({
      success: true,
      data: adjustment
    })
  } catch (error) {
    console.error('Error adjusting difficulty:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to adjust difficulty'
    })
  }
})

// Provide feedback on personalization effectiveness
router.post('/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const feedbackSchema = z.object({
      subject: z.enum(['math', 'english', 'essay']),
      feedbackType: z.enum(['helpful', 'not_helpful', 'too_easy', 'too_hard']),
      context: z.record(z.any()).optional()
    })

    const { subject, feedbackType, context } = feedbackSchema.parse(req.body)

    const { personalizationEngine } = await import('../services/ai/personalizationEngine')
    await personalizationEngine.updatePersonalizationFromFeedback(userId, subject, feedbackType, context || {})

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    })
  } catch (error) {
    console.error('Error recording feedback:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to record feedback'
    })
  }
})

// Get content recommendations
router.get('/content-recommendations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const subject = req.query.subject as 'math' | 'english' | 'essay'
    if (!subject || !['math', 'english', 'essay'].includes(subject)) {
      return res.status(400).json({
        error: 'Valid subject parameter is required (math, english, or essay)'
      })
    }

    const { adaptiveLearningService } = await import('../services/ai/adaptiveLearningService')
    const recommendations = await adaptiveLearningService.generateContentRecommendations(userId, subject)

    res.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('Error getting content recommendations:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get content recommendations'
    })
  }
})

// Adapt content for user's learning style
router.post('/adapt-content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const adaptContentSchema = z.object({
      content: z.record(z.any()),
      contentType: z.enum(['problem', 'explanation', 'hint', 'feedback'])
    })

    const { content, contentType } = adaptContentSchema.parse(req.body)

    const { personalizationEngine } = await import('../services/ai/personalizationEngine')
    const adaptedContent = await personalizationEngine.adaptContentForUser(userId, content, contentType)

    res.json({
      success: true,
      data: adaptedContent
    })
  } catch (error) {
    console.error('Error adapting content:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to adapt content'
    })
  }
})

// Chat with AI tutor
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const chatRequestSchema = z.object({
      conversationId: z.string().uuid().optional(),
      message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
      subject: z.enum(['math', 'english', 'essay', 'general']),
      context: z.record(z.any()).optional()
    })

    const validatedData = chatRequestSchema.parse(req.body)

    const { conversationService } = await import('../services/ai/conversationService')
    const response = await conversationService.processChat(userId, validatedData)

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error processing chat:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to process chat message'
    })
  }
})

// Get user's chat conversations
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const limit = parseInt(req.query.limit as string) || 20

    const { conversationService } = await import('../services/ai/conversationService')
    const conversations = await conversationService.getUserConversations(userId, limit)

    res.json({
      success: true,
      data: conversations
    })
  } catch (error) {
    console.error('Error getting conversations:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get conversations'
    })
  }
})

// Get specific conversation
router.get('/conversations/:conversationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { conversationId } = req.params

    const { conversationService } = await import('../services/ai/conversationService')
    const conversation = await conversationService.getConversation(conversationId, userId)

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      })
    }

    res.json({
      success: true,
      data: conversation
    })
  } catch (error) {
    console.error('Error getting conversation:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to get conversation'
    })
  }
})

// Update conversation title
router.patch('/conversations/:conversationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { conversationId } = req.params
    const updateSchema = z.object({
      title: z.string().min(1).max(100).optional()
    })

    const { title } = updateSchema.parse(req.body)

    if (title) {
      const { conversationService } = await import('../services/ai/conversationService')
      await conversationService.updateConversationTitle(conversationId, userId, title)
    }

    res.json({
      success: true,
      message: 'Conversation updated successfully'
    })
  } catch (error) {
    console.error('Error updating conversation:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to update conversation'
    })
  }
})

// Deactivate conversation
router.delete('/conversations/:conversationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { conversationId } = req.params

    const { conversationService } = await import('../services/ai/conversationService')
    await conversationService.deactivateConversation(conversationId, userId)

    res.json({
      success: true,
      message: 'Conversation deactivated successfully'
    })
  } catch (error) {
    console.error('Error deactivating conversation:', error)
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to deactivate conversation'
    })
  }
})

export { router as tutorRoutes }