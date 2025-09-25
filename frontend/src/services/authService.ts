import { supabase } from '../lib/supabase'

// Define types locally to avoid apiService dependency
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

// Authentication service functions - v2.0 (Supabase direct)
export const authService = {
  // Register new user with Supabase directly
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse> | ApiError> {
    try {
      console.log('🚀 NEW AUTH SERVICE v2.0 - Using Supabase directly!')
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
      // Logout from Supabase directly
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

  // Get current user profile (using Supabase session)
  async getProfile(): Promise<ApiResponse<UserProfile> | ApiError> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return {
          data: null,
          error: {
            message: 'No authenticated user',
            code: 'NO_USER',
          },
          success: false,
        }
      }

      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata?.first_name || '',
        lastName: session.user.user_metadata?.last_name || '',
        createdAt: session.user.created_at,
        updatedAt: new Date().toISOString(),
        preferences: {
          studyReminders: true,
          parentNotifications: false,
          difficultyLevel: 'adaptive',
          dailyGoalMinutes: 30,
        }
      }

      return {
        data: userProfile,
        error: null,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get profile',
          code: 'PROFILE_ERROR',
        },
        success: false,
      }
    }
  },

  // Update user profile (using Supabase user metadata)
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile> | ApiError> {
    try {
      const { data: updateData, error } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          exam_date: data.examDate,
          grade_level: data.gradeLevel,
          parent_email: data.parentEmail,
          preferences: data.preferences,
        }
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

      if (!updateData.user) {
        return {
          data: null,
          error: {
            message: 'Update failed',
            code: 'UPDATE_FAILED',
          },
          success: false,
        }
      }

      const userProfile: UserProfile = {
        id: updateData.user.id,
        email: updateData.user.email!,
        firstName: updateData.user.user_metadata?.first_name || '',
        lastName: updateData.user.user_metadata?.last_name || '',
        examDate: updateData.user.user_metadata?.exam_date,
        gradeLevel: updateData.user.user_metadata?.grade_level,
        parentEmail: updateData.user.user_metadata?.parent_email,
        createdAt: updateData.user.created_at,
        updatedAt: new Date().toISOString(),
        preferences: updateData.user.user_metadata?.preferences || {
          studyReminders: true,
          parentNotifications: false,
          difficultyLevel: 'adaptive',
          dailyGoalMinutes: 30,
        }
      }

      return {
        data: userProfile,
        error: null,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Update failed',
          code: 'UPDATE_ERROR',
        },
        success: false,
      }
    }
  },

  // Refresh session token
  async refreshSession(): Promise<ApiResponse<AuthResponse> | ApiError> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.refresh_token) {
      return {
        data: null,
        error: {
          message: 'No refresh token available',
          code: 'NO_REFRESH_TOKEN',
        },
        success: false,
      }
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.name,
          details: error,
        },
        success: false,
      }
    }

    // Get updated profile from session
    const userProfile: UserProfile = {
      id: data.session!.user.id,
      email: data.session!.user.email!,
      firstName: data.session!.user.user_metadata?.first_name || '',
      lastName: data.session!.user.user_metadata?.last_name || '',
      createdAt: data.session!.user.created_at,
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
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token,
          expires_at: data.session!.expires_at!,
        },
      },
      error: null,
      success: true,
    }
  },

  // Check if user session is valid
  async validateSession(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return false
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // Try to refresh the session
      const refreshResult = await this.refreshSession()
      return refreshResult.success
    }

    return true
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
}