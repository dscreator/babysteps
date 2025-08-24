import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Base API response type
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

// Type guard for API responses
export function isApiError(response: any): response is ApiError {
  return response.success === false && response.error
}

// Base API service class
class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  // Get authorization header with current session token
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    return headers
  }

  // Generic request method with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T> | ApiError> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        const error: ApiError = {
          data: null,
          error: {
            message: data.message || `HTTP ${response.status}: ${response.statusText}`,
            code: data.code || response.status.toString(),
            details: data.details || null,
          },
          success: false,
        }

        // Show error toast for user-facing errors
        if (response.status >= 400 && response.status < 500) {
          toast.error(error.error.message)
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.')
        }

        return error
      }

      return {
        data,
        error: null,
        success: true,
      }
    } catch (error) {
      const apiError: ApiError = {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Network error occurred',
          code: 'NETWORK_ERROR',
          details: error,
        },
        success: false,
      }

      toast.error('Network error. Please check your connection.')
      return apiError
    }
  }

  // HTTP method helpers
  async get<T>(endpoint: string): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()