import { adaptiveLearningService, LearningPattern, PersonalizationProfile, DifficultyAdjustment } from './adaptiveLearningService'
import { learningStyleService, LearningStyleAnalysis } from './learningStyleService'
import { supabase } from '../../config/supabase'
import { openaiService } from './openaiService'
import { 
  UserProgress, 
  PracticeSession, 
  AIInteraction,
  MathProblem,
  ReadingQuestion 
} from '../../types/practice'

export interface PersonalizationRecommendation {
  userId: string
  subject: 'math' | 'english' | 'essay'
  recommendations: {
    nextTopics: string[]
    reviewTopics: string[]
    difficultyAdjustment: 'increase' | 'maintain' | 'decrease'
    studyTips: string[]
    contentAdaptations: ContentAdaptation[]
    sessionRecommendations: SessionRecommendation
  }
  confidence: number
  reasoning: string[]
  lastUpdated: string
}

export interface ContentAdaptation {
  type: 'presentation' | 'explanation' | 'hint' | 'feedback'
  adaptations: Record<string, any>
  reasoning: string
}

export interface SessionRecommendation {
  optimalLength: number // minutes
  bestTimeOfDay: string
  breakFrequency: number // minutes between breaks
  practiceTypes: string[]
  motivationalElements: string[]
}

export interface LearningInsight {
  type: 'strength' | 'weakness' | 'pattern' | 'recommendation'
  subject: string
  topic?: string
  description: string
  confidence: number
  actionable: boolean
  suggestedActions?: string[]
}

