import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  authService, 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest,
  AuthResponse,
  UserProfile
} from '../services/authService'
import { queryKeys } from '../lib/queryClient'
import { isApiError } from '../services/apiService'

// Login mutation hook
export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (result) => {
      if (isApiError(result)) {
        return
      }

      // Cache user profile
      queryClient.setQueryData(queryKeys.auth.profile, result.data.user)
      
      toast.success('Welcome back!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    },
  })
}

// Register mutation hook
export function useRegister() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (result) => {
      if (isApiError(result)) {
        return
      }

      // Cache user profile
      queryClient.setQueryData(queryKeys.auth.profile, result.data.user)
      
      toast.success('Account created successfully!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    },
  })
}

// Logout mutation hook
export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      
      toast.success('Logged out successfully')
      navigate('/login')
    },
    onError: (error: any) => {
      console.error('Logout error:', error)
      // Even if logout fails on backend, clear local data
      queryClient.clear()
      navigate('/login')
    },
  })
}

// Update profile mutation hook
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authService.updateProfile(data),
    onSuccess: (result) => {
      if (isApiError(result)) {
        return
      }

      // Update cached profile data
      queryClient.setQueryData(queryKeys.auth.profile, result.data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile })
      
      toast.success('Profile updated successfully!')
    },
    onError: (error: any) => {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
    },
  })
}

// Refresh session mutation hook
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.refreshSession(),
    onSuccess: (result) => {
      if (isApiError(result)) {
        return
      }

      // Update cached profile data
      queryClient.setQueryData(queryKeys.auth.profile, result.data.user)
      
      console.log('Session refreshed successfully')
    },
    onError: (error: any) => {
      console.error('Session refresh error:', error)
      // Don't show toast for session refresh errors as they're automatic
    },
  })
}