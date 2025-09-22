import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { tutorRoutes } from '../routes/tutor'

// Mock the dependencies
vi.mock('../services/ai/tutorService', () => ({
  tutorService: {
    generateHint: vi.fn(),
    generateExplanation: vi.fn(),
    generateContextualHelp: vi.fn()
  }
}))

vi.mock('../services/ai/contextService', () => ({
  contextService: {
    buildTutorContext: vi.fn(),
    getPersonalizedRecommendations: vi.fn(),
    analyzeUserLearningPatterns: vi.fn()
  }
}))

vi.mock('../services/ai/openaiService', () => ({
  openaiService: {
    isAvailable: vi.fn(() => true)
  }
}))

vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' }
    next()
  },
  AuthenticatedRequest: {}
}))

describe('Tutor Routes', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/tutor', tutorRoutes)
  })

  describe('GET /api/tutor/status', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get('/api/tutor/status')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.aiServiceAvailable).toBe(true)
      expect(response.body.data.features).toEqual({
        hints: true,
        explanations: true,
        contextualHelp: true,
        recommendations: true,
        analytics: true
      })
    })
  })

  describe('POST /api/tutor/hint', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tutor/hint')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
      expect(response.body.details).toBeDefined()
    })

    it('should validate subject enum', async () => {
      const response = await request(app)
        .post('/api/tutor/hint')
        .send({
          question: 'Test question',
          subject: 'invalid_subject'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    it('should accept valid hint request', async () => {
      const { tutorService } = await import('../services/ai/tutorService')
      const { contextService } = await import('../services/ai/contextService')

      vi.mocked(contextService.buildTutorContext).mockResolvedValue({
        userId: 'test-user-id',
        subject: 'math'
      } as any)

      vi.mocked(tutorService.generateHint).mockResolvedValue({
        content: 'This is a helpful hint',
        type: 'hint',
        followUpSuggestions: ['Try a different approach'],
        relatedConcepts: ['algebra']
      })

      const response = await request(app)
        .post('/api/tutor/hint')
        .send({
          question: 'Solve for x: 2x + 5 = 15',
          subject: 'math',
          attemptCount: 1
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toBe('This is a helpful hint')
      expect(response.body.data.type).toBe('hint')
    })
  })

  describe('POST /api/tutor/explain', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tutor/explain')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    it('should accept valid explanation request', async () => {
      const { tutorService } = await import('../services/ai/tutorService')
      const { contextService } = await import('../services/ai/contextService')

      vi.mocked(contextService.buildTutorContext).mockResolvedValue({
        userId: 'test-user-id',
        subject: 'math'
      } as any)

      vi.mocked(tutorService.generateExplanation).mockResolvedValue({
        content: 'Linear equations are mathematical expressions...',
        type: 'explanation',
        relatedConcepts: ['algebra', 'equations']
      })

      const response = await request(app)
        .post('/api/tutor/explain')
        .send({
          concept: 'linear equations',
          subject: 'math'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toContain('Linear equations')
      expect(response.body.data.type).toBe('explanation')
    })
  })

  describe('POST /api/tutor/help', () => {
    it('should validate help type enum', async () => {
      const response = await request(app)
        .post('/api/tutor/help')
        .send({
          subject: 'math',
          helpType: 'invalid_type'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    it('should accept valid help request', async () => {
      const { tutorService } = await import('../services/ai/tutorService')
      const { contextService } = await import('../services/ai/contextService')

      vi.mocked(contextService.buildTutorContext).mockResolvedValue({
        userId: 'test-user-id',
        subject: 'math'
      } as any)

      vi.mocked(tutorService.generateContextualHelp).mockResolvedValue({
        content: 'When you\'re stuck, try breaking the problem into smaller steps',
        type: 'explanation',
        followUpSuggestions: ['Take a break', 'Try a simpler problem']
      })

      const response = await request(app)
        .post('/api/tutor/help')
        .send({
          subject: 'math',
          helpType: 'stuck'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toContain('stuck')
    })
  })

  describe('GET /api/tutor/recommendations', () => {
    it('should require subject parameter', async () => {
      const response = await request(app)
        .get('/api/tutor/recommendations')

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Valid subject parameter is required')
    })

    it('should validate subject parameter', async () => {
      const response = await request(app)
        .get('/api/tutor/recommendations')
        .query({ subject: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Valid subject parameter is required')
    })

    it('should return recommendations for valid subject', async () => {
      const { contextService } = await import('../services/ai/contextService')

      vi.mocked(contextService.getPersonalizedRecommendations).mockResolvedValue({
        nextTopics: ['algebra', 'geometry'],
        reviewTopics: ['fractions'],
        difficultyAdjustment: 'maintain',
        studyTips: ['Practice daily', 'Review mistakes']
      })

      vi.mocked(contextService.analyzeUserLearningPatterns).mockResolvedValue({
        learningStyle: 'analytical',
        preferredHintType: 'conceptual',
        strugglingAreas: ['fractions'],
        improvingAreas: ['algebra'],
        recommendedDifficulty: 5
      })

      const response = await request(app)
        .get('/api/tutor/recommendations')
        .query({ subject: 'math' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.recommendations).toBeDefined()
      expect(response.body.data.learningPatterns).toBeDefined()
    })
  })

  describe('GET /api/tutor/analytics', () => {
    it('should require subject parameter', async () => {
      const response = await request(app)
        .get('/api/tutor/analytics')

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Valid subject parameter is required')
    })

    it('should return learning analytics', async () => {
      const { contextService } = await import('../services/ai/contextService')

      vi.mocked(contextService.analyzeUserLearningPatterns).mockResolvedValue({
        learningStyle: 'visual',
        preferredHintType: 'example-based',
        strugglingAreas: ['geometry'],
        improvingAreas: ['arithmetic'],
        recommendedDifficulty: 6
      })

      const response = await request(app)
        .get('/api/tutor/analytics')
        .query({ subject: 'math' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.learningStyle).toBe('visual')
      expect(response.body.data.preferredHintType).toBe('example-based')
    })
  })

  describe('POST /api/tutor/chat', () => {
    it('should return not implemented message', async () => {
      const response = await request(app)
        .post('/api/tutor/chat')
        .send({})

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('to be implemented in task 8.3')
      expect(response.body.status).toBe('not_implemented')
    })
  })
})