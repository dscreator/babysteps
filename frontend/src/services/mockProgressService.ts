import type { 
  ProgressDashboard, 
  DetailedProgress, 
  TutorRecommendations,
  PracticeSessionResponse,
  Achievement
} from '../types/api'
import { ApiResponse } from './apiService'

// Mock data for development
const mockDashboardData: ProgressDashboard = {
  overallProgress: {
    math: 72,
    english: 85,
    essay: 68,
    overall: 75,
  },
  recentSessions: [
    {
      id: '1',
      userId: 'user1',
      subject: 'math',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      questionsAttempted: 15,
      questionsCorrect: 11,
      score: 73,
      topics: ['algebra', 'geometry'],
      difficultyLevel: 3,
      completed: true,
    },
    {
      id: '2',
      userId: 'user1',
      subject: 'english',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      endTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
      questionsAttempted: 20,
      questionsCorrect: 17,
      score: 85,
      topics: ['reading comprehension', 'vocabulary'],
      difficultyLevel: 4,
      completed: true,
    },
    {
      id: '3',
      userId: 'user1',
      subject: 'essay',
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      endTime: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      questionsAttempted: 1,
      questionsCorrect: 1,
      score: 68,
      topics: ['narrative writing'],
      difficultyLevel: 3,
      completed: true,
    },
  ],
  streakDays: 5,
  totalPracticeTime: 1240, // minutes
  examCountdown: {
    daysRemaining: 28,
    hoursRemaining: 672,
    isUrgent: false,
  },
  weeklyGoal: {
    target: 300, // minutes
    completed: 180, // minutes
    percentage: 60,
  },
  achievements: [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first practice session',
      icon: '🎯',
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Math Whiz',
      description: 'Score 80% or higher on a math session',
      icon: '🔢',
      progress: {
        current: 72,
        target: 80,
      },
    },
    {
      id: '3',
      name: 'Streak Master',
      description: 'Maintain a 7-day study streak',
      icon: '🔥',
      progress: {
        current: 5,
        target: 7,
      },
    },
  ],
}

const mockTutorRecommendations: TutorRecommendations = {
  dailyGoals: {
    math: 20,
    english: 25,
    essay: 30,
  },
  focusAreas: ['algebra word problems', 'reading inference questions', 'essay organization'],
  suggestedSessions: [
    {
      subject: 'math',
      topic: 'algebra',
      difficulty: 3,
      estimatedTime: 20,
    },
    {
      subject: 'english',
      topic: 'reading comprehension',
      difficulty: 4,
      estimatedTime: 25,
    },
    {
      subject: 'essay',
      topic: 'persuasive writing',
      difficulty: 3,
      estimatedTime: 35,
    },
  ],
  motivationalMessage: 'Great progress this week! Focus on algebra and reading inference to boost your scores.',
}

// Mock service implementation
export class MockProgressService {
  async getDashboard(): Promise<ApiResponse<ProgressDashboard>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      data: mockDashboardData,
    }
  }

  async getDetailedProgress(subject: string): Promise<ApiResponse<DetailedProgress>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const mockDetailedProgress: DetailedProgress = {
      subject: subject as 'math' | 'english' | 'essay',
      topicScores: {
        'arithmetic': 85,
        'algebra': 72,
        'geometry': 68,
        'data analysis': 79,
      },
      performanceTrend: [
        { date: '2024-01-01', score: 60 },
        { date: '2024-01-08', score: 65 },
        { date: '2024-01-15', score: 70 },
        { date: '2024-01-22', score: 75 },
      ],
      weakAreas: ['algebra word problems', 'geometry proofs'],
      strongAreas: ['arithmetic', 'data interpretation'],
      recommendations: [
        'Focus on algebra word problems',
        'Practice geometry proofs daily',
        'Review fundamental concepts',
      ],
      timeSpent: 420,
      questionsAnswered: 156,
      accuracy: 72,
    }
    
    return {
      success: true,
      data: mockDetailedProgress,
    }
  }

  async getTutorRecommendations(): Promise<ApiResponse<TutorRecommendations>> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      success: true,
      data: mockTutorRecommendations,
    }
  }

  async updateDailyGoal(minutes: number): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      success: true,
      data: undefined,
    }
  }
}

export const mockProgressService = new MockProgressService()