import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dependencies before importing
vi.mock('../services/ai/openaiService', () => ({
  openaiService: {
    generateContextualResponse: vi.fn(),
    isAvailable: vi.fn(() => true)
  }
}))

vi.mock('../services/ai/contextService', () => ({
  contextService: {
    buildTutorContext: vi.fn()
  }
}))

vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}))

// Mock rate limiter
vi.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: vi.fn(() => ({
    consume: vi.fn()
  }))
}))

// Import after mocking
import { tutorService } from '../services/ai/tutorService'
import { contextService } from '../services/ai/contextService'
import { openaiService } from '../services/ai/openaiService'

describe('TutorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateHint', () => {
    it('should generate a hint for a math problem', async () => {
      // Mock the context service
      const mockContext = {
        userId: 'user123',
        subject: 'math' as const,
        currentProblem: {
          id: 'problem123',
          topic: 'algebra',
          difficulty: 5,
          question: 'Solve for x: 2x + 5 = 15',
          correctAnswer: '5',
          explanation: 'Subtract 5 from both sides, then divide by 2',
          hints: ['Start by isolating the term with x'],
          gradeLevel: 7,
          createdAt: '2024-01-01'
        }
      }

      vi.mocked(contextService.buildTutorContext).mockResolvedValue(mockContext)
      vi.mocked(openaiService.generateContextualResponse).mockResolvedValue(
        'Try isolating the term with x by moving the constant to the other side of the equation.'
      )

      const hintRequest = {
        context: mockContext,
        question: 'Solve for x: 2x + 5 = 15',
        attemptCount: 1
      }

      const result = await tutorService.generateHint(hintRequest)

      expect(result).toEqual({
        content: 'Try isolating the term with x by moving the constant to the other side of the equation.',
        type: 'hint',
        followUpSuggestions: expect.any(Array),
        relatedConcepts: expect.any(Array)
      })

      expect(openaiService.generateContextualResponse).toHaveBeenCalledWith(
        expect.stringContaining('You are an expert AI tutor'),
        expect.stringContaining('Solve for x: 2x + 5 = 15'),
        { maxTokens: 200, temperature: 0.7 }
      )
    })

    it('should handle rate limiting', async () => {
      const mockContext = {
        userId: 'user123',
        subject: 'math' as const
      }

      // Create a spy that rejects with rate limit error
      const checkRateLimitSpy = vi.spyOn(tutorService, 'checkRateLimit')
      checkRateLimitSpy.mockRejectedValue(new Error('Too many tutor requests. Try again in 30 seconds.'))

      const hintRequest = {
        context: mockContext,
        question: 'Test question',
        attemptCount: 1
      }

      await expect(tutorService.generateHint(hintRequest)).rejects.toThrow(
        'Too many tutor requests. Try again in 30 seconds.'
      )
      
      checkRateLimitSpy.mockRestore()
    })
  })

  describe('generateExplanation', () => {
    it('should generate an explanation for a concept', async () => {
      const mockContext = {
        userId: 'user123',
        subject: 'math' as const
      }

      vi.mocked(openaiService.generateContextualResponse).mockResolvedValue(
        'Linear equations are equations where the variable appears to the first power only. To solve them, you need to isolate the variable on one side of the equation.'
      )

      const explanationRequest = {
        context: mockContext,
        concept: 'linear equations',
        isIncorrect: false
      }

      const result = await tutorService.generateExplanation(explanationRequest)

      expect(result).toEqual({
        content: expect.stringContaining('Linear equations are equations'),
        type: 'explanation',
        relatedConcepts: expect.any(Array)
      })

      expect(openaiService.generateContextualResponse).toHaveBeenCalledWith(
        expect.stringContaining('explanation'),
        expect.stringContaining('linear equations'),
        { maxTokens: 400, temperature: 0.5 }
      )
    })

    it('should provide different explanation for incorrect answers', async () => {
      const mockContext = {
        userId: 'user123',
        subject: 'math' as const
      }

      vi.mocked(openaiService.generateContextualResponse).mockResolvedValue(
        'I see the confusion. When solving linear equations, remember to perform the same operation on both sides.'
      )

      const explanationRequest = {
        context: mockContext,
        concept: 'linear equations',
        userAnswer: 'x = 10',
        isIncorrect: true
      }

      const result = await tutorService.generateExplanation(explanationRequest)

      expect(result.content).toContain('confusion')
      expect(openaiService.generateContextualResponse).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('The student got this wrong'),
        expect.any(Object)
      )
    })
  })

  describe('generateContextualHelp', () => {
    it('should generate help for stuck students', async () => {
      const mockContext = {
        userId: 'user123',
        subject: 'math' as const,
        currentProblem: {
          id: 'problem123',
          topic: 'geometry',
          difficulty: 6,
          question: 'Find the area of a triangle with base 8 and height 6',
          correctAnswer: '24',
          explanation: 'Use the formula: Area = (1/2) × base × height',
          hints: ['Remember the triangle area formula'],
          gradeLevel: 7,
          createdAt: '2024-01-01'
        }
      }

      vi.mocked(openaiService.generateContextualResponse).mockResolvedValue(
        'When you\'re stuck on geometry problems, try to identify what formula you need. For triangles, think about the area formula.'
      )

      const result = await tutorService.generateContextualHelp(mockContext, 'stuck')

      expect(result).toEqual({
        content: expect.stringContaining('stuck on geometry problems'),
        type: 'explanation',
        followUpSuggestions: expect.any(Array)
      })
    })

    it('should generate encouragement when requested', async () => {
      const mockContext = {
        userId: 'user123',
        subject: 'english' as const
      }

      vi.mocked(openaiService.generateContextualResponse).mockResolvedValue(
        'You\'re doing great! Learning takes time and practice. Keep up the good work!'
      )

      const result = await tutorService.generateContextualHelp(mockContext, 'encouragement')

      expect(result.type).toBe('encouragement')
      expect(result.content).toContain('doing great')
    })
  })
})

describe('TutorService Integration', () => {
  it('should handle OpenAI service unavailability gracefully', async () => {
    const mockContext = {
      userId: 'user123',
      subject: 'math' as const
    }

    vi.mocked(openaiService.generateContextualResponse).mockRejectedValue(
      new Error('OpenAI service not configured')
    )

    const hintRequest = {
      context: mockContext,
      question: 'Test question',
      attemptCount: 1
    }

    await expect(tutorService.generateHint(hintRequest)).rejects.toThrow(
      'Unable to generate hint at this time'
    )
  })
})