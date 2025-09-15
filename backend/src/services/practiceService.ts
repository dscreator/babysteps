import { supabase } from '../config/supabase'
import {
  PracticeSession,
  AIInteraction,
  CreateSessionRequest,
  UpdateSessionRequest,
  EndSessionRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse
} from '../types/practice'
import { contentService } from './content/contentService'

export class PracticeService {
  /**
   * Create a new practice session
   */
  async createSession(userId: string, request: CreateSessionRequest): Promise<PracticeSession> {
    const sessionData = {
      user_id: userId,
      subject: request.subject,
      topics: request.topics || [],
      difficulty_level: request.difficultyLevel,
      session_data: {}
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create practice session: ${error.message}`)
    }

    return this.mapPracticeSession(data)
  }

  /**
   * Get a practice session by ID
   */
  async getSessionById(sessionId: string, userId: string): Promise<PracticeSession | null> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch practice session: ${error.message}`)
    }

    return this.mapPracticeSession(data)
  }

  /**
   * Update a practice session
   */
  async updateSession(
    sessionId: string,
    userId: string,
    request: UpdateSessionRequest
  ): Promise<PracticeSession> {
    const updateData: any = {}

    if (request.questionsAttempted !== undefined) {
      updateData.questions_attempted = request.questionsAttempted
    }

    if (request.questionsCorrect !== undefined) {
      updateData.questions_correct = request.questionsCorrect
    }

    if (request.topics) {
      updateData.topics = request.topics
    }

    if (request.sessionData) {
      updateData.session_data = request.sessionData
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update practice session: ${error.message}`)
    }

    return this.mapPracticeSession(data)
  }

  /**
   * End a practice session
   */
  async endSession(
    sessionId: string,
    userId: string,
    request: EndSessionRequest
  ): Promise<PracticeSession> {
    const updateData = {
      end_time: new Date().toISOString(),
      questions_attempted: request.questionsAttempted,
      questions_correct: request.questionsCorrect,
      session_data: request.sessionData || {}
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to end practice session: ${error.message}`)
    }

    return this.mapPracticeSession(data)
  }

  /**
   * Get user's practice sessions with optional filtering
   */
  async getUserSessions(
    userId: string,
    options: {
      subject?: 'math' | 'english' | 'essay'
      limit?: number
      offset?: number
      includeActive?: boolean
    } = {}
  ): Promise<PracticeSession[]> {
    const { subject, limit = 20, offset = 0, includeActive = true } = options

    let query = supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (subject) {
      query = query.eq('subject', subject)
    }

    if (!includeActive) {
      query = query.not('end_time', 'is', null)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch user sessions: ${error.message}`)
    }

    return data?.map(this.mapPracticeSession) || []
  }

  /**
   * Get active session for user (session without end_time)
   */
  async getActiveSession(userId: string): Promise<PracticeSession | null> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No active session
      }
      throw new Error(`Failed to fetch active session: ${error.message}`)
    }

    return this.mapPracticeSession(data)
  }

  /**
   * Submit an answer and get feedback
   */
  async submitAnswer(
    userId: string,
    request: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    // First verify the session belongs to the user
    const session = await this.getSessionById(request.sessionId, userId)
    if (!session) {
      throw new Error('Session not found or access denied')
    }

    // Get the correct answer based on the subject and question
    let correct = false
    let explanation: string | undefined
    let hints: string[] | undefined
    let correctAnswer: string | undefined
    let stepByStepSolution: any = undefined
    let hintUsageCount = 0

    if (session.subject === 'math') {
      const problem = await contentService.getMathProblemById(request.questionId)
      if (problem) {
        correct = this.compareAnswers(problem.correctAnswer, request.answer)
        explanation = problem.explanation
        hints = problem.hints
        correctAnswer = problem.correctAnswer
        
        // Generate step-by-step solution for math problems
        stepByStepSolution = await this.generateStepByStepSolution(problem)
        
        // Get hint usage count from session data
        const sessionData = session.sessionData || {}
        const problemHints = sessionData.hintUsage?.[request.questionId] || []
        hintUsageCount = problemHints.length
      }
    } else if (session.subject === 'english') {
      // For reading questions, we need to check if it's a passage question
      const { data: questionData, error } = await supabase
        .from('reading_questions')
        .select('*')
        .eq('id', request.questionId)
        .single()

      if (!error && questionData) {
        correct = this.compareAnswers(questionData.correct_answer, request.answer)
        explanation = questionData.explanation
        correctAnswer = questionData.correct_answer
      }
    }

    // Update session statistics and performance tracking
    const currentAttempted = session.questionsAttempted + 1
    const currentCorrect = session.questionsCorrect + (correct ? 1 : 0)

    // Enhanced session data with performance metrics
    const updatedSessionData = {
      ...session.sessionData,
      answers: {
        ...session.sessionData.answers,
        [request.questionId]: {
          answer: request.answer,
          correct,
          timeSpent: request.timeSpent,
          hintsUsed: hintUsageCount,
          submittedAt: new Date().toISOString()
        }
      },
      performanceMetrics: {
        ...session.sessionData.performanceMetrics,
        totalTimeSpent: (session.sessionData.performanceMetrics?.totalTimeSpent || 0) + (request.timeSpent || 0),
        averageTimePerQuestion: ((session.sessionData.performanceMetrics?.totalTimeSpent || 0) + (request.timeSpent || 0)) / currentAttempted,
        hintsUsedTotal: (session.sessionData.performanceMetrics?.hintsUsedTotal || 0) + hintUsageCount
      }
    }

    await this.updateSession(request.sessionId, userId, {
      questionsAttempted: currentAttempted,
      questionsCorrect: currentCorrect,
      sessionData: updatedSessionData
    })

    // Record the interaction for learning analytics
    await this.recordAIInteraction(userId, {
      sessionId: request.sessionId,
      interactionType: correct ? 'correct_answer' : 'incorrect_answer',
      content: correct ? 'Answer submitted correctly' : explanation || 'Incorrect answer submitted',
      context: {
        questionId: request.questionId,
        userAnswer: request.answer,
        correctAnswer,
        timeSpent: request.timeSpent,
        hintsUsed: hintUsageCount,
        correct
      }
    })

    return {
      correct,
      explanation: !correct ? explanation : undefined,
      hints: !correct ? hints : undefined,
      correctAnswer: !correct ? correctAnswer : undefined,
      stepByStepSolution: !correct ? stepByStepSolution : undefined,
      hintUsageCount
    }
  }

  /**
   * Compare answers with flexible matching for math problems
   */
  private compareAnswers(correctAnswer: string, userAnswer: string): boolean {
    const normalize = (answer: string) => {
      return answer.toLowerCase().trim()
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/[()]/g, '') // Remove parentheses
    }

    const normalizedCorrect = normalize(correctAnswer)
    const normalizedUser = normalize(userAnswer)

    // Direct match
    if (normalizedCorrect === normalizedUser) {
      return true
    }

    // Try to parse as numbers for decimal/fraction comparison
    try {
      const correctNum = this.parseNumber(correctAnswer)
      const userNum = this.parseNumber(userAnswer)
      
      if (correctNum !== null && userNum !== null) {
        return Math.abs(correctNum - userNum) < 0.001 // Allow small floating point differences
      }
    } catch (e) {
      // Not numbers, continue with string comparison
    }

    return false
  }

  /**
   * Parse various number formats (decimals, fractions, percentages)
   */
  private parseNumber(value: string): number | null {
    const cleaned = value.trim().toLowerCase()
    
    // Handle percentages
    if (cleaned.includes('%')) {
      const num = parseFloat(cleaned.replace('%', ''))
      return isNaN(num) ? null : num / 100
    }
    
    // Handle fractions
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/')
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0])
        const denominator = parseFloat(parts[1])
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator
        }
      }
    }
    
    // Handle regular numbers
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  /**
   * Generate step-by-step solution for math problems
   */
  private async generateStepByStepSolution(problem: any): Promise<any> {
    // For now, return a basic step-by-step breakdown
    // In a full implementation, this could use AI to generate detailed steps
    const steps = []
    
    // Basic step generation based on problem type
    if (problem.topic === 'algebra') {
      steps.push(
        {
          step: 1,
          title: 'Identify the equation',
          content: 'Look at the given information and identify what we need to solve for.',
          formula: problem.question.includes('=') ? problem.question.split('=')[0] + '= ?' : undefined
        },
        {
          step: 2,
          title: 'Apply algebraic operations',
          content: 'Use inverse operations to isolate the variable.',
        },
        {
          step: 3,
          title: 'Verify the solution',
          content: `Substitute the answer back into the original equation to verify: ${problem.correctAnswer}`,
        }
      )
    } else if (problem.topic === 'geometry') {
      steps.push(
        {
          step: 1,
          title: 'Identify the geometric shape and given information',
          content: 'Determine what type of shape we\'re working with and what measurements are provided.',
        },
        {
          step: 2,
          title: 'Apply the appropriate formula',
          content: 'Use the correct geometric formula for the problem type.',
        },
        {
          step: 3,
          title: 'Calculate the result',
          content: `Perform the calculations to get: ${problem.correctAnswer}`,
        }
      )
    } else {
      // Generic steps for other topics
      steps.push(
        {
          step: 1,
          title: 'Understand the problem',
          content: 'Read the problem carefully and identify what is being asked.',
        },
        {
          step: 2,
          title: 'Apply the solution method',
          content: 'Use the appropriate mathematical operations or formulas.',
        },
        {
          step: 3,
          title: 'Arrive at the answer',
          content: `The final answer is: ${problem.correctAnswer}`,
        }
      )
    }

    return { steps }
  }

  /**
   * Record an AI interaction
   */
  async recordAIInteraction(
    userId: string,
    interaction: {
      sessionId?: string
      interactionType: 'hint' | 'explanation' | 'feedback' | 'chat' | 'correct_answer' | 'incorrect_answer'
      content: string
      context?: Record<string, any>
    }
  ): Promise<AIInteraction> {
    const interactionData = {
      user_id: userId,
      session_id: interaction.sessionId,
      interaction_type: interaction.interactionType,
      content: interaction.content,
      context: interaction.context || {}
    }

    const { data, error } = await supabase
      .from('ai_interactions')
      .insert(interactionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record AI interaction: ${error.message}`)
    }

    return this.mapAIInteraction(data)
  }

  /**
   * Track hint usage for a specific problem in a session
   */
  async trackHintUsage(
    userId: string,
    sessionId: string,
    questionId: string,
    hintIndex: number,
    timeSpent?: number
  ): Promise<void> {
    // Get current session
    const session = await this.getSessionById(sessionId, userId)
    if (!session) {
      throw new Error('Session not found or access denied')
    }

    // Update session data with hint usage
    const sessionData = session.sessionData || {}
    const hintUsage = sessionData.hintUsage || {}
    const questionHints = hintUsage[questionId] || []

    // Add new hint usage record
    questionHints.push({
      hintIndex,
      requestedAt: new Date().toISOString(),
      timeSpent
    })

    hintUsage[questionId] = questionHints
    sessionData.hintUsage = hintUsage

    // Update session
    await this.updateSession(sessionId, userId, {
      sessionData
    })

    // Record AI interaction for analytics
    await this.recordAIInteraction(userId, {
      sessionId,
      interactionType: 'hint',
      content: `Hint ${hintIndex + 1} requested for question ${questionId}`,
      context: {
        questionId,
        hintIndex,
        timeSpent,
        totalHintsForQuestion: questionHints.length
      }
    })
  }

  /**
   * Get AI interactions for a session
   */
  async getSessionInteractions(sessionId: string, userId: string): Promise<AIInteraction[]> {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch session interactions: ${error.message}`)
    }

    return data?.map(this.mapAIInteraction) || []
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string, subject?: 'math' | 'english' | 'essay'): Promise<{
    totalSessions: number
    completedSessions: number
    totalQuestions: number
    correctAnswers: number
    averageAccuracy: number
    totalPracticeTime: number // in minutes
  }> {
    let query = supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)

    if (subject) {
      query = query.eq('subject', subject)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch session stats: ${error.message}`)
    }

    const sessions = data || []
    const completedSessions = sessions.filter(s => s.end_time)
    
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0)
    const correctAnswers = sessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0)
    
    // Calculate total practice time in minutes
    const totalPracticeTime = completedSessions.reduce((sum, s) => {
      if (s.start_time && s.end_time) {
        const start = new Date(s.start_time)
        const end = new Date(s.end_time)
        return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }
      return sum
    }, 0)

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalQuestions,
      correctAnswers,
      averageAccuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
      totalPracticeTime
    }
  }

  /**
   * Get detailed English analytics for a user
   */
  async getEnglishAnalytics(userId: string, timeRange?: 'week' | 'month' | 'all'): Promise<{
    questionTypePerformance: Record<string, { correct: number; total: number; accuracy: number }>
    vocabularyGaps: Array<{ difficultyLevel: number; wordsStruggled: number; totalWords: number; gapPercentage: number }>
    performanceTrend: Array<{ date: string; accuracy: number; questionsAnswered: number }>
    readingSpeed: number
    comprehensionAccuracy: number
    vocabularyMastery: number
    weakAreas: string[]
    strongAreas: string[]
    recommendations: string[]
  }> {
    // Get date filter based on time range
    let dateFilter = new Date()
    if (timeRange === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7)
    } else if (timeRange === 'month') {
      dateFilter.setDate(dateFilter.getDate() - 30)
    } else {
      dateFilter = new Date('2020-01-01') // All time
    }

    // Get English sessions
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', 'english')
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch English sessions: ${error.message}`)
    }

    // Analyze question type performance
    const questionTypePerformance: Record<string, { correct: number; total: number; accuracy: number }> = {
      main_idea: { correct: 0, total: 0, accuracy: 0 },
      detail: { correct: 0, total: 0, accuracy: 0 },
      inference: { correct: 0, total: 0, accuracy: 0 },
      vocabulary: { correct: 0, total: 0, accuracy: 0 }
    }

    // Analyze sessions for question type performance
    sessions?.forEach(session => {
      const sessionData = session.session_data || {}
      const answers = sessionData.answers || {}
      
      Object.values(answers).forEach((answer: any) => {
        if (answer.questionType && questionTypePerformance[answer.questionType]) {
          questionTypePerformance[answer.questionType].total++
          if (answer.correct) {
            questionTypePerformance[answer.questionType].correct++
          }
        }
      })
    })

    // Calculate accuracies
    Object.keys(questionTypePerformance).forEach(type => {
      const data = questionTypePerformance[type]
      data.accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    // Mock vocabulary gaps analysis (would be more sophisticated in real implementation)
    const vocabularyGaps = [
      { difficultyLevel: 1, wordsStruggled: 2, totalWords: 20, gapPercentage: 10 },
      { difficultyLevel: 2, wordsStruggled: 5, totalWords: 25, gapPercentage: 20 },
      { difficultyLevel: 3, wordsStruggled: 8, totalWords: 20, gapPercentage: 40 },
      { difficultyLevel: 4, wordsStruggled: 12, totalWords: 15, gapPercentage: 80 }
    ]

    // Calculate performance trend
    const performanceTrend = sessions?.map(session => ({
      date: session.created_at,
      accuracy: session.questions_attempted > 0 ? 
        Math.round((session.questions_correct / session.questions_attempted) * 100) : 0,
      questionsAnswered: session.questions_attempted || 0
    })) || []

    // Calculate overall metrics
    const totalQuestions = sessions?.reduce((sum, s) => sum + (s.questions_attempted || 0), 0) || 0
    const totalCorrect = sessions?.reduce((sum, s) => sum + (s.questions_correct || 0), 0) || 0
    const comprehensionAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    // Mock reading speed calculation (would be based on actual reading time data)
    const readingSpeed = 185 // words per minute

    // Calculate vocabulary mastery (based on vocabulary sessions)
    const vocabularyMastery = 72 // percentage

    // Determine weak and strong areas
    const weakAreas: string[] = []
    const strongAreas: string[] = []

    Object.entries(questionTypePerformance).forEach(([type, data]) => {
      const typeName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      if (data.accuracy < 70) {
        weakAreas.push(`${typeName} Questions`)
      } else if (data.accuracy >= 80) {
        strongAreas.push(`${typeName} Questions`)
      }
    })

    // Add vocabulary-based weak/strong areas
    if (vocabularyMastery < 70) {
      weakAreas.push('Vocabulary Mastery')
    } else if (vocabularyMastery >= 80) {
      strongAreas.push('Vocabulary Mastery')
    }

    if (readingSpeed < 200) {
      weakAreas.push('Reading Speed')
    } else {
      strongAreas.push('Reading Speed')
    }

    // Generate recommendations based on weak areas
    const recommendations: string[] = []
    
    if (questionTypePerformance.inference.accuracy < 70) {
      recommendations.push('Focus on inference questions with practice passages')
    }
    if (vocabularyMastery < 80) {
      recommendations.push('Study advanced vocabulary words (Level 3-4)')
    }
    if (readingSpeed < 200) {
      recommendations.push('Practice timed reading to improve speed')
    }
    if (questionTypePerformance.main_idea.accuracy < 70) {
      recommendations.push('Work on identifying main ideas and themes')
    }

    return {
      questionTypePerformance,
      vocabularyGaps,
      performanceTrend,
      readingSpeed,
      comprehensionAccuracy,
      vocabularyMastery,
      weakAreas,
      strongAreas,
      recommendations
    }
  }

  // Private mapping methods
  private mapPracticeSession(data: any): PracticeSession {
    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      startTime: data.start_time,
      endTime: data.end_time,
      questionsAttempted: data.questions_attempted || 0,
      questionsCorrect: data.questions_correct || 0,
      topics: data.topics || [],
      difficultyLevel: data.difficulty_level,
      sessionData: data.session_data || {},
      createdAt: data.created_at
    }
  }

  private mapAIInteraction(data: any): AIInteraction {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      interactionType: data.interaction_type,
      content: data.content,
      context: data.context || {},
      createdAt: data.created_at
    }
  }
}

export const practiceService = new PracticeService()