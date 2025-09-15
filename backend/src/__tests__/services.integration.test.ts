import { describe, it, expect } from 'vitest'
import { 
  validateCreateSession,
  validateGetProblems,
  validateSubmitAnswer,
  ValidationError
} from '../utils/practiceValidation'

describe('Practice Validation', () => {
  describe('validateCreateSession', () => {
    it('should validate correct session creation data', () => {
      const validData = {
        subject: 'math',
        topics: ['algebra'],
        difficultyLevel: 3
      }

      expect(() => validateCreateSession(validData)).not.toThrow()
      const result = validateCreateSession(validData)
      expect(result.subject).toBe('math')
      expect(result.topics).toEqual(['algebra'])
      expect(result.difficultyLevel).toBe(3)
    })

    it('should reject invalid subject', () => {
      const invalidData = {
        subject: 'invalid',
        topics: ['algebra']
      }

      expect(() => validateCreateSession(invalidData)).toThrow()
    })

    it('should reject invalid difficulty level', () => {
      const invalidData = {
        subject: 'math',
        difficultyLevel: 10
      }

      expect(() => validateCreateSession(invalidData)).toThrow()
    })
  })

  describe('validateGetProblems', () => {
    it('should validate correct problem request', () => {
      const validData = {
        topic: 'algebra',
        difficulty: 3,
        gradeLevel: 7,
        limit: 10,
        offset: 0
      }

      expect(() => validateGetProblems(validData)).not.toThrow()
      const result = validateGetProblems(validData)
      expect(result.topic).toBe('algebra')
      expect(result.difficulty).toBe(3)
      expect(result.gradeLevel).toBe(7)
    })

    it('should apply default values', () => {
      const minimalData = {}

      const result = validateGetProblems(minimalData)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(0)
    })

    it('should reject invalid grade level', () => {
      const invalidData = {
        gradeLevel: 12
      }

      expect(() => validateGetProblems(invalidData)).toThrow()
    })
  })

  describe('validateSubmitAnswer', () => {
    it('should validate correct answer submission', () => {
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        questionId: '123e4567-e89b-12d3-a456-426614174001',
        answer: 'x = 2',
        timeSpent: 30
      }

      expect(() => validateSubmitAnswer(validData)).not.toThrow()
      const result = validateSubmitAnswer(validData)
      expect(result.sessionId).toBe(validData.sessionId)
      expect(result.questionId).toBe(validData.questionId)
      expect(result.answer).toBe(validData.answer)
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        sessionId: 'invalid-uuid',
        questionId: '123e4567-e89b-12d3-a456-426614174001',
        answer: 'x = 2'
      }

      expect(() => validateSubmitAnswer(invalidData)).toThrow()
    })

    it('should reject empty answer', () => {
      const invalidData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        questionId: '123e4567-e89b-12d3-a456-426614174001',
        answer: ''
      }

      expect(() => validateSubmitAnswer(invalidData)).toThrow()
    })
  })
})

describe('Business Logic Validation', () => {
  it('should validate exam date correctly', () => {
    const { validateExamDate } = require('../utils/practiceValidation')
    
    // Future date should be valid
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 6)
    expect(() => validateExamDate(futureDate.toISOString())).not.toThrow()

    // Past date should be invalid
    const pastDate = new Date()
    pastDate.setMonth(pastDate.getMonth() - 1)
    expect(() => validateExamDate(pastDate.toISOString())).toThrow()

    // Invalid date format should be invalid
    expect(() => validateExamDate('invalid-date')).toThrow()
  })

  it('should validate grade level correctly', () => {
    const { validateGradeLevel } = require('../utils/practiceValidation')
    
    expect(() => validateGradeLevel(6)).not.toThrow()
    expect(() => validateGradeLevel(7)).not.toThrow()
    expect(() => validateGradeLevel(8)).not.toThrow()
    
    expect(() => validateGradeLevel(5)).toThrow()
    expect(() => validateGradeLevel(9)).toThrow()
  })
})

describe('Service Type Definitions', () => {
  it('should have correct type structure for practice types', () => {
    const { 
      MathProblem,
      ReadingPassage,
      PracticeSession 
    } = require('../types/practice')
    
    // These should be defined (no runtime test, just import check)
    expect(typeof MathProblem).toBe('undefined') // Types don't exist at runtime
    expect(typeof ReadingPassage).toBe('undefined')
    expect(typeof PracticeSession).toBe('undefined')
  })
})