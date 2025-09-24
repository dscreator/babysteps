import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockSupabaseClient, createTestUser, createTestPracticeSession } from './setup'

// Mock Supabase client
vi.mock('../config/supabase', () => ({
  supabase: mockSupabaseClient
}))

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Operations', () => {
    it('creates a new user profile', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      const testUser = createTestUser()
      
      mockSupabaseClient.from().insert().mockResolvedValue({
        data: [testUser],
        error: null
      })

      const result = await userRepository.createUser(testUser)

      expect(result).toEqual(testUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(testUser)
    })

    it('retrieves user by ID', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      const testUser = createTestUser()
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: testUser,
        error: null
      })

      const result = await userRepository.getUserById('test-user-123')

      expect(result).toEqual(testUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'test-user-123')
    })

    it('updates user profile', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      const updatedUser = createTestUser({ firstName: 'Updated' })
      
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: updatedUser,
        error: null
      })

      const result = await userRepository.updateUser('test-user-123', { firstName: 'Updated' })

      expect(result).toEqual(updatedUser)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({ firstName: 'Updated' })
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'test-user-123')
    })

    it('handles user not found error', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      await expect(userRepository.getUserById('non-existent')).rejects.toThrow('User not found')
    })
  })

  describe('Practice Session Operations', () => {
    it('creates a practice session', async () => {
      const { practiceRepository } = await import('../repositories/practiceRepository')
      const testSession = createTestPracticeSession()
      
      mockSupabaseClient.from().insert().single.mockResolvedValue({
        data: testSession,
        error: null
      })

      const result = await practiceRepository.createSession(testSession)

      expect(result).toEqual(testSession)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('practice_sessions')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(testSession)
    })

    it('retrieves user session history', async () => {
      const { practiceRepository } = await import('../repositories/practiceRepository')
      const testSessions = [
        createTestPracticeSession(),
        createTestPracticeSession({ id: 'session-2', subject: 'english' })
      ]
      
      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValue({
        data: testSessions,
        error: null
      })

      const result = await practiceRepository.getUserSessions('test-user-123', { limit: 10 })

      expect(result).toEqual(testSessions)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('practice_sessions')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('user_id', 'test-user-123')
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(10)
    })

    it('updates session with end time and results', async () => {
      const { practiceRepository } = await import('../repositories/practiceRepository')
      const updatedSession = createTestPracticeSession({ 
        endTime: new Date(),
        questionsCorrect: 8,
        questionsAttempted: 10
      })
      
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: updatedSession,
        error: null
      })

      const result = await practiceRepository.endSession('test-session-456', {
        endTime: updatedSession.endTime,
        questionsCorrect: 8,
        questionsAttempted: 10
      })

      expect(result).toEqual(updatedSession)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        endTime: updatedSession.endTime,
        questionsCorrect: 8,
        questionsAttempted: 10
      })
    })
  })

  describe('Content Operations', () => {
    it('retrieves math problems with filters', async () => {
      const { contentRepository } = await import('../repositories/contentRepository')
      const mockProblems = [
        { id: '1', topic: 'arithmetic', difficulty: 2, question: 'What is 2+2?' },
        { id: '2', topic: 'arithmetic', difficulty: 2, question: 'What is 3+3?' }
      ]
      
      mockSupabaseClient.from().select().eq().eq().limit.mockResolvedValue({
        data: mockProblems,
        error: null
      })

      const result = await contentRepository.getMathProblems({
        topic: 'arithmetic',
        difficulty: 2,
        limit: 10
      })

      expect(result).toEqual(mockProblems)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('math_problems')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('topic', 'arithmetic')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('difficulty', 2)
    })

    it('retrieves reading passages with questions', async () => {
      const { contentRepository } = await import('../repositories/contentRepository')
      const mockPassages = [
        {
          id: '1',
          title: 'Test Passage',
          content: 'This is a test passage...',
          questions: [
            { id: '1', question: 'What is the main idea?', options: ['A', 'B', 'C', 'D'] }
          ]
        }
      ]
      
      mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
        data: mockPassages,
        error: null
      })

      const result = await contentRepository.getReadingPassages({
        gradeLevel: 7,
        limit: 5
      })

      expect(result).toEqual(mockPassages)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reading_passages')
    })
  })

  describe('Progress Tracking Operations', () => {
    it('updates user progress after session', async () => {
      const { progressRepository } = await import('../repositories/progressRepository')
      const progressUpdate = {
        userId: 'test-user-123',
        subject: 'math',
        sessionScore: 0.8,
        topicsPerformance: { arithmetic: 0.9, algebra: 0.7 }
      }
      
      mockSupabaseClient.from().upsert().mockResolvedValue({
        data: [{ ...progressUpdate, overallScore: 85 }],
        error: null
      })

      const result = await progressRepository.updateProgress(progressUpdate)

      expect(result.overallScore).toBe(85)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_progress')
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining(progressUpdate)
      )
    })

    it('retrieves comprehensive progress data', async () => {
      const { progressRepository } = await import('../repositories/progressRepository')
      const mockProgress = {
        overall: { math: 85, english: 78, essay: 82 },
        trends: [
          { date: '2024-01-01', math: 80, english: 75, essay: 78 },
          { date: '2024-01-02', math: 85, english: 78, essay: 82 }
        ],
        weakAreas: ['geometry', 'vocabulary'],
        strongAreas: ['arithmetic', 'grammar']
      }
      
      mockSupabaseClient.from().select().eq().mockResolvedValue({
        data: mockProgress,
        error: null
      })

      const result = await progressRepository.getProgressSummary('test-user-123')

      expect(result).toEqual(mockProgress)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_progress')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('user_id', 'test-user-123')
    })
  })

  describe('Transaction Operations', () => {
    it('handles database transactions correctly', async () => {
      const { practiceRepository } = await import('../repositories/practiceRepository')
      
      // Mock successful transaction
      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null })
      mockSupabaseClient.from().update().mockResolvedValue({ data: [{}], error: null })

      const sessionData = createTestPracticeSession()
      const progressData = { userId: 'test-user-123', sessionScore: 0.8 }

      await expect(
        practiceRepository.createSessionWithProgress(sessionData, progressData)
      ).resolves.not.toThrow()
    })

    it('rolls back on transaction failure', async () => {
      const { practiceRepository } = await import('../repositories/practiceRepository')
      
      // Mock transaction failure
      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null })
      mockSupabaseClient.from().update().mockResolvedValue({ 
        data: null, 
        error: { message: 'Update failed' } 
      })

      const sessionData = createTestPracticeSession()
      const progressData = { userId: 'test-user-123', sessionScore: 0.8 }

      await expect(
        practiceRepository.createSessionWithProgress(sessionData, progressData)
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Data Validation', () => {
    it('validates data before database operations', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      
      const invalidUser = {
        email: 'invalid-email',
        firstName: '',
        gradeLevel: 15 // Invalid grade level
      }

      await expect(userRepository.createUser(invalidUser)).rejects.toThrow('validation')
    })

    it('sanitizes input data', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      
      const userWithScriptTag = createTestUser({
        firstName: '<script>alert("xss")</script>John'
      })
      
      mockSupabaseClient.from().insert().mockResolvedValue({
        data: [{ ...userWithScriptTag, firstName: 'John' }],
        error: null
      })

      const result = await userRepository.createUser(userWithScriptTag)

      expect(result.firstName).toBe('John')
      expect(result.firstName).not.toContain('<script>')
    })
  })

  describe('Connection and Error Handling', () => {
    it('handles database connection errors', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      
      mockSupabaseClient.from().select().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
      })

      await expect(userRepository.getUserById('test-user-123')).rejects.toThrow('Connection failed')
    })

    it('retries failed operations', async () => {
      const { userRepository } = await import('../repositories/userRepository')
      
      // First call fails, second succeeds
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Temporary error', code: 'TEMP_ERROR' }
        })
        .mockResolvedValueOnce({
          data: createTestUser(),
          error: null
        })

      const result = await userRepository.getUserById('test-user-123')

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from().select).toHaveBeenCalledTimes(2)
    })
  })
})