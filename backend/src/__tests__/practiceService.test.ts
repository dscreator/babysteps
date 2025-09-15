import { describe, it, expect, beforeEach, vi } from 'vitest'
import { practiceService } from '../services/practiceService'
import { contentService } from '../services/content/contentService'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-session-id',
              user_id: 'test-user-id',
              subject: 'math',
              start_time: new Date().toISOString(),
              end_time: null,
              questions_attempted: 0,
              questions_correct: 0,
              topics: [],
              difficulty_level: null,
              session_data: {},
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-session-id',
              user_id: 'test-user-id',
              subject: 'math',
              start_time: new Date().toISOString(),
              end_time: null,
              questions_attempted: 0,
              questions_correct: 0,
              topics: [],
              difficulty_level: null,
              session_data: {},
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-session-id',
                user_id: 'test-user-id',
                subject: 'math',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                questions_attempted: 5,
                questions_correct: 4,
                topics: ['algebra'],
                difficulty_level: 3,
                session_data: {},
                created_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}))

// Mock content service
vi.mock('../services/content/contentService', () => ({
  contentService: {
    getMathProblemById: vi.fn(() => Promise.resolve({
      id: 'test-problem-id',
      topic: 'algebra',
      difficulty: 3,
      question: 'What is 2x + 3 = 7?',
      correctAnswer: 'x = 2',
      explanation: 'Subtract 3 from both sides, then divide by 2',
      hints: ['Start by isolating the variable'],
      gradeLevel: 7,
      createdAt: new Date().toISOString()
    }))
  }
}))

describe('PracticeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a new practice session', async () => {
      const userId = 'test-user-id'
      const request = {
        subject: 'math' as const,
        topics: ['algebra'],
        difficultyLevel: 3
      }

      const session = await practiceService.createSession(userId, request)

      expect(session).toBeDefined()
      expect(session.userId).toBe(userId)
      expect(session.subject).toBe('math')
      expect(session.questionsAttempted).toBe(0)
      expect(session.questionsCorrect).toBe(0)
    })
  })

  describe('submitAnswer', () => {
    it('should submit an answer and return feedback', async () => {
      const userId = 'test-user-id'
      const request = {
        sessionId: 'test-session-id',
        questionId: 'test-problem-id',
        answer: 'x = 2',
        timeSpent: 30
      }

      const result = await practiceService.submitAnswer(userId, request)

      expect(result).toBeDefined()
      expect(result.correct).toBe(true)
      expect(contentService.getMathProblemById).toHaveBeenCalledWith('test-problem-id')
    })

    it('should handle incorrect answers', async () => {
      const userId = 'test-user-id'
      const request = {
        sessionId: 'test-session-id',
        questionId: 'test-problem-id',
        answer: 'x = 5',
        timeSpent: 30
      }

      const result = await practiceService.submitAnswer(userId, request)

      expect(result).toBeDefined()
      expect(result.correct).toBe(false)
      expect(result.explanation).toBeDefined()
      expect(result.correctAnswer).toBe('x = 2')
    })
  })

  describe('endSession', () => {
    it('should end a practice session', async () => {
      const userId = 'test-user-id'
      const sessionId = 'test-session-id'
      const request = {
        questionsAttempted: 5,
        questionsCorrect: 4,
        sessionData: { totalTime: 300 }
      }

      const session = await practiceService.endSession(sessionId, userId, request)

      expect(session).toBeDefined()
      expect(session.questionsAttempted).toBe(5)
      expect(session.questionsCorrect).toBe(4)
      expect(session.endTime).toBeDefined()
    })
  })
})