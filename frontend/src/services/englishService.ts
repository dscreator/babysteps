import { apiService, isApiError } from './apiService'
import type {
  ReadingPassage,
  ReadingQuestion,
  VocabularyWord,
  PracticeSessionRequest,
  PracticeSessionResponse
} from '../types/api'

export interface EnglishPracticeFilters {
  gradeLevel?: number
  subjectArea?: string
  difficultyLevel?: number
  limit?: number
  offset?: number
}

export interface EnglishSessionData {
  currentQuestionIndex: number
  passage: ReadingPassage
  questions: ReadingQuestion[]
  answers: Array<{
    questionId: string
    answer: string
    correct: boolean
    timeSpent: number
  }>
  vocabulary: VocabularyWord[]
  startTime: string
  totalTimeSpent: number
}

class EnglishService {
  /**
   * Get reading passages with optional filtering
   */
  async getReadingPassages(filters: EnglishPracticeFilters = {}) {
    const queryParams = new URLSearchParams()
    
    if (filters.gradeLevel) queryParams.append('gradeLevel', filters.gradeLevel.toString())
    if (filters.subjectArea) queryParams.append('subjectArea', filters.subjectArea)
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())

    const endpoint = `/practice/english/passages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiService.get<{ passages: ReadingPassage[] }>(endpoint)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.passages
  }

  /**
   * Get a reading passage with its questions
   */
  async getReadingPassageWithQuestions(passageId: string) {
    const response = await apiService.get<{
      passage: ReadingPassage
      questions: ReadingQuestion[]
    }>(`/practice/english/passages/${passageId}`)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data
  }

  /**
   * Get vocabulary words with optional filtering
   */
  async getVocabularyWords(filters: EnglishPracticeFilters = {}) {
    const queryParams = new URLSearchParams()
    
    if (filters.difficultyLevel) queryParams.append('difficultyLevel', filters.difficultyLevel.toString())
    if (filters.gradeLevel) queryParams.append('gradeLevel', filters.gradeLevel.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())

    const endpoint = `/practice/english/vocabulary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiService.get<{ words: VocabularyWord[] }>(endpoint)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.words
  }

  /**
   * Get random reading passage for practice
   */
  async getRandomReadingPassage(gradeLevel?: number) {
    const queryParams = new URLSearchParams()
    if (gradeLevel) queryParams.append('gradeLevel', gradeLevel.toString())

    const response = await apiService.get<{
      passage: ReadingPassage
      questions: ReadingQuestion[]
      vocabulary: VocabularyWord[]
    }>(`/practice/english/random${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data
  }

  /**
   * Create a new English practice session
   */
  async createEnglishSession(options: {
    gradeLevel?: number
    subjectArea?: string
    timeLimit?: number
  } = {}) {
    const sessionRequest: PracticeSessionRequest = {
      subject: 'english',
      difficulty: options.gradeLevel,
      timeLimit: options.timeLimit || 45 // 45 minutes default for reading
    }

    const response = await apiService.post<{ session: PracticeSessionResponse }>('/practice/sessions', sessionRequest)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  /**
   * Submit an answer for an English question
   */
  async submitAnswer(answerData: {
    sessionId: string
    questionId: string
    answer: string
    timeSpent: number
  }) {
    const submitRequest = {
      sessionId: answerData.sessionId,
      questionId: answerData.questionId,
      answer: answerData.answer,
      timeSpent: answerData.timeSpent
    }

    const response = await apiService.post<{
      correct: boolean
      explanation?: string
      correctAnswer?: string
    }>('/practice/submit', submitRequest)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data
  }

  /**
   * Get user's English practice statistics
   */
  async getEnglishStats() {
    const response = await apiService.get<{
      stats: {
        totalSessions: number
        completedSessions: number
        totalQuestions: number
        correctAnswers: number
        averageAccuracy: number
        totalPracticeTime: number
        readingSpeed: number // words per minute
        vocabularyMastery: number // percentage
      }
    }>('/practice/stats?subject=english')

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.stats
  }

  /**
   * Get available subject areas for reading passages
   */
  getAvailableSubjectAreas(): string[] {
    return [
      'science',
      'history',
      'literature',
      'social-studies',
      'biography',
      'current-events',
      'arts',
      'nature'
    ]
  }

  /**
   * Get question types for reading comprehension
   */
  getQuestionTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'main_idea', label: 'Main Idea', description: 'Identify the central theme or main point' },
      { value: 'detail', label: 'Supporting Details', description: 'Find specific information from the text' },
      { value: 'inference', label: 'Inference', description: 'Draw conclusions based on evidence' },
      { value: 'vocabulary', label: 'Vocabulary', description: 'Understand word meanings in context' }
    ]
  }

  /**
   * Get difficulty levels for vocabulary
   */
  getDifficultyLevels(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 1, label: 'Basic', description: 'Common everyday words' },
      { value: 2, label: 'Intermediate', description: 'Standard ISEE vocabulary' },
      { value: 3, label: 'Advanced', description: 'Challenging academic words' },
      { value: 4, label: 'Expert', description: 'Complex vocabulary for high achievers' }
    ]
  }
}

export const englishService = new EnglishService()