class PersonalizationEngine {
  /**
   * Generates comprehensive personalized recommendations for a user
   */
  async generatePersonalizedRecommendations(
    userId: string, 
    subject: 'math' | 'english' | 'essay'
  ): Promise<PersonalizationRecommendation> {
    const [learningPattern, learningStyle, profile] = await Promise.all([
      adaptiveLearningService.analyzeUserLearningPatterns(userId, subject),
      learningStyleService.analyzeLearningStyle(userId),
      adaptiveLearningService.createPersonalizationProfile(userId, subject)
    ])

    // Generate content recommendations
    const contentRecommendations = await adaptiveLearningService.generateContentRecommendations(userId, subject)
    
    // Extract topics from recommendations
    const nextTopics = contentRecommendations
      .filter(r => r.practiceType === 'new_learning')
      .flatMap(r => r.topics)
      .slice(0, 3)
    
    const reviewTopics = contentRecommendations
      .filter(r => r.practiceType === 'review')
      .flatMap(r => r.topics)
      .slice(0, 3)

    // Determine difficulty adjustment
    const difficultyAdjustment = await this.determineDifficultyAdjustment(learningPattern, profile)
    
    // Generate personalized study tips
    const studyTips = await this.generatePersonalizedStudyTips(learningPattern, learningStyle, subject)
    
    // Create content adaptations
    const contentAdaptations = this.createContentAdaptations(learningStyle, learningPattern)
    
    // Generate session recommendations
    const sessionRecommendations = this.createSessionRecommendations(learningStyle, learningPattern, profile)
    
    // Calculate confidence and reasoning
    const { confidence, reasoning } = this.calculateRecommendationConfidence(learningPattern, learningStyle)

    return {
      userId,
      subject,
      recommendations: {
        nextTopics,
        reviewTopics,
        difficultyAdjustment,
        studyTips,
        contentAdaptations,
        sessionRecommendations
      },
      confidence,
      reasoning,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Adapts content based on user's learning style and patterns
   */
  async adaptContentForUser(
    userId: string,
    content: MathProblem | ReadingQuestion | any,
    contentType: 'problem' | 'explanation' | 'hint' | 'feedback'
  ): Promise<any> {
    const [learningStyle, learningPattern] = await Promise.all([
      learningStyleService.analyzeLearningStyle(userId),
      adaptiveLearningService.analyzeUserLearningPatterns(userId, content.subject || 'math')
    ])

    let adaptedContent = { ...content }

    // Apply learning style adaptations
    adaptedContent = await learningStyleService.adaptContentForUser(userId, contentType, adaptedContent)

    // Apply pattern-based adaptations
    adaptedContent = this.applyPatternBasedAdaptations(adaptedContent, learningPattern, contentType)

    // Apply AI-powered adaptations for complex content
    if (contentType === 'explanation' || contentType === 'hint') {
      adaptedContent = await this.applyAIAdaptations(adaptedContent, learningStyle, learningPattern)
    }

    return adaptedContent
  }

  /**
   * Generates learning insights based on user data
   */
  async generateLearningInsights(userId: string, subject: 'math' | 'english' | 'essay'): Promise<LearningInsight[]> {
    const [learningPattern, learningStyle, recentSessions] = await Promise.all([
      adaptiveLearningService.analyzeUserLearningPatterns(userId, subject),
      learningStyleService.analyzeLearningStyle(userId),
      this.getRecentSessions(userId, subject, 10)
    ])

    const insights: LearningInsight[] = []

    // Strength insights
    learningPattern.improvingAreas.forEach(area => {
      insights.push({
        type: 'strength',
        subject,
        topic: area,
        description: `Showing consistent improvement in ${area}`,
        confidence: 0.8,
        actionable: true,
        suggestedActions: [
          `Continue practicing ${area} to maintain momentum`,
          `Try more challenging problems in ${area}`
        ]
      })
    })

    // Weakness insights
    learningPattern.strugglingAreas.forEach(area => {
      insights.push({
        type: 'weakness',
        subject,
        topic: area,
        description: `Needs focused attention in ${area}`,
        confidence: 0.9,
        actionable: true,
        suggestedActions: [
          `Schedule dedicated review sessions for ${area}`,
          `Break down ${area} concepts into smaller parts`,
          `Seek additional explanations for ${area}`
        ]
      })
    })

    // Learning pattern insights
    if (learningStyle.confidence > 0.7) {
      insights.push({
        type: 'pattern',
        subject,
        description: `Primary learning style identified as ${learningStyle.primaryStyle}`,
        confidence: learningStyle.confidence,
        actionable: true,
        suggestedActions: learningStyle.adaptationRecommendations.slice(0, 3)
      })
    }

    // Performance trend insights
    if (learningPattern.improvementRate > 0.1) {
      insights.push({
        type: 'pattern',
        subject,
        description: 'Showing positive improvement trend',
        confidence: 0.8,
        actionable: true,
        suggestedActions: [
          'Continue current study approach',
          'Consider increasing difficulty level',
          'Set more challenging goals'
        ]
      })
    } else if (learningPattern.improvementRate < -0.05) {
      insights.push({
        type: 'pattern',
        subject,
        description: 'Performance trend needs attention',
        confidence: 0.7,
        actionable: true,
        suggestedActions: [
          'Review recent study methods',
          'Consider reducing difficulty temporarily',
          'Focus on foundational concepts'
        ]
      })
    }

    // Session pattern insights
    if (recentSessions.length >= 5) {
      const avgAccuracy = recentSessions.reduce((sum, s) => 
        sum + (s.questionsCorrect / s.questionsAttempted), 0
      ) / recentSessions.length

      if (avgAccuracy > 0.85) {
        insights.push({
          type: 'recommendation',
          subject,
          description: 'Ready for more challenging content',
          confidence: 0.8,
          actionable: true,
          suggestedActions: [
            'Increase difficulty level',
            'Try advanced problem types',
            'Focus on speed improvement'
          ]
        })
      } else if (avgAccuracy < 0.6) {
        insights.push({
          type: 'recommendation',
          subject,
          description: 'Consider focusing on fundamentals',
          confidence: 0.9,
          actionable: true,
          suggestedActions: [
            'Review basic concepts',
            'Reduce difficulty level',
            'Increase practice frequency'
          ]
        })
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 8)
  }

  /**
   * Updates personalization based on user feedback and performance
   */
  async updatePersonalizationFromFeedback(
    userId: string,
    subject: 'math' | 'english' | 'essay',
    feedbackType: 'helpful' | 'not_helpful' | 'too_easy' | 'too_hard',
    context: any
  ): Promise<void> {
    // Record the feedback
    await this.recordPersonalizationFeedback(userId, subject, feedbackType, context)

    // Update learning style analysis
    await learningStyleService.updateLearningStyleFromInteraction(
      userId,
      feedbackType,
      context,
      feedbackType === 'helpful' ? 1 : 0
    )

    // Trigger re-analysis if significant feedback received
    const recentFeedback = await this.getRecentFeedback(userId, 10)
    if (recentFeedback.length >= 5) {
      await this.generatePersonalizedRecommendations(userId, subject)
    }
  }

  // Private helper methods

  private async determineDifficultyAdjustment(
    learningPattern: LearningPattern, 
    profile: PersonalizationProfile
  ): Promise<'increase' | 'maintain' | 'decrease'> {
    const difficultyAdjustment = await adaptiveLearningService.adjustDifficulty(
      profile.userId, 
      profile.subject, 
      learningPattern.recommendedDifficulty
    )

    if (difficultyAdjustment.recommendedDifficulty > difficultyAdjustment.currentDifficulty) {
      return 'increase'
    } else if (difficultyAdjustment.recommendedDifficulty < difficultyAdjustment.currentDifficulty) {
      return 'decrease'
    }
    return 'maintain'
  }

  private async generatePersonalizedStudyTips(
    learningPattern: LearningPattern,
    learningStyle: LearningStyleAnalysis,
    subject: string
  ): Promise<string[]> {
    const tips: string[] = []

    // Tips based on learning style
    switch (learningStyle.primaryStyle) {
      case 'visual':
        tips.push('Create visual diagrams and charts to organize information')
        tips.push('Use color coding to highlight important concepts')
        tips.push('Draw pictures or diagrams to solve problems')
        break
      
      case 'auditory':
        tips.push('Read problems and explanations aloud')
        tips.push('Discuss concepts with others or explain them to yourself')
        tips.push('Use mnemonic devices and verbal patterns')
        break
      
      case 'kinesthetic':
        tips.push('Take breaks every 15-20 minutes to stay focused')
        tips.push('Use hands-on activities and manipulatives when possible')
        tips.push('Practice problems multiple times to build muscle memory')
        break
      
      case 'reading-writing':
        tips.push('Take detailed notes while studying')
        tips.push('Write out step-by-step solutions')
        tips.push('Create written summaries of key concepts')
        break
    }

    // Tips based on learning patterns
    if (learningPattern.attentionSpan === 'short') {
      tips.push('Break study sessions into 10-15 minute focused blocks')
      tips.push('Use a timer to maintain focus during practice')
    } else if (learningPattern.attentionSpan === 'long') {
      tips.push('Take advantage of your focus by tackling complex problems')
      tips.push('Plan longer study sessions when you have time')
    }

    // Tips based on error patterns
    if (learningPattern.errorPatterns.includes('high_confusion_rate')) {
      tips.push('Ask for help or explanations when you feel confused')
      tips.push('Review basic concepts before attempting new problems')
    }

    // Subject-specific tips
    switch (subject) {
      case 'math':
        tips.push('Always check your work by substituting answers back')
        tips.push('Practice mental math to improve calculation speed')
        if (learningPattern.strugglingAreas.includes('word_problems')) {
          tips.push('Identify key information and translate word problems step by step')
        }
        break
      
      case 'english':
        tips.push('Read actively by asking questions about the text')
        tips.push('Build vocabulary by learning word roots and prefixes')
        if (learningPattern.strugglingAreas.includes('reading_comprehension')) {
          tips.push('Practice summarizing paragraphs in your own words')
        }
        break
      
      case 'essay':
        tips.push('Create an outline before writing to organize your thoughts')
        tips.push('Read your essays aloud to catch errors and improve flow')
        if (learningPattern.strugglingAreas.includes('organization')) {
          tips.push('Use transition words to connect your ideas clearly')
        }
        break
    }

    return tips.slice(0, 6) // Return top 6 most relevant tips
  }

  private createContentAdaptations(
    learningStyle: LearningStyleAnalysis,
    learningPattern: LearningPattern
  ): ContentAdaptation[] {
    const adaptations: ContentAdaptation[] = []

    // Presentation adaptations
    const presentationAdaptations: Record<string, any> = {}
    
    if (learningStyle.primaryStyle === 'visual') {
      presentationAdaptations.includeVisuals = true
      presentationAdaptations.highlightKeyTerms = true
      presentationAdaptations.useColorCoding = true
    }
    
    if (learningStyle.preferences.problemPresentation === 'interactive') {
      presentationAdaptations.enableInteractiveElements = true
      presentationAdaptations.allowMultipleAttempts = true
    }

    adaptations.push({
      type: 'presentation',
      adaptations: presentationAdaptations,
      reasoning: `Adapted for ${learningStyle.primaryStyle} learning style`
    })

    // Explanation adaptations
    const explanationAdaptations: Record<string, any> = {}
    
    switch (learningStyle.preferences.explanationType) {
      case 'conceptual':
        explanationAdaptations.includeConceptualFramework = true
        explanationAdaptations.connectToUnderlyingPrinciples = true
        break
      case 'procedural':
        explanationAdaptations.includeStepByStep = true
        explanationAdaptations.focusOnProcess = true
        break
      case 'example-based':
        explanationAdaptations.includeMultipleExamples = true
        explanationAdaptations.showSimilarProblems = true
        break
    }

    adaptations.push({
      type: 'explanation',
      adaptations: explanationAdaptations,
      reasoning: `Adapted for ${learningStyle.preferences.explanationType} explanation preference`
    })

    // Hint adaptations
    const hintAdaptations: Record<string, any> = {}
    
    switch (learningStyle.preferences.hintProgression) {
      case 'gradual':
        hintAdaptations.progressiveDisclosure = true
        hintAdaptations.buildOnPreviousHints = true
        break
      case 'direct':
        hintAdaptations.provideDirectGuidance = true
        hintAdaptations.minimizeAmbiguity = true
        break
      case 'discovery':
        hintAdaptations.useGuidingQuestions = true
        hintAdaptations.encourageExploration = true
        break
    }

    adaptations.push({
      type: 'hint',
      adaptations: hintAdaptations,
      reasoning: `Adapted for ${learningStyle.preferences.hintProgression} hint progression`
    })

    // Feedback adaptations
    const feedbackAdaptations: Record<string, any> = {}
    
    switch (learningStyle.preferences.feedbackStyle) {
      case 'immediate':
        feedbackAdaptations.provideQuickResponse = true
        feedbackAdaptations.focusOnCorrection = true
        break
      case 'detailed':
        feedbackAdaptations.includeComprehensiveAnalysis = true
        feedbackAdaptations.explainReasoningProcess = true
        break
      case 'encouraging':
        feedbackAdaptations.emphasizePositives = true
        feedbackAdaptations.includeMotivationalElements = true
        break
    }

    adaptations.push({
      type: 'feedback',
      adaptations: feedbackAdaptations,
      reasoning: `Adapted for ${learningStyle.preferences.feedbackStyle} feedback style`
    })

    return adaptations
  }

  private createSessionRecommendations(
    learningStyle: LearningStyleAnalysis,
    learningPattern: LearningPattern,
    profile: PersonalizationProfile
  ): SessionRecommendation {
    // Determine optimal length
    let optimalLength = profile.optimalSessionLength
    
    // Adjust based on attention span
    if (learningPattern.attentionSpan === 'short') {
      optimalLength = Math.min(optimalLength, 20)
    } else if (learningPattern.attentionSpan === 'long') {
      optimalLength = Math.max(optimalLength, 30)
    }

    // Determine break frequency
    let breakFrequency = 25 // Default pomodoro-style
    if (learningPattern.attentionSpan === 'short') {
      breakFrequency = 15
    } else if (learningPattern.attentionSpan === 'long') {
      breakFrequency = 35
    }

    // Determine practice types
    const practiceTypes = [...profile.preferredPracticeTypes]
    
    // Add types based on learning style
    if (learningStyle.primaryStyle === 'kinesthetic') {
      practiceTypes.push('interactive_practice', 'hands_on_activities')
    } else if (learningStyle.primaryStyle === 'visual') {
      practiceTypes.push('visual_problems', 'diagram_based_practice')
    }

    // Determine motivational elements
    const motivationalElements = [...profile.motivationalFactors]
    
    // Add elements based on patterns
    if (learningPattern.improvementRate > 0) {
      motivationalElements.push('progress_celebration', 'achievement_tracking')
    }
    
    if (learningPattern.strugglingAreas.length > 0) {
      motivationalElements.push('encouragement_messages', 'effort_recognition')
    }

    return {
      optimalLength,
      bestTimeOfDay: profile.bestPracticeTime,
      breakFrequency,
      practiceTypes: [...new Set(practiceTypes)].slice(0, 5),
      motivationalElements: [...new Set(motivationalElements)].slice(0, 4)
    }
  }

  private calculateRecommendationConfidence(
    learningPattern: LearningPattern,
    learningStyle: LearningStyleAnalysis
  ): { confidence: number; reasoning: string[] } {
    const reasoning: string[] = []
    let confidence = 0.5 // Base confidence

    // Increase confidence based on learning style certainty
    if (learningStyle.confidence > 0.7) {
      confidence += 0.2
      reasoning.push(`High confidence in learning style identification (${learningStyle.confidence.toFixed(2)})`)
    } else if (learningStyle.confidence < 0.4) {
      confidence -= 0.1
      reasoning.push(`Lower confidence due to unclear learning style patterns`)
    }

    // Increase confidence based on data availability
    const masteryDataPoints = Object.keys(learningPattern.masteryLevels).length
    if (masteryDataPoints >= 5) {
      confidence += 0.15
      reasoning.push(`Sufficient performance data across ${masteryDataPoints} topics`)
    } else if (masteryDataPoints < 3) {
      confidence -= 0.1
      reasoning.push(`Limited performance data (${masteryDataPoints} topics)`)
    }

    // Adjust based on improvement rate reliability
    if (Math.abs(learningPattern.improvementRate) > 0.1) {
      confidence += 0.1
      reasoning.push(`Clear performance trend identified`)
    }

    // Adjust based on error pattern clarity
    if (learningPattern.errorPatterns.length > 0) {
      confidence += 0.05
      reasoning.push(`Identifiable error patterns provide guidance`)
    }

    return {
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      reasoning
    }
  }

  private applyPatternBasedAdaptations(
    content: any,
    learningPattern: LearningPattern,
    contentType: string
  ): any {
    const adapted = { ...content }

    // Adjust based on attention span
    if (learningPattern.attentionSpan === 'short' && contentType === 'problem') {
      adapted.breakIntoSteps = true
      adapted.provideMidpointChecks = true
    }

    // Adjust based on error patterns
    if (learningPattern.errorPatterns.includes('high_confusion_rate')) {
      adapted.includeExtraGuidance = true
      adapted.provideMoreExamples = true
    }

    // Adjust based on mastery levels
    const relevantMastery = Object.entries(learningPattern.masteryLevels)
      .filter(([topic, _]) => content.topics?.includes(topic) || content.topic === topic)
      .map(([_, mastery]) => mastery)

    if (relevantMastery.length > 0) {
      const avgMastery = relevantMastery.reduce((sum, m) => sum + m, 0) / relevantMastery.length
      
      if (avgMastery < 0.5) {
        adapted.includeBasicReview = true
        adapted.provideExtraScaffolding = true
      } else if (avgMastery > 0.8) {
        adapted.includeExtensionQuestions = true
        adapted.reduceSupportLevel = true
      }
    }

    return adapted
  }

  private async applyAIAdaptations(
    content: any,
    learningStyle: LearningStyleAnalysis,
    learningPattern: LearningPattern
  ): Promise<any> {
    try {
      // Use AI to enhance explanations based on learning style
      if (content.explanation) {
        const adaptationPrompt = `
Adapt this explanation for a student with ${learningStyle.primaryStyle} learning style:
Original explanation: ${content.explanation}

Learning style preferences:
- Explanation type: ${learningStyle.preferences.explanationType}
- Feedback style: ${learningStyle.preferences.feedbackStyle}

Student context:
- Struggling areas: ${learningPattern.strugglingAreas.join(', ')}
- Attention span: ${learningPattern.attentionSpan}

Please provide an adapted explanation that matches their learning preferences.
`

        const adaptedExplanation = await openaiService.generateContextualResponse(
          'You are an expert educational content adapter.',
          adaptationPrompt,
          { maxTokens: 300, temperature: 0.7 }
        )

        content.adaptedExplanation = adaptedExplanation
      }

      return content
    } catch (error) {
      console.error('Error applying AI adaptations:', error)
      return content
    }
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

  private async recordPersonalizationFeedback(
    userId: string,
    subject: string,
    feedbackType: string,
    context: any
  ): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'personalization_feedback',
          content: feedbackType,
          context: {
            subject,
            ...context,
            timestamp: new Date().toISOString()
          }
        })
    } catch (error) {
      console.error('Error recording personalization feedback:', error)
    }
  }

  private async getRecentFeedback(userId: string, limit: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('interaction_type', 'personalization_feedback')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recent feedback:', error)
      return []
    }
  }
}

export const personalizationEngine = new PersonalizationEngine()

// Export types for use in other modules
export type {
  PersonalizationRecommendation,
  ContentAdaptation,
  SessionRecommendation,
  LearningInsight
}