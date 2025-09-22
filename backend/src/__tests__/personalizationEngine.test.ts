import { describe, it, expect, beforeEach, vi } from 'vitest'
import { personalizationEngine } from '../services/ai/personalizationEngine'
import { adaptiveLearningService } from '../services/ai/adaptiveLearningService'
import { learningStyleService } from '../services/ai/learningStyleService'

// Mock the dependencies
vi.mock('../services/ai/adaptiveLearningService')
vi.mock('../services/ai/learningStyleService')
vi.mock('../services/ai/openaiService')
vi.mock('../config/supabase')

const mockAdaptiveLearningService = adaptiveLearningService as any
const mockLearningStyleService = learningStyleService as any

describe('PersonalizationEngine', () => {
  const mockUserId = 'test-user-123'
  const mockSubject = 'math' as const

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generatePersonalizedRecommendations', () => {
    it('should generate comprehensive personalized recommendations', async () => {
      // Mock learning pattern
      const mockLearningPattern = {
        userId: mockUserId,
        subject: mockSubject,
        learningStyle: 'analytical' as const,
        preferredHintType: 'conceptual' as const,
        attentionSpan: 'medium' as const,
        errorPatterns: ['frequent_errors_fractions'],
        masteryLevels: { algebra: 0.8, fractions: 0.4, geometry: 0.6 },
        improvementRate: 0.15,
        strugglingAreas: ['fractions', 'word_problems'],
        improvingAreas: ['algebra'],
        recommendedDifficulty: 6,
        lastAnalyzed: new Date().toISOString()
      }

      // Mock learning style
      const mockLearningStyle = {
        userId: mockUserId,
        primaryStyle: 'analytical' as const,
        confidence: 0.8,
        indicators: { visual: 0.2, auditory: 0.3, kinesthetic: 0.1, readingWriting: 0.4 },
        preferences: {
          explanationType: 'conceptual' as const,
          feedbackStyle: 'detailed' as const,
          problemPresentation: 'text' as const,
          hintProgression: 'gradual' as const
        },
        adaptationRecommendations: ['Include detailed explanations', 'Use step-by-step approach'],
        lastAnalyzed: new Date().toISOString()
      }

      // Mock personalization profile
      const mockProfile = {
        userId: mockUserId,
        subject: mockSubject,
        currentLevel: 6,
        targetLevel: 8,
        learningGoals: ['Improve fractions to 75%', 'Master word problems'],
        preferredPracticeTypes: ['step_by_step_solutions', 'concept_explanations'],
        optimalSessionLength: 25,
        bestPracticeTime: 'afternoon',
        motivationalFactors: ['progress_tracking', 'achievement_badges'],
        adaptationHistory: []
      }

      vi.mocked(mockAdaptiveLearningService.analyzeUserLearningPatterns).mockResolvedValue(mockLearningPattern)
      vi.mocked(mockLearningStyleService.analyzeLearningStyle).mockResolvedValue(mockLearningStyle)
      vi.mocked(mockAdaptiveLearningService.createPersonalizationProfile).mockResolvedValue(mockProfile)
      vi.mocked(mockAdaptiveLearningService.generateContentRecommendations).mockResolvedValue([
        {
          topics: ['fractions'],
          difficultyLevel: 5,
          practiceType: 'review',
          estimatedTime: 15,
          priority: 'high',
          reasoning: 'Focused review needed for struggling area'
        }
      ])

      const result = await personalizationEngine.generatePersonalizedRecommendations(mockUserId, mockSubject)

      expect(result).toMatchObject({
        userId: mockUserId,
        subject: mockSubject,
        recommendations: {
          nextTopics: expect.any(Array),
          reviewTopics: expect.any(Array),
          difficultyAdjustment: expect.stringMatching(/^(increase|maintain|decrease)$/),
          studyTips: expect.any(Array),
          contentAdaptations: expect.any(Array),
          sessionRecommendations: expect.objectContaining({
            optimalLength: expect.any(Number),
            bestTimeOfDay: expect.any(String),
            breakFrequency: expect.any(Number),
            practiceTypes: expect.any(Array),
            motivationalElements: expect.any(Array)
          })
        },
        confidence: expect.any(Number),
        reasoning: expect.any(Array),
        lastUpdated: expect.any(String)
      })

      expect(vi.mocked(mockAdaptiveLearningService.analyzeUserLearningPatterns)).toHaveBeenCalledWith(mockUserId, mockSubject)
      expect(vi.mocked(mockLearningStyleService.analyzeLearningStyle)).toHaveBeenCalledWith(mockUserId)
      expect(vi.mocked(mockAdaptiveLearningService.createPersonalizationProfile)).toHaveBeenCalledWith(mockUserId, mockSubject)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(mockAdaptiveLearningService.analyzeUserLearningPatterns).mockRejectedValue(new Error('Database error'))

      await expect(
        personalizationEngine.generatePersonalizedRecommendations(mockUserId, mockSubject)
      ).rejects.toThrow('Database error')
    })
  })

  describe('generateLearningInsights', () => {
    it('should generate actionable learning insights', async () => {
      const mockLearningPattern = {
        userId: mockUserId,
        subject: mockSubject,
        learningStyle: 'visual' as const,
        preferredHintType: 'example-based' as const,
        attentionSpan: 'short' as const,
        errorPatterns: [],
        masteryLevels: { algebra: 0.9, fractions: 0.3 },
        improvementRate: 0.2,
        strugglingAreas: ['fractions'],
        improvingAreas: ['algebra'],
        recommendedDifficulty: 7,
        lastAnalyzed: new Date().toISOString()
      }

      const mockLearningStyle = {
        userId: mockUserId,
        primaryStyle: 'visual' as const,
        confidence: 0.85,
        indicators: { visual: 0.6, auditory: 0.2, kinesthetic: 0.1, readingWriting: 0.1 },
        preferences: {
          explanationType: 'example-based' as const,
          feedbackStyle: 'immediate' as const,
          problemPresentation: 'visual' as const,
          hintProgression: 'direct' as const
        },
        adaptationRecommendations: ['Use visual diagrams', 'Include examples'],
        lastAnalyzed: new Date().toISOString()
      }

      vi.mocked(mockAdaptiveLearningService.analyzeUserLearningPatterns).mockResolvedValue(mockLearningPattern)
      vi.mocked(mockLearningStyleService.analyzeLearningStyle).mockResolvedValue(mockLearningStyle)

      const insights = await personalizationEngine.generateLearningInsights(mockUserId, mockSubject)

      expect(insights).toBeInstanceOf(Array)
      expect(insights.length).toBeGreaterThan(0)
      
      // Check for strength insights
      const strengthInsights = insights.filter(i => i.type === 'strength')
      expect(strengthInsights.length).toBeGreaterThan(0)
      expect(strengthInsights[0]).toMatchObject({
        type: 'strength',
        subject: mockSubject,
        topic: 'algebra',
        description: expect.stringContaining('improvement'),
        confidence: expect.any(Number),
        actionable: true,
        suggestedActions: expect.any(Array)
      })

      // Check for weakness insights
      const weaknessInsights = insights.filter(i => i.type === 'weakness')
      expect(weaknessInsights.length).toBeGreaterThan(0)
      expect(weaknessInsights[0]).toMatchObject({
        type: 'weakness',
        subject: mockSubject,
        topic: 'fractions',
        description: expect.stringContaining('attention'),
        confidence: expect.any(Number),
        actionable: true,
        suggestedActions: expect.any(Array)
      })
    })
  })

  describe('adaptContentForUser', () => {
    it('should adapt content based on learning style and patterns', async () => {
      const mockContent = {
        id: 'problem-123',
        question: 'Solve for x: 2x + 5 = 15',
        subject: 'math',
        topic: 'algebra'
      }

      const mockLearningStyle = {
        userId: mockUserId,
        primaryStyle: 'visual' as const,
        confidence: 0.8,
        indicators: { visual: 0.7, auditory: 0.1, kinesthetic: 0.1, readingWriting: 0.1 },
        preferences: {
          explanationType: 'example-based' as const,
          feedbackStyle: 'immediate' as const,
          problemPresentation: 'visual' as const,
          hintProgression: 'direct' as const
        },
        adaptationRecommendations: [],
        lastAnalyzed: new Date().toISOString()
      }

      const mockLearningPattern = {
        userId: mockUserId,
        subject: 'math' as const,
        learningStyle: 'visual' as const,
        preferredHintType: 'example-based' as const,
        attentionSpan: 'medium' as const,
        errorPatterns: [],
        masteryLevels: { algebra: 0.8 },
        improvementRate: 0.1,
        strugglingAreas: [],
        improvingAreas: ['algebra'],
        recommendedDifficulty: 6,
        lastAnalyzed: new Date().toISOString()
      }

      vi.mocked(mockLearningStyleService.analyzeLearningStyle).mockResolvedValue(mockLearningStyle)
      vi.mocked(mockAdaptiveLearningService.analyzeUserLearningPatterns).mockResolvedValue(mockLearningPattern)
      vi.mocked(mockLearningStyleService.adaptContentForUser).mockResolvedValue({
        ...mockContent,
        includeVisuals: true,
        highlightKeyTerms: true
      })

      const adaptedContent = await personalizationEngine.adaptContentForUser(
        mockUserId,
        mockContent,
        'problem'
      )

      expect(adaptedContent).toMatchObject({
        ...mockContent,
        includeVisuals: true,
        highlightKeyTerms: true
      })

      expect(vi.mocked(mockLearningStyleService.adaptContentForUser)).toHaveBeenCalledWith(
        mockUserId,
        'problem',
        expect.objectContaining(mockContent)
      )
    })
  })

  describe('updatePersonalizationFromFeedback', () => {
    it('should record feedback and update personalization', async () => {
      const feedbackType = 'helpful'
      const context = { problemId: 'test-123', difficulty: 5 }

      vi.mocked(mockLearningStyleService.updateLearningStyleFromInteraction).mockResolvedValue()

      await personalizationEngine.updatePersonalizationFromFeedback(
        mockUserId,
        mockSubject,
        feedbackType,
        context
      )

      expect(vi.mocked(mockLearningStyleService.updateLearningStyleFromInteraction)).toHaveBeenCalledWith(
        mockUserId,
        feedbackType,
        context,
        1 // effectiveness score for 'helpful' feedback
      )
    })

    it('should handle not_helpful feedback correctly', async () => {
      const feedbackType = 'not_helpful'
      const context = { problemId: 'test-123' }

      vi.mocked(mockLearningStyleService.updateLearningStyleFromInteraction).mockResolvedValue()

      await personalizationEngine.updatePersonalizationFromFeedback(
        mockUserId,
        mockSubject,
        feedbackType,
        context
      )

      expect(vi.mocked(mockLearningStyleService.updateLearningStyleFromInteraction)).toHaveBeenCalledWith(
        mockUserId,
        feedbackType,
        context,
        0 // effectiveness score for 'not_helpful' feedback
      )
    })
  })
})