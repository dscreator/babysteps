export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  examDate: string
  gradeLevel: number
  parentEmail?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  examDate?: string
  gradeLevel?: number
  parentEmail?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  studyReminders: boolean
  parentNotifications: boolean
  difficultyLevel: 'adaptive' | 'beginner' | 'intermediate' | 'advanced'
  dailyGoalMinutes: number
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  examDate: string
  gradeLevel: number
  parentEmail?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: UserProfile
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}