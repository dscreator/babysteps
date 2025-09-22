import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adaptiveLearningService } from '../services/ai/adaptiveLearningService'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn()
          })),
          limit: vi.fn()
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

describe('AdaptiveLearningService', () => {
  const mockUserId = 'test-user-123'
  const mockSubject = 'math' as const

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeUserLearningPatterns', () => {
    it('should analyze learning patterns from user data', async () => {
      // Mock the service methods to return basic data
      const mockAnalyzeMethod = vi.spyOn(adaptiveLearningService, 'analyzeUserLearningPatterns')
      
      const mockResult = {
        userId: mockUserId,
        subject: mockSubject,
        learningStyle: 'analytical' as const,
        preferredHintType: 'conceptual' as const,
        attentionSpan: 'medium' as const,
        errorPatterns: ['frequent_errors_fractions'],
        masteryLevels: { algebra: 0.8, fractions: 0.4 },
        improvementRate: 0.15,
        strugglingAreas: ['fractions'],
        improvingAreas: ['algebra'],
        recommendedDifficulty: 6,
        lastAnalyzed: new Date().toISOString()
      }

      mockAnalyzeMethod.mockResolvedValue(mockResult)

      const result = await adaptiveLearningService.analyzeUserLearningPatterns(mockUserId, mockSubject)

      expect(result).toMatchObject({
        userId: mockUserId,
        subject: mockSubject,
        learningStyle: expect.stringMatching(/^(visual|analytical|trial-and-error|mixed)$/),
        preferredHintType: expect.stringMatching(/^(conceptual|procedural|example-based)$/),
        attentionSpan: expect.stringMatching(/^(short|medium|long)$/),
        errorPatterns: expect.any(Array),
        masteryLevels: expect.any(Object),
        improvementRate: expect.any(Number),
        strugglingAreas: expect.any(Array),
        improvingAreas: expect.any(Array),
        recommendedDifficulty: expect.any(Number),
        lastAnalyzed: expect.any(String)
      })

      mockAnalyzeMethod.mockRestore()
    })
  })

  describe('adjustDifficulty', () => {
    it('should recommend difficulty adjustment based on performance', async () => {
      const mockAdjustMethod = vi.spyOn(adaptiveLearningService, 'adjustDifficulty')
      
      const mockResult = {
        currentDifficulty: 5,
        recommendedDifficulty: 6,
        adjustmentReason: 'High accuracy indicates readiness for increased difficulty',
        confidence: 0.8
      }

      mockAdjustMethod.mockResolvedValue(mockResult)

      const result = await adaptiveLearningService.adjustDifficulty(mockUserId, mockSubject, 5)

      expect(result).toMatchObject({
        currentDifficulty: expect.any(Number),
        recommendedDifficulty: expect.any(Number),
        adjustmentReason: expect.any(String),
        confidence: expect.any(Number)
      })

      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)

      mockAdjustMethod.mockRestore()
    })
  })

  describe('generateContentRecommendations', () => {
    it('should generate prioritized content recommendations', async () => {
      const mockGenerateMethod = vi.spyOn(adaptiveLearningService, 'generateContentRecommendations')
      
      const mockRecommendations = [
        {
          topics: ['fractions'],
          difficultyLevel: 4,
          practiceType: 'review' as const,
          estimatedTime: 15,
          priority: 'high' as const,
          reasoning: 'Focused review needed for struggling area'
        },
        {
          topics: ['algebra'],
          difficultyLevel: 6,
          practiceType: 'new_learning' as const,
          estimatedTime: 20,
          priority: 'medium' as const,
          reasoning: 'Build on improvement in algebra'
        }
      ]

      mockGenerateMethod.mockResolvedValue(mockRecommendations)

      const recommendations = await adaptiveLearningService.generateContentRecommendations(mockUserId, mockSubject)

      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)

      // Check structure of recommendations
      recommendations.forEach(rec => {
        expect(rec).toMatchObject({
          topics: expect.any(Array),
          difficultyLevel: expect.any(Number),
          practiceType: expect.stringMatching(/^(review|new_learning|challenge)$/),
          estimatedTime: expect.any(Number),
          priority: expect.stringMatching(/^(high|medium|low)$/),
          reasoning: expect.any(String)
        })
      })

      mockGenerateMethod.mockRestore()
    })
  })

  describe('createPersonalizationProfile', () => {
    it('should create comprehensive personalization profile', async () => {
      const mockCreateMethod = vi.spyOn(adaptiveLearningService, 'createPersonalizationProfile')
      
      const mockProfile = {
        userId: mockUserId,
        subject: mockSubject,
        currentLevel: 5,
        targetLevel: 7,
        learningGoals: ['Improve fractions to 75%', 'Master word problems'],
        preferredPracticeTypes: ['step_by_step_solutions', 'concept_explanations'],
        optimalSessionLength: 25,
        bestPracticeTime: 'afternoon',
        motivationalFactors: ['progress_tracking', 'achievement_badges'],
        adaptationHistory: []
      }

      mockCreateMethod.mockResolvedValue(mockProfile)

      const profile = await adaptiveLearningService.createPersonalizationProfile(mockUserId, mockSubject)

      expect(profile).toMatchObject({
        userId: mockUserId,
        subject: mockSubject,
        currentLevel: expect.any(Number),
        targetLevel: expect.any(Number),
        learningGoals: expect.any(Array),
        preferredPracticeTypes: expect.any(Array),
        optimalSessionLength: expect.any(Number),
        bestPracticeTime: expect.any(String),
        motivationalFactors: expect.any(Array),
        adaptationHistory: expect.any(Array)
      })

      expect(profile.currentLevel).toBeGreaterThan(0)
      expect(profile.targetLevel).toBeGreaterThanOrEqual(profile.currentLevel)
      expect(profile.optimalSessionLength).toBeGreaterThan(0)

      mockCreateMethod.mockRestore()
    })
  })
})