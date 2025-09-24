import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockOpenAIClient, createTestUser, createTestMathProblem } from './setup'

// Mock OpenAI
vi.mock('openai', () => ({
  default: class OpenAI {
    chat = mockOpenAIClient.chat
  }
}))

describe('AI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AI Tutor Service', () => {
    it('generates contextual explanations', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'To solve 2 + 2, you add the two numbers together. 2 + 2 = 4.'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const problem = createTestMathProblem()
      const explanation = await aiTutorService.generateExplanation(problem, 'test-user-123')

      expect(explanation).toBe('To solve 2 + 2, you add the two numbers together. 2 + 2 = 4.')
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('middle school student')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(problem.question)
          })
        ]),
        max_tokens: 500,
        temperature: 0.7
      })
    })

    it('generates progressive hints', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'Try breaking down the problem into smaller parts.'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const problem = createTestMathProblem()
      const hint = await aiTutorService.generateHint(problem, 'test-user-123', 1)

      expect(hint).toBe('Try breaking down the problem into smaller parts.')
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('first hint')
            })
          ])
        })
      )
    })

    it('handles API errors gracefully', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockRejectedValue(
        new Error('OpenAI API error')
      )

      const problem = createTestMathProblem()
      
      await expect(
        aiTutorService.generateExplanation(problem, 'test-user-123')
      ).rejects.toThrow('OpenAI API error')
    })

    it('respects rate limiting', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      // Mock rate limit error
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.name = 'RateLimitError'
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockRejectedValue(rateLimitError)

      const problem = createTestMathProblem()
      
      await expect(
        aiTutorService.generateExplanation(problem, 'test-user-123')
      ).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Essay Analysis Service', () => {
    it('analyzes essay structure and content', async () => {
      const { essayAnalysisService } = await import('../services/ai/essayAnalysisService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallScore: 85,
              structure: {
                score: 80,
                feedback: 'Good introduction and conclusion, but body paragraphs need more development.'
              },
              grammar: {
                score: 90,
                feedback: 'Excellent grammar with only minor errors.'
              },
              vocabulary: {
                score: 85,
                feedback: 'Good vocabulary usage with some advanced words.'
              },
              suggestions: [
                'Add more supporting details in body paragraphs',
                'Use transition words between paragraphs'
              ]
            })
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const essay = 'This is a sample essay about environmental protection...'
      const prompt = 'Write about an environmental issue you care about.'
      
      const analysis = await essayAnalysisService.analyzeEssay(essay, prompt, 'test-user-123')

      expect(analysis.overallScore).toBe(85)
      expect(analysis.structure.score).toBe(80)
      expect(analysis.grammar.score).toBe(90)
      expect(analysis.vocabulary.score).toBe(85)
      expect(analysis.suggestions).toHaveLength(2)
    })

    it('handles malformed AI responses', async () => {
      const { essayAnalysisService } = await import('../services/ai/essayAnalysisService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const essay = 'Sample essay'
      const prompt = 'Sample prompt'
      
      await expect(
        essayAnalysisService.analyzeEssay(essay, prompt, 'test-user-123')
      ).rejects.toThrow()
    })
  })

  describe('Adaptive Learning Service', () => {
    it('adjusts difficulty based on performance', async () => {
      const { adaptiveLearningService } = await import('../services/ai/adaptiveLearningService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              recommendedDifficulty: 3,
              focusTopics: ['algebra', 'geometry'],
              reasoning: 'Student shows strong arithmetic skills but needs work on algebra'
            })
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const performanceData = {
        recentSessions: [
          { subject: 'math', accuracy: 0.9, topics: ['arithmetic'] },
          { subject: 'math', accuracy: 0.6, topics: ['algebra'] }
        ]
      }
      
      const recommendation = await adaptiveLearningService.getRecommendations(
        'test-user-123',
        performanceData
      )

      expect(recommendation.recommendedDifficulty).toBe(3)
      expect(recommendation.focusTopics).toContain('algebra')
      expect(recommendation.reasoning).toContain('arithmetic skills')
    })

    it('provides personalized study plans', async () => {
      const { adaptiveLearningService } = await import('../services/ai/adaptiveLearningService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              dailyGoals: {
                math: 20,
                english: 15,
                essay: 10
              },
              weeklyFocus: ['fractions', 'reading comprehension'],
              studySchedule: [
                { day: 'Monday', subjects: ['math', 'english'], duration: 45 },
                { day: 'Tuesday', subjects: ['essay'], duration: 30 }
              ]
            })
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const user = createTestUser({ examDate: new Date('2024-06-01') })
      const studyPlan = await adaptiveLearningService.generateStudyPlan(user)

      expect(studyPlan.dailyGoals.math).toBe(20)
      expect(studyPlan.weeklyFocus).toContain('fractions')
      expect(studyPlan.studySchedule).toHaveLength(2)
    })
  })

  describe('AI Response Caching', () => {
    it('caches similar requests to reduce API calls', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'Cached explanation response'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const problem = createTestMathProblem()
      
      // First call
      const explanation1 = await aiTutorService.generateExplanation(problem, 'test-user-123')
      
      // Second call with same problem should use cache
      const explanation2 = await aiTutorService.generateExplanation(problem, 'test-user-123')

      expect(explanation1).toBe(explanation2)
      // Should only call OpenAI once due to caching
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('AI Safety and Content Filtering', () => {
    it('filters inappropriate content from AI responses', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is an inappropriate response that should be filtered'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const problem = createTestMathProblem()
      
      // Mock content filter to detect inappropriate content
      const explanation = await aiTutorService.generateExplanation(problem, 'test-user-123')
      
      // Should return a safe fallback response
      expect(explanation).not.toContain('inappropriate')
    })

    it('ensures age-appropriate language for middle school students', async () => {
      const { aiTutorService } = await import('../services/ai/aiTutorService')
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'Great job! You solved this problem correctly. Keep practicing!'
          }
        }]
      }
      
      vi.mocked(mockOpenAIClient.chat.completions.create).mockResolvedValue(mockResponse)

      const problem = createTestMathProblem()
      const explanation = await aiTutorService.generateExplanation(problem, 'test-user-123')

      expect(explanation).toContain('Great job')
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('age-appropriate')
            })
          ])
        })
      )
    })
  })
})