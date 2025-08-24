import { useQuery } from '@tanstack/react-query'
import { progressService } from '../services/progressService'
import { queryKeys } from '../lib/queryClient'
import { isApiError } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'

// Dashboard data query hook
export function useDashboardData() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.progress.dashboard,
    queryFn: async () => {
      const result = await progressService.getDashboard()
      
      if (isApiError(result)) {
        throw new Error(result.error.message)
      }
      
      return result.data
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time updates
  })
}

// Detailed progress query hook
export function useDetailedProgress(subject: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.progress.detailed(subject),
    queryFn: async () => {
      const result = await progressService.getDetailedProgress(subject)
      
      if (isApiError(result)) {
        throw new Error(result.error.message)
      }
      
      return result.data
    },
    enabled: !!user && !!subject,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Tutor recommendations query hook
export function useTutorRecommendations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.tutor.recommendations,
    queryFn: async () => {
      const result = await progressService.getTutorRecommendations()
      
      if (isApiError(result)) {
        throw new Error(result.error.message)
      }
      
      return result.data
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}