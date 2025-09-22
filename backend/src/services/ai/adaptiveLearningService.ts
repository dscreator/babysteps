import { supabase } from '../../config/supabase'
import { 
  UserProgress, 
  PracticeSession, 
  AIInteraction,
  ProgressSnapshot 
} from '../../types/practice'

export interface LearningPattern {
  userId: string
  subject: 'math' | 'english' | 'essay'
  learningStyle: 'visual' | 'analytical' | 'trial-and-error' | 'mixed'
  preferredHintType: 'conceptual' | 'procedural' | 'example-based'
  attentionSpan: 'short' | 'medium' | 'long' // Based on session duration patterns
  errorPatterns: string[] // Common mistake types
  masteryLevels: Record<string, number> // Topic -> mastery level (0-1)
  improvementRate: number // Rate of improvement over time
  strugglingAreas: string[]
  improvingAreas: string[]
  recommendedDifficulty: number
  lastAnalyzed: string
}

export interface PersonalizationProfile {
  userId: string
  subject: 'math' | 'english' | 'essay'
  currentLevel: number
  targetLevel: number
  learningGoals: string[]
  preferredPracticeTypes: string[]
  optimalSessionLength: number // in minutes
  bestPracticeTime: string // time of day
  motivationalFactors: string[]
  adaptationHistory: AdaptationRecord[]
}

export interface AdaptationRecord {
  timestamp: string
  adaptationType: 'difficulty' | 'content_type' | 'hint_style' | 'session_length'
  previousValue: any
  newValue: any
  reason: string
  effectiveness?: number // Measured after implementation
}

export interface DifficultyAdjustment {
  currentDifficulty: number
  recommendedDifficulty: number
  adjustmentReason: string
  confidence: number // 0-1, how confident we are in this adjustment
}

export interface ContentRecommendation {
  topics: string[]
  difficultyLevel: number
  practiceType: 'review' | 'new_learning' | 'challenge'
  estimatedTime: number
  priority: 'high' | 'medium' | 'low'
  reasoning: string
}

class AdaptiveLearningService {
  /**
   * Analyzes user performance data to identify learning patterns
   */
  async analyzeUserLearningPatterns(userId: string, subject: 'math' | 'english' | 'essay'): Promise<LearningPattern> {
    const [sessions, interactions, progress, snapshots] = await Promise.all([
      this.getRecentSessions(userId, subject, 30),
      this.getRecentInteractions(userId, 100),
      this.getUserProgress(userId, subject),
      this.getProgressSnapshots(userId, subject, 10)
    ])

    // Analyze learning style based on interaction patterns
    const learningStyle = this.determineLearningStyle(interactions, sessions)
    
    // Analyze preferred hint type
    const preferredHintType = this.analyzeHintPreferences(interactions)
    
    // Determine attention span from session patterns
    const attentionSpan = this.analyzeAttentionSpan(sessions)
    
    // Identify error patterns
    const errorPatterns = this.identifyErrorPatterns(sessions, interactions)
    
    // Calculate mastery levels for each topic
    const masteryLevels = this.calculateMasteryLevels(sessions, progress)
    
    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(snapshots, sessions)
    
    // Identify struggling and improving areas
    const { strugglingAreas, improvingAreas } = this.identifyPerformanceAreas(sessions, progress, snapshots)
    
    // Recommend difficulty level
    const recommendedDifficulty = this.calculateRecommendedDifficulty(sessions, progress, masteryLevels)

    const learningPattern: LearningPattern = {
      userId,
      subject,
      learningStyle,
      preferredHintType,
      attentionSpan,
      errorPatterns,
      masteryLevels,
      improvementRate,
      strugglingAreas,
      improvingAreas,
      recommendedDifficulty,
      lastAnalyzed: new Date().toISOString()
    }

    // Store the learning pattern for future reference
    await this.storeLearningPattern(learningPattern)

    return learningPattern
  }

