import { QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay function (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for important data
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Show error toast on mutation failure
      onError: (error: any) => {
        const message = error?.message || 'An error occurred'
        toast.error(message)
      },
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // Auth related queries
  auth: {
    profile: ['auth', 'profile'] as const,
    session: ['auth', 'session'] as const,
  },
  // Practice related queries
  practice: {
    math: {
      problems: (filters?: any) => ['practice', 'math', 'problems', filters] as const,
      session: (sessionId: string) => ['practice', 'math', 'session', sessionId] as const,
    },
    english: {
      passages: (filters?: any) => ['practice', 'english', 'passages', filters] as const,
      session: (sessionId: string) => ['practice', 'english', 'session', sessionId] as const,
    },
    essay: {
      prompts: (filters?: any) => ['practice', 'essay', 'prompts', filters] as const,
      session: (sessionId: string) => ['practice', 'essay', 'session', sessionId] as const,
    },
  },
  // Progress related queries
  progress: {
    dashboard: ['progress', 'dashboard'] as const,
    detailed: (subject: string) => ['progress', 'detailed', subject] as const,
    analytics: (timeRange?: string) => ['progress', 'analytics', timeRange] as const,
  },
  // AI tutor related queries
  tutor: {
    recommendations: ['tutor', 'recommendations'] as const,
    chat: (sessionId: string) => ['tutor', 'chat', sessionId] as const,
  },
} as const