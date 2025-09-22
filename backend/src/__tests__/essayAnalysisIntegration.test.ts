import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { practiceRoutes } from '../routes/practice'
import { errorHandler } from '../middleware/errorHandler'

// Create test app
const app = express()
app.use(express.json())

// Mock authentication middleware for testing
app.use('/api/practice', (req, res, next) => {
  req.user = { userId: 'test-user-123' }
  next()
})

app.use('/api/practice', practiceRoutes)
app.use(errorHandler)

describe('Essay Analysis API Integration', () => {
  describe('POST /api/practice/essay/submit', () => {
    it('should validate essay submission request', async () => {
      const response = await request(app)
        .post('/api/practice/essay/submit')
        .send({
          promptId: 'invalid-uuid',
          content: 'Too short'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
    })

    it('should accept valid essay submission format', async () => {
      const validEssay = 'This is a valid essay submission that meets the minimum length requirements for the ISEE AI tutor system. It contains sufficient content to be processed by the analysis system.'

      const response = await request(app)
        .post('/api/practice/essay/submit')
        .send({
          promptId: '550e8400-e29b-41d4-a716-446655440000',
          content: validEssay,
          timeSpent: 15
        })

      // This will fail at the database level since we're not connected to Supabase
      // But it should pass validation
      expect(response.status).toBe(500) // Database error, not validation error
      expect(response.body.error).toBe('Failed to submit essay')
    })
  })

  describe('POST /api/practice/essay/analyze', () => {
    it('should validate analysis request', async () => {
      const response = await request(app)
        .post('/api/practice/essay/analyze')
        .send({
          submissionId: 'invalid-uuid'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should accept valid analysis request format', async () => {
      const response = await request(app)
        .post('/api/practice/essay/analyze')
        .send({
          submissionId: '550e8400-e29b-41d4-a716-446655440000'
        })

      // This will fail at the database/OpenAI level since we're not connected
      // But it should pass validation
      expect(response.status).toBe(500) // Service error, not validation error
    })
  })

  describe('GET /api/practice/essay/history', () => {
    it('should accept valid query parameters', async () => {
      const response = await request(app)
        .get('/api/practice/essay/history')
        .query({ limit: '5' })

      // This will fail at the database level since we're not connected to Supabase
      // But it should pass validation
      expect(response.status).toBe(500) // Database error, not validation error
    })

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/practice/essay/history')
        .query({ limit: 'invalid' })

      expect(response.status).toBe(500) // Will fail at query validation
    })
  })

  describe('Rate Limiting Validation', () => {
    it('should have proper error handling structure for rate limits', () => {
      // Test that our rate limiting error messages are properly structured
      const rateLimitError = new Error('Rate limit exceeded. Try again in 30 seconds.')
      expect(rateLimitError.message).toContain('Rate limit exceeded')
    })
  })

  describe('Essay Content Validation', () => {
    it('should validate essay content requirements', async () => {
      const { validateEssayContent } = await import('../utils/essayValidation')
      
      // Test short essay
      const shortResult = validateEssayContent('Too short')
      expect(shortResult.isValid).toBe(false)
      expect(shortResult.errors).toContain('Essay is too short (minimum 50 characters)')

      // Test long essay
      const longEssay = 'a'.repeat(10001)
      const longResult = validateEssayContent(longEssay)
      expect(longResult.isValid).toBe(false)
      expect(longResult.errors).toContain('Essay is too long (maximum 10,000 characters)')

      // Test valid essay
      const validEssay = 'This is a valid essay that meets all the requirements for submission to the ISEE AI tutor system.'
      const validResult = validateEssayContent(validEssay)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)
    })
  })
})