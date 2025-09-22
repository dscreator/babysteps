import { supabase } from '../../config/supabase'
import { openaiService } from './openaiService'
import { contextService } from './contextService'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter for chat interactions
const chatRateLimiter = new RateLimiterMemory({
  keyPrefix: 'chat_interaction',
  points: 10, // 10 messages per user
  duration: 3600, // Per hour
})

// Cost control - track tokens used per user
const tokenUsageTracker = new Map<string, { tokens: number; resetTime: number }>()
const MAX_TOKENS_PER_USER_PER_DAY = 5000
const RESET_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string
  userId: string
  subject: 'math' | 'english' | 'essay' | 'general'
  title?: string
  context?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface ChatRequest {
  conversationId?: string
  message: string
  subject: 'math' | 'english' | 'essay' | 'general'
  context?: Record<string, any>
}

export interface ChatResponse {
  conversationId: string
  message: ChatMessage
  suggestions?: string[]
  relatedTopics?: string[]
  isNewConversation: boolean
}

class ConversationService {
  async checkRateLimit(userId: string): Promise<void> {
    try {
      await chatRateLimiter.consume(userId)
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
      throw new Error(`Too many chat messages. Try again in ${secs} seconds.`)
    }
  }

  async checkTokenUsage(userId: string, estimatedTokens: number): Promise<void> {
    const now = Date.now()
    const userUsage = tokenUsageTracker.get(userId)

    if (!userUsage || now > userUsage.resetTime) {
      // Reset or initialize usage
      tokenUsageTracker.set(userId, {
        tokens: estimatedTokens,
        resetTime: now + RESET_INTERVAL
      })
      return
    }

    if (userUsage.tokens + estimatedTokens > MAX_TOKENS_PER_USER_PER_DAY) {
      throw new Error('Daily AI usage limit reached. Please try again tomorrow.')
    }

    userUsage.tokens += estimatedTokens
  }

