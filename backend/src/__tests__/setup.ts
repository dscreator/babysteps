// Test setup file
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { vi } from 'vitest'

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.RESEND_API_KEY = 'test-resend-key'
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Cleanup after tests
  vi.restoreAllMocks()
})

// Mock Supabase client for tests
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn()
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  }))
}

// Mock OpenAI client
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
}

// Test data factories
export const createTestUser = (overrides = {}) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 60) // 60 days from now
  
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    examDate: futureDate,
    gradeLevel: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export const createTestPracticeSession = (overrides = {}) => ({
  id: 'test-session-456',
  userId: 'test-user-123',
  subject: 'math',
  startTime: new Date(),
  endTime: new Date(),
  questionsAttempted: 10,
  questionsCorrect: 8,
  topics: ['arithmetic', 'algebra'],
  difficultyLevel: 2,
  ...overrides
})

export const createTestMathProblem = (overrides = {}) => ({
  id: 'test-problem-789',
  topic: 'arithmetic',
  difficulty: 2,
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctAnswer: '4',
  explanation: '2 + 2 equals 4',
  hints: ['Think about basic addition'],
  ...overrides
})