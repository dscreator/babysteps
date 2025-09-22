import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { essayAnalysisService } from '../services/ai/essayAnalysisService'
import { openaiService } from '../services/ai/openaiService'
import { supabase } from '../config/supabase'

// Mock the dependencies
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn()
            }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    }))
  }
}))

vi.mock('../services/ai/openaiService', () => ({
  openaiService: {
    checkRateLimit: vi.fn(),
    analyzeEssay: vi.fn(),
    isAvailable: vi.fn(() => true)
  }
}))

describe('EssayAnalysisService', () => {
  const mockUserId = 'user-123'
  const mockPromptId = 'prompt-456'
  const mockSubmissionId = 'submission-789'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('submitEssay', () => {
    it('should successfully submit an essay', async () => {
      const mockEssayContent = 'This is a test essay with sufficient length to meet the minimum requirements for submission.'
      const mockPrompt = {
        id: mockPromptId,
        prompt: 'Write about your favorite season',
        type: 'narrative',
        grade_level: 7
      }

      const mockSubmission = {
        id: mockSubmissionId,
        user_id: mockUserId,
        prompt_id: mockPromptId,
        content: mockEssayContent,
        word_count: 17,
        time_spent: 15,
        submitted_at: '2024-01-01T10:00:00Z'
      }

      // Mock Supabase calls
      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockPrompt, error: null })
          }))
        }))
      }

      const mockInsertChain = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
          }))
        }))
      }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'essay_prompts') {
          return mockSupabaseChain as any
        }
        if (table === 'essay_submissions') {
          return mockInsertChain as any
        }
        return {} as any
      })

      const result = await essayAnalysisService.submitEssay(mockUserId, {
        promptId: mockPromptId,
        content: mockEssayContent,
        timeSpent: 15
      })

      expect(result).toEqual({
        id: mockSubmissionId,
        userId: mockUserId,
        promptId: mockPromptId,
        content: mockEssayContent,
        wordCount: 17,
        timeSpent: 15,
        submittedAt: '2024-01-01T10:00:00Z'
      })
    })

    it('should reject essays that are too short', async () => {
      const shortEssay = 'Too short'

      await expect(
        essayAnalysisService.submitEssay(mockUserId, {
          promptId: mockPromptId,
          content: shortEssay
        })
      ).rejects.toThrow('Essay must be at least 50 characters long')
    })

    it('should reject essays that are too long', async () => {
      const longEssay = 'a'.repeat(10001)

      await expect(
        essayAnalysisService.submitEssay(mockUserId, {
          promptId: mockPromptId,
          content: longEssay
        })
      ).rejects.toThrow('Essay exceeds maximum length of 10,000 characters')
    })

    it('should reject invalid prompt IDs', async () => {
      const mockEssayContent = 'This is a test essay with sufficient length to meet the minimum requirements for submission.'

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          }))
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any)

      await expect(
        essayAnalysisService.submitEssay(mockUserId, {
          promptId: 'invalid-prompt-id',
          content: mockEssayContent
        })
      ).rejects.toThrow('Invalid essay prompt')
    })
  })

  describe('analyzeEssay', () => {
    it('should successfully analyze an essay', async () => {
      const mockSubmissionData = {
        id: mockSubmissionId,
        user_id: mockUserId,
        prompt_id: mockPromptId,
        content: 'This is a test essay for analysis.',
        word_count: 8,
        essay_prompts: {
          id: mockPromptId,
          prompt: 'Write about your favorite season',
          type: 'narrative',
          rubric: { structure: 25, grammar: 25, content: 25, vocabulary: 25 }
        }
      }

      const mockAIAnalysis = {
        overallScore: 85,
        structureScore: 80,
        grammarScore: 90,
        contentScore: 85,
        vocabularyScore: 85,
        feedback: {
          strengths: ['Clear writing', 'Good organization'],
          improvements: ['Add more details', 'Vary sentence structure'],
          specific: ['Consider using transition words', 'Expand on examples']
        },
        rubricBreakdown: {
          structure: { score: 80, feedback: 'Well organized' },
          grammar: { score: 90, feedback: 'Excellent grammar' },
          content: { score: 85, feedback: 'Good ideas' },
          vocabulary: { score: 85, feedback: 'Appropriate word choice' }
        }
      }

      const mockAnalysisRecord = {
        id: 'analysis-123',
        submission_id: mockSubmissionId,
        overall_score: 85,
        structure_score: 80,
        grammar_score: 90,
        content_score: 85,
        vocabulary_score: 85,
        feedback: mockAIAnalysis.feedback,
        rubric_breakdown: mockAIAnalysis.rubricBreakdown,
        analyzed_at: '2024-01-01T10:30:00Z'
      }

      // Mock rate limiting check
      vi.mocked(openaiService.checkRateLimit).mockResolvedValue()

      // Mock OpenAI analysis
      vi.mocked(openaiService.analyzeEssay).mockResolvedValue(mockAIAnalysis)

      // Mock Supabase calls
      const mockSubmissionQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
            }))
          }))
        }))
      }

      const mockExistingAnalysisQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      }

      const mockInsertAnalysis = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAnalysisRecord, error: null })
          }))
        }))
      }

      const mockProgressQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null })
            }))
          }))
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null })
          }))
        }))
      }

      const mockInteractionInsert = {
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        switch (table) {
          case 'essay_submissions':
            return mockSubmissionQuery as any
          case 'essay_analyses':
            if (vi.mocked(supabase.from).mock.calls.filter(call => call[0] === 'essay_analyses').length === 1) {
              return mockExistingAnalysisQuery as any
            }
            return mockInsertAnalysis as any
          case 'user_progress':
            return mockProgressQuery as any
          case 'ai_interactions':
            return mockInteractionInsert as any
          default:
            return {} as any
        }
      })

      const result = await essayAnalysisService.analyzeEssay(mockUserId, mockSubmissionId)

      expect(openaiService.checkRateLimit).toHaveBeenCalledWith(mockUserId)
      expect(openaiService.analyzeEssay).toHaveBeenCalledWith(
        mockSubmissionData.content,
        mockSubmissionData.essay_prompts.prompt,
        mockSubmissionData.essay_prompts.rubric
      )

      expect(result.analysis.overallScore).toBe(85)
      expect(result.suggestions.nextSteps).toContain('Great work! Try more challenging prompts to continue improving')
    })

    it('should return existing analysis if already exists', async () => {
      const mockExistingAnalysis = {
        id: 'analysis-123',
        submission_id: mockSubmissionId,
        overall_score: 85,
        structure_score: 80,
        grammar_score: 90,
        content_score: 85,
        vocabulary_score: 85,
        feedback: { strengths: [], improvements: [], specific: [] },
        rubric_breakdown: {},
        analyzed_at: '2024-01-01T10:30:00Z'
      }

      const mockSubmissionData = {
        id: mockSubmissionId,
        user_id: mockUserId,
        content: 'Test essay'
      }

      // Mock rate limiting check
      vi.mocked(openaiService.checkRateLimit).mockResolvedValue()

      // Mock Supabase calls
      const mockSubmissionQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
            }))
          }))
        }))
      }

      const mockExistingAnalysisQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockExistingAnalysis, error: null })
          }))
        }))
      }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'essay_submissions') {
          return mockSubmissionQuery as any
        }
        if (table === 'essay_analyses') {
          return mockExistingAnalysisQuery as any
        }
        return {} as any
      })

      const result = await essayAnalysisService.analyzeEssay(mockUserId, mockSubmissionId)

      expect(result.analysis.id).toBe('analysis-123')
      expect(openaiService.analyzeEssay).not.toHaveBeenCalled()
    })

    it('should handle rate limiting errors', async () => {
      vi.mocked(openaiService.checkRateLimit).mockRejectedValue(
        new Error('Rate limit exceeded. Try again in 30 seconds.')
      )

      await expect(
        essayAnalysisService.analyzeEssay(mockUserId, mockSubmissionId)
      ).rejects.toThrow('Rate limit exceeded. Try again in 30 seconds.')
    })

    it('should handle OpenAI service errors', async () => {
      const mockSubmissionData = {
        id: mockSubmissionId,
        user_id: mockUserId,
        prompt_id: mockPromptId,
        content: 'Test essay',
        essay_prompts: {
          prompt: 'Test prompt',
          type: 'narrative'
        }
      }

      vi.mocked(openaiService.checkRateLimit).mockResolvedValue()
      vi.mocked(openaiService.analyzeEssay).mockRejectedValue(
        new Error('OpenAI API error')
      )

      const mockSubmissionQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
            }))
          }))
        }))
      }

      const mockExistingAnalysisQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'essay_submissions') {
          return mockSubmissionQuery as any
        }
        if (table === 'essay_analyses') {
          return mockExistingAnalysisQuery as any
        }
        return {} as any
      })

      await expect(
        essayAnalysisService.analyzeEssay(mockUserId, mockSubmissionId)
      ).rejects.toThrow('OpenAI API error')
    })
  })

  describe('getUserEssayHistory', () => {
    it('should return user essay history with analyses', async () => {
      const mockHistoryData = [
        {
          id: 'submission-1',
          user_id: mockUserId,
          prompt_id: 'prompt-1',
          content: 'Essay 1 content',
          word_count: 100,
          time_spent: 20,
          submitted_at: '2024-01-01T10:00:00Z',
          essay_analyses: [{
            id: 'analysis-1',
            submission_id: 'submission-1',
            overall_score: 85,
            structure_score: 80,
            grammar_score: 90,
            content_score: 85,
            vocabulary_score: 85,
            feedback: { strengths: [], improvements: [], specific: [] },
            rubric_breakdown: {},
            analyzed_at: '2024-01-01T10:30:00Z'
          }]
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: mockHistoryData, error: null })
            }))
          }))
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await essayAnalysisService.getUserEssayHistory(mockUserId, 10)

      expect(result.submissions).toHaveLength(1)
      expect(result.analyses).toHaveLength(1)
      expect(result.submissions[0].id).toBe('submission-1')
      expect(result.analyses[0].overallScore).toBe(85)
    })
  })
})