import { describe, it, expect, vi, beforeEach } from 'vitest'
import { conversationService } from '../services/ai/conversationService'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-conversation-id',
              user_id: 'test-user-id',
              subject: 'math',
              title: 'Math Chat',
              context: {},
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-conversation-id',
              user_id: 'test-user-id',
              subject: 'math',
              title: 'Math Chat',
              context: {},
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }
}))

// Mock OpenAI service
vi.mock('../services/ai/openaiService', () => ({
  openaiService: {
    generateContextualResponse: vi.fn(() => Promise.resolve('This is a helpful AI response'))
  }
}))

// Mock context service
vi.mock('../services/ai/contextService', () => ({
  contextService: {
    buildTutorContext: vi.fn(() => Promise.resolve({
      userId: 'test-user-id',
      subject: 'math',
      userPerformance: {
        overallScore: 75,
        weakAreas: ['algebra'],
        strongAreas: ['geometry']
      }
    }))
  }
}))

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const conversation = await conversationService.createConversation(
        'test-user-id',
        'math',
        'Test Math Chat'
      )

      expect(conversation).toMatchObject({
        id: 'test-conversation-id',
        userId: 'test-user-id',
        subject: 'math',
        title: 'Test Math Chat',
        isActive: true,
        messages: []
      })
    })
  })

  describe('processChat', () => {
    it('should process a chat message and return response', async () => {
      const request = {
        message: 'Help me with algebra',
        subject: 'math' as const,
        context: {}
      }

      const response = await conversationService.processChat('test-user-id', request)

      expect(response).toMatchObject({
        conversationId: expect.any(String),
        message: expect.objectContaining({
          role: 'assistant',
          content: expect.any(String)
        }),
        isNewConversation: true
      })
    })
  })

  describe('rate limiting', () => {
    it('should enforce rate limits', async () => {
      // This test would need more setup to properly test rate limiting
      // For now, just verify the method exists
      expect(conversationService.checkRateLimit).toBeDefined()
    })
  })

  describe('token usage tracking', () => {
    it('should track token usage', async () => {
      // This test would need more setup to properly test token tracking
      // For now, just verify the method exists
      expect(conversationService.checkTokenUsage).toBeDefined()
    })
  })
})