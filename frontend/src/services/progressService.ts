import { apiService, ApiResponse } from './apiService'
import { mockProgressService } from './mockProgressService'
import type { 
  ProgressDashboard, 
  DetailedProgress, 
  TutorRecommendations 
} from '../types/api'

export interface ProgressService {
  getDashboard(): Promise<ApiResponse<ProgressDashboard>>
  getDetailedProgress(subject: string): Promise<ApiResponse<DetailedProgress>>
  getTutorRecommendations(): Promise<ApiResponse<TutorRecommendations>>
  updateDailyGoal(minutes: number): Promise<ApiResponse<void>>
}

class ProgressServiceImpl implements ProgressService {
  async getDashboard(): Promise<ApiResponse<ProgressDashboard>> {
    // Use mock data in development until backend is ready
    if (import.meta.env.DEV) {
      return mockProgressService.getDashboard()
    }
    return apiService.get<ProgressDashboard>('/progress/dashboard')
  }

  async getDetailedProgress(subject: string): Promise<ApiResponse<DetailedProgress>> {
    if (import.meta.env.DEV) {
      return mockProgressService.getDetailedProgress(subject)
    }
    return apiService.get<DetailedProgress>(`/progress/detailed/${subject}`)
  }

  async getTutorRecommendations(): Promise<ApiResponse<TutorRecommendations>> {
    if (import.meta.env.DEV) {
      return mockProgressService.getTutorRecommendations()
    }
    return apiService.get<TutorRecommendations>('/tutor/recommendations')
  }

  async updateDailyGoal(minutes: number): Promise<ApiResponse<void>> {
    if (import.meta.env.DEV) {
      return mockProgressService.updateDailyGoal(minutes)
    }
    return apiService.put<void>('/progress/goals', { dailyGoalMinutes: minutes })
  }
}

export const progressService = new ProgressServiceImpl()