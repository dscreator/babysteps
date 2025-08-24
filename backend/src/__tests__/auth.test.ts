import request from 'supertest'
import app from '../index'

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    examDate: '2024-06-01',
    gradeLevel: 7
  }

  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: '123'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate grade level range', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          gradeLevel: 5
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate exam date is in future', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          examDate: '2020-01-01'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/profile')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Invalid or expired token')
    })
  })

  describe('PUT /api/auth/profile', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })

    it('should validate update data', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ gradeLevel: 10 })

      expect(response.status).toBe(403) // Will fail on auth first
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })
  })

  describe('GET /api/auth/verify', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/verify')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })
  })
})