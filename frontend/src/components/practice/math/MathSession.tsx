import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, Square, RotateCcw, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { MathProblem } from './MathProblem'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { mathService } from '../../../services/mathService'
import type { MathProblem as MathProblemType, PracticeSessionResponse } from '../../../types/api'

interface MathSessionProps {
  topics?: string[]
  difficultyLevel?: number
  problemCount?: number
  timeLimit?: number
  onSessionComplete?: (session: PracticeSessionResponse) => void
}

interface SessionState {
  session: PracticeSessionResponse | null
  problems: MathProblemType[]
  currentProblemIndex: number
  answers: Array<{
    problemId: string
    answer: string
    correct: boolean
    timeSpent: number
    feedback?: {
      correct: boolean
      explanation?: string
      correctAnswer?: string
      hints?: string[]
    }
  }>
  isActive: boolean
  isPaused: boolean
  showFeedback: boolean
  sessionStartTime: number
  totalTimeSpent: number
  sessionData: {
    failedSubmissions?: Array<{
      problemId?: string
      answer: string
      timeSpent: number
      error: string
      timestamp: string
    }>
    [key: string]: any
  }
}

export function MathSession({
  topics = [],
  difficultyLevel = 2,
  problemCount = 10,
  timeLimit = 1800, // 30 minutes default
  onSessionComplete
}: MathSessionProps) {
  const queryClient = useQueryClient()
  
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    problems: [],
    currentProblemIndex: 0,
    answers: [],
    isActive: false,
    isPaused: false,
    showFeedback: false,
    sessionStartTime: 0,
    totalTimeSpent: 0,
    sessionData: {}
  })

  const [sessionTimer, setSessionTimer] = useState<number>(0)

  // Fetch problems for the session
  const { data: problems, isLoading: problemsLoading } = useQuery({
    queryKey: ['math-problems', { topics, difficultyLevel, count: problemCount }],
    queryFn: () => mathService.getRandomMathProblems(problemCount, 7), // Grade 7 default
    enabled: !sessionState.isActive && sessionState.problems.length === 0
  })

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => mathService.createMathSession({
      topics: topics.length > 0 ? topics : undefined,
      difficultyLevel,
      problemCount
    }),
    onSuccess: (session) => {
      setSessionState(prev => ({
        ...prev,
        session,
        isActive: true,
        sessionStartTime: Date.now()
      }))
      toast.success('Math practice session started!')
    },
    onError: (error) => {
      toast.error(`Failed to start session: ${error.message}`)
    }
  })

  // Submit answer mutation with enhanced error handling
  const submitAnswerMutation = useMutation({
    mutationFn: (answerData: {
      sessionId: string
      questionId: string
      answer: string
      timeSpent: number
    }) => mathService.submitAnswer(answerData),
    onSuccess: (feedback, variables) => {
      const newAnswer = {
        problemId: variables.questionId,
        answer: variables.answer,
        correct: feedback.correct,
        timeSpent: variables.timeSpent,
        feedback
      }

      setSessionState(prev => ({
        ...prev,
        answers: [...prev.answers, newAnswer],
        showFeedback: true
      }))

      // Update session progress
      if (sessionState.session) {
        updateSessionMutation.mutate({
          sessionId: sessionState.session.id,
          questionsAttempted: sessionState.answers.length + 1,
          questionsCorrect: sessionState.answers.filter(a => a.correct).length + (feedback.correct ? 1 : 0)
        })
      }
    },
    onError: (error) => {
      console.error('Submit answer error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to submit answer'
      
      if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      } else if (error.message?.includes('server')) {
        errorMessage = 'Server error. Please try again in a moment.'
      }
      
      toast.error(errorMessage)
      
      // Optionally store the answer locally for retry
      const answerData = {
        problemId: sessionState.problems[sessionState.currentProblemIndex]?.id,
        answer: '',
        timeSpent: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      }
      
      // Store in session data for potential retry
      setSessionState(prev => ({
        ...prev,
        sessionData: {
          ...prev.sessionData,
          failedSubmissions: [
            ...(prev.sessionData.failedSubmissions || []),
            answerData
          ]
        }
      }))
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && (!navigator.onLine || error.message?.includes('network'))) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  })

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: (data: {
      sessionId: string
      questionsAttempted: number
      questionsCorrect: number
    }) => mathService.updateSession(data.sessionId, {
      questionsAttempted: data.questionsAttempted,
      questionsCorrect: data.questionsCorrect,
      sessionData: {
        currentProblemIndex: sessionState.currentProblemIndex,
        answers: sessionState.answers,
        totalTimeSpent: sessionTimer
      }
    })
  })

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: () => {
      if (!sessionState.session) throw new Error('No active session')
      
      return mathService.endSession(sessionState.session.id, {
        questionsAttempted: sessionState.answers.length,
        questionsCorrect: sessionState.answers.filter(a => a.correct).length,
        sessionData: {
          problems: sessionState.problems,
          answers: sessionState.answers,
          totalTimeSpent: sessionTimer
        }
      })
    },
    onSuccess: (completedSession) => {
      setSessionState(prev => ({
        ...prev,
        session: completedSession,
        isActive: false,
        isPaused: false
      }))
      
      queryClient.invalidateQueries({ queryKey: ['math-stats'] })
      queryClient.invalidateQueries({ queryKey: ['progress-dashboard'] })
      
      toast.success('Math practice session completed!')
      onSessionComplete?.(completedSession)
    },
    onError: (error) => {
      toast.error(`Failed to end session: ${error.message}`)
    }
  })

  // Session timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (sessionState.isActive && !sessionState.isPaused) {
      interval = setInterval(() => {
        setSessionTimer(prev => {
          const newTime = prev + 1
          
          // Auto-end session if time limit reached
          if (timeLimit && newTime >= timeLimit) {
            handleEndSession()
            return prev
          }
          
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionState.isActive, sessionState.isPaused, timeLimit])

  // Initialize problems when fetched
  useEffect(() => {
    if (problems && problems.length > 0 && sessionState.problems.length === 0) {
      setSessionState(prev => ({
        ...prev,
        problems
      }))
    }
  }, [problems, sessionState.problems.length])

  const handleStartSession = useCallback(() => {
    if (sessionState.problems.length === 0) {
      toast.error('No problems available. Please try again.')
      return
    }
    
    createSessionMutation.mutate()
  }, [sessionState.problems.length, createSessionMutation])

  const handlePauseSession = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }))
  }, [])

  const handleEndSession = useCallback(() => {
    if (sessionState.session) {
      endSessionMutation.mutate()
    }
  }, [sessionState.session, endSessionMutation])

  const handleRestartSession = useCallback(() => {
    setSessionState({
      session: null,
      problems: [],
      currentProblemIndex: 0,
      answers: [],
      isActive: false,
      isPaused: false,
      showFeedback: false,
      sessionStartTime: 0,
      totalTimeSpent: 0,
      sessionData: {}
    })
    setSessionTimer(0)
    queryClient.invalidateQueries({ queryKey: ['math-problems'] })
  }, [queryClient])

  const handleSubmitAnswer = useCallback((answer: string, timeSpent: number) => {
    if (!sessionState.session || !sessionState.problems[sessionState.currentProblemIndex]) {
      return
    }

    const currentProblem = sessionState.problems[sessionState.currentProblemIndex]
    
    submitAnswerMutation.mutate({
      sessionId: sessionState.session.id,
      questionId: currentProblem.id,
      answer,
      timeSpent
    })
  }, [sessionState.session, sessionState.problems, sessionState.currentProblemIndex, submitAnswerMutation])

  const handleNextProblem = useCallback(() => {
    const nextIndex = sessionState.currentProblemIndex + 1
    
    if (nextIndex >= sessionState.problems.length) {
      // Session complete
      handleEndSession()
      return
    }

    setSessionState(prev => ({
      ...prev,
      currentProblemIndex: nextIndex,
      showFeedback: false
    }))
  }, [sessionState.currentProblemIndex, sessionState.problems.length, handleEndSession])

  const handleRequestHint = useCallback((hintIndex: number) => {
    if (!sessionState.session || !sessionState.problems[sessionState.currentProblemIndex]) {
      return
    }

    const currentProblem = sessionState.problems[sessionState.currentProblemIndex]
    
    // Track hint usage
    mathService.trackHintUsage(sessionState.session.id, currentProblem.id, hintIndex)
      .catch(error => {
        console.error('Failed to track hint usage:', error)
        // Don't block the UI for tracking failures
      })
  }, [sessionState.session, sessionState.problems, sessionState.currentProblemIndex])

  const handleHintUsageTracked = useCallback((hintIndex: number, timeSpent: number) => {
    if (!sessionState.session || !sessionState.problems[sessionState.currentProblemIndex]) {
      return
    }

    const currentProblem = sessionState.problems[sessionState.currentProblemIndex]
    
    // Track detailed hint usage with time spent
    mathService.trackHintUsage(sessionState.session.id, currentProblem.id, hintIndex, timeSpent)
      .catch(error => {
        console.error('Failed to track detailed hint usage:', error)
      })
  }, [sessionState.session, sessionState.problems, sessionState.currentProblemIndex])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionProgress = () => {
    const completed = sessionState.answers.length
    const total = sessionState.problems.length
    const correct = sessionState.answers.filter(a => a.correct).length
    const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0
    
    return { completed, total, correct, accuracy }
  }

  // Loading state
  if (problemsLoading || createSessionMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          {problemsLoading ? 'Loading problems...' : 'Starting session...'}
        </span>
      </div>
    )
  }

  // Pre-session state
  if (!sessionState.isActive && !sessionState.session) {
    // const progress = getSessionProgress()
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Math Practice Session</h2>
            <p className="text-gray-600 mb-6">
              Ready to practice {problemCount} math problems
              {topics.length > 0 && ` focusing on ${topics.join(', ')}`}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Problems</div>
                <div className="text-gray-600">{problemCount} questions</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Time Limit</div>
                <div className="text-gray-600">{formatTime(timeLimit)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Difficulty</div>
                <div className="text-gray-600">Level {difficultyLevel}/4</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Topics</div>
                <div className="text-gray-600">
                  {topics.length > 0 ? `${topics.length} selected` : 'All topics'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartSession}
              disabled={!problems || problems.length === 0}
              size="lg"
              className="px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Practice Session
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Session complete state
  if (sessionState.session && !sessionState.isActive) {
    const progress = getSessionProgress()
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
            <p className="text-gray-600 mb-6">Great job on completing your math practice session.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{progress.completed}</div>
                <div className="text-sm text-gray-600">Problems Completed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{progress.correct}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatTime(sessionTimer)}</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRestartSession}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Practice Again
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Active session state
  const currentProblem = sessionState.problems[sessionState.currentProblemIndex]
  const progress = getSessionProgress()
  const currentAnswer = sessionState.answers[sessionState.currentProblemIndex]

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading problem...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Session Header */}
      <div className="mb-6">
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-medium text-gray-900">Progress: </span>
                <span className="text-gray-600">
                  {progress.completed} / {progress.total} problems
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">Accuracy: </span>
                <span className={`${progress.accuracy >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {progress.accuracy}%
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">Time: </span>
                <span className="font-mono text-gray-600">{formatTime(sessionTimer)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseSession}
                disabled={sessionState.showFeedback}
              >
                {sessionState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {sessionState.isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndSession}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Square className="w-4 h-4 mr-1" />
                End Session
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Current Problem */}
      <div className="mb-6">
        <MathProblem
          problem={currentProblem}
          onSubmit={handleSubmitAnswer}
          onRequestHint={handleRequestHint}
          onHintUsageTracked={handleHintUsageTracked}
          showFeedback={sessionState.showFeedback}
          feedback={currentAnswer?.feedback}
          disabled={sessionState.isPaused || submitAnswerMutation.isPending}
          questionNumber={sessionState.currentProblemIndex + 1}
          totalQuestions={sessionState.problems.length}
          maxHintsAllowed={3}
        />
      </div>

      {/* Next Problem Button */}
      {sessionState.showFeedback && (
        <div className="text-center">
          <Button
            onClick={handleNextProblem}
            size="lg"
            className="px-8"
          >
            {sessionState.currentProblemIndex + 1 >= sessionState.problems.length
              ? 'Complete Session'
              : 'Next Problem'
            }
          </Button>
        </div>
      )}
    </div>
  )
}