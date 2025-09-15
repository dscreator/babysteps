import { describe, it, expect } from 'vitest'
import express from 'express'
import { practiceRoutes } from '../routes/practice'
import { progressRoutes } from '../routes/progress'

describe('Route Structure', () => {
  describe('Practice Routes', () => {
    it('should be a valid Express router', () => {
      expect(practiceRoutes).toBeDefined()
      expect(typeof practiceRoutes).toBe('function')
      expect(practiceRoutes.stack).toBeDefined()
    })

    it('should have expected route handlers', () => {
      const app = express()
      app.use('/practice', practiceRoutes)
      
      // Check that the router has routes defined
      expect(practiceRoutes.stack.length).toBeGreaterThan(0)
    })
  })

  describe('Progress Routes', () => {
    it('should be a valid Express router', () => {
      expect(progressRoutes).toBeDefined()
      expect(typeof progressRoutes).toBe('function')
      expect(progressRoutes.stack).toBeDefined()
    })

    it('should have expected route handlers', () => {
      const app = express()
      app.use('/progress', progressRoutes)
      
      // Check that the router has routes defined
      expect(progressRoutes.stack.length).toBeGreaterThan(0)
    })
  })
})

describe('Service Imports', () => {
  it('should import practice service correctly', async () => {
    const { practiceService } = await import('../services/practiceService')
    expect(practiceService).toBeDefined()
    expect(typeof practiceService.createSession).toBe('function')
    expect(typeof practiceService.submitAnswer).toBe('function')
    expect(typeof practiceService.endSession).toBe('function')
  })

  it('should import content service correctly', async () => {
    const { contentService } = await import('../services/content/contentService')
    expect(contentService).toBeDefined()
    expect(typeof contentService.getMathProblems).toBe('function')
    expect(typeof contentService.getReadingPassages).toBe('function')
    expect(typeof contentService.getEssayPrompts).toBe('function')
  })

  it('should import progress service correctly', async () => {
    const { progressService } = await import('../services/progressService')
    expect(progressService).toBeDefined()
    expect(typeof progressService.getUserProgress).toBe('function')
    expect(typeof progressService.updateUserProgress).toBe('function')
    expect(typeof progressService.getDashboardData).toBe('function')
  })
})

describe('Type Definitions', () => {
  it('should have practice types defined', async () => {
    // Import types to ensure they compile correctly
    const practiceTypes = await import('../types/practice')
    expect(practiceTypes).toBeDefined()
  })

  it('should have validation utilities defined', async () => {
    const validation = await import('../utils/practiceValidation')
    expect(validation.validateCreateSession).toBeDefined()
    expect(validation.validateSubmitAnswer).toBeDefined()
    expect(validation.validateGetProblems).toBeDefined()
  })
})