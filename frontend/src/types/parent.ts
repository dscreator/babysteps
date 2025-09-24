export interface ParentAccount {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

export interface StudentLink {
  studentId: string
  studentName: string
  examDate: string
  gradeLevel: number
  accessGranted: boolean
}

export interface ParentDashboardData {
  student: {
    id: string
    firstName: string
    lastName: string
    examDate: string
    gradeLevel: number
  }
  progress: {
    math: {
      overallScore: number
      recentSessions: number
      weakAreas: string[]
      strongAreas: string[]
    }
    english: {
      overallScore: number
      recentSessions: number
      weakAreas: string[]
      strongAreas: string[]
    }
    essay: {
      overallScore: number
      recentSessions: number
      weakAreas: string[]
      strongAreas: string[]
    }
  }
  engagement: {
    streakDays: number
    totalPracticeTime: number
    lastPracticeDate: string
    weeklyGoalProgress: number
    consistencyScore: number
  }
  recentActivity: Array<{
    date: string
    subject: string
    duration: number
    performance: number
  }>
}

export interface CreateParentAccountRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  studentEmail: string
}

export interface ParentLoginRequest {
  email: string
  password: string
}

export interface ParentNotificationPreferences {
  progressMilestones: boolean
  studyReminders: boolean
  weeklyReports: boolean
  emailFrequency: 'daily' | 'weekly' | 'monthly'
}