  /**
   * Creates a personalization profile based on learning patterns and user preferences
   */
  async createPersonalizationProfile(userId: string, subject: 'math' | 'english' | 'essay'): Promise<PersonalizationProfile> {
    const [learningPattern, userPrefs, sessions] = await Promise.all([
      this.analyzeUserLearningPatterns(userId, subject),
      this.getUserPreferences(userId),
      this.getRecentSessions(userId, subject, 20)
    ])

    // Determine current and target levels
    const currentLevel = this.calculateCurrentLevel(learningPattern.masteryLevels)
    const targetLevel = this.calculateTargetLevel(userId, subject)
    
    // Set learning goals based on weak areas and exam timeline
    const learningGoals = this.generateLearningGoals(learningPattern, await targetLevel)
    
    // Determine preferred practice types
    const preferredPracticeTypes = this.determinePracticeTypes(learningPattern, sessions)
    
    // Calculate optimal session length
    const optimalSessionLength = this.calculateOptimalSessionLength(sessions, learningPattern.attentionSpan)
    
    // Determine best practice time
    const bestPracticeTime = this.analyzeBestPracticeTime(sessions)
    
    // Identify motivational factors
    const motivationalFactors = this.identifyMotivationalFactors(userId, sessions)

    return {
      userId,
      subject,
      currentLevel,
      targetLevel: await targetLevel,
      learningGoals,
      preferredPracticeTypes,
      optimalSessionLength,
      bestPracticeTime,
      motivationalFactors,
      adaptationHistory: []
    }
  }

  /**
   * Adjusts difficulty based on recent performance
   */
  async adjustDifficulty(userId: string, subject: 'math' | 'english' | 'essay', currentDifficulty: number): Promise<DifficultyAdjustment> {
    const recentSessions = await this.getRecentSessions(userId, subject, 5)
    
    if (recentSessions.length < 3) {
      return {
        currentDifficulty,
        recommendedDifficulty: currentDifficulty,
        adjustmentReason: 'Insufficient data for adjustment',
        confidence: 0.1
      }
    }

    // Calculate recent performance metrics
    const recentAccuracy = recentSessions.reduce((sum, session) => 
      sum + (session.questionsCorrect / session.questionsAttempted), 0
    ) / recentSessions.length

    const recentSpeed = recentSessions.reduce((sum, session) => {
      const duration = session.endTime ? 
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60 : 30
      return sum + (session.questionsAttempted / duration)
    }, 0) / recentSessions.length

    // Get learning pattern for additional context
    const learningPattern = await this.analyzeUserLearningPatterns(userId, subject)
    
    let recommendedDifficulty = currentDifficulty
    let adjustmentReason = ''
    let confidence = 0.5

    // Difficulty adjustment logic
    if (recentAccuracy >= 0.85 && recentSpeed > 1.5) {
      // High accuracy and good speed - increase difficulty
      recommendedDifficulty = Math.min(10, currentDifficulty + 1)
      adjustmentReason = 'High accuracy and good speed indicate readiness for increased difficulty'
      confidence = 0.8
    } else if (recentAccuracy >= 0.75 && recentSpeed > 1.0) {
      // Good performance - slight increase
      recommendedDifficulty = Math.min(10, currentDifficulty + 0.5)
      adjustmentReason = 'Good performance suggests slight difficulty increase'
      confidence = 0.6
    } else if (recentAccuracy < 0.5 || recentSpeed < 0.5) {
      // Poor performance - decrease difficulty
      recommendedDifficulty = Math.max(1, currentDifficulty - 1)
      adjustmentReason = 'Low accuracy or slow speed indicates need for easier content'
      confidence = 0.9
    } else if (recentAccuracy < 0.65) {
      // Moderate struggle - slight decrease
      recommendedDifficulty = Math.max(1, currentDifficulty - 0.5)
      adjustmentReason = 'Moderate difficulty suggests slight reduction needed'
      confidence = 0.7
    }

    // Consider learning style in adjustment
    if (learningPattern.learningStyle === 'trial-and-error' && recentAccuracy < 0.7) {
      // Trial-and-error learners may need more time at current level
      recommendedDifficulty = Math.max(recommendedDifficulty - 0.5, 1)
      adjustmentReason += ' (adjusted for trial-and-error learning style)'
    }

    return {
      currentDifficulty,
      recommendedDifficulty: Math.round(recommendedDifficulty * 2) / 2, // Round to nearest 0.5
      adjustmentReason,
      confidence
    }
  }

