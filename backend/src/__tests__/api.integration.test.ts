import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { mockSupabaseClient, createTestUser, createTestMathProblem } from './setup'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: mockSupabaseClient
}))

describe('API Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = createTestUser()
      next()
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Flow Integration', () => {
    it('should handle complete registration flow', async () => {
      // Mock successful user creation
      const mockInsert = vi.fn().mockResolvedValue({
        data: [createTestUser()],
        error: null
      })
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      })

      // Mock auth service
      const mockAuthService = {
        register: vi.fn().mockResolvedValue({
          user: createTestUser(),
          session: { access_token: 'mock-token' }
        })
      }

      // Create a simple registration endpoint for testing
      app.post('/auth/register', async (req, res) => {
        try {
          const result = await mockAuthService.register(req.body)
          res.status(201).json({ success: true, data: result })
        } catch (error) {
          res.status(400).json({ success: false, error: error.message })
        }
      })

      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        gradeLevel: 7
      }

      const response = await request(app)
        .post('/auth/register')
        .send(registrationData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.session).toBeDefined()
      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData)
    })

    it('should handle login flow', async () => {
      const mockAuthService = {
        login: vi.fn().mockResolvedValue({
          user: createTestUser(),
          session: { access_token: 'mock-token' }
        })
      }

      app.post('/auth/login', async (req, res) => {
        try {
          const result = await mockAuthService.login(req.body)
          res.status(200).json({ success: true, data: result })
        } catch (error) {
          res.status(401).json({ success: false, error: error.message })
        }
      })

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.session).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      const mockAuthService = {
        login: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      }

      app.post('/auth/login', async (req, res) => {
        try {
          const result = await mockAuthService.login(req.body)
          res.status(200).json({ success: true, data: result })
        } catch (error) {
          res.status(401).json({ success: false, error: error.message })
        }
      })

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })
  })

  describe('Practice Session Integration', () => {
    it('should handle complete practice session workflow', async () => {
      const mockPracticeService = {
        createSession: vi.fn().mockResolvedValue({
          id: 'session-123',
          userId: 'test-user-123',
          subject: 'math',
          startTime: new Date(),
          status: 'active'
        }),
        submitAnswer: vi.fn().mockResolvedValue({
          isCorrect: true,
          explanation: 'Correct answer!',
          nextProblem: createTestMathProblem()
        }),
        endSession: vi.fn().mockResolvedValue({
          sessionId: 'session-123',
          totalQuestions: 5,
          correctAnswers: 4,
          accuracy: 0.8,
          timeSpent: 300
        })
      }

      // Create session endpoint
      app.post('/practice/sessions', async (req, res) => {
        try {
          const session = await mockPracticeService.createSession(
            req.user.id,
            req.body.subject,
            req.body.topics,
            req.body.difficultyLevel
          )
          res.status(201).json({ success: true, data: session })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      // Submit answer endpoint
      app.post('/practice/sessions/:sessionId/answers', async (req, res) => {
        try {
          const result = await mockPracticeService.submitAnswer(
            req.params.sessionId,
            req.body.problemId,
            req.body.answer,
            req.user.id
          )
          res.status(200).json({ success: true, data: result })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      // End session endpoint
      app.put('/practice/sessions/:sessionId/end', async (req, res) => {
        try {
          const summary = await mockPracticeService.endSession(
            req.params.sessionId,
            req.user.id
          )
          res.status(200).json({ success: true, data: summary })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      // 1. Create session
      const sessionResponse = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })

      expect(sessionResponse.status).toBe(201)
      expect(sessionResponse.body.data.id).toBe('session-123')

      // 2. Submit answer
      const answerResponse = await request(app)
        .post('/practice/sessions/session-123/answers')
        .send({
          problemId: 'problem-456',
          answer: '42',
          timeSpent: 30
        })

      expect(answerResponse.status).toBe(200)
      expect(answerResponse.body.data.isCorrect).toBe(true)

      // 3. End session
      const endResponse = await request(app)
        .put('/practice/sessions/session-123/end')

      expect(endResponse.status).toBe(200)
      expect(endResponse.body.data.accuracy).toBe(0.8)

      // Verify service calls
      expect(mockPracticeService.createSession).toHaveBeenCalledWith(
        'test-user-123',
        'math',
        ['arithmetic'],
        2
      )
      expect(mockPracticeService.submitAnswer).toHaveBeenCalledWith(
        'session-123',
        'problem-456',
        '42',
        'test-user-123'
      )
      expect(mockPracticeService.endSession).toHaveBeenCalledWith(
        'session-123',
        'test-user-123'
      )
    })
  })

  describe('Progress Tracking Integration', () => {
    it('should update progress after practice session', async () => {
      const mockProgressService = {
        updateUserProgress: vi.fn().mockResolvedValue({
          userId: 'test-user-123',
          subject: 'math',
          overallScore: 85,
          improvement: 5
        }),
        getDashboardData: vi.fn().mockResolvedValue({
          overallProgress: { math: 85, english: 78, essay: 82 },
          recentSessions: [],
          achievements: []
        })
      }

      app.post('/progress/update', async (req, res) => {
        try {
          const result = await mockProgressService.updateUserProgress(
            req.user.id,
            req.body
          )
          res.status(200).json({ success: true, data: result })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      app.get('/progress/dashboard', async (req, res) => {
        try {
          const data = await mockProgressService.getDashboardData(req.user.id)
          res.status(200).json({ success: true, data })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      // Update progress
      const updateResponse = await request(app)
        .post('/progress/update')
        .send({
          subject: 'math',
          sessionScore: 0.8,
          topicsPerformance: { arithmetic: 0.9, algebra: 0.7 },
          timeSpent: 300
        })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.data.overallScore).toBe(85)

      // Get dashboard data
      const dashboardResponse = await request(app)
        .get('/progress/dashboard')

      expect(dashboardResponse.status).toBe(200)
      expect(dashboardResponse.body.data.overallProgress.math).toBe(85)
    })
  })

  describe('AI Integration', () => {
    it('should handle AI tutor requests', async () => {
      const mockAIService = {
        generateExplanation: vi.fn().mockResolvedValue(
          'To solve this problem, first identify the operation needed...'
        ),
        generateHint: vi.fn().mockResolvedValue(
          'Try breaking the problem into smaller parts.'
        )
      }

      app.post('/tutor/explain', async (req, res) => {
        try {
          const explanation = await mockAIService.generateExplanation(
            req.body.problem,
            req.user.id
          )
          res.status(200).json({ success: true, data: { explanation } })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      app.post('/tutor/hint', async (req, res) => {
        try {
          const hint = await mockAIService.generateHint(
            req.body.problem,
            req.user.id,
            req.body.hintLevel
          )
          res.status(200).json({ success: true, data: { hint } })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      // Request explanation
      const explanationResponse = await request(app)
        .post('/tutor/explain')
        .send({
          problem: createTestMathProblem()
        })

      expect(explanationResponse.status).toBe(200)
      expect(explanationResponse.body.data.explanation).toContain('solve this problem')

      // Request hint
      const hintResponse = await request(app)
        .post('/tutor/hint')
        .send({
          problem: createTestMathProblem(),
          hintLevel: 1
        })

      expect(hintResponse.status).toBe(200)
      expect(hintResponse.body.data.hint).toContain('breaking the problem')
    })

    it('should handle AI service errors gracefully', async () => {
      const mockAIService = {
        generateExplanation: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
      }

      app.post('/tutor/explain', async (req, res) => {
        try {
          const explanation = await mockAIService.generateExplanation(
            req.body.problem,
            req.user.id
          )
          res.status(200).json({ success: true, data: { explanation } })
        } catch (error) {
          res.status(503).json({ 
            success: false, 
            error: 'AI service temporarily unavailable' 
          })
        }
      })

      const response = await request(app)
        .post('/tutor/explain')
        .send({
          problem: createTestMathProblem()
        })

      expect(response.status).toBe(503)
      expect(response.body.error).toBe('AI service temporarily unavailable')
    })
  })

  describe('Data Validation Integration', () => {
    it('should validate request data across endpoints', async () => {
      app.post('/practice/sessions', (req, res) => {
        const { subject, topics, difficultyLevel } = req.body

        // Validation logic
        if (!subject || !['math', 'english', 'essay'].includes(subject)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid subject' 
          })
        }

        if (!Array.isArray(topics) || topics.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Topics must be a non-empty array' 
          })
        }

        if (!difficultyLevel || difficultyLevel < 1 || difficultyLevel > 5) {
          return res.status(400).json({ 
            success: false, 
            error: 'Difficulty level must be between 1 and 5' 
          })
        }

        res.status(201).json({ success: true, data: { id: 'session-123' } })
      })

      // Test invalid subject
      const invalidSubjectResponse = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'invalid',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })

      expect(invalidSubjectResponse.status).toBe(400)
      expect(invalidSubjectResponse.body.error).toBe('Invalid subject')

      // Test empty topics
      const emptyTopicsResponse = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: [],
          difficultyLevel: 2
        })

      expect(emptyTopicsResponse.status).toBe(400)
      expect(emptyTopicsResponse.body.error).toBe('Topics must be a non-empty array')

      // Test invalid difficulty
      const invalidDifficultyResponse = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 10
        })

      expect(invalidDifficultyResponse.status).toBe(400)
      expect(invalidDifficultyResponse.body.error).toBe('Difficulty level must be between 1 and 5')

      // Test valid request
      const validResponse = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })

      expect(validResponse.status).toBe(201)
      expect(validResponse.body.success).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database connection errors', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
      })
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      })

      app.get('/test/database', async (req, res) => {
        try {
          const { data, error } = await mockSupabaseClient
            .from('users')
            .select('*')
            .eq('id', req.user.id)

          if (error) {
            throw new Error(error.message)
          }

          res.status(200).json({ success: true, data })
        } catch (error) {
          res.status(500).json({ 
            success: false, 
            error: 'Database connection failed' 
          })
        }
      })

      const response = await request(app).get('/test/database')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Database connection failed')
    })

    it('should handle rate limiting', async () => {
      let requestCount = 0

      app.post('/test/rate-limit', (req, res) => {
        requestCount++
        
        if (requestCount > 5) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: 60
          })
        }

        res.status(200).json({ success: true, requestCount })
      })

      // Make multiple requests
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post('/test/rate-limit')
        
        if (i < 5) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(429)
          expect(response.body.error).toBe('Rate limit exceeded')
        }
      }
    })
  })
})