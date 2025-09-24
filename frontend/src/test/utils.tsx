import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock auth context for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  examDate: new Date('2024-06-01'),
  gradeLevel: 7,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockPracticeSession = (overrides = {}) => ({
  id: '456',
  userId: '123',
  subject: 'math' as const,
  startTime: new Date(),
  endTime: new Date(),
  questionsAttempted: 10,
  questionsCorrect: 8,
  topics: ['arithmetic', 'algebra'],
  difficultyLevel: 2,
  ...overrides
})

export const createMockMathProblem = (overrides = {}) => ({
  id: '789',
  topic: 'arithmetic',
  difficulty: 2,
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctAnswer: '4',
  explanation: '2 + 2 equals 4',
  hints: ['Think about basic addition'],
  ...overrides
})

export const createMockProgress = (overrides = {}) => ({
  userId: '123',
  subject: 'math',
  overallScore: 85,
  topicScores: { arithmetic: 90, algebra: 80 },
  streakDays: 5,
  totalPracticeTime: 3600,
  lastPracticeDate: new Date(),
  weakAreas: ['geometry'],
  strongAreas: ['arithmetic'],
  ...overrides
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }