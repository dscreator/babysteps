// Re-export API service types for consistency
export type { 
  ApiResponse, 
  ApiError 
} from '../services/apiService'

export type { 
  LoginRequest,
  RegisterRequest,
  UserProfile,
  UserPreferences,
  UpdateProfileRequest,
  AuthResponse
} from '../services/authService'

// Common API types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: any
}

// Practice session types
export interface PracticeSessionRequest {
  subject: 'math' | 'english' | 'essay'
  difficulty?: number
  topics?: string[]
  timeLimit?: number
}

export interface PracticeSessionResponse {
  id: string
  userId: string
  subject: 'math' | 'english' | 'essay'
  startTime: string
  endTime?: string
  questionsAttempted: number
  questionsCorrect: number
  score: number
  topics: string[]
  difficultyLevel: number
  completed: boolean
}

// Math practice types
export interface MathProblem {
  id: string
  topic: string
  difficulty: number
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  hints: string[]
  timeLimit?: number
}

export interface MathProblemResponse {
  problem: MathProblem
  sessionId: string
  questionNumber: number
  totalQuestions: number
}

export interface MathAnswerRequest {
  sessionId: string
  problemId: string
  answer: string
  timeSpent: number
}

export interface MathAnswerResponse {
  correct: boolean
  explanation: string
  correctAnswer: string
  score: number
  nextProblem?: MathProblem
}

// English practice types
export interface ReadingPassage {
  id: string
  title: string
  content: string
  gradeLevel: number
  topic: string
  wordCount: number
  estimatedReadingTime: number
}

export interface ReadingQuestion {
  id: string
  passageId: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  type: 'comprehension' | 'vocabulary' | 'inference' | 'main_idea'
}

export interface EnglishPracticeResponse {
  passage: ReadingPassage
  questions: ReadingQuestion[]
  sessionId: string
  vocabulary: VocabularyWord[]
}

export interface VocabularyWord {
  id: string
  word: string
  definition: string
  partOfSpeech: string
  synonyms: string[]
  antonyms: string[]
  examples: string[]
  difficulty: number
}

// Essay practice types
export interface EssayPrompt {
  id: string
  prompt: string
  type: 'narrative' | 'expository' | 'persuasive'
  gradeLevel: number
  timeLimit: number
  instructions: string[]
  rubric: EssayRubric
}

export interface EssayRubric {
  criteria: {
    organization: RubricCriterion
    development: RubricCriterion
    language: RubricCriterion
    conventions: RubricCriterion
  }
  maxScore: number
}

export interface RubricCriterion {
  name: string
  description: string
  levels: {
    score: number
    description: string
  }[]
}

export interface EssaySubmissionRequest {
  promptId: string
  content: string
  timeSpent: number
  wordCount: number
}

export interface EssayAnalysisResponse {
  score: number
  feedback: {
    overall: string
    organization: string
    development: string
    language: string
    conventions: string
  }
  suggestions: string[]
  strengths: string[]
  improvements: string[]
  rubricScores: {
    organization: number
    development: number
    language: number
    conventions: number
  }
}

// Progress tracking types
export interface ProgressDashboard {
  overallProgress: {
    math: number
    english: number
    essay: number
    overall: number
  }
  recentSessions: PracticeSessionResponse[]
  streakDays: number
  totalPracticeTime: number
  examCountdown: {
    daysRemaining: number
    hoursRemaining: number
    isUrgent: boolean
  }
  weeklyGoal: {
    target: number
    completed: number
    percentage: number
  }
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress?: {
    current: number
    target: number
  }
}

export interface DetailedProgress {
  subject: 'math' | 'english' | 'essay'
  topicScores: Record<string, number>
  performanceTrend: {
    date: string
    score: number
  }[]
  weakAreas: string[]
  strongAreas: string[]
  recommendations: string[]
  timeSpent: number
  questionsAnswered: number
  accuracy: number
}

// AI Tutor types
export interface TutorExplanationRequest {
  problemId?: string
  question: string
  context?: string
  subject: 'math' | 'english' | 'essay'
}

export interface TutorExplanationResponse {
  explanation: string
  examples?: string[]
  relatedConcepts?: string[]
  nextSteps?: string[]
}

export interface TutorChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: {
    subject?: string
    topic?: string
    problemId?: string
  }
}

export interface TutorChatRequest {
  message: string
  context?: {
    subject?: string
    topic?: string
    problemId?: string
  }
}

export interface TutorRecommendations {
  dailyGoals: {
    math: number
    english: number
    essay: number
  }
  focusAreas: string[]
  suggestedSessions: {
    subject: string
    topic: string
    difficulty: number
    estimatedTime: number
  }[]
  motivationalMessage: string
}