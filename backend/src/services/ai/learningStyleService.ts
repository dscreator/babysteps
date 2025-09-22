import { supabase } from '../../config/supabase'
import { PracticeSession, AIInteraction } from '../../types/practice'

export interface LearningStyleAnalysis {
  userId: string
  primaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing'
  secondaryStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing'
  confidence: number // 0-1, how confident we are in this assessment
  indicators: {
    visual: number
    auditory: number
    kinesthetic: number
    readingWriting: number
  }
  preferences: {
    explanationType: 'conceptual' | 'procedural' | 'example-based'
    feedbackStyle: 'immediate' | 'detailed' | 'encouraging'
    problemPresentation: 'text' | 'visual' | 'interactive'
    hintProgression: 'gradual' | 'direct' | 'discovery'
  }
  adaptationRecommendations: string[]
  lastAnalyzed: string
}

export interface InteractionPattern {
  hintRequestFrequency: number
  explanationRequestFrequency: number
  averageTimePerProblem: number
  errorRecoveryPattern: 'quick-retry' | 'seek-help' | 'give-up'
  sessionDurationPreference: 'short' | 'medium' | 'long'
  difficultyProgression: 'gradual' | 'aggressive' | 'plateau'
}

class LearningStyleService {
  /**
   * Analyzes user's learning style based on interaction patterns and behavior
   */
  async analyzeLearningStyle(userId: string): Promise<LearningStyleAnalysis> {
    const [sessions, interactions, userPrefs] = await Promise.all([
      this.getRecentSessions(userId, 50),
      this.getRecentInteractions(userId, 200),
      this.getUserPreferences(userId)
    ])

    // Analyze interaction patterns
    const patterns = this.analyzeInteractionPatterns(sessions, interactions)
    
    // Calculate learning style indicators
    const indicators = this.calculateStyleIndicators(sessions, interactions, patterns)
    
    // Determine primary and secondary styles
    const { primaryStyle, secondaryStyle, confidence } = this.determineStyles(indicators)
    
    // Analyze preferences
    const preferences = this.analyzePreferences(interactions, patterns, userPrefs)
    
    // Generate adaptation recommendations
    const adaptationRecommendations = this.generateAdaptationRecommendations(
      primaryStyle, 
      secondaryStyle, 
      preferences, 
      patterns
    )

    return {
      userId,
      primaryStyle,
      secondaryStyle,
      confidence,
      indicators,
      preferences,
      adaptationRecommendations,
      lastAnalyzed: new Date().toISOString()
    }
  }

  /**
   * Provides personalized content adaptation based on learning style
   */
  async adaptContentForUser(
    userId: string, 
    contentType: 'problem' | 'explanation' | 'hint' | 'feedback',
    baseContent: any
  ): Promise<any> {
    const learningStyle = await this.analyzeLearningStyle(userId)
    
    switch (contentType) {
      case 'problem':
        return this.adaptProblemPresentation(baseContent, learningStyle)
      case 'explanation':
        return this.adaptExplanationStyle(baseContent, learningStyle)
      case 'hint':
        return this.adaptHintStyle(baseContent, learningStyle)
      case 'feedback':
        return this.adaptFeedbackStyle(baseContent, learningStyle)
      default:
        return baseContent
    }
  }

  /**
   * Updates learning style analysis based on new interaction data
   */
  async updateLearningStyleFromInteraction(
    userId: string, 
    interactionType: string, 
    context: any,
    effectiveness?: number
  ): Promise<void> {
    // Store interaction for future analysis
    await this.recordStyleInteraction(userId, interactionType, context, effectiveness)
    
    // Trigger re-analysis if enough new data
    const recentInteractions = await this.getRecentInteractions(userId, 10)
    if (recentInteractions.length >= 10) {
      await this.analyzeLearningStyle(userId)
    }
  }

  // Private analysis methods

  private analyzeInteractionPatterns(
    sessions: PracticeSession[], 
    interactions: AIInteraction[]
  ): InteractionPattern {
    const totalSessions = sessions.length
    const totalInteractions = interactions.length

    // Calculate frequencies
    const hintRequests = interactions.filter(i => i.interactionType === 'hint').length
    const explanationRequests = interactions.filter(i => i.interactionType === 'explanation').length

    const hintRequestFrequency = totalSessions > 0 ? hintRequests / totalSessions : 0
    const explanationRequestFrequency = totalSessions > 0 ? explanationRequests / totalSessions : 0

    // Calculate average time per problem
    const completedSessions = sessions.filter(s => s.endTime && s.questionsAttempted > 0)
    const averageTimePerProblem = completedSessions.length > 0 ? 
      completedSessions.reduce((sum, session) => {
        const duration = (new Date(session.endTime!).getTime() - new Date(session.startTime).getTime()) / 1000 / 60
        return sum + (duration / session.questionsAttempted)
      }, 0) / completedSessions.length : 0

    // Analyze error recovery patterns
    const errorRecoveryPattern = this.analyzeErrorRecovery(interactions)

    // Analyze session duration preferences
    const sessionDurationPreference = this.analyzeSessionDurations(sessions)

    // Analyze difficulty progression
    const difficultyProgression = this.analyzeDifficultyProgression(sessions)

    return {
      hintRequestFrequency,
      explanationRequestFrequency,
      averageTimePerProblem,
      errorRecoveryPattern,
      sessionDurationPreference,
      difficultyProgression
    }
  }

