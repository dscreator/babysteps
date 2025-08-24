import { apiService, ApiResponse, ApiError } from './apiService'
import { supabase } from '../lib/supabase'

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

// Authentication service functions
export const authService = {
  // Register new user with backend API
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse> | ApiError> {
    return apiService.post<AuthResponse>('/auth/register', data)
  },

  // Login user with backend API
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse> | ApiError> {
    return apiService.post<AuthResponse>('/auth/login', data)
  },

  // Logout user
  async logout(): Promise<ApiResponse<void> | ApiError> {
    // First logout from backend
    const result = await apiService.post<void>('/auth/logout')
    
    // Then logout from Supabase
    await supabase.auth.signOut()
    
    return result
  },

  // Get current user profile
  async getProfile(): Promise<ApiResponse<UserProfile> | ApiError> {
    return apiService.get<UserProfile>('/auth/profile')
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile> | ApiError> {
    return apiService.put<UserProfile>('/auth/profile', data)
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

    // Get updated profile from backend
    const profileResult = await apiService.get<UserProfile>('/auth/profile')
    
    if (!profileResult.success) {
      return profileResult
    }

    return {
      data: {
        user: profileResult.data,
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