import { authService } from '../services/authService'
import { supabase } from '../config/supabase'

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      examDate: '2024-06-01',
      gradeLevel: 7
    }

    it('should create user and profile successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' }
      const mockSession = { access_token: 'token', refresh_token: 'refresh', expires_at: 123456 }
      const mockProfile = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        exam_date: '2024-06-01',
        grade_level: 7,
        parent_email: null,
        preferences: {
          studyReminders: true,
          parentNotifications: false,
          difficultyLevel: 'adaptive',
          dailyGoalMinutes: 30
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      const result = await authService.register(registerData)

      expect(result.user.id).toBe('user-id')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.firstName).toBe('Test')
      expect(result.session).toBe(mockSession)
    })

    it('should handle auth signup error', async () => {
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' }
      })

      await expect(authService.register(registerData)).rejects.toThrow('Registration failed: Email already exists')
    })

    it('should cleanup auth user if profile creation fails', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' }
      
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile creation failed' }
            })
          })
        })
      })

      await expect(authService.register(registerData)).rejects.toThrow('Profile creation failed: Profile creation failed')
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-id')
    })
  })

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should login successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' }
      const mockSession = { access_token: 'token', refresh_token: 'refresh', expires_at: 123456 }
      const mockProfile = {
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        exam_date: '2024-06-01',
        grade_level: 7,
        parent_email: null,
        preferences: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      const result = await authService.login(loginData)

      expect(result.user.id).toBe('user-id')
      expect(result.session).toBe(mockSession)
    })

    it('should handle login error', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      await expect(authService.login(loginData)).rejects.toThrow('Login failed: Invalid credentials')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' }

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await authService.verifyToken('valid-token')

      expect(result.userId).toBe('user-id')
      expect(result.email).toBe('test@example.com')
    })

    it('should reject invalid token', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid or expired token')
    })
  })
})