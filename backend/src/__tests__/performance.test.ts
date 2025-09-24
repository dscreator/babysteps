import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { mockSupabaseClient, createTestUser, createTestMathProblem } from './setup'

describe('Performance Tests', () => {
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

  describe('API Response Times', () => {
    it('should respond to health check quickly', async () => {
      app.get('/health', (req, res) => {
        res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
      })

      const startTime = Date.now()
      const response = await request(app).get('/health')
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Should respond within 100ms
    })

    it('should handle practice session creation efficiently', async () => {
      const mockPracticeService = {
        createSession: vi.fn().mockResolvedValue({
          id: 'session-123',
          userId: 'test-user-123',
          subject: 'math',
          startTime: new Date()
        })
      }

      app.post('/practice/sessions', async (req, res) => {
        const session = await mockPracticeService.createSession(
          req.user.id,
          req.body.subject,
          req.body.topics,
          req.body.difficultyLevel
        )
        res.status(201).json({ success: true, data: session })
      })

      const startTime = Date.now()
      const response = await request(app)
        .post('/practice/sessions')
        .send({
          subject: 'math',
          topics: ['arithmetic'],
          difficultyLevel: 2
        })
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(201)
      expect(responseTime).toBeLessThan(500) // Should respond within 500ms
    })

    it('should handle multiple concurrent requests', async () => {
      const mockContentService = {
        getMathProblems: vi.fn().mockResolvedValue([
          createTestMathProblem(),
          createTestMathProblem({ id: 'problem-2' }),
          createTestMathProblem({ id: 'problem-3' })
        ])
      }

      app.get('/practice/math/problems', async (req, res) => {
        const problems = await mockContentService.getMathProblems({
          topic: req.query.topic,
          difficulty: parseInt(req.query.difficulty as string),
          limit: parseInt(req.query.limit as string) || 10
        })
        res.status(200).json({ success: true, data: problems })
      })

      // Make 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/practice/math/problems')
          .query({ topic: 'arithmetic', difficulty: 2, limit: 5 })
      )

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Should handle all requests within reasonable time
      expect(totalTime).toBeLessThan(2000) // 2 seconds for 10 concurrent requests
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const mockService = {
        processData: vi.fn().mockImplementation((data) => {
          // Simulate some processing
          return { processed: true, count: data.length }
        })
      }

      app.post('/test/memory', (req, res) => {
        const result = mockService.processData(req.body.data)
        res.status(200).json({ success: true, data: result })
      })

      const initialMemory = process.memoryUsage().heapUsed

      // Make many requests to test for memory leaks
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/test/memory')
          .send({
            data: Array.from({ length: 100 }, (_, index) => ({ id: index, value: `item-${index}` }))
          })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Database Query Performance', () => {
    it('should handle database queries efficiently', async () => {
      // Mock database response with delay to simulate real database
      mockSupabaseClient.from().select().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: [createTestUser(), createTestUser({ id: 'user-2' })],
              error: null
            })
          }, 50) // 50ms simulated database delay
        })
      })

      app.get('/users', async (req, res) => {
        const { data, error } = await mockSupabaseClient
          .from('users')
          .select('*')
          .limit(10)

        if (error) {
          return res.status(500).json({ success: false, error: error.message })
        }

        res.status(200).json({ success: true, data })
      })

      const startTime = Date.now()
      const response = await request(app).get('/users')
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(200) // Should complete within 200ms including DB delay
    })

    it('should handle complex queries with joins efficiently', async () => {
      // Mock complex query response
      mockSupabaseClient.from().select().mockResolvedValue({
        data: [
          {
            ...createTestUser(),
            sessions: [
              { id: 'session-1', subject: 'math', score: 85 },
              { id: 'session-2', subject: 'english', score: 78 }
            ],
            progress: {
              math: 85,
              english: 78,
              essay: 82
            }
          }
        ],
        error: null
      })

      app.get('/users/:id/detailed', async (req, res) => {
        const { data, error } = await mockSupabaseClient
          .from('users')
          .select(`
            *,
            practice_sessions(*),
            user_progress(*)
          `)
          .eq('id', req.params.id)
          .single()

        if (error) {
          return res.status(500).json({ success: false, error: error.message })
        }

        res.status(200).json({ success: true, data })
      })

      const startTime = Date.now()
      const response = await request(app).get('/users/test-user-123/detailed')
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(300) // Complex queries should still be fast
    })
  })

  describe('AI Service Performance', () => {
    it('should handle AI requests within acceptable time limits', async () => {
      const mockAIService = {
        generateExplanation: vi.fn().mockImplementation(() => {
          // Simulate AI processing delay
          return new Promise(resolve => {
            setTimeout(() => {
              resolve('This is a detailed explanation of the mathematical concept...')
            }, 1000) // 1 second simulated AI delay
          })
        })
      }

      app.post('/tutor/explain', async (req, res) => {
        try {
          const explanation = await mockAIService.generateExplanation(req.body.problem)
          res.status(200).json({ success: true, data: { explanation } })
        } catch (error) {
          res.status(500).json({ success: false, error: error.message })
        }
      })

      const startTime = Date.now()
      const response = await request(app)
        .post('/tutor/explain')
        .send({ problem: createTestMathProblem() })
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(2000) // AI requests should complete within 2 seconds
      expect(responseTime).toBeGreaterThan(900) // Should include the simulated delay
    })

    it('should handle AI service timeouts gracefully', async () => {
      const mockAIService = {
        generateExplanation: vi.fn().mockImplementation(() => {
          // Simulate timeout
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Request timeout'))
            }, 5000) // 5 second timeout
          })
        })
      }

      app.post('/tutor/explain-timeout', async (req, res) => {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Service timeout')), 3000)
          })

          const explanation = await Promise.race([
            mockAIService.generateExplanation(req.body.problem),
            timeoutPromise
          ])

          res.status(200).json({ success: true, data: { explanation } })
        } catch (error) {
          res.status(408).json({ 
            success: false, 
            error: 'Request timeout - please try again' 
          })
        }
      })

      const startTime = Date.now()
      const response = await request(app)
        .post('/tutor/explain-timeout')
        .send({ problem: createTestMathProblem() })
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(408)
      expect(responseTime).toBeLessThan(3500) // Should timeout within 3.5 seconds
      expect(response.body.error).toContain('timeout')
    })
  })

  describe('Load Testing', () => {
    it('should handle burst of requests without degradation', async () => {
      const mockService = {
        processRequest: vi.fn().mockResolvedValue({ processed: true })
      }

      app.post('/test/load', async (req, res) => {
        const result = await mockService.processRequest(req.body)
        res.status(200).json({ success: true, data: result })
      })

      // Create burst of 50 requests
      const requests = Array.from({ length: 50 }, (_, index) =>
        request(app)
          .post('/test/load')
          .send({ requestId: index, data: `test-data-${index}` })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const totalTime = Date.now() - startTime

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Should handle burst within reasonable time (10 seconds for 50 requests)
      expect(totalTime).toBeLessThan(10000)

      // Service should be called for each request
      expect(mockService.processRequest).toHaveBeenCalledTimes(50)
    })

    it('should maintain response quality under load', async () => {
      const mockContentService = {
        getMathProblems: vi.fn().mockResolvedValue([
          createTestMathProblem(),
          createTestMathProblem({ id: 'problem-2' }),
          createTestMathProblem({ id: 'problem-3' })
        ])
      }

      app.get('/practice/math/problems-load', async (req, res) => {
        const problems = await mockContentService.getMathProblems({
          topic: req.query.topic,
          difficulty: parseInt(req.query.difficulty as string),
          limit: parseInt(req.query.limit as string) || 10
        })
        res.status(200).json({ success: true, data: problems, count: problems.length })
      })

      // Make 20 concurrent requests
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/practice/math/problems-load')
          .query({ topic: 'arithmetic', difficulty: 2, limit: 3 })
      )

      const responses = await Promise.all(requests)

      // All responses should have consistent data quality
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveLength(3)
        expect(response.body.count).toBe(3)
        
        // Verify data structure
        response.body.data.forEach((problem: any) => {
          expect(problem).toHaveProperty('id')
          expect(problem).toHaveProperty('question')
          expect(problem).toHaveProperty('correctAnswer')
        })
      })
    })
  })
})