import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { practiceRoutes } from '../routes/practice'
import { mockSupabaseClient, createTestUser, createTestMathProblem, createTestPracticeSession } from './setup'

// Mock the services
const mockPracticeService = {
  createSession: vi.fn(),
  submitAnswer: vi.fn(),
  endSession: vi.fn(),
  getSessionHistory: vi.fn()
}

const mockContentService = {
  getMathProblems: vi.fn(),
  getReadingPassages: vi.fn(),
  getEssayPrompts: vi.fn()
}

vi.mock('../services/practiceService', () => ({
  practiceService: mockPracticeService
}))

vi.mock('../services/content/contentService', () => ({
  contentService: mockContentService
}))

vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = createTestUser()
    next()
  }
}))

describe('Practice API Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/practice', practiceRoutes)
  })

  describe('POST /practice/sessions', () => {
    it('creates a new practice session', async () => {
      const { practiceService } = await import('../services/practiceService')
      const mockSession = createTestPracticeSession()
      
      mockPracticeService.createSession.mockResolvedValue(mockSession)

      const response = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        data: mockSession
      })
      expect(mockPracticeService.createSession).toHaveBeenCalledWith(
        'test-user-123',
        'math',
        ['arithmetic'],
        2
      )
    })

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math'
          // Missing topics and difficultyLevel
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('validation')
    })

    it('handles service errors', async () => {
      mockPracticeService.createSession.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /practice/sessions/:sessionId/answers', () => {
    it('submits an answer successfully', async () => {
      const mockResult = {
        isCorrect: true,
        explanation: 'Correct answer!',
        nextProblem: createTestMathProblem()
      }
      
      mockPracticeService.submitAnswer.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/practice/sessions/test-session-456/answers')
        .send({
          problemId: 'test-problem-789',
          answer: '4',
          timeSpent: 30
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResult
      })
    })

    it('validates answer submission data', async () => {
      const response = await request(app)
        .post('/practice/sessions/test-session-456/answers')
        .send({
          problemId: 'test-problem-789'
          // Missing answer and timeSpent
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /practice/math/problems', () => {
    it('fetches math problems with filters', async () => {
      const mockProblems = [createTestMathProblem(), createTestMathProblem({ id: 'problem-2' })]
      
      mockContentService.getMathProblems.mockResolvedValue(mockProblems)

      const response = await request(app)
        .get('/practice/math/problems')
        .query({
          topic: 'arithmetic',
          difficulty: '2',
          limit: '10'
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockProblems
      })
      expect(mockContentService.getMathProblems).toHaveBeenCalledWith({
        topic: 'arithmetic',
        difficulty: 2,
        limit: 10,
        userId: 'test-user-123'
      })
    })

    it('handles invalid query parameters', async () => {
      const response = await request(app)
        .get('/practice/math/problems')
        .query({
          difficulty: 'invalid',
          limit: 'not-a-number'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /practice/sessions/:sessionId/end', () => {
    it('ends a practice session', async () => {
      const mockSessionSummary = {
        sessionId: 'test-session-456',
        totalQuestions: 10,
        correctAnswers: 8,
        accuracy: 0.8,
        timeSpent: 600,
        topicsPerformance: { arithmetic: 0.9, algebra: 0.7 }
      }
      
      mockPracticeService.endSession.mockResolvedValue(mockSessionSummary)

      const response = await request(app)
        .put('/practice/sessions/test-session-456/end')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockSessionSummary
      })
      expect(mockPracticeService.endSession).toHaveBeenCalledWith('test-session-456', 'test-user-123')
    })

    it('handles non-existent session', async () => {
      mockPracticeService.endSession.mockRejectedValue(new Error('Session not found'))

      const response = await request(app)
        .put('/practice/sessions/non-existent/end')

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /practice/sessions/history', () => {
    it('fetches user session history', async () => {
      const mockHistory = [
        createTestPracticeSession(),
        createTestPracticeSession({ id: 'session-2', subject: 'english' })
      ]
      
      mockPracticeService.getSessionHistory.mockResolvedValue(mockHistory)

      const response = await request(app)
        .get('/practice/sessions/history')
        .query({
          subject: 'math',
          limit: '20'
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockHistory
      })
      expect(mockPracticeService.getSessionHistory).toHaveBeenCalledWith('test-user-123', {
        subject: 'math',
        limit: 20
      })
    })
  })
})