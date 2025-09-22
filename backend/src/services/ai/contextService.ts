import { supabase } from '../../config/supabase'
import { 
  UserProgress, 
  PracticeSession, 
  AIInteraction, 
  MathProblem, 
  ReadingQuestion 
} from '../../types/practice'
import { TutorContext } from './tutorService'

class ContextService {
  async buildTutorContext(
    userId: string, 
    subject: 'math' | 'english' | 'essay',
    currentProblemId?: string
  ): Promise<TutorContext> {
    const [userPerformance, sessionHistory, previousInteractions, currentProblem] = await Promise.all([
      this.getUserPerformance(userId, subject),
      this.getRecentSessions(userId, subject, 5),
      this.getRecentInteractions(userId, 10),
      currentProblemId ? this.getCurrentProblem(currentProblemId, subject) : null
    ])

    return {
      userId,
      subject,
      currentProblem,
      userPerformance,
      sessionHistory,
      previousInteractions
    }
  }

  private async getUserPerformance(userId: string, subject: string): Promise<UserProgress | undefined> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .single()

      if (error || !data) {
        return undefined
      }

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
      console.error('Error fetching user performance:', error)
      return undefined
    }
  }

  private async getRecentSessions(userId: string, subject: string, limit: number): Promise<PracticeSession[]> {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) {
        return []
      }

      return data.map(session => ({
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
      }))
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

      if (error || !data) {
        return []
      }

      return data.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        sessionId: interaction.session_id,
        interactionType: interaction.interaction_type,
        content: interaction.content,
        context: interaction.context || {},
        createdAt: interaction.created_at
      }))
    } catch (error) {
      console.error('Error fetching recent interactions:', error)
      return []
    }
  }

  private async getCurrentProblem(problemId: string, subject: string): Promise<MathProblem | ReadingQuestion | undefined> {
    try {
      if (subject === 'math') {
        const { data, error } = await supabase
          .from('math_problems')
          .select('*')
          .eq('id', problemId)
          .single()

        if (error || !data) return undefined

        return {
          id: data.id,
          topic: data.topic,
          difficulty: data.difficulty,
          question: data.question,
          options: data.options,
          correctAnswer: data.correct_answer,
          explanation: data.explanation,
          hints: data.hints || [],
          gradeLevel: data.grade_level,
          createdAt: data.created_at
        }
      } else if (subject === 'english') {
        const { data, error } = await supabase
          .from('reading_questions')
          .select('*')
          .eq('id', problemId)
          .single()

        if (error || !data) return undefined

        return {
          id: data.id,
          passageId: data.passage_id,
          question: data.question,
          options: data.options,
          correctAnswer: data.correct_answer,
          explanation: data.explanation,
          questionType: data.question_type,
          createdAt: data.created_at
        }
      }

      return undefined
    } catch (error) {
      console.error('Error fetching current problem:', error)
      return null
    }
  }

  async analyzeUserLearningPatterns(userId: string, subject: string): Promise<{
    learningStyle: 'visual' | 'analytical' | 'trial-and-error' | 'mixed'
    preferredHintType: 'conceptual' | 'procedural' | 'example-based'
    strugglingAreas: string[]
    improvingAreas: string[]
    recommendedDifficulty: number
  }> {
    const [sessions, interactions, performance] = await Promise.all([
      this.getRecentSessions(userId, subject, 20),
      this.getRecentInteractions(userId, 50),
      this.getUserPerformance(userId, subject)
    ])

    // Analyze learning patterns
    const hintRequests = interactions.filter(i => i.interactionType === 'hint').length
    const explanationRequests = interactions.filter(i => i.interactionType === 'explanation').length
    const totalInteractions = interactions.length

    // Determine learning style based on interaction patterns
    let learningStyle: 'visual' | 'analytical' | 'trial-and-error' | 'mixed' = 'mixed'
    if (explanationRequests > hintRequests * 2) {
      learningStyle = 'analytical'
    } else if (hintRequests > explanationRequests * 2) {
      learningStyle = 'trial-and-error'
    }

    // Determine preferred hint type
    let preferredHintType: 'conceptual' | 'procedural' | 'example-based' = 'conceptual'
    if (totalInteractions > 10) {
      // Analyze context of interactions to determine preference
      const conceptualHints = interactions.filter(i => 
        i.interactionType === 'hint' && 
        i.context?.helpType === 'confused'
      ).length
      
      const proceduralHints = interactions.filter(i => 
        i.interactionType === 'hint' && 
        i.context?.helpType === 'stuck'
      ).length

      if (proceduralHints > conceptualHints) {
        preferredHintType = 'procedural'
      }
    }

    // Analyze struggling and improving areas
    const strugglingAreas = performance?.weakAreas || []
    const improvingAreas: string[] = []

    // Compare recent performance to identify improving areas
    if (sessions.length >= 5) {
      const recentSessions = sessions.slice(0, 5)
      const olderSessions = sessions.slice(5, 10)
      
      const recentAvg = recentSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / recentSessions.length
      const olderAvg = olderSessions.length > 0 ? 
        olderSessions.reduce((sum, s) => sum + (s.questionsCorrect / s.questionsAttempted), 0) / olderSessions.length : 0

      if (recentAvg > olderAvg + 0.1) { // 10% improvement
        // Identify which topics are improving
        const recentTopics = recentSessions.flatMap(s => s.topics)
        const topicCounts = recentTopics.reduce((acc, topic) => {
          acc[topic] = (acc[topic] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        improvingAreas.push(...Object.keys(topicCounts).slice(0, 3))
      }
    }

    // Recommend difficulty based on recent performance
    let recommendedDifficulty = 5 // Default medium difficulty
    if (performance) {
      if (performance.overallScore >= 80) {
        recommendedDifficulty = Math.min(8, Math.floor(performance.overallScore / 10))
      } else if (performance.overallScore >= 60) {
        recommendedDifficulty = 5
      } else {
        recommendedDifficulty = 3
      }
    }

    return {
      learningStyle,
      preferredHintType,
      strugglingAreas,
      improvingAreas,
      recommendedDifficulty
    }
  }

  async getPersonalizedRecommendations(userId: string, subject: string): Promise<{
    nextTopics: string[]
    reviewTopics: string[]
    difficultyAdjustment: 'increase' | 'maintain' | 'decrease'
    studyTips: string[]
  }> {
    // Use the new personalization engine for comprehensive recommendations
    try {
      const { personalizationEngine } = await import('./personalizationEngine')
      const recommendations = await personalizationEngine.generatePersonalizedRecommendations(userId, subject as 'math' | 'english' | 'essay')
      
      return {
        nextTopics: recommendations.recommendations.nextTopics,
        reviewTopics: recommendations.recommendations.reviewTopics,
        difficultyAdjustment: recommendations.recommendations.difficultyAdjustment,
        studyTips: recommendations.recommendations.studyTips
      }
    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      
      // Fallback to basic recommendations
      const [performance, learningPatterns, sessions] = await Promise.all([
        this.getUserPerformance(userId, subject),
        this.analyzeUserLearningPatterns(userId, subject),
        this.getRecentSessions(userId, subject, 10)
      ])

      const nextTopics: string[] = []
      const reviewTopics: string[] = []
      let difficultyAdjustment: 'increase' | 'maintain' | 'decrease' = 'maintain'
      const studyTips: string[] = []

      if (performance) {
        // Identify topics to review (weak areas)
        reviewTopics.push(...learningPatterns.strugglingAreas.slice(0, 3))

        // Identify next topics to learn
        const allTopics = this.getTopicsForSubject(subject)
        const masteredTopics = Object.keys(performance.topicScores).filter(topic => 
          performance.topicScores[topic] >= 75
        )
        
        nextTopics.push(...allTopics.filter(topic => 
          !masteredTopics.includes(topic) && 
          !learningPatterns.strugglingAreas.includes(topic)
        ).slice(0, 3))

        // Determine difficulty adjustment
        const recentPerformance = sessions.slice(0, 5)
        if (recentPerformance.length >= 3) {
          const avgAccuracy = recentPerformance.reduce((sum, s) => 
            sum + (s.questionsCorrect / s.questionsAttempted), 0
          ) / recentPerformance.length

          if (avgAccuracy >= 0.85) {
            difficultyAdjustment = 'increase'
          } else if (avgAccuracy < 0.6) {
            difficultyAdjustment = 'decrease'
          }
        }

        // Generate personalized study tips
        studyTips.push(...this.generateStudyTips(learningPatterns, performance, subject))
      }

      return {
        nextTopics,
        reviewTopics,
        difficultyAdjustment,
        studyTips
      }
    }
  }

  private getTopicsForSubject(subject: string): string[] {
    const topicMap: Record<string, string[]> = {
      math: [
        'arithmetic', 'fractions', 'decimals', 'percentages', 'ratios', 'proportions',
        'algebra', 'equations', 'inequalities', 'geometry', 'area', 'perimeter',
        'volume', 'coordinate_geometry', 'data_analysis', 'statistics', 'probability'
      ],
      english: [
        'main_idea', 'supporting_details', 'inference', 'vocabulary_in_context',
        'author_purpose', 'text_structure', 'compare_contrast', 'cause_effect',
        'synonyms', 'antonyms', 'analogies', 'sentence_completion'
      ],
      essay: [
        'narrative_writing', 'expository_writing', 'persuasive_writing',
        'paragraph_structure', 'thesis_development', 'supporting_evidence',
        'transitions', 'conclusion_writing', 'grammar', 'vocabulary_usage'
      ]
    }

    return topicMap[subject] || []
  }

  private generateStudyTips(
    learningPatterns: any, 
    performance: UserProgress, 
    subject: string
  ): string[] {
    const tips: string[] = []

    // Tips based on learning style
    switch (learningPatterns.learningStyle) {
      case 'visual':
        tips.push('Try drawing diagrams or charts to visualize problems')
        tips.push('Use color coding to organize your notes')
        break
      case 'analytical':
        tips.push('Break down complex problems into smaller steps')
        tips.push('Focus on understanding the underlying concepts')
        break
      case 'trial-and-error':
        tips.push('Practice with similar problems to build pattern recognition')
        tips.push('Don\'t be afraid to try different approaches')
        break
    }

    // Tips based on performance
    if (performance.overallScore < 60) {
      tips.push('Focus on mastering basic concepts before moving to advanced topics')
      tips.push('Take your time with each problem - accuracy is more important than speed')
    } else if (performance.overallScore >= 80) {
      tips.push('Challenge yourself with harder problems to continue improving')
      tips.push('Help reinforce your learning by explaining concepts to others')
    }

    // Subject-specific tips
    switch (subject) {
      case 'math':
        tips.push('Always check your work by plugging answers back into the original problem')
        tips.push('Practice mental math to improve your calculation speed')
        break
      case 'english':
        tips.push('Read actively by asking questions about the text as you go')
        tips.push('Build vocabulary by learning word roots and prefixes')
        break
      case 'essay':
        tips.push('Create an outline before you start writing')
        tips.push('Read your essays aloud to catch errors and improve flow')
        break
    }

    return tips.slice(0, 4) // Return up to 4 tips
  }
}

export const contextService = new ContextService()