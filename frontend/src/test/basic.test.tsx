import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMockUser, createMockMathProblem, createMockProgress } from './utils'

// Simple component for testing
const TestComponent = ({ title }: { title: string }) => {
  return <div data-testid="test-component">{title}</div>
}

describe('Frontend Basic Tests', () => {
  describe('Test Utilities', () => {
    it('creates mock user data correctly', () => {
      const user = createMockUser()
      
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('firstName')
      expect(user).toHaveProperty('lastName')
      expect(user).toHaveProperty('examDate')
      expect(user).toHaveProperty('gradeLevel')
      
      expect(user.email).toContain('@')
      expect(user.gradeLevel).toBeGreaterThanOrEqual(6)
      expect(user.gradeLevel).toBeLessThanOrEqual(8)
    })

    it('creates mock math problem correctly', () => {
      const problem = createMockMathProblem()
      
      expect(problem).toHaveProperty('id')
      expect(problem).toHaveProperty('topic')
      expect(problem).toHaveProperty('difficulty')
      expect(problem).toHaveProperty('question')
      expect(problem).toHaveProperty('correctAnswer')
      expect(problem).toHaveProperty('explanation')
      expect(problem).toHaveProperty('hints')
      
      expect(Array.isArray(problem.hints)).toBe(true)
      expect(problem.difficulty).toBeGreaterThan(0)
    })

    it('creates mock progress data correctly', () => {
      const progress = createMockProgress()
      
      expect(progress).toHaveProperty('userId')
      expect(progress).toHaveProperty('subject')
      expect(progress).toHaveProperty('overallScore')
      expect(progress).toHaveProperty('topicScores')
      expect(progress).toHaveProperty('streakDays')
      
      expect(progress.overallScore).toBeGreaterThanOrEqual(0)
      expect(progress.overallScore).toBeLessThanOrEqual(100)
      expect(typeof progress.topicScores).toBe('object')
    })

    it('allows overriding mock data', () => {
      const customUser = createMockUser({ 
        firstName: 'Custom',
        gradeLevel: 8 
      })
      
      expect(customUser.firstName).toBe('Custom')
      expect(customUser.gradeLevel).toBe(8)
    })
  })

  describe('Component Rendering', () => {
    it('renders test component correctly', () => {
      render(<TestComponent title="Hello World" />)
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('handles different props', () => {
      const { rerender } = render(<TestComponent title="First Title" />)
      
      expect(screen.getByText('First Title')).toBeInTheDocument()
      
      rerender(<TestComponent title="Second Title" />)
      
      expect(screen.getByText('Second Title')).toBeInTheDocument()
      expect(screen.queryByText('First Title')).not.toBeInTheDocument()
    })
  })

  describe('Data Validation', () => {
    it('validates email format', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })

    it('validates grade level range', () => {
      const validateGradeLevel = (grade: number) => {
        return grade >= 6 && grade <= 8
      }

      expect(validateGradeLevel(6)).toBe(true)
      expect(validateGradeLevel(7)).toBe(true)
      expect(validateGradeLevel(8)).toBe(true)
      expect(validateGradeLevel(5)).toBe(false)
      expect(validateGradeLevel(9)).toBe(false)
    })

    it('validates required fields', () => {
      const validateRequiredFields = (data: any, requiredFields: string[]) => {
        return requiredFields.every(field => 
          data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
        )
      }

      const userData = createMockUser()
      const requiredFields = ['id', 'email', 'firstName', 'lastName', 'examDate', 'gradeLevel']
      
      expect(validateRequiredFields(userData, requiredFields)).toBe(true)
      
      const incompleteData = { id: '123', email: 'test@example.com' }
      expect(validateRequiredFields(incompleteData, requiredFields)).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    it('formats dates correctly', () => {
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
      }

      const testDate = new Date('2024-06-01')
      expect(formatDate(testDate)).toBe('2024-06-01')
    })

    it('calculates days between dates', () => {
      const daysBetween = (date1: Date, date2: Date) => {
        const diffTime = Math.abs(date2.getTime() - date1.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-31')
      
      expect(daysBetween(date1, date2)).toBe(30)
    })

    it('calculates percentage correctly', () => {
      const calculatePercentage = (correct: number, total: number) => {
        if (total === 0) return 0
        return Math.round((correct / total) * 100)
      }

      expect(calculatePercentage(8, 10)).toBe(80)
      expect(calculatePercentage(0, 10)).toBe(0)
      expect(calculatePercentage(10, 10)).toBe(100)
      expect(calculatePercentage(5, 0)).toBe(0) // Edge case
    })

    it('sanitizes strings safely', () => {
      const sanitizeString = (str: string) => {
        return str.replace(/[<>]/g, '')
      }

      expect(sanitizeString('Hello <script>World</script>')).toBe('Hello scriptWorld/script')
      expect(sanitizeString('Normal text')).toBe('Normal text')
    })
  })

  describe('Error Handling', () => {
    it('handles null and undefined values', () => {
      const safeAccess = (obj: any, path: string) => {
        try {
          return path.split('.').reduce((current, key) => current?.[key], obj)
        } catch {
          return undefined
        }
      }

      const testObj = { user: { profile: { name: 'Test' } } }
      
      expect(safeAccess(testObj, 'user.profile.name')).toBe('Test')
      expect(safeAccess(testObj, 'user.profile.age')).toBeUndefined()
      expect(safeAccess(null, 'user.profile.name')).toBeUndefined()
    })

    it('handles array operations safely', () => {
      const safeArrayAccess = (arr: any[], index: number) => {
        return Array.isArray(arr) && index >= 0 && index < arr.length ? arr[index] : undefined
      }

      const testArray = ['a', 'b', 'c']
      
      expect(safeArrayAccess(testArray, 0)).toBe('a')
      expect(safeArrayAccess(testArray, 5)).toBeUndefined()
      expect(safeArrayAccess([], 0)).toBeUndefined()
    })
  })
})