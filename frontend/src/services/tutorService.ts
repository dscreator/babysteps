import { apiService } from './apiService'

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

export interface HintRequest {
  question: string
  subject: 'math' | 'english' | 'essay'
  currentProblemId?: string
  userAnswer?: string
  attemptCount?: number
}

export interface ExplanationRequest {
  concept: string
  subject: 'math' | 'english' | 'essay'
  question?: string
  currentProblemId?: string
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
  // Chat functionality
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiService.post('/tutor/chat', request)
    return response.data
  }

  async getConversations(limit: number = 20): Promise<Conversation[]> {
    const response = await apiService.get(`/tutor/conversations?limit=${limit}`)
    return response.data
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiService.get(`/tutor/conversations/${conversationId}`)
    return response.data
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await apiService.patch(`/tutor/conversations/${conversationId}`, { title })
  }

  async deactivateConversation(conversationId: string): Promise<void> {
    await apiService.delete(`/tutor/conversations/${conversationId}`)
  }

  // Existing tutor functionality
  async getHint(request: HintRequest): Promise<TutorResponse> {
    const response = await apiService.post('/tutor/hint', request)
    return response.data
  }

  async getExplanation(request: ExplanationRequest): Promise<TutorResponse> {
    const response = await apiService.post('/tutor/explain', request)
    return response.data
  }

  async getContextualHelp(
    subject: 'math' | 'english' | 'essay',
    helpType: 'stuck' | 'confused' | 'encouragement',
    currentProblemId?: string
  ): Promise<TutorResponse> {
    const response = await apiService.post('/tutor/help', {
      subject,
      helpType,
      currentProblemId
    })
    return response.data
  }

  async getRecommendations(subject: 'math' | 'english' | 'essay'): Promise<any> {
    const response = await apiService.get(`/tutor/recommendations?subject=${subject}`)
    return response.data
  }

  async getAnalytics(subject: 'math' | 'english' | 'essay'): Promise<any> {
    const response = await apiService.get(`/tutor/analytics?subject=${subject}`)
    return response.data
  }

  async getInsights(subject: 'math' | 'english' | 'essay'): Promise<any> {
    const response = await apiService.get(`/tutor/insights?subject=${subject}`)
    return response.data
  }

  async adjustDifficulty(
    subject: 'math' | 'english' | 'essay',
    currentDifficulty: number
  ): Promise<any> {
    const response = await apiService.post('/tutor/adjust-difficulty', {
      subject,
      currentDifficulty
    })
    return response.data
  }

  async provideFeedback(
    subject: 'math' | 'english' | 'essay',
    feedbackType: 'helpful' | 'not_helpful' | 'too_easy' | 'too_hard',
    context?: Record<string, any>
  ): Promise<void> {
    await apiService.post('/tutor/feedback', {
      subject,
      feedbackType,
      context
    })
  }

  async getContentRecommendations(subject: 'math' | 'english' | 'essay'): Promise<any> {
    const response = await apiService.get(`/tutor/content-recommendations?subject=${subject}`)
    return response.data
  }

  async adaptContent(
    content: Record<string, any>,
    contentType: 'problem' | 'explanation' | 'hint' | 'feedback'
  ): Promise<any> {
    const response = await apiService.post('/tutor/adapt-content', {
      content,
      contentType
    })
    return response.data
  }

  async getStatus(): Promise<{
    aiServiceAvailable: boolean
    features: Record<string, boolean>
  }> {
    const response = await apiService.get('/tutor/status')
    return response.data
  }
}

export const tutorService = new TutorService()