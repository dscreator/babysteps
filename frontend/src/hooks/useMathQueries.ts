import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mathService, type MathPracticeFilters } from '../services/mathService'
import type { PracticeSessionResponse } from '../types/api'

// Query keys
export const mathQueryKeys = {
  all: ['math'] as const,
  problems: () => [...mathQueryKeys.all, 'problems'] as const,
  problemsWithFilters: (filters: MathPracticeFilters) => 
    [...mathQueryKeys.problems(), filters] as const,
  problem: (id: string) => [...mathQueryKeys.all, 'problem', id] as const,
  randomProblems: (count: number, gradeLevel?: number) => 
    [...mathQueryKeys.all, 'random', count, gradeLevel] as const,
  sessions: () => [...mathQueryKeys.all, 'sessions'] as const,
  session: (id: string) => [...mathQueryKeys.sessions(), id] as const,
  stats: () => [...mathQueryKeys.all, 'stats'] as const,
}

// Queries
export function useMathProblems(filters: MathPracticeFilters = {}) {
  return useQuery({
    queryKey: mathQueryKeys.problemsWithFilters(filters),
    queryFn: () => mathService.getMathProblems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useMathProblem(problemId: string) {
  return useQuery({
    queryKey: mathQueryKeys.problem(problemId),
    queryFn: () => mathService.getMathProblem(problemId),
    enabled: !!problemId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useRandomMathProblems(count: number = 5, gradeLevel?: number) {
  return useQuery({
    queryKey: mathQueryKeys.randomProblems(count, gradeLevel),
    queryFn: () => mathService.getRandomMathProblems(count, gradeLevel),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useMathSession(sessionId: string) {
  return useQuery({
    queryKey: mathQueryKeys.session(sessionId),
    queryFn: () => mathService.getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for active sessions
  })
}

export function useMathStats() {
  return useQuery({
    queryKey: mathQueryKeys.stats(),
    queryFn: () => mathService.getMathStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutations
export function useCreateMathSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: {
      topics?: string[]
      difficultyLevel?: number
      problemCount?: number
    }) => mathService.createMathSession(options),
    onSuccess: (session: PracticeSessionResponse) => {
      // Update sessions cache
      queryClient.invalidateQueries({ queryKey: mathQueryKeys.sessions() })
      
      // Add the new session to cache
      queryClient.setQueryData(mathQueryKeys.session(session.id), session)
    },
  })
}

export function useUpdateMathSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      sessionId, 
      updates 
    }: { 
      sessionId: string
      updates: {
        questionsAttempted?: number
        questionsCorrect?: number
        topics?: string[]
        sessionData?: any
      }
    }) => mathService.updateSession(sessionId, updates),
    onSuccess: (session: PracticeSessionResponse) => {
      // Update the specific session in cache
      queryClient.setQueryData(mathQueryKeys.session(session.id), session)
      
      // Invalidate sessions list to reflect changes
      queryClient.invalidateQueries({ queryKey: mathQueryKeys.sessions() })
    },
  })
}

export function useEndMathSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      sessionId, 
      finalData 
    }: { 
      sessionId: string
      finalData: {
        questionsAttempted: number
        questionsCorrect: number
        sessionData?: any
      }
    }) => mathService.endSession(sessionId, finalData),
    onSuccess: (session: PracticeSessionResponse) => {
      // Update the specific session in cache
      queryClient.setQueryData(mathQueryKeys.session(session.id), session)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: mathQueryKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: mathQueryKeys.stats() })
      
      // Invalidate progress queries if they exist
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function useSubmitMathAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (answerData: {
      sessionId: string
      questionId: string
      answer: string
      timeSpent: number
    }) => mathService.submitAnswer(answerData),
    onSuccess: (_, variables) => {
      // Invalidate the session to get updated stats
      queryClient.invalidateQueries({ 
        queryKey: mathQueryKeys.session(variables.sessionId) 
      })
    },
  })
}

// Custom hooks for common patterns
export function useMathPracticeData() {
  const topics = mathService.getAvailableTopics()
  const difficultyLevels = mathService.getDifficultyLevels()
  
  return {
    topics,
    difficultyLevels,
    topicLabels: {
      'arithmetic': 'Arithmetic',
      'algebra': 'Algebra', 
      'geometry': 'Geometry',
      'data-analysis': 'Data Analysis',
      'fractions': 'Fractions',
      'decimals': 'Decimals',
      'percentages': 'Percentages',
      'ratios': 'Ratios & Proportions',
      'proportions': 'Proportions',
      'basic-equations': 'Basic Equations',
      'coordinate-geometry': 'Coordinate Geometry',
      'probability': 'Probability',
      'statistics': 'Statistics'
    }
  }
}

export function useMathSessionManager(sessionId?: string) {
  const createSession = useCreateMathSession()
  const updateSession = useUpdateMathSession()
  const endSession = useEndMathSession()
  const submitAnswer = useSubmitMathAnswer()
  
  const sessionQuery = useMathSession(sessionId || '')
  
  return {
    // Session data
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error,
    
    // Mutations
    createSession: createSession.mutate,
    updateSession: updateSession.mutate,
    endSession: endSession.mutate,
    submitAnswer: submitAnswer.mutate,
    
    // Mutation states
    isCreating: createSession.isPending,
    isUpdating: updateSession.isPending,
    isEnding: endSession.isPending,
    isSubmitting: submitAnswer.isPending,
    
    // Mutation errors
    createError: createSession.error,
    updateError: updateSession.error,
    endError: endSession.error,
    submitError: submitAnswer.error,
  }
}