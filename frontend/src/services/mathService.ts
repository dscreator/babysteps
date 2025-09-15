import { apiService, isApiError } from './apiService'
import type {
  MathProblem,
  PracticeSessionRequest,
  PracticeSessionResponse,
  MathAnswerRequest,
  MathAnswerResponse
} from '../types/api'

export interface MathPracticeFilters {
  topic?: string
  difficulty?: number
  gradeLevel?: number
  limit?: number
  offset?: number
}

export interface MathSessionData {
  currentProblemIndex: number
  problems: MathProblem[]
  answers: Array<{
    problemId: string
    answer: string
    correct: boolean
    timeSpent: number
  }>
  startTime: string
  totalTimeSpent: number
}

class MathService {
  /**
   * Get math problems with optional filtering
   */
  async getMathProblems(filters: MathPracticeFilters = {}) {
    const queryParams = new URLSearchParams()
    
    if (filters.topic) queryParams.append('topic', filters.topic)
    if (filters.difficulty) queryParams.append('difficulty', filters.difficulty.toString())
    if (filters.gradeLevel) queryParams.append('gradeLevel', filters.gradeLevel.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())

    const endpoint = `/practice/math/problems${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiService.get<{ problems: MathProblem[] }>(endpoint)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.problems
  }

  /**
   * Get a specific math problem by ID
   */
  async getMathProblem(problemId: string) {
    const response = await apiService.get<{ problem: MathProblem }>(`/practice/math/problems/${problemId}`)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.problem
  }

  /**
   * Get random math problems for practice
   */
  async getRandomMathProblems(count: number = 5, gradeLevel?: number) {
    const queryParams = new URLSearchParams()
    queryParams.append('count', count.toString())
    if (gradeLevel) queryParams.append('gradeLevel', gradeLevel.toString())

    const response = await apiService.get<{ problems: MathProblem[] }>(`/practice/math/random?${queryParams.toString()}`)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.problems
  }

  /**
   * Create a new math practice session
   */
  async createMathSession(options: {
    topics?: string[]
    difficultyLevel?: number
    problemCount?: number
  } = {}) {
    const sessionRequest: PracticeSessionRequest = {
      subject: 'math',
      topics: options.topics,
      difficulty: options.difficultyLevel,
      timeLimit: 30 // 30 minutes default
    }

    const response = await apiService.post<{ session: PracticeSessionResponse }>('/practice/sessions', sessionRequest)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  /**
   * Get a practice session by ID
   */
  async getSession(sessionId: string) {
    const response = await apiService.get<{ session: PracticeSessionResponse }>(`/practice/sessions/${sessionId}`)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  /**
   * Update a practice session
   */
  async updateSession(sessionId: string, updates: {
    questionsAttempted?: number
    questionsCorrect?: number
    topics?: string[]
    sessionData?: any
  }) {
    const response = await apiService.put<{ session: PracticeSessionResponse }>(`/practice/sessions/${sessionId}`, updates)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  /**
   * End a practice session
   */
  async endSession(sessionId: string, finalData: {
    questionsAttempted: number
    questionsCorrect: number
    sessionData?: any
  }) {
    const response = await apiService.post<{ session: PracticeSessionResponse }>(`/practice/sessions/${sessionId}/end`, finalData)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  /**
   * Submit an answer for a math problem with retry logic
   */
  async submitAnswer(answerData: {
    sessionId: string
    questionId: string
    answer: string
    timeSpent: number
  }, retryCount = 0): Promise<MathAnswerResponse> {
    const maxRetries = 3
    const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff

    try {
      const submitRequest: MathAnswerRequest = {
        sessionId: answerData.sessionId,
        problemId: answerData.questionId,
        answer: answerData.answer,
        timeSpent: answerData.timeSpent
      }

      const response = await apiService.post<MathAnswerResponse>('/practice/submit', submitRequest)

      if (isApiError(response)) {
        // Check if it's a network error that should be retried
        if (this.shouldRetry(response.error) && retryCount < maxRetries) {
          await this.delay(retryDelay)
          return this.submitAnswer(answerData, retryCount + 1)
        }
        throw new Error(response.error.message)
      }

      return response.data
    } catch (error) {
      // Handle network errors
      if (this.isNetworkError(error) && retryCount < maxRetries) {
        await this.delay(retryDelay)
        return this.submitAnswer(answerData, retryCount + 1)
      }
      throw error
    }
  }

  /**
   * Get user's math practice statistics
   */
  async getMathStats() {
    const response = await apiService.get<{
      stats: {
        totalSessions: number
        completedSessions: number
        totalQuestions: number
        correctAnswers: number
        averageAccuracy: number
        totalPracticeTime: number
      }
    }>('/practice/stats?subject=math')

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.stats
  }

  /**
   * Track hint usage for a problem
   */
  async trackHintUsage(sessionId: string, questionId: string, hintIndex: number, timeSpent?: number) {
    const response = await apiService.post(`/practice/sessions/${sessionId}/hints`, {
      questionId,
      hintIndex,
      timeSpent
    })

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data
  }

  /**
   * Get available math topics
   */
  getAvailableTopics(): string[] {
    return [
      'arithmetic',
      'algebra',
      'geometry',
      'data-analysis',
      'fractions',
      'decimals',
      'percentages',
      'ratios',
      'proportions',
      'basic-equations',
      'coordinate-geometry',
      'probability',
      'statistics'
    ]
  }

  /**
   * Get difficulty levels
   */
  getDifficultyLevels(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 1, label: 'Beginner', description: 'Basic concepts and simple problems' },
      { value: 2, label: 'Intermediate', description: 'Standard ISEE level problems' },
      { value: 3, label: 'Advanced', description: 'Challenging problems for high achievers' },
      { value: 4, label: 'Expert', description: 'Most difficult problems available' }
    ]
  }

  /**
   * Check if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    // Retry on server errors (5xx) but not client errors (4xx)
    if (error.status >= 500) return true
    
    // Retry on specific error codes
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
    return retryableErrors.includes(error.code)
  }

  /**
   * Check if an error is a network error
   */
  private isNetworkError(error: any): boolean {
    return error.name === 'NetworkError' || 
           error.message?.includes('fetch') ||
           error.message?.includes('network') ||
           !navigator.onLine
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const mathService = new MathService()