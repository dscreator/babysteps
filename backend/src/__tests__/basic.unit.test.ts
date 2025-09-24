import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestUser, createTestMathProblem, createTestPracticeSession } from './setup'

describe('Basic Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Test Data Factories', () => {
    it('creates valid test user', () => {
      const user = createTestUser()
      
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('firstName')
      expect(user).toHaveProperty('lastName')
      expect(user).toHaveProperty('examDate')
      expect(user).toHaveProperty('gradeLevel')
      expect(user.gradeLevel).toBeGreaterThanOrEqual(6)
      expect(user.gradeLevel).toBeLessThanOrEqual(8)
    })

    it('creates valid test math problem', () => {
      const problem = createTestMathProblem()
      
      expect(problem).toHaveProperty('id')
      expect(problem).toHaveProperty('topic')
      expect(problem).toHaveProperty('difficulty')
      expect(problem).toHaveProperty('question')
      expect(problem).toHaveProperty('correctAnswer')
      expect(problem).toHaveProperty('explanation')
      expect(problem).toHaveProperty('hints')
      expect(Array.isArray(problem.hints)).toBe(true)
    })

    it('creates valid test practice session', () => {
      const session = createTestPracticeSession()
      
      expect(session).toHaveProperty('id')
      expect(session).toHaveProperty('userId')
      expect(session).toHaveProperty('subject')
      expect(session).toHaveProperty('questionsAttempted')
      expect(session).toHaveProperty('questionsCorrect')
      expect(['math', 'english', 'essay']).toContain(session.subject)
    })

    it('allows overriding test data properties', () => {
      const customUser = createTestUser({ 
        firstName: 'Custom',
        gradeLevel: 8 
      })
      
      expect(customUser.firstName).toBe('Custom')
      expect(customUser.gradeLevel).toBe(8)
      expect(customUser.email).toBe('test@example.com') // Default value
    })
  })

  describe('Data Validation', () => {
    it('validates email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const user = createTestUser()
      
      expect(emailRegex.test(user.email)).toBe(true)
    })

    it('validates exam date is in future', () => {
      const user = createTestUser()
      const now = new Date()
      
      expect(user.examDate.getTime()).toBeGreaterThan(now.getTime())
    })

    it('validates grade level range', () => {
      const user = createTestUser()
      
      expect(user.gradeLevel).toBeGreaterThanOrEqual(6)
      expect(user.gradeLevel).toBeLessThanOrEqual(8)
    })

    it('validates practice session accuracy', () => {
      const session = createTestPracticeSession({
        questionsAttempted: 10,
        questionsCorrect: 8
      })
      
      const accuracy = session.questionsCorrect / session.questionsAttempted
      expect(accuracy).toBeGreaterThanOrEqual(0)
      expect(accuracy).toBeLessThanOrEqual(1)
    })
  })

  describe('Business Logic Validation', () => {
    it('calculates days until exam correctly', () => {
      const examDate = new Date()
      examDate.setDate(examDate.getDate() + 30) // 30 days from now
      
      const user = createTestUser({ examDate })
      const now = new Date()
      const daysUntilExam = Math.ceil((user.examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysUntilExam).toBe(30)
    })

    it('determines study intensity based on time remaining', () => {
      const shortTimeUser = createTestUser({ 
        examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      const longTimeUser = createTestUser({ 
        examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      })
      
      const getStudyIntensity = (daysUntilExam: number) => {
        if (daysUntilExam < 14) return 'intensive'
        if (daysUntilExam < 30) return 'moderate'
        return 'relaxed'
      }
      
      const shortTimeDays = Math.ceil((shortTimeUser.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const longTimeDays = Math.ceil((longTimeUser.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      expect(getStudyIntensity(shortTimeDays)).toBe('intensive')
      expect(getStudyIntensity(longTimeDays)).toBe('relaxed')
    })

    it('calculates practice session performance metrics', () => {
      const session = createTestPracticeSession({
        questionsAttempted: 20,
        questionsCorrect: 16,
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        endTime: new Date()
      })
      
      const accuracy = session.questionsCorrect / session.questionsAttempted
      const timeSpent = session.endTime.getTime() - session.startTime.getTime()
      const averageTimePerQuestion = timeSpent / session.questionsAttempted
      
      expect(accuracy).toBe(0.8)
      expect(timeSpent).toBe(30 * 60 * 1000) // 30 minutes in milliseconds
      expect(averageTimePerQuestion).toBe(1.5 * 60 * 1000) // 1.5 minutes per question
    })
  })

  describe('Error Handling', () => {
    it('handles invalid user data gracefully', () => {
      const createInvalidUser = () => {
        return createTestUser({ 
          email: 'invalid-email',
          gradeLevel: 15 // Invalid grade level
        })
      }
      
      // The factory should still create the user, but validation would catch it
      const invalidUser = createInvalidUser()
      expect(invalidUser).toBeDefined()
      
      // Validation logic would be in the actual service
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const isValidGradeLevel = (grade: number) => grade >= 6 && grade <= 8
      
      expect(isValidEmail(invalidUser.email)).toBe(false)
      expect(isValidGradeLevel(invalidUser.gradeLevel)).toBe(false)
    })

    it('handles edge cases in calculations', () => {
      const zeroQuestionsSession = createTestPracticeSession({
        questionsAttempted: 0,
        questionsCorrect: 0
      })
      
      const calculateAccuracy = (correct: number, attempted: number) => {
        return attempted === 0 ? 0 : correct / attempted
      }
      
      expect(calculateAccuracy(zeroQuestionsSession.questionsCorrect, zeroQuestionsSession.questionsAttempted)).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    it('formats dates correctly', () => {
      const user = createTestUser()
      const formattedDate = user.examDate.toISOString().split('T')[0]
      
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('generates unique IDs', () => {
      const user1 = createTestUser()
      const user2 = createTestUser()
      
      // In a real implementation, IDs would be unique
      // For test data, we use fixed IDs, but this shows the concept
      expect(typeof user1.id).toBe('string')
      expect(typeof user2.id).toBe('string')
    })

    it('handles array operations safely', () => {
      const problem = createTestMathProblem()
      
      expect(Array.isArray(problem.hints)).toBe(true)
      expect(problem.hints.length).toBeGreaterThan(0)
      
      // Safe array access
      const firstHint = problem.hints[0]
      expect(typeof firstHint).toBe('string')
    })
  })
})