import { apiService, ApiResponse, ApiError } from './apiService'
import { mockProgressService } from './mockProgressService'
import type { 
  ProgressDashboard, 
  DetailedProgress, 
  TutorRecommendations 
} from '../types/api'

export interface ProgressService {
  getDashboard(): Promise<ApiResponse<ProgressDashboard> | ApiError>
  getDetailedProgress(subject: string): Promise<ApiResponse<DetailedProgress> | ApiError>
  getTutorRecommendations(): Promise<ApiResponse<TutorRecommendations> | ApiError>
  updateDailyGoal(minutes: number): Promise<ApiResponse<void> | ApiError>
}

class ProgressServiceImpl implements ProgressService {
  async getDashboard(): Promise<ApiResponse<ProgressDashboard> | ApiError> {
    // Use mock data in development until backend is ready
    if (import.meta.env.DEV) {
      return mockProgressService.getDashboard()
    }
    return apiService.get<ProgressDashboard>('/progress/dashboard')
  }

  async getDetailedProgress(subject: string): Promise<ApiResponse<DetailedProgress> | ApiError> {
    if (import.meta.env.DEV) {
      return mockProgressService.getDetailedProgress(subject)
    }
    return apiService.get<DetailedProgress>(`/progress/detailed/${subject}`)
  }

  async getTutorRecommendations(): Promise<ApiResponse<TutorRecommendations> | ApiError> {
    if (import.meta.env.DEV) {
      return mockProgressService.getTutorRecommendations()
    }
    return apiService.get<TutorRecommendations>('/tutor/recommendations')
  }

  async updateDailyGoal(minutes: number): Promise<ApiResponse<void> | ApiError> {
    if (import.meta.env.DEV) {
      return mockProgressService.updateDailyGoal(minutes)
    }
    return apiService.put<void>('/progress/goals', { dailyGoalMinutes: minutes })
  }
}

export const progressService = new ProgressServiceImpl()