  private calculateStyleIndicators(
    sessions: PracticeSession[], 
    interactions: AIInteraction[], 
    patterns: InteractionPattern
  ): LearningStyleAnalysis['indicators'] {
    let visual = 0
    let auditory = 0
    let kinesthetic = 0
    let readingWriting = 0

    // Visual learning indicators
    if (patterns.explanationRequestFrequency > 0.3) visual += 0.3 // Prefers detailed explanations
    if (patterns.averageTimePerProblem > 3) visual += 0.2 // Takes time to process visually
    
    // Check for visual content requests in interactions
    const visualRequests = interactions.filter(i => 
      i.context?.requestType === 'diagram' || 
      i.context?.helpType === 'visual' ||
      i.content.toLowerCase().includes('diagram') ||
      i.content.toLowerCase().includes('picture')
    ).length
    visual += Math.min(0.4, visualRequests / interactions.length * 2)

    // Auditory learning indicators (harder to detect in text-based system)
    if (patterns.hintRequestFrequency > 0.4) auditory += 0.2 // Prefers verbal guidance
    
    // Check for requests for verbal explanations
    const verbalRequests = interactions.filter(i => 
      i.content.toLowerCase().includes('explain') ||
      i.content.toLowerCase().includes('tell me') ||
      i.interactionType === 'explanation'
    ).length
    auditory += Math.min(0.3, verbalRequests / interactions.length * 1.5)

    // Kinesthetic learning indicators
    if (patterns.errorRecoveryPattern === 'quick-retry') kinesthetic += 0.3 // Trial and error approach
    if (patterns.sessionDurationPreference === 'short') kinesthetic += 0.2 // Prefers active, short bursts
    
    // Check for hands-on approach indicators
    const trialErrorSessions = sessions.filter(s => 
      s.questionsAttempted > s.questionsCorrect * 2 // Many attempts per correct answer
    ).length
    kinesthetic += Math.min(0.3, trialErrorSessions / sessions.length)

    // Reading/Writing learning indicators
    if (patterns.explanationRequestFrequency > 0.5) readingWriting += 0.3 // Prefers written explanations
    if (patterns.averageTimePerProblem > 4) readingWriting += 0.2 // Takes time to read and process
    
    // Check for detailed explanation requests
    const detailedRequests = interactions.filter(i => 
      i.content.length > 100 || // Long, detailed requests
      i.context?.requestType === 'detailed' ||
      i.content.toLowerCase().includes('step by step')
    ).length
    readingWriting += Math.min(0.4, detailedRequests / interactions.length * 2)

    // Normalize scores
    const total = visual + auditory + kinesthetic + readingWriting
    if (total > 0) {
      visual /= total
      auditory /= total
      kinesthetic /= total
      readingWriting /= total
    }

    return { visual, auditory, kinesthetic, readingWriting }
  }

  private determineStyles(indicators: LearningStyleAnalysis['indicators']): {
    primaryStyle: LearningStyleAnalysis['primaryStyle']
    secondaryStyle?: LearningStyleAnalysis['secondaryStyle']
    confidence: number
  } {
    const styles = [
      { name: 'visual' as const, score: indicators.visual },
      { name: 'auditory' as const, score: indicators.auditory },
      { name: 'kinesthetic' as const, score: indicators.kinesthetic },
      { name: 'reading-writing' as const, score: indicators.readingWriting }
    ].sort((a, b) => b.score - a.score)

    const primaryStyle = styles[0].name
    const secondaryStyle = styles[1].score > 0.25 ? styles[1].name : undefined

    // Calculate confidence based on score separation
    const scoreDifference = styles[0].score - styles[1].score
    const confidence = Math.min(1, scoreDifference * 2 + 0.3)

    return { primaryStyle, secondaryStyle, confidence }
  }

