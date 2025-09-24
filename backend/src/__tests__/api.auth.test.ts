import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRoutes } from '../routes/auth'
import { mockSupabaseClient, createTestUser } from './setup'

// Mock the auth service
const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  updateProfile: vi.fn(),
  getUserProfile: vi.fn()
}

vi.mock('../services/authService', () => ({
  authService: mockAuthService
}))

describe('Auth API Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/auth', authRoutes)
  })

  describe('POST /auth/register', () => {
    it('registers a new user successfully', async () => {
      const mockUser = createTestUser()
      const mockAuthResponse = {
        user: mockUser,
        session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
      }
      
      mockAuthService.register.mockResolvedValue(mockAuthResponse)

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          examDate: '2024-06-01',
          gradeLevel: 7
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: mockAuthResponse.session
        }
      })
    })

    it('validates registration data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          // Missing required fields
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('validation')
    })

    it('handles duplicate email registration', async () => {
      const { authService } = await import('../services/authService')
      vi.mocked(authService.register).mockRejectedValue(new Error('User already exists'))

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          examDate: '2024-06-01',
          gradeLevel: 7
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /auth/login', () => {
    it('logs in user successfully', async () => {
      const { authService } = await import('../services/authService')
      const mockUser = createTestUser()
      const mockAuthResponse = {
        user: mockUser,
        session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
      }
      
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse)

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: mockAuthResponse.session
        }
      })
    })

    it('validates login credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          // Missing password
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('handles invalid credentials', async () => {
      const { authService } = await import('../services/authService')
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /auth/profile', () => {
    it('gets user profile when authenticated', async () => {
      const { authService } = await import('../services/authService')
      const mockUser = createTestUser()
      
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)

      // Mock authentication middleware
      const authApp = express()
      authApp.use(express.json())
      authApp.use((req, res, next) => {
        req.user = { id: 'test-user-123' }
        next()
      })
      authApp.use('/auth', authRoutes)

      const response = await request(authApp)
        .get('/auth/profile')
        .set('Authorization', 'Bearer mock-token')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockUser
      })
    })

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/profile')

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /auth/profile', () => {
    it('updates user profile successfully', async () => {
      const { authService } = await import('../services/authService')
      const updatedUser = createTestUser({ firstName: 'Updated' })
      
      vi.mocked(authService.updateProfile).mockResolvedValue(updatedUser)

      // Mock authentication middleware
      const authApp = express()
      authApp.use(express.json())
      authApp.use((req, res, next) => {
        req.user = { id: 'test-user-123' }
        next()
      })
      authApp.use('/auth', authRoutes)

      const response = await request(authApp)
        .put('/auth/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({
          firstName: 'Updated',
          examDate: '2024-07-01'
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: updatedUser
      })
    })

    it('validates profile update data', async () => {
      const authApp = express()
      authApp.use(express.json())
      authApp.use((req, res, next) => {
        req.user = { id: 'test-user-123' }
        next()
      })
      authApp.use('/auth', authRoutes)

      const response = await request(authApp)
        .put('/auth/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({
          email: 'invalid-email',
          gradeLevel: 15 // Invalid grade level
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})