  /**
   * Generates personalized content recommendations
   */
  async generateContentRecommendations(userId: string, subject: 'math' | 'english' | 'essay'): Promise<ContentRecommendation[]> {
    const [learningPattern, profile, progress] = await Promise.all([
      this.analyzeUserLearningPatterns(userId, subject),
      this.createPersonalizationProfile(userId, subject),
      this.getUserProgress(userId, subject)
    ])

    const recommendations: ContentRecommendation[] = []

    // High priority: Address struggling areas
    for (const area of learningPattern.strugglingAreas.slice(0, 2)) {
      recommendations.push({
        topics: [area],
        difficultyLevel: Math.max(1, learningPattern.recommendedDifficulty - 1),
        practiceType: 'review',
        estimatedTime: profile.optimalSessionLength * 0.4,
        priority: 'high',
        reasoning: `Focused review needed for struggling area: ${area}`
      })
    }

    // Medium priority: Reinforce improving areas
    for (const area of learningPattern.improvingAreas.slice(0, 2)) {
      recommendations.push({
        topics: [area],
        difficultyLevel: learningPattern.recommendedDifficulty,
        practiceType: 'new_learning',
        estimatedTime: profile.optimalSessionLength * 0.3,
        priority: 'medium',
        reasoning: `Build on improvement in: ${area}`
      })
    }

    // Low priority: Challenge with strong areas
    const strongAreas = progress?.strongAreas || []
    if (strongAreas.length > 0) {
      recommendations.push({
        topics: strongAreas.slice(0, 2),
        difficultyLevel: Math.min(10, learningPattern.recommendedDifficulty + 1),
        practiceType: 'challenge',
        estimatedTime: profile.optimalSessionLength * 0.3,
        priority: 'low',
        reasoning: 'Challenge practice in strong areas to maintain engagement'
      })
    }

    return recommendations.slice(0, 5) // Return top 5 recommendations
  }

  // Private helper methods

  private determineLearningStyle(interactions: AIInteraction[], sessions: PracticeSession[]): 'visual' | 'analytical' | 'trial-and-error' | 'mixed' {
    const hintRequests = interactions.filter(i => i.interactionType === 'hint').length
    const explanationRequests = interactions.filter(i => i.interactionType === 'explanation').length
    const totalInteractions = interactions.length

    if (totalInteractions < 10) return 'mixed'

    const hintRatio = hintRequests / totalInteractions
    const explanationRatio = explanationRequests / totalInteractions

    if (explanationRatio > 0.6) return 'analytical'
    if (hintRatio > 0.6) return 'trial-and-error'
    
    // Check for visual learning indicators (would need more data)
    return 'mixed'
  }

  private analyzeHintPreferences(interactions: AIInteraction[]): 'conceptual' | 'procedural' | 'example-based' {
    const hintInteractions = interactions.filter(i => i.interactionType === 'hint')
    
    if (hintInteractions.length < 5) return 'conceptual'

    // Analyze context of hint requests to determine preference
    const conceptualHints = hintInteractions.filter(i => 
      i.context?.helpType === 'confused' || i.context?.concept
    ).length
    
    const proceduralHints = hintInteractions.filter(i => 
      i.context?.helpType === 'stuck' || i.context?.attemptCount > 1
    ).length

    if (proceduralHints > conceptualHints * 1.5) return 'procedural'
    if (conceptualHints > proceduralHints * 1.5) return 'conceptual'
    
    return 'example-based'
  }