  private analyzePreferences(
    interactions: AIInteraction[], 
    patterns: InteractionPattern,
    userPrefs: any
  ): LearningStyleAnalysis['preferences'] {
    // Analyze explanation type preference
    const conceptualRequests = interactions.filter(i => 
      i.context?.concept || i.content.toLowerCase().includes('why') || i.content.toLowerCase().includes('concept')
    ).length
    
    const proceduralRequests = interactions.filter(i => 
      i.context?.helpType === 'stuck' || i.content.toLowerCase().includes('how') || i.content.toLowerCase().includes('step')
    ).length
    
    const exampleRequests = interactions.filter(i => 
      i.content.toLowerCase().includes('example') || i.content.toLowerCase().includes('similar')
    ).length

    let explanationType: 'conceptual' | 'procedural' | 'example-based' = 'conceptual'
    if (proceduralRequests > conceptualRequests && proceduralRequests > exampleRequests) {
      explanationType = 'procedural'
    } else if (exampleRequests > conceptualRequests && exampleRequests > proceduralRequests) {
      explanationType = 'example-based'
    }

    // Analyze feedback style preference
    const immediateRequests = interactions.filter(i => 
      i.interactionType === 'hint' || i.context?.attemptCount === 1
    ).length
    
    const detailedRequests = interactions.filter(i => 
      i.interactionType === 'explanation' || i.content.length > 50
    ).length

    let feedbackStyle: 'immediate' | 'detailed' | 'encouraging' = 'immediate'
    if (detailedRequests > immediateRequests * 1.5) {
      feedbackStyle = 'detailed'
    } else if (patterns.errorRecoveryPattern === 'give-up') {
      feedbackStyle = 'encouraging'
    }

    // Analyze problem presentation preference
    let problemPresentation: 'text' | 'visual' | 'interactive' = 'text'
    const visualRequests = interactions.filter(i => 
      i.content.toLowerCase().includes('diagram') || i.content.toLowerCase().includes('visual')
    ).length
    
    if (visualRequests > interactions.length * 0.2) {
      problemPresentation = 'visual'
    } else if (patterns.errorRecoveryPattern === 'quick-retry') {
      problemPresentation = 'interactive'
    }

    // Analyze hint progression preference
    let hintProgression: 'gradual' | 'direct' | 'discovery' = 'gradual'
    if (patterns.hintRequestFrequency > 0.5) {
      hintProgression = 'direct'
    } else if (patterns.errorRecoveryPattern === 'quick-retry') {
      hintProgression = 'discovery'
    }

    return {
      explanationType,
      feedbackStyle,
      problemPresentation,
      hintProgression
    }
  }

  private generateAdaptationRecommendations(
    primaryStyle: LearningStyleAnalysis['primaryStyle'],
    secondaryStyle: LearningStyleAnalysis['secondaryStyle'],
    preferences: LearningStyleAnalysis['preferences'],
    patterns: InteractionPattern
  ): string[] {
    const recommendations: string[] = []

    // Primary style recommendations
    switch (primaryStyle) {
      case 'visual':
        recommendations.push('Include diagrams and visual representations in explanations')
        recommendations.push('Use color coding and highlighting for key concepts')
        recommendations.push('Provide step-by-step visual breakdowns of solutions')
        break
      
      case 'auditory':
        recommendations.push('Use conversational tone in explanations')
        recommendations.push('Provide verbal reasoning and thought processes')
        recommendations.push('Include mnemonic devices and verbal patterns')
        break
      
      case 'kinesthetic':
        recommendations.push('Encourage trial-and-error exploration')
        recommendations.push('Provide interactive problem-solving opportunities')
        recommendations.push('Break learning into short, active sessions')
        break
      
      case 'reading-writing':
        recommendations.push('Provide detailed written explanations')
        recommendations.push('Encourage note-taking and written reflection')
        recommendations.push('Use structured, text-based learning materials')
        break
    }

    // Preference-based recommendations
    if (preferences.feedbackStyle === 'encouraging') {
      recommendations.push('Provide positive reinforcement and motivation')
      recommendations.push('Focus on progress and effort rather than just correctness')
    }

    if (preferences.hintProgression === 'direct') {
      recommendations.push('Provide clear, direct hints when requested')
      recommendations.push('Minimize discovery-based learning approaches')
    }

    // Pattern-based recommendations
    if (patterns.sessionDurationPreference === 'short') {
      recommendations.push('Design bite-sized learning modules')
      recommendations.push('Provide frequent breaks and checkpoints')
    }

    if (patterns.errorRecoveryPattern === 'give-up') {
      recommendations.push('Implement early intervention when struggles are detected')
      recommendations.push('Provide additional scaffolding and support')
    }

    return recommendations.slice(0, 8) // Limit to most important recommendations
  }

  // Content adaptation methods