  async createConversation(
    userId: string, 
    subject: 'math' | 'english' | 'essay' | 'general',
    title?: string,
    context?: Record<string, any>
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          subject,
          title: title || `${subject.charAt(0).toUpperCase() + subject.slice(1)} Chat`,
          context: context || {},
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        subject: data.subject,
        title: data.title,
        context: data.context,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        messages: []
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw new Error('Failed to create conversation')
    }
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (convError || !conversation) return null

      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      return {
        id: conversation.id,
        userId: conversation.user_id,
        subject: conversation.subject,
        title: conversation.title,
        context: conversation.context,
        isActive: conversation.is_active,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        messages: messages.map(msg => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata
        }))
      }
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  async getUserConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_messages!inner(
            id, role, content, created_at, metadata
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(conv => ({
        id: conv.id,
        userId: conv.user_id,
        subject: conv.subject,
        title: conv.title,
        context: conv.context,
        isActive: conv.is_active,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: conv.chat_messages
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg: any) => ({
            id: msg.id,
            conversationId: conv.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            metadata: msg.metadata
          }))
      }))
    } catch (error) {
      console.error('Error getting user conversations:', error)
      return []
    }
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return {
        id: data.id,
        conversationId: data.conversation_id,
        role: data.role,
        content: data.content,
        timestamp: data.created_at,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Error adding message:', error)
      throw new Error('Failed to add message')
    }
  }

  async processChat(userId: string, request: ChatRequest): Promise<ChatResponse> {
    const { conversationId, message, subject, context } = request

    // Check rate limits and token usage
    await this.checkRateLimit(userId)
    const estimatedTokens = Math.ceil(message.length / 4) + 200 // Rough estimate
    await this.checkTokenUsage(userId, estimatedTokens)

    let conversation: Conversation | null = null
    let isNewConversation = false

    // Get or create conversation
    if (conversationId) {
      conversation = await this.getConversation(conversationId, userId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }
    } else {
      conversation = await this.createConversation(userId, subject, undefined, context)
      isNewConversation = true
    }

    // Add user message
    const userMessage = await this.addMessage(conversation.id, 'user', message)

    // Build context for AI response
    const tutorContext = await contextService.buildTutorContext(userId, subject)
    const conversationHistory = conversation.messages.slice(-10) // Last 10 messages for context

    // Generate AI response
    const aiResponse = await this.generateAIResponse(
      message,
      subject,
      tutorContext,
      conversationHistory,
      context
    )

    // Add AI message
    const assistantMessage = await this.addMessage(
      conversation.id,
      'assistant',
      aiResponse.content,
      {
        suggestions: aiResponse.suggestions,
        relatedTopics: aiResponse.relatedTopics
      }
    )

    // Record interaction for analytics
    await this.recordChatInteraction(userId, conversation.id, message, aiResponse.content, subject)

    return {
      conversationId: conversation.id,
      message: assistantMessage,
      suggestions: aiResponse.suggestions,
      relatedTopics: aiResponse.relatedTopics,
      isNewConversation
    }
  }

  private async generateAIResponse(
    userMessage: string,
    subject: string,
    tutorContext: any,
    conversationHistory: ChatMessage[],
    additionalContext?: Record<string, any>
  ): Promise<{
    content: string
    suggestions?: string[]
    relatedTopics?: string[]
  }> {
    const userGradeLevel = await this.getUserGradeLevel(tutorContext.userId)
    
    const systemPrompt = this.buildChatSystemPrompt(subject, userGradeLevel)
    
    // Build conversation context
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n' + 
        conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
    }

    // Build performance context
    let performanceContext = ''
    if (tutorContext.userPerformance) {
      const { overallScore, weakAreas, strongAreas } = tutorContext.userPerformance
      performanceContext = `\n\nStudent performance in ${subject}: ${Math.round(overallScore)}%`
      if (strongAreas.length > 0) {
        performanceContext += `\nStrong areas: ${strongAreas.join(', ')}`
      }
      if (weakAreas.length > 0) {
        performanceContext += `\nAreas needing improvement: ${weakAreas.join(', ')}`
      }
    }

    const userPrompt = `Student message: "${userMessage}"
${performanceContext}
${conversationContext}
${additionalContext ? `\nAdditional context: ${JSON.stringify(additionalContext)}` : ''}

Please respond as a helpful AI tutor. Be encouraging, age-appropriate, and focused on helping the student learn and improve their ISEE preparation.`

    try {
      const response = await openaiService.generateContextualResponse(
        systemPrompt,
        userPrompt,
        { maxTokens: 400, temperature: 0.7 }
      )

      // Generate suggestions and related topics
      const suggestions = this.generateChatSuggestions(subject, userMessage)
      const relatedTopics = this.getRelatedTopics(subject, userMessage)

      return {
        content: response,
        suggestions,
        relatedTopics
      }
    } catch (error) {
      console.error('Error generating AI chat response:', error)
      throw new Error('Unable to generate response at this time')
    }
  }

  private buildChatSystemPrompt(subject: string, gradeLevel: number): string {
    const basePrompt = `You are an expert AI tutor helping a ${this.getGradeLevelText(gradeLevel)} student prepare for the ISEE exam through conversational chat.

Your personality should be:
- Encouraging and supportive
- Patient and understanding
- Enthusiastic about learning
- Age-appropriate and relatable
- Focused on building confidence

Your responses should:
- Be conversational and natural
- Use age-appropriate language
- Provide clear explanations when needed
- Ask follow-up questions to check understanding
- Celebrate progress and effort
- Guide students toward solutions rather than giving direct answers
- Connect concepts to real-world examples when helpful`

    const subjectContext = this.getSubjectChatContext(subject)
    
    return `${basePrompt}\n\n${subjectContext}\n\nRemember: You're having a conversation, not just answering questions. Be engaging and help build the student's confidence and understanding.`
  }

  private getSubjectChatContext(subject: string): string {
    switch (subject) {
      case 'math':
        return `You're helping with ISEE mathematics (arithmetic, algebra, geometry, data analysis).
Focus on:
- Problem-solving strategies and mathematical reasoning
- Breaking down complex problems into steps
- Connecting math concepts to everyday situations
- Building number sense and computational fluency`
      
      case 'english':
        return `You're helping with ISEE verbal reasoning (reading comprehension, vocabulary).
Focus on:
- Reading strategies and comprehension techniques
- Vocabulary building through context and word relationships
- Critical thinking about texts and passages
- Building confidence in tackling challenging reading material`
      
      case 'essay':
        return `You're helping with ISEE essay writing (structure, content, expression).
Focus on:
- Organization and planning strategies
- Developing ideas with supporting details
- Clear and effective communication
- Building writing confidence and voice`
      
      case 'general':
        return `You're providing general ISEE test preparation support.
Focus on:
- Study strategies and time management
- Test-taking techniques and confidence building
- Motivation and goal setting
- Connecting different subject areas`
      
      default:
        return 'Focus on building understanding and test-taking confidence.'
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

  private generateChatSuggestions(subject: string, userMessage: string): string[] {
    const suggestions: string[] = []
    const messageLower = userMessage.toLowerCase()

    // General suggestions
    if (messageLower.includes('stuck') || messageLower.includes('confused')) {
      suggestions.push("Can you show me a specific example?")
      suggestions.push("What part is most confusing?")
      suggestions.push("Let's break this down step by step")
    }

    if (messageLower.includes('practice') || messageLower.includes('study')) {
      suggestions.push("What topics would you like to focus on?")
      suggestions.push("How much time do you have to study?")
      suggestions.push("What's your exam date?")
    }

    // Subject-specific suggestions
    switch (subject) {
      case 'math':
        if (messageLower.includes('word problem')) {
          suggestions.push("Let's identify the key information")
          suggestions.push("What operation do we need to use?")
        }
        if (messageLower.includes('geometry')) {
          suggestions.push("Can you draw a diagram?")
          suggestions.push("What formulas might help here?")
        }
        break

      case 'english':
        if (messageLower.includes('reading') || messageLower.includes('passage')) {
          suggestions.push("What's the main idea of this passage?")
          suggestions.push("Are there any unfamiliar words?")
        }
        if (messageLower.includes('vocabulary')) {
          suggestions.push("Let's look at word roots and prefixes")
          suggestions.push("Can you use this word in a sentence?")
        }
        break

      case 'essay':
        if (messageLower.includes('writing') || messageLower.includes('essay')) {
          suggestions.push("What's your main argument or story?")
          suggestions.push("How can we organize your ideas?")
        }
        break
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push("Tell me more about what you're working on")
      suggestions.push("What would you like to practice next?")
      suggestions.push("How can I help you prepare for the ISEE?")
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  private getRelatedTopics(subject: string, userMessage: string): string[] {
    const topicMap: Record<string, string[]> = {
      math: ['algebra', 'geometry', 'fractions', 'percentages', 'word problems', 'data analysis'],
      english: ['reading comprehension', 'vocabulary', 'context clues', 'main idea', 'inference', 'synonyms'],
      essay: ['paragraph structure', 'thesis statement', 'supporting details', 'transitions', 'conclusion', 'brainstorming'],
      general: ['study strategies', 'time management', 'test anxiety', 'goal setting', 'practice planning']
    }

    return topicMap[subject] || []
  }

  private async getUserGradeLevel(userId: string): Promise<number> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('grade_level')
        .eq('id', userId)
        .single()
      
      return user?.grade_level || 7
    } catch (error) {
      console.error('Error fetching user grade level:', error)
      return 7
    }
  }

  private async recordChatInteraction(
    userId: string,
    conversationId: string,
    userMessage: string,
    aiResponse: string,
    subject: string
  ): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'chat',
          content: aiResponse,
          context: {
            conversation_id: conversationId,
            user_message: userMessage,
            subject,
            timestamp: new Date().toISOString()
          }
        })
    } catch (error) {
      console.error('Error recording chat interaction:', error)
      // Don't throw error as this is not critical to the main flow
    }
  }

  async deactivateConversation(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .eq('id', conversationId)
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error deactivating conversation:', error)
      throw new Error('Failed to deactivate conversation')
    }
  }

  async updateConversationTitle(conversationId: string, userId: string, title: string): Promise<void> {
    try {
      await supabase
        .from('chat_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error updating conversation title:', error)
      throw new Error('Failed to update conversation title')
    }
  }

  // Clean up old conversations and messages
  async cleanupOldConversations(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .lt('updated_at', cutoffDate.toISOString())
    } catch (error) {
      console.error('Error cleaning up old conversations:', error)
    }
  }
}

export const conversationService = new ConversationService()