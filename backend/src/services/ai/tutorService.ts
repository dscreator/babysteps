import { openaiService } from './openaiService'
import { supabase } from '../../config/supabase'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { 
  AIInteraction, 
  MathProblem, 
  ReadingQuestion, 
  UserProgress,
  PracticeSession 
} from '../../types/practice'

// Rate limiter for tutor interactions
const tutorRateLimiter = new RateLimiterMemory({
  keyPrefix: 'tutor_interaction',
  points: 20, // 20 interactions per user
  duration: 3600, // Per hour
})

// Cache for explanations to reduce API costs
const explanationCache = new Map<string, { content: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface TutorContext {
  userId: string
  subject: 'math' | 'english' | 'essay'
  currentProblem?: MathProblem | ReadingQuestion
  userPerformance?: UserProgress
  sessionHistory?: PracticeSession[]
  previousInteractions?: AIInteraction[]
}

export interface HintRequest {
  context: TutorContext
  question: string
  userAnswer?: string
  attemptCount?: number
}

export interface ExplanationRequest {
  context: TutorContext
  concept: string
  question?: string
  userAnswer?: string
  isIncorrect?: boolean
}

export interface TutorResponse {
  content: string
  type: 'hint' | 'explanation' | 'encouragement'
  followUpSuggestions?: string[]
  relatedConcepts?: string[]
}

class TutorService {
  async checkRateLimit(userId: string): Promise<void> {
    try {
      await tutorRateLimiter.consume(userId)
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
      throw new Error(`Too many tutor requests. Try again in ${secs} seconds.`)
    }
  }

  async generateHint(request: HintRequest): Promise<TutorResponse> {
    const { context, question, userAnswer, attemptCount = 1 } = request
    
    await this.checkRateLimit(context.userId)

    // Get user's grade level and performance for age-appropriate responses
    const userGradeLevel = await this.getUserGradeLevel(context.userId)
    const performanceContext = await this.buildPerformanceContext(context)

    const systemPrompt = this.buildSystemPrompt('hint', userGradeLevel, context.subject)
    
    const userPrompt = `
Question: ${question}
${userAnswer ? `Student's answer: ${userAnswer}` : ''}
Attempt number: ${attemptCount}
${performanceContext}

Please provide a helpful hint that guides the student toward the correct approach without giving away the answer directly.
${attemptCount > 1 ? 'The student has tried before, so provide a more specific hint.' : 'This is their first attempt, so start with a gentle nudge.'}
`

    try {
      const response = await openaiService.generateContextualResponse(
        systemPrompt,
        userPrompt,
        { maxTokens: 200, temperature: 0.7 }
      )

      // Record the interaction
      await this.recordInteraction(context.userId, 'hint', response, {
        question,
        userAnswer,
        attemptCount,
        subject: context.subject
      })

      return {
        content: response,
        type: 'hint',
        followUpSuggestions: this.generateFollowUpSuggestions(context.subject, attemptCount),
        relatedConcepts: await this.getRelatedConcepts(context.subject, question)
      }
    } catch (error) {
      console.error('Error generating hint:', error)
      throw new Error('Unable to generate hint at this time')
    }
  }

  async generateExplanation(request: ExplanationRequest): Promise<TutorResponse> {
    const { context, concept, question, userAnswer, isIncorrect = false } = request
    
    await this.checkRateLimit(context.userId)

    // Check cache first
    const cacheKey = `${concept}-${context.subject}-${isIncorrect ? 'incorrect' : 'correct'}`
    const cached = explanationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        content: cached.content,
        type: 'explanation',
        relatedConcepts: await this.getRelatedConcepts(context.subject, concept)
      }
    }

    const userGradeLevel = await this.getUserGradeLevel(context.userId)
    const performanceContext = await this.buildPerformanceContext(context)

    const systemPrompt = this.buildSystemPrompt('explanation', userGradeLevel, context.subject)
    
    const userPrompt = `
Concept to explain: ${concept}
${question ? `Related question: ${question}` : ''}
${userAnswer ? `Student's answer: ${userAnswer}` : ''}
${isIncorrect ? 'The student got this wrong and needs clarification.' : 'The student wants to understand this concept better.'}
${performanceContext}

Please provide a clear, step-by-step explanation that helps the student understand the concept.
${isIncorrect ? 'Focus on correcting their misunderstanding and preventing similar mistakes.' : 'Build on their existing knowledge.'}
`

    try {
      const response = await openaiService.generateContextualResponse(
        systemPrompt,
        userPrompt,
        { maxTokens: 400, temperature: 0.5 }
      )

      // Cache the explanation
      explanationCache.set(cacheKey, { content: response, timestamp: Date.now() })

      // Record the interaction
      await this.recordInteraction(context.userId, 'explanation', response, {
        concept,
        question,
        userAnswer,
        isIncorrect,
        subject: context.subject
      })

      return {
        content: response,
        type: 'explanation',
        relatedConcepts: await this.getRelatedConcepts(context.subject, concept)
      }
    } catch (error) {
      console.error('Error generating explanation:', error)
      throw new Error('Unable to generate explanation at this time')
    }
  }

  async generateContextualHelp(context: TutorContext, helpType: 'stuck' | 'confused' | 'encouragement'): Promise<TutorResponse> {
    await this.checkRateLimit(context.userId)

    const userGradeLevel = await this.getUserGradeLevel(context.userId)
    const performanceContext = await this.buildPerformanceContext(context)

    let systemPrompt: string
    let userPrompt: string

    switch (helpType) {
      case 'stuck':
        systemPrompt = this.buildSystemPrompt('help', userGradeLevel, context.subject)
        userPrompt = `
The student is stuck and needs guidance to move forward.
${performanceContext}
Current problem context: ${JSON.stringify(context.currentProblem, null, 2)}

Provide encouraging guidance to help them get unstuck without giving away the answer.
`
        break

      case 'confused':
        systemPrompt = this.buildSystemPrompt('clarification', userGradeLevel, context.subject)
        userPrompt = `
The student is confused about the current concept or problem.
${performanceContext}
Current problem context: ${JSON.stringify(context.currentProblem, null, 2)}

Help clarify the concept and provide a clear path forward.
`
        break

      case 'encouragement':
        systemPrompt = this.buildSystemPrompt('encouragement', userGradeLevel, context.subject)
        userPrompt = `
The student needs encouragement and motivation.
${performanceContext}

Provide positive, motivating feedback that acknowledges their effort and encourages continued learning.
`
        break
    }

    try {
      const response = await openaiService.generateContextualResponse(
        systemPrompt,
        userPrompt,
        { maxTokens: 250, temperature: 0.8 }
      )

      await this.recordInteraction(context.userId, 'feedback', response, {
        helpType,
        subject: context.subject,
        currentProblem: context.currentProblem?.id
      })

      return {
        content: response,
        type: helpType === 'encouragement' ? 'encouragement' : 'explanation',
        followUpSuggestions: this.generateFollowUpSuggestions(context.subject, 1)
      }
    } catch (error) {
      console.error('Error generating contextual help:', error)
      throw new Error('Unable to provide help at this time')
    }
  }

  private buildSystemPrompt(type: string, gradeLevel: number, subject: string): string {
    const basePrompt = `You are an expert AI tutor helping a ${this.getGradeLevelText(gradeLevel)} student prepare for the ISEE exam. 
Your responses should be:
- Age-appropriate and encouraging
- Clear and easy to understand
- Focused on building understanding, not just giving answers
- Supportive of the student's learning journey`

    const subjectContext = this.getSubjectContext(subject)
    
    switch (type) {
      case 'hint':
        return `${basePrompt}
${subjectContext}

When providing hints:
- Guide the student toward the solution without giving it away
- Use leading questions when appropriate
- Break complex problems into smaller steps
- Encourage the student to think through the process`

      case 'explanation':
        return `${basePrompt}
${subjectContext}

When explaining concepts:
- Start with what the student likely already knows
- Use concrete examples and analogies
- Break down complex ideas into simpler parts
- Connect new concepts to previously learned material`

      case 'help':
        return `${basePrompt}
${subjectContext}

When helping stuck students:
- Acknowledge their effort and normalize the struggle
- Suggest a different approach or perspective
- Provide scaffolding to help them move forward
- Encourage persistence and growth mindset`

      case 'clarification':
        return `${basePrompt}
${subjectContext}

When clarifying confusion:
- Identify the likely source of confusion
- Provide clear, simple explanations
- Use examples to illustrate the concept
- Check understanding with follow-up questions`

      case 'encouragement':
        return `${basePrompt}

When providing encouragement:
- Acknowledge their effort and progress
- Remind them that learning takes time and practice
- Highlight their strengths and improvements
- Motivate them to continue practicing`

      default:
        return basePrompt
    }
  }

  private getGradeLevelText(gradeLevel: number): string {
    switch (gradeLevel) {
      case 6: return 'sixth grade'
      case 7: return 'seventh grade'
      case 8: return 'eighth grade'
      default: return 'middle school'
    }
  }

  private getSubjectContext(subject: string): string {
    switch (subject) {
      case 'math':
        return `You're helping with ISEE mathematics, which includes arithmetic, algebra, geometry, and data analysis.
Focus on problem-solving strategies and mathematical reasoning.`
      
      case 'english':
        return `You're helping with ISEE verbal reasoning, including reading comprehension and vocabulary.
Focus on reading strategies, context clues, and word relationships.`
      
      case 'essay':
        return `You're helping with ISEE essay writing, focusing on structure, content, and expression.
Emphasize organization, supporting details, and clear communication.`
      
      default:
        return 'Focus on building understanding and test-taking strategies.'
    }
  }

  private async getUserGradeLevel(userId: string): Promise<number> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('grade_level')
        .eq('id', userId)
        .single()
      
      return user?.grade_level || 7 // Default to 7th grade
    } catch (error) {
      console.error('Error fetching user grade level:', error)
      return 7
    }
  }

  private async buildPerformanceContext(context: TutorContext): Promise<string> {
    if (!context.userPerformance) {
      return ''
    }

    const { overallScore, topicScores, weakAreas, strongAreas } = context.userPerformance
    
    let performanceText = `Student's current performance in ${context.subject}: ${Math.round(overallScore)}%`
    
    if (strongAreas.length > 0) {
      performanceText += `\nStrong areas: ${strongAreas.join(', ')}`
    }
    
    if (weakAreas.length > 0) {
      performanceText += `\nAreas needing improvement: ${weakAreas.join(', ')}`
    }

    return performanceText
  }

  private generateFollowUpSuggestions(subject: string, attemptCount: number): string[] {
    const suggestions: string[] = []

    if (attemptCount > 2) {
      suggestions.push("Take a short break and come back to this problem")
      suggestions.push("Try working through a similar but easier problem first")
    }

    switch (subject) {
      case 'math':
        suggestions.push("Draw a diagram or picture to visualize the problem")
        suggestions.push("Check your work by plugging your answer back into the problem")
        break
      
      case 'english':
        suggestions.push("Re-read the passage and look for key details")
        suggestions.push("Use context clues to understand unfamiliar words")
        break
      
      case 'essay':
        suggestions.push("Create an outline before writing")
        suggestions.push("Read your essay aloud to check for clarity")
        break
    }

    return suggestions
  }

  private async getRelatedConcepts(subject: string, query: string): Promise<string[]> {
    // This could be enhanced with a more sophisticated concept mapping system
    const conceptMap: Record<string, string[]> = {
      math: ['algebra', 'geometry', 'fractions', 'percentages', 'word problems', 'equations'],
      english: ['reading comprehension', 'vocabulary', 'context clues', 'main idea', 'inference'],
      essay: ['paragraph structure', 'thesis statement', 'supporting details', 'transitions', 'conclusion']
    }

    return conceptMap[subject] || []
  }

  private async recordInteraction(
    userId: string, 
    type: 'hint' | 'explanation' | 'feedback', 
    content: string, 
    context: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          interaction_type: type,
          content,
          context,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error recording AI interaction:', error)
      // Don't throw error as this is not critical to the main flow
    }
  }

  // Clean up old cache entries
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of explanationCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        explanationCache.delete(key)
      }
    }
  }

  // Initialize cleanup interval
  constructor() {
    // Clean up cache every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000)
  }
}

export const tutorService = new TutorService()