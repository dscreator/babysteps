import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService, UserProfile } from '../services/authService'
import { queryKeys } from '../lib/queryClient'
import { isApiError } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'

// Get user profile query hook
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const result = await authService.getProfile()
      
      if (isApiError(result)) {
        throw new Error(result.error.message)
      }
      
      return result.data
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Session validation query hook
export function useSessionValidation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async () => {
      const isValid = await authService.validateSession()
      
      if (!isValid) {
        // Clear cached data if session is invalid
        queryClient.clear()
        throw new Error('Session expired')
      }
      
      return isValid
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry session validation
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  })
}

// Hook to get cached profile data without refetching
export function useCachedProfile(): UserProfile | undefined {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(queryKeys.auth.profile)
}

// Hook to check if user has completed profile setup
export function useProfileCompletion() {
  const { data: profile, isLoading } = useProfile()

  const isComplete = profile && 
    profile.examDate && 
    profile.gradeLevel && 
    profile.firstName && 
    profile.lastName

  return {
    profile,
    isComplete: !!isComplete,
    isLoading,
    missingFields: {
      examDate: !profile?.examDate,
      gradeLevel: !profile?.gradeLevel,
      firstName: !profile?.firstName,
      lastName: !profile?.lastName,
    },
  }
}