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
  createdAt: string
}

export interface ReadingPassage {
  id: string
  title: string
  content: string
  gradeLevel: number
  subjectArea?: string
  wordCount?: number
  createdAt: string
}

export interface ReadingQuestion {
  id: string
  passageId: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  questionType: 'main_idea' | 'detail' | 'inference' | 'vocabulary'
  createdAt: string
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
  createdAt: string
}

export interface EssayPrompt {
  id: string
  prompt: string
  type: 'narrative' | 'expository' | 'persuasive'
  gradeLevel: number
  timeLimit: number
  rubric?: Record<string, any>
  createdAt: string
}

export interface PracticeSession {
  id: string
  userId: string
  subject: 'math' | 'english' | 'essay'
  startTime: string
  endTime?: string
  questionsAttempted: number
  questionsCorrect: number
  topics: string[]
  difficultyLevel?: number
  sessionData: Record<string, any>
  createdAt: string
}

export interface AIInteraction {
  id: string
  userId: string
  sessionId?: string
  interactionType: 'hint' | 'explanation' | 'feedback' | 'chat'
  content: string
  context?: Record<string, any>
  createdAt: string
}

export interface UserProgress {
  id: string
  userId: string
  subject: 'math' | 'english' | 'essay'
  overallScore: number
  topicScores: Record<string, number>
  streakDays: number
  totalPracticeTime: number
  lastPracticeDate?: string
  weakAreas: string[]
  strongAreas: string[]
  createdAt: string
  updatedAt: string
}

export interface ProgressSnapshot {
  id: string
  userId: string
  snapshotDate: string
  subject: 'math' | 'english' | 'essay'
  performanceData: Record<string, any>
  createdAt: string
}

// Request/Response types
export interface CreateSessionRequest {
  subject: 'math' | 'english' | 'essay'
  topics?: string[]
  difficultyLevel?: number
}

export interface UpdateSessionRequest {
  questionsAttempted?: number
  questionsCorrect?: number
  topics?: string[]
  sessionData?: Record<string, any>
}

export interface EndSessionRequest {
  questionsAttempted: number
  questionsCorrect: number
  sessionData?: Record<string, any>
}

export interface GetProblemsRequest {
  topic?: string
  difficulty?: number
  gradeLevel?: number
  limit?: number
  offset?: number
}

export interface GetPassagesRequest {
  gradeLevel?: number
  subjectArea?: string
  limit?: number
  offset?: number
}

export interface GetVocabularyRequest {
  difficultyLevel?: number
  gradeLevel?: number
  limit?: number
  offset?: number
}

export interface GetPromptsRequest {
  type?: 'narrative' | 'expository' | 'persuasive'
  gradeLevel?: number
  limit?: number
  offset?: number
}

export interface SubmitAnswerRequest {
  sessionId: string
  questionId: string
  answer: string
  timeSpent?: number
}

export interface SubmitAnswerResponse {
  correct: boolean
  explanation?: string
  hints?: string[]
  correctAnswer?: string
  stepByStepSolution?: {
    steps: Array<{
      step: number
      title: string
      content: string
      formula?: string
    }>
  }
  hintUsageCount?: number
}

// Essay analysis types
export interface EssaySubmission {
  id: string
  userId: string
  promptId: string
  content: string
  wordCount: number
  timeSpent?: number
  submittedAt: string
}

export interface EssayAnalysis {
  id: string
  submissionId: string
  overallScore: number
  structureScore: number
  grammarScore: number
  contentScore: number
  vocabularyScore: number
  feedback: EssayFeedback
  rubricBreakdown: Record<string, RubricScore>
  analyzedAt: string
}

export interface EssayFeedback {
  strengths: string[]
  improvements: string[]
  specific: string[]
}

export interface RubricScore {
  score: number
  feedback: string
}

// Request/Response types for essay analysis
export interface SubmitEssayRequest {
  promptId: string
  content: string
  timeSpent?: number
}

export interface AnalyzeEssayRequest {
  submissionId: string
}

export interface EssayAnalysisResponse {
  analysis: EssayAnalysis
  suggestions: {
    nextSteps: string[]
    practiceAreas: string[]
  }
}