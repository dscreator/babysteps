// User types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  examDate?: Date
  gradeLevel?: number
  parentEmail?: string
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  studyReminders: boolean
  parentNotifications: boolean
  difficultyLevel: 'adaptive' | 'beginner' | 'intermediate' | 'advanced'
  dailyGoalMinutes: number
}

// Practice session types
export interface PracticeSession {
  id: string
  userId: string
  subject: 'math' | 'english' | 'essay'
  startTime: Date
  endTime?: Date
  questionsAttempted: number
  questionsCorrect: number
  topics: string[]
  difficultyLevel?: number
  sessionData: Record<string, any>
}

// Content types
export interface MathProblem {
  id: string
  topic: string
  difficulty: number
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  hints: string[]
  gradeLevel: number
}

export interface ReadingPassage {
  id: string
  title: string
  content: string
  gradeLevel: number
  subjectArea?: string
  wordCount?: number
  questions: ReadingQuestion[]
}

export interface ReadingQuestion {
  id: string
  passageId: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  questionType: 'main_idea' | 'detail' | 'inference' | 'vocabulary'
}

export interface VocabularyWord {
  id: string
  word: string
  definition: string
  partOfSpeech?: string
  difficultyLevel: number
  exampleSentence?: string
  synonyms: string[]
  antonyms: string[]
  gradeLevel: number
}

export interface EssayPrompt {
  id: string
  prompt: string
  type: 'narrative' | 'expository' | 'persuasive'
  gradeLevel: number
  timeLimit: number
  rubric?: EssayRubric
}

export interface EssayRubric {
  criteria: {
    name: string
    description: string
    maxPoints: number
  }[]
}

// Progress types
export interface UserProgress {
  userId: string
  subject: string
  overallScore: number
  topicScores: Record<string, number>
  streakDays: number
  totalPracticeTime: number
  lastPracticeDate?: Date
  weakAreas: string[]
  strongAreas: string[]
}

// AI interaction types
export interface AIInteraction {
  id: string
  userId: string
  sessionId?: string
  interactionType: 'hint' | 'explanation' | 'feedback' | 'chat'
  content: string
  context?: Record<string, any>
  createdAt: Date
}

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}