  private analyzeAttentionSpan(sessions: PracticeSession[]): 'short' | 'medium' | 'long' {
    if (sessions.length < 5) return 'medium'

    const durations = sessions
      .filter(s => s.endTime)
      .map(s => (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60)

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    if (avgDuration < 15) return 'short'
    if (avgDuration > 30) return 'long'
    return 'medium'
  }

  private identifyErrorPatterns(sessions: PracticeSession[], interactions: AIInteraction[]): string[] {
    const patterns: string[] = []
    
    // Analyze session data for common error types
    const lowPerformanceTopics = sessions
      .filter(s => s.questionsAttempted > 0 && (s.questionsCorrect / s.questionsAttempted) < 0.6)
      .flatMap(s => s.topics)

    const topicCounts = lowPerformanceTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Add topics with consistent errors
    Object.entries(topicCounts)
      .filter(([_, count]) => count >= 3)
      .forEach(([topic, _]) => patterns.push(`frequent_errors_${topic}`))

    // Analyze interaction patterns for error types
    const errorInteractions = interactions.filter(i => 
      i.context?.isIncorrect || i.context?.helpType === 'confused'
    )

    if (errorInteractions.length > sessions.length * 2) {
      patterns.push('high_confusion_rate')
    }

    return patterns
  }

  private calculateMasteryLevels(sessions: PracticeSession[], progress?: UserProgress): Record<string, number> {
    const masteryLevels: Record<string, number> = {}

    // Use existing progress data if available
    if (progress?.topicScores) {
      Object.entries(progress.topicScores).forEach(([topic, score]) => {
        masteryLevels[topic] = score / 100 // Convert percentage to 0-1 scale
      })
    }

    // Calculate from recent sessions
    const topicPerformance: Record<string, { correct: number; total: number }> = {}

    sessions.forEach(session => {
      session.topics.forEach(topic => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 }
        }
        topicPerformance[topic].correct += session.questionsCorrect
        topicPerformance[topic].total += session.questionsAttempted
      })
    })

    // Update mastery levels based on recent performance
    Object.entries(topicPerformance).forEach(([topic, perf]) => {
      if (perf.total >= 5) { // Only calculate if sufficient data
        const recentMastery = perf.correct / perf.total
        masteryLevels[topic] = masteryLevels[topic] ? 
          (masteryLevels[topic] * 0.7 + recentMastery * 0.3) : // Weighted average
          recentMastery
      }
    })

    return masteryLevels
  }

  private calculateImprovementRate(snapshots: ProgressSnapshot[], sessions: PracticeSession[]): number {
    if (snapshots.length < 2) {
      // Calculate from sessions if no snapshots
      if (sessions.length < 10) return 0

      const oldSessions = sessions.slice(-10, -5)
      const newSessions = sessions.slice(-5)

      const oldAvg = oldSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / oldSessions.length
      const newAvg = newSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / newSessions.length

      return (newAvg - oldAvg) / oldAvg
    }

    // Calculate from snapshots
    const sortedSnapshots = snapshots.sort((a, b) => 
      new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
    )

    const oldScore = sortedSnapshots[0].performanceData.overallScore || 0
    const newScore = sortedSnapshots[sortedSnapshots.length - 1].performanceData.overallScore || 0

    return oldScore > 0 ? (newScore - oldScore) / oldScore : 0
  }

  private identifyPerformanceAreas(
    sessions: PracticeSession[], 
    progress?: UserProgress, 
    snapshots?: ProgressSnapshot[]
  ): { strugglingAreas: string[]; improvingAreas: string[] } {
    const strugglingAreas: string[] = []
    const improvingAreas: string[] = []

    // Use existing progress data
    if (progress) {
      strugglingAreas.push(...progress.weakAreas)
      strugglingAreas.push(...progress.strongAreas)
    }

    // Analyze recent session trends
    if (sessions.length >= 10) {
      const recentSessions = sessions.slice(0, 5)
      const olderSessions = sessions.slice(5, 10)

      const recentTopicPerf = this.calculateTopicPerformance(recentSessions)
      const olderTopicPerf = this.calculateTopicPerformance(olderSessions)

      Object.keys(recentTopicPerf).forEach(topic => {
        const recentScore = recentTopicPerf[topic]
        const olderScore = olderTopicPerf[topic] || 0

        if (recentScore < 0.6) {
          strugglingAreas.push(topic)
        } else if (recentScore > olderScore + 0.15) {
          improvingAreas.push(topic)
        }
      })
    }

    return {
      strugglingAreas: [...new Set(strugglingAreas)].slice(0, 5),
      improvingAreas: [...new Set(improvingAreas)].slice(0, 5)
    }
  }

  private calculateTopicPerformance(sessions: PracticeSession[]): Record<string, number> {
    const topicPerf: Record<string, { correct: number; total: number }> = {}

    sessions.forEach(session => {
      const sessionAccuracy = session.questionsCorrect / session.questionsAttempted
      session.topics.forEach(topic => {
        if (!topicPerf[topic]) {
          topicPerf[topic] = { correct: 0, total: 0 }
        }
        topicPerf[topic].correct += session.questionsCorrect
        topicPerf[topic].total += session.questionsAttempted
      })
    })

    const result: Record<string, number> = {}
    Object.entries(topicPerf).forEach(([topic, perf]) => {
      result[topic] = perf.total > 0 ? perf.correct / perf.total : 0
    })

    return result
  }

  private calculateRecommendedDifficulty(
    sessions: PracticeSession[], 
    progress?: UserProgress, 
    masteryLevels?: Record<string, number>
  ): number {
    if (sessions.length < 3) return 5 // Default medium difficulty

    const recentSessions = sessions.slice(0, 5)
    const avgAccuracy = recentSessions.reduce((sum, s) => 
      sum + (s.questionsCorrect / s.questionsAttempted), 0
    ) / recentSessions.length

    let baseDifficulty = 5
    if (avgAccuracy >= 0.85) baseDifficulty = 7
    else if (avgAccuracy >= 0.75) baseDifficulty = 6
    else if (avgAccuracy < 0.5) baseDifficulty = 3
    else if (avgAccuracy < 0.65) baseDifficulty = 4

    // Adjust based on overall mastery
    if (masteryLevels) {
      const avgMastery = Object.values(masteryLevels).reduce((sum, m) => sum + m, 0) / Object.values(masteryLevels).length
      if (avgMastery > 0.8) baseDifficulty += 1
      else if (avgMastery < 0.5) baseDifficulty -= 1
    }

    return Math.max(1, Math.min(10, baseDifficulty))
  }

  // Database helper methods
  private async getRecentSessions(userId: string, subject: string, limit: number): Promise<PracticeSession[]> {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(session => ({
        id: session.id,
        userId: session.user_id,
        subject: session.subject,
        startTime: session.start_time,
        endTime: session.end_time,
        questionsAttempted: session.questions_attempted,
        questionsCorrect: session.questions_correct,
        topics: session.topics || [],
        difficultyLevel: session.difficulty_level,
        sessionData: session.session_data || {},
        createdAt: session.created_at
      })) || []
    } catch (error) {
      console.error('Error fetching recent sessions:', error)
      return []
    }
  }

  private async getRecentInteractions(userId: string, limit: number): Promise<AIInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        sessionId: interaction.session_id,
        interactionType: interaction.interaction_type,
        content: interaction.content,
        context: interaction.context || {},
        createdAt: interaction.created_at
      })) || []
    } catch (error) {
      console.error('Error fetching recent interactions:', error)
      return []
    }
  }

  private async getUserProgress(userId: string, subject: string): Promise<UserProgress | undefined> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .single()

      if (error || !data) return undefined

      return {
        id: data.id,
        userId: data.user_id,
        subject: data.subject,
        overallScore: data.overall_score,
        topicScores: data.topic_scores || {},
        streakDays: data.streak_days || 0,
        totalPracticeTime: data.total_practice_time || 0,
        lastPracticeDate: data.last_practice_date,
        weakAreas: data.weak_areas || [],
        strongAreas: data.strong_areas || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error fetching user progress:', error)
      return undefined
    }
  }

  private async getProgressSnapshots(userId: string, subject: string, limit: number): Promise<ProgressSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('progress_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .order('snapshot_date', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(snapshot => ({
        id: snapshot.id,
        userId: snapshot.user_id,
        snapshotDate: snapshot.snapshot_date,
        subject: snapshot.subject,
        performanceData: snapshot.performance_data || {},
        createdAt: snapshot.created_at
      })) || []
    } catch (error) {
      console.error('Error fetching progress snapshots:', error)
      return []
    }
  }

  private async getUserPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data?.preferences || {}
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return {}
    }
  }

  private async storeLearningPattern(pattern: LearningPattern): Promise<void> {
    try {
      // Store in user preferences or create a new table for learning patterns
      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            [`learning_pattern_${pattern.subject}`]: pattern
          }
        })
        .eq('id', pattern.userId)

      if (error) throw error
    } catch (error) {
      console.error('Error storing learning pattern:', error)
    }
  }

  // Additional helper methods for personalization profile
  private calculateCurrentLevel(masteryLevels: Record<string, number>): number {
    const levels = Object.values(masteryLevels)
    if (levels.length === 0) return 1
    
    const avgMastery = levels.reduce((sum, level) => sum + level, 0) / levels.length
    return Math.ceil(avgMastery * 10) // Convert to 1-10 scale
  }

  private async calculateTargetLevel(userId: string, subject: string): Promise<number> {
    // This could be based on exam date, user goals, etc.
    // For now, return a reasonable target based on grade level
    try {
      const { data } = await supabase
        .from('users')
        .select('grade_level, exam_date')
        .eq('id', userId)
        .single()

      const gradeLevel = data?.grade_level || 7
      const examDate = data?.exam_date

      // Calculate target based on grade level and time until exam
      let baseTarget = gradeLevel + 2 // Aim slightly above grade level
      
      if (examDate) {
        const daysUntilExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysUntilExam < 30) baseTarget += 1 // Higher target if exam is soon
      }

      return Math.min(10, baseTarget)
    } catch (error) {
      return 8 // Default target
    }
  }

  private generateLearningGoals(pattern: LearningPattern, targetLevel: number): string[] {
    const goals: string[] = []

    // Goals based on struggling areas
    pattern.strugglingAreas.forEach(area => {
      goals.push(`Improve performance in ${area} to 75% accuracy`)
    })

    // Goals based on target level
    if (pattern.recommendedDifficulty < targetLevel) {
      goals.push(`Progress to difficulty level ${targetLevel}`)
    }

    // Goals based on improvement rate
    if (pattern.improvementRate < 0.1) {
      goals.push('Establish consistent improvement trend')
    }

    return goals.slice(0, 5) // Limit to 5 goals
  }

  private determinePracticeTypes(pattern: LearningPattern, sessions: PracticeSession[]): string[] {
    const types: string[] = []

    // Based on learning style
    switch (pattern.learningStyle) {
      case 'visual':
        types.push('diagram_problems', 'visual_explanations')
        break
      case 'analytical':
        types.push('step_by_step_solutions', 'concept_explanations')
        break
      case 'trial-and-error':
        types.push('practice_drills', 'immediate_feedback')
        break
      default:
        types.push('mixed_practice', 'adaptive_content')
    }

    // Based on attention span
    if (pattern.attentionSpan === 'short') {
      types.push('quick_sessions', 'bite_sized_problems')
    } else if (pattern.attentionSpan === 'long') {
      types.push('comprehensive_sessions', 'complex_problems')
    }

    return types
  }

  private calculateOptimalSessionLength(sessions: PracticeSession[], attentionSpan: string): number {
    if (sessions.length < 5) {
      // Default based on attention span
      switch (attentionSpan) {
        case 'short': return 15
        case 'long': return 45
        default: return 25
      }
    }

    // Calculate from actual session data
    const completedSessions = sessions.filter(s => s.endTime)
    const durations = completedSessions.map(s => 
      (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60
    )

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    
    // Adjust based on performance in different duration ranges
    const shortSessions = completedSessions.filter(s => {
      const duration = (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60
      return duration < 20
    })
    
    const longSessions = completedSessions.filter(s => {
      const duration = (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60
      return duration > 30
    })

    const shortPerf = shortSessions.length > 0 ? 
      shortSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / shortSessions.length : 0
    
    const longPerf = longSessions.length > 0 ? 
      longSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / longSessions.length : 0

    // Prefer duration range with better performance
    if (shortPerf > longPerf + 0.1) {
      return Math.min(20, avgDuration)
    } else if (longPerf > shortPerf + 0.1) {
      return Math.max(30, avgDuration)
    }

    return Math.round(avgDuration)
  }

  private analyzeBestPracticeTime(sessions: PracticeSession[]): string {
    if (sessions.length < 10) return 'afternoon' // Default

    const timePerformance: Record<string, { total: number; correct: number; count: number }> = {
      morning: { total: 0, correct: 0, count: 0 },
      afternoon: { total: 0, correct: 0, count: 0 },
      evening: { total: 0, correct: 0, count: 0 }
    }

    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours()
      let timeOfDay: string
      
      if (hour < 12) timeOfDay = 'morning'
      else if (hour < 18) timeOfDay = 'afternoon'
      else timeOfDay = 'evening'

      timePerformance[timeOfDay].total += session.questionsAttempted
      timePerformance[timeOfDay].correct += session.questionsCorrect
      timePerformance[timeOfDay].count += 1
    })

    // Find time with best performance
    let bestTime = 'afternoon'
    let bestPerformance = 0

    Object.entries(timePerformance).forEach(([time, perf]) => {
      if (perf.count >= 3) { // Need at least 3 sessions
        const performance = perf.correct / perf.total
        if (performance > bestPerformance) {
          bestPerformance = performance
          bestTime = time
        }
      }
    })

    return bestTime
  }

  private identifyMotivationalFactors(userId: string, sessions: PracticeSession[]): string[] {
    const factors: string[] = []

    // Analyze session patterns for motivational insights
    const sessionLengths = sessions
      .filter(s => s.endTime)
      .map(s => (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60)

    const avgLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length

    if (avgLength > 30) {
      factors.push('enjoys_extended_practice')
    } else if (avgLength < 15) {
      factors.push('prefers_quick_sessions')
    }

    // Check for consistency patterns
    const recentDates = sessions.slice(0, 10).map(s => new Date(s.startTime).toDateString())
    const uniqueDates = new Set(recentDates).size

    if (uniqueDates >= 7) {
      factors.push('consistent_daily_practice')
    }

    // Add default motivational factors
    factors.push('progress_tracking', 'achievement_badges', 'exam_preparation')

    return factors
  }
}

export const adaptiveLearningService = new AdaptiveLearningService()