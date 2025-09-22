import { describe, it, expect } from 'vitest'
import { 
  validateEssayContent, 
  validateAnalysisRateLimit,
  validateEssayPrompt,
  submitEssaySchema,
  analyzeEssaySchema 
} from '../utils/essayValidation'

describe('Essay Validation', () => {
  describe('validateEssayContent', () => {
    it('should reject essays that are too short', () => {
      const result = validateEssayContent('Too short')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Essay is too short (minimum 50 characters)')
    })

    it('should reject essays that are too long', () => {
      const longEssay = 'a'.repeat(10001)
      const result = validateEssayContent(longEssay)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Essay is too long (maximum 10,000 characters)')
    })

    it('should accept valid essays', () => {
      const validEssay = 'This is a valid essay that meets all the requirements for submission to the ISEE AI tutor system. It has sufficient length and content.'
      const result = validateEssayContent(validEssay)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should provide warnings for short but valid essays', () => {
      const shortButValid = 'This is a short but valid essay that meets minimum requirements.'
      const result = validateEssayContent(shortButValid)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Essay is quite short (less than 25 words)')
    })

    it('should warn about missing punctuation', () => {
      const noPunctuation = 'This is a valid essay that meets all the requirements for submission to the ISEE AI tutor system but has no ending punctuation'
      const result = validateEssayContent(noPunctuation)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Essay should end with proper punctuation')
    })

    it('should warn about single paragraph essays', () => {
      const singleParagraph = 'This is a valid essay that meets all the requirements for submission to the ISEE AI tutor system. It has sufficient length and content but is all in one paragraph.'
      const result = validateEssayContent(singleParagraph)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Consider organizing your essay into multiple paragraphs')
    })
  })

  describe('validateAnalysisRateLimit', () => {
    it('should allow analysis when under rate limit', () => {
      expect(() => validateAnalysisRateLimit('user123', 2)).not.toThrow()
    })

    it('should reject analysis when over rate limit', () => {
      expect(() => validateAnalysisRateLimit('user123', 3)).toThrow('Rate limit exceeded')
    })
  })

  describe('validateEssayPrompt', () => {
    it('should validate correct essay prompt', () => {
      const validPrompt = {
        id: '123',
        prompt: 'Write about your favorite season',
        type: 'narrative',
        grade_level: 7
      }
      expect(validateEssayPrompt(validPrompt)).toBe(true)
    })

    it('should reject invalid essay prompt types', () => {
      const invalidPrompt = {
        id: '123',
        prompt: 'Write about your favorite season',
        type: 'invalid-type',
        grade_level: 7
      }
      expect(validateEssayPrompt(invalidPrompt)).toBe(false)
    })

    it('should reject invalid grade levels', () => {
      const invalidPrompt = {
        id: '123',
        prompt: 'Write about your favorite season',
        type: 'narrative',
        grade_level: 5
      }
      expect(validateEssayPrompt(invalidPrompt)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidPrompt = {
        id: '123',
        type: 'narrative',
        grade_level: 7
      }
      expect(validateEssayPrompt(invalidPrompt)).toBe(false)
    })
  })

  describe('Zod Schema Validation', () => {
    describe('submitEssaySchema', () => {
      it('should validate correct essay submission', () => {
        const validData = {
          promptId: '550e8400-e29b-41d4-a716-446655440000',
          content: 'This is a valid essay that meets all the requirements for submission to the ISEE AI tutor system.',
          timeSpent: 15
        }
        expect(() => submitEssaySchema.parse(validData)).not.toThrow()
      })

      it('should reject invalid UUID', () => {
        const invalidData = {
          promptId: 'invalid-uuid',
          content: 'This is a valid essay that meets all the requirements for submission.',
          timeSpent: 15
        }
        expect(() => submitEssaySchema.parse(invalidData)).toThrow()
      })

      it('should reject short content', () => {
        const invalidData = {
          promptId: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Too short',
          timeSpent: 15
        }
        expect(() => submitEssaySchema.parse(invalidData)).toThrow()
      })

      it('should reject long content', () => {
        const invalidData = {
          promptId: '550e8400-e29b-41d4-a716-446655440000',
          content: 'a'.repeat(10001),
          timeSpent: 15
        }
        expect(() => submitEssaySchema.parse(invalidData)).toThrow()
      })

      it('should reject invalid time spent', () => {
        const invalidData = {
          promptId: '550e8400-e29b-41d4-a716-446655440000',
          content: 'This is a valid essay that meets all the requirements for submission.',
          timeSpent: -5
        }
        expect(() => submitEssaySchema.parse(invalidData)).toThrow()
      })
    })

    describe('analyzeEssaySchema', () => {
      it('should validate correct analysis request', () => {
        const validData = {
          submissionId: '550e8400-e29b-41d4-a716-446655440000'
        }
        expect(() => analyzeEssaySchema.parse(validData)).not.toThrow()
      })

      it('should reject invalid UUID', () => {
        const invalidData = {
          submissionId: 'invalid-uuid'
        }
        expect(() => analyzeEssaySchema.parse(invalidData)).toThrow()
      })
    })
  })
})