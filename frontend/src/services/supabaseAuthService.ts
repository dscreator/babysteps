import { supabase } from '../lib/supabase'

// Define types locally to avoid any dependencies
export interface ApiResponse<T = any> {
  data: T
  error: null
  success: true
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
    details?: any
  }
  success: false
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  examDate?: string
  gradeLevel?: number
  createdAt: string
  updatedAt: string
  parentEmail?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  studyReminders: boolean
  parentNotifications: boolean
  difficultyLevel: 'adaptive' | 'beginner' | 'intermediate' | 'advanced'
  dailyGoalMinutes: number
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  examDate?: string
  gradeLevel?: number
  parentEmail?: string
  preferences?: Partial<UserPreferences>
}

export interface AuthResponse {
  user: UserProfile
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

// NEW SUPABASE-ONLY AUTH SERVICE v3.0
export const supabaseAuthService = {
  // Register new user with Supabase directly
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse> | ApiError> {
    try {
      console.log('🚀 SUPABASE AUTH SERVICE v3.0 - DIRECT REGISTRATION!')
      console.log('Attempting registration with Supabase...', { email: data.email })
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      })

      console.log('Supabase response:', { authData, error })

      if (error) {
        console.error('Supabase error:', error)
        return {
          data: null,
          error: {
            message: error.message,
            code: error.name,
          },
          success: false,
        }
      }

      if (!authData.user) {
        return {
          data: null,
          error: {
            message: 'Registration failed',
            code: 'REGISTRATION_FAILED',
          },
          success: false,
        }
      }

      console.log('✅ Registration successful!')

      // Create user profile
      const userProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          studyReminders: true,
          parentNotifications: false,
          difficultyLevel: 'adaptive',
          dailyGoalMinutes: 30,
        }
      }

      return {
        data: {
          user: userProfile,
          session: {
            access_token: authData.session?.access_token || '',
            refresh_token: authData.session?.refresh_token || '',
            expires_at: authData.session?.expires_at || 0,
          }
        },
        error: null,
        success: true,
      }
    } catch (error) {
      console.error('Registration catch error:', error)
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Registration failed',
          code: 'REGISTRATION_ERROR',
        },
        success: false,
      }
    }
  },

  // Login user with Supabase directly
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse> | ApiError> {
    try {
      console.log('🚀 SUPABASE AUTH SERVICE v3.0 - DIRECT LOGIN!')
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            code: error.name,
          },
          success: false,
        }
      }

      if (!authData.user) {
        return {
          data: null,
          error: {
            message: 'Login failed',
            code: 'LOGIN_FAILED',
          },
          success: false,
        }
      }

      // Create user profile from auth data
      const userProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: authData.user.user_metadata?.first_name || '',
        lastName: authData.user.user_metadata?.last_name || '',
        createdAt: authData.user.created_at,
        updatedAt: new Date().toISOString(),
        preferences: {
          studyReminders: true,
          parentNotifications: false,
          difficultyLevel: 'adaptive',
          dailyGoalMinutes: 30,
        }
      }

      return {
        data: {
          user: userProfile,
          session: {
            access_token: authData.session?.access_token || '',
            refresh_token: authData.session?.refresh_token || '',
            expires_at: authData.session?.expires_at || 0,
          }
        },
        error: null,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Login failed',
          code: 'LOGIN_ERROR',
        },
        success: false,
      }
    }
  },

  // Logout user
  async logout(): Promise<ApiResponse<void> | ApiError> {
    try {
      console.log('🚀 SUPABASE AUTH SERVICE v3.0 - DIRECT LOGOUT!')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            code: error.name,
          },
          success: false,
        }
      }

      return {
        data: null,
        error: null,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Logout failed',
          code: 'LOGOUT_ERROR',
        },
        success: false,
      }
    }
  },
}