  private adaptProblemPresentation(problem: any, style: LearningStyleAnalysis): any {
    const adapted = { ...problem }

    switch (style.primaryStyle) {
      case 'visual':
        if (style.preferences.problemPresentation === 'visual') {
          adapted.includeVisuals = true
          adapted.highlightKeyTerms = true
        }
        break
      
      case 'kinesthetic':
        adapted.allowMultipleAttempts = true
        adapted.provideImmediateFeedback = true
        break
      
      case 'reading-writing':
        adapted.includeDetailedContext = true
        adapted.provideWrittenWorkspace = true
        break
    }

    return adapted
  }

  private adaptExplanationStyle(explanation: any, style: LearningStyleAnalysis): any {
    const adapted = { ...explanation }

    switch (style.preferences.explanationType) {
      case 'conceptual':
        adapted.includeConceptualFramework = true
        adapted.connectToUnderlyingPrinciples = true
        break
      
      case 'procedural':
        adapted.includeStepByStep = true
        adapted.focusOnProcess = true
        break
      
      case 'example-based':
        adapted.includeMultipleExamples = true
        adapted.showSimilarProblems = true
        break
    }

    return adapted
  }

  private adaptHintStyle(hint: any, style: LearningStyleAnalysis): any {
    const adapted = { ...hint }

    switch (style.preferences.hintProgression) {
      case 'gradual':
        adapted.progressiveDisclosure = true
        adapted.buildOnPreviousHints = true
        break
      
      case 'direct':
        adapted.provideDirectGuidance = true
        adapted.minimizeAmbiguity = true
        break
      
      case 'discovery':
        adapted.useGuidingQuestions = true
        adapted.encourageExploration = true
        break
    }

    return adapted
  }

  private adaptFeedbackStyle(feedback: any, style: LearningStyleAnalysis): any {
    const adapted = { ...feedback }

    switch (style.preferences.feedbackStyle) {
      case 'immediate':
        adapted.provideQuickResponse = true
        adapted.focusOnCorrection = true
        break
      
      case 'detailed':
        adapted.includeComprehensiveAnalysis = true
        adapted.explainReasoningProcess = true
        break
      
      case 'encouraging':
        adapted.emphasizePositives = true
        adapted.includeMotivationalElements = true
        break
    }

    return adapted
  }

  // Helper methods for pattern analysis

  private analyzeErrorRecovery(interactions: AIInteraction[]): 'quick-retry' | 'seek-help' | 'give-up' {
    const errorInteractions = interactions.filter(i => 
      i.context?.isIncorrect || i.context?.attemptCount > 1
    )

    if (errorInteractions.length === 0) return 'quick-retry'

    const helpSeekingInteractions = errorInteractions.filter(i => 
      i.interactionType === 'hint' || i.interactionType === 'explanation'
    )

    const helpSeekingRatio = helpSeekingInteractions.length / errorInteractions.length

    if (helpSeekingRatio > 0.7) return 'seek-help'
    if (helpSeekingRatio < 0.3) return 'quick-retry'
    return 'give-up' // Moderate help-seeking might indicate giving up tendency
  }

  private analyzeSessionDurations(sessions: PracticeSession[]): 'short' | 'medium' | 'long' {
    const completedSessions = sessions.filter(s => s.endTime)
    if (completedSessions.length === 0) return 'medium'

    const durations = completedSessions.map(s => 
      (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000 / 60
    )

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    if (avgDuration < 15) return 'short'
    if (avgDuration > 35) return 'long'
    return 'medium'
  }

  private analyzeDifficultyProgression(sessions: PracticeSession[]): 'gradual' | 'aggressive' | 'plateau' {
    const sessionsWithDifficulty = sessions.filter(s => s.difficultyLevel).slice(0, 10)
    if (sessionsWithDifficulty.length < 5) return 'gradual'

    const difficulties = sessionsWithDifficulty.map(s => s.difficultyLevel!).reverse() // Chronological order
    
    let increases = 0
    let decreases = 0
    let stable = 0

    for (let i = 1; i < difficulties.length; i++) {
      const diff = difficulties[i] - difficulties[i - 1]
      if (diff > 0.5) increases++
      else if (diff < -0.5) decreases++
      else stable++
    }

    if (increases > decreases * 2) return 'aggressive'
    if (stable > increases + decreases) return 'plateau'
    return 'gradual'
  }

  // Database helper methods

  private async getRecentSessions(userId: string, limit: number): Promise<PracticeSession[]> {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
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

  private async recordStyleInteraction(
    userId: string, 
    interactionType: string, 
    context: any, 
    effectiveness?: number
  ): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'learning_style_data',
          content: JSON.stringify({ interactionType, effectiveness }),
          context: { ...context, timestamp: new Date().toISOString() }
        })
    } catch (error) {
      console.error('Error recording style interaction:', error)
    }
  }
}

export const learningStyleService = new LearningStyleService()