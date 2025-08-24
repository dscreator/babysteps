import { ApiResponse, ApiError, isApiError } from '../services/apiService'

// Utility to handle API responses in components
export function handleApiResponse<T>(
  response: ApiResponse<T> | ApiError,
  onSuccess?: (data: T) => void,
  onError?: (error: ApiError['error']) => void
): T | null {
  if (isApiError(response)) {
    if (onError) {
      onError(response.error)
    }
    return null
  }

  if (onSuccess) {
    onSuccess(response.data)
  }
  
  return response.data
}

// Utility to extract data from API response or throw error
export function unwrapApiResponse<T>(response: ApiResponse<T> | ApiError): T {
  if (isApiError(response)) {
    throw new Error(response.error.message)
  }
  
  return response.data
}

// Utility to check if API response is successful
export function isApiSuccess<T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> {
  return response.success === true
}

// Utility to create a standardized error object
export function createApiError(message: string, code?: string, details?: any): ApiError {
  return {
    data: null,
    error: {
      message,
      code,
      details,
    },
    success: false,
  }
}

// Utility to transform Supabase errors to API errors
export function transformSupabaseError(error: any): ApiError {
  return createApiError(
    error.message || 'An error occurred',
    error.code || 'SUPABASE_ERROR',
    error
  )
}

// Utility for retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Utility to validate required environment variables
export function validateEnvVars(vars: Record<string, string | undefined>): void {
  const missing = Object.entries(vars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Utility to format API errors for display
export function formatApiError(error: ApiError['error']): string {
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your internet connection.'
  }
  
  if (error.code === 'UNAUTHORIZED') {
    return 'Please log in to continue.'
  }
  
  if (error.code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.'
  }
  
  if (error.code === 'NOT_FOUND') {
    return 'The requested resource was not found.'
  }
  
  if (error.code === 'VALIDATION_ERROR') {
    return error.details?.message || 'Please check your input and try again.'
  }
  
  return error.message || 'An unexpected error occurred.'
}

// Utility to create query error handler
export function createQueryErrorHandler(fallbackMessage?: string) {
  return (error: any) => {
    console.error('Query error:', error)
    
    if (isApiError(error)) {
      return formatApiError(error.error)
    }
    
    return fallbackMessage || error.message || 'An error occurred while loading data.'
  }
}

// Utility to create mutation error handler
export function createMutationErrorHandler(fallbackMessage?: string) {
  return (error: any) => {
    console.error('Mutation error:', error)
    
    if (isApiError(error)) {
      return formatApiError(error.error)
    }
    
    return fallbackMessage || error.message || 'An error occurred while saving data.'
  }
}