import request from 'supertest'
import app from '../index'

describe('Authentication Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('OK')
      expect(response.body.timestamp).toBeDefined()
    })
  })

  describe('Authentication Endpoints Structure', () => {
    it('should have register endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})

      // Should return validation error, not 404
      expect(response.status).not.toBe(404)
    })

    it('should have login endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})

      // Should return validation error, not 404
      expect(response.status).not.toBe(404)
    })

    it('should have profile endpoint', async () => {
      const response = await request(app)
        .get('/api/auth/profile')

      // Should return auth error, not 404
      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })

    it('should have logout endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      // Should return auth error, not 404
      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })

    it('should have verify endpoint', async () => {
      const response = await request(app)
        .get('/api/auth/verify')

      // Should return auth error, not 404
      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })
  })

  describe('Validation', () => {
    it('should validate registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          firstName: '',
          lastName: '',
          examDate: '2020-01-01',
          gradeLevel: 10
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
      expect(Array.isArray(response.body.details)).toBe(true)
    })

    it('should validate login data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // Make multiple requests quickly
      const requests = Array(6).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password123' })
      )

      const responses = await Promise.all(requests)
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429)
      expect(rateLimited).toBe(true)
    })
  })
})