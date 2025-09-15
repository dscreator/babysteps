import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, Square, RotateCcw, BookOpen, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { ReadingPassage } from './ReadingPassage'
import { ReadingQuestion } from './ReadingQuestion'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { englishService } from '../../../services/englishService'
import { mathService } from '../../../services/mathService' // Reuse session management
import type { 
  ReadingPassage as ReadingPassageType, 
  ReadingQuestion as ReadingQuestionType,
  VocabularyWord,
  PracticeSessionResponse 
} from '../../../types/api'

interface EnglishSessionProps {
  gradeLevel?: number
  subjectArea?: string
  timeLimit?: number
  onSessionComplete?: (session: PracticeSessionResponse) => void
}

interface SessionState {
  session: PracticeSessionResponse | null
  passage: ReadingPassageType | null
  questions: ReadingQuestionType[]
  vocabulary: VocabularyWord[]
  currentQuestionIndex: number
  answers: Array<{
    questionId: string
    answer: string
    correct: boolean
    timeSpent: number
    feedback?: {
      correct: boolean
      explanation?: string
      correctAnswer?: string
    }
  }>
  isActive: boolean
  isPaused: boolean
  showFeedback: boolean
  sessionStartTime: number
  readingTimeSpent: number
  totalTimeSpent: number
  hasFinishedReading: boolean
}

export function EnglishSession({
  gradeLevel = 7,
  subjectArea,
  timeLimit = 2700, // 45 minutes default
  onSessionComplete
}: EnglishSessionProps) {
  const queryClient = useQueryClient()
  
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    passage: null,
    questions: [],
    vocabulary: [],
    currentQuestionIndex: 0,
    answers: [],
    isActive: false,
    isPaused: false,
    showFeedback: false,
    sessionStartTime: 0,
    readingTimeSpent: 0,
    totalTimeSpent: 0,
    hasFinishedReading: false
  })

  const [sessionTimer, setSessionTimer] = useState<number>(0)

  // Fetch reading passage and questions for the session
  const { data: practiceData, isLoading: practiceLoading } = useQuery({
    queryKey: ['english-practice', { gradeLevel, subjectArea }],
    queryFn: () => englishService.getRandomReadingPassage(gradeLevel),
    enabled: !sessionState.isActive && !sessionState.passage
  })

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => englishService.createEnglishSession({
      gradeLevel,
      subjectArea,
      timeLimit
    }),
    onSuccess: (session) => {
      setSessionState(prev => ({
        ...prev,
        session,
        isActive: true,
        sessionStartTime: Date.now()
      }))
      toast.success('English practice session started!')
    },
    onError: (error) => {
      toast.error(`Failed to start session: ${error.message}`)
    }
  })

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (answerData: {
      sessionId: string
      questionId: string
      answer: string
      timeSpent: number
    }) => englishService.submitAnswer(answerData),
    onSuccess: (feedback, variables) => {
      const newAnswer = {
        questionId: variables.questionId,
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

      // Update session progress using math service (same API)
      if (sessionState.session) {
        mathService.updateSession(sessionState.session.id, {
          questionsAttempted: sessionState.answers.length + 1,
          questionsCorrect: sessionState.answers.filter(a => a.correct).length + (feedback.correct ? 1 : 0)
        }).catch(error => {
          console.error('Failed to update session:', error)
        })
      }
    },
    onError: (error) => {
      toast.error(`Failed to submit answer: ${error.message}`)
    }
  })

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: () => {
      if (!sessionState.session) throw new Error('No active session')
      
      return mathService.endSession(sessionState.session.id, {
        questionsAttempted: sessionState.answers.length,
        questionsCorrect: sessionState.answers.filter(a => a.correct).length,
        sessionData: {
          passage: sessionState.passage,
          questions: sessionState.questions,
          answers: sessionState.answers,
          readingTimeSpent: sessionState.readingTimeSpent,
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
      
      queryClient.invalidateQueries({ queryKey: ['english-stats'] })
      queryClient.invalidateQueries({ queryKey: ['progress-dashboard'] })
      
      toast.success('English practice session completed!')
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

  // Initialize practice data when fetched
  useEffect(() => {
    if (practiceData && !sessionState.passage) {
      setSessionState(prev => ({
        ...prev,
        passage: practiceData.passage,
        questions: practiceData.questions,
        vocabulary: practiceData.vocabulary || []
      }))
    }
  }, [practiceData, sessionState.passage])

  const handleStartSession = useCallback(() => {
    if (!sessionState.passage || sessionState.questions.length === 0) {
      toast.error('No practice content available. Please try again.')
      return
    }
    
    createSessionMutation.mutate()
  }, [sessionState.passage, sessionState.questions.length, createSessionMutation])

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
      passage: null,
      questions: [],
      vocabulary: [],
      currentQuestionIndex: 0,
      answers: [],
      isActive: false,
      isPaused: false,
      showFeedback: false,
      sessionStartTime: 0,
      readingTimeSpent: 0,
      totalTimeSpent: 0,
      hasFinishedReading: false
    })
    setSessionTimer(0)
    queryClient.invalidateQueries({ queryKey: ['english-practice'] })
  }, [queryClient])

  const handleFinishReading = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      hasFinishedReading: true,
      readingTimeSpent: sessionTimer
    }))
  }, [sessionTimer])

  const handleSubmitAnswer = useCallback((answer: string, timeSpent: number) => {
    if (!sessionState.session || !sessionState.questions[sessionState.currentQuestionIndex]) {
      return
    }

    const currentQuestion = sessionState.questions[sessionState.currentQuestionIndex]
    
    submitAnswerMutation.mutate({
      sessionId: sessionState.session.id,
      questionId: currentQuestion.id,
      answer,
      timeSpent
    })
  }, [sessionState.session, sessionState.questions, sessionState.currentQuestionIndex, submitAnswerMutation])

  const handleNextQuestion = useCallback(() => {
    const nextIndex = sessionState.currentQuestionIndex + 1
    
    if (nextIndex >= sessionState.questions.length) {
      // Session complete
      handleEndSession()
      return
    }

    setSessionState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      showFeedback: false
    }))
  }, [sessionState.currentQuestionIndex, sessionState.questions.length, handleEndSession])

  const handleReadingTimeUpdate = useCallback((timeSpent: number) => {
    if (!sessionState.hasFinishedReading) {
      setSessionState(prev => ({
        ...prev,
        readingTimeSpent: timeSpent
      }))
    }
  }, [sessionState.hasFinishedReading])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionProgress = () => {
    const completed = sessionState.answers.length
    const total = sessionState.questions.length
    const correct = sessionState.answers.filter(a => a.correct).length
    const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0
    
    return { completed, total, correct, accuracy }
  }

  // Loading state
  if (practiceLoading || createSessionMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          {practiceLoading ? 'Loading reading passage...' : 'Starting session...'}
        </span>
      </div>
    )
  }

  // Pre-session state
  if (!sessionState.isActive && !sessionState.session) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">English Practice Session</h2>
            <p className="text-gray-600 mb-6">
              Ready to practice reading comprehension and vocabulary
              {subjectArea && ` with ${subjectArea} content`}
            </p>

            {sessionState.passage && (
              <div className="text-left mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Today's Reading:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{sessionState.passage.title}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{sessionState.passage.wordCount} words</span>
                    <span>{sessionState.questions.length} questions</span>
                    {sessionState.vocabulary.length > 0 && (
                      <span>{sessionState.vocabulary.length} vocabulary words</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Questions</div>
                <div className="text-gray-600">{sessionState.questions.length} questions</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Time Limit</div>
                <div className="text-gray-600">{formatTime(timeLimit)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Grade Level</div>
                <div className="text-gray-600">Grade {gradeLevel}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Subject</div>
                <div className="text-gray-600">
                  {subjectArea || 'Mixed topics'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartSession}
              disabled={!sessionState.passage || sessionState.questions.length === 0}
              size="lg"
              className="px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Reading Practice
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
            <p className="text-gray-600 mb-6">Great job on completing your English practice session.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{progress.completed}</div>
                <div className="text-sm text-gray-600">Questions Completed</div>
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
                <div className="text-sm text-gray-600">Total Time</div>
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
  const progress = getSessionProgress()
  const currentQuestion = sessionState.questions[sessionState.currentQuestionIndex]
  const currentAnswer = sessionState.answers[sessionState.currentQuestionIndex]

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
                  {sessionState.hasFinishedReading ? `${progress.completed} / ${progress.total} questions` : 'Reading passage'}
                </span>
              </div>
              {sessionState.hasFinishedReading && (
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Accuracy: </span>
                  <span className={`${progress.accuracy >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {progress.accuracy}%
                  </span>
                </div>
              )}
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
          {sessionState.hasFinishedReading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Reading Phase */}
      {!sessionState.hasFinishedReading && sessionState.passage && (
        <div className="space-y-6">
          <ReadingPassage
            passage={sessionState.passage}
            vocabulary={sessionState.vocabulary}
            timeSpent={sessionState.readingTimeSpent}
            onTimeUpdate={handleReadingTimeUpdate}
          />
          
          <div className="text-center">
            <Button
              onClick={handleFinishReading}
              size="lg"
              className="px-8"
              disabled={sessionState.isPaused}
            >
              Finished Reading - Start Questions
            </Button>
          </div>
        </div>
      )}

      {/* Questions Phase */}
      {sessionState.hasFinishedReading && currentQuestion && (
        <div className="space-y-6">
          <ReadingQuestion
            question={currentQuestion}
            questionNumber={sessionState.currentQuestionIndex + 1}
            totalQuestions={sessionState.questions.length}
            onSubmit={handleSubmitAnswer}
            showFeedback={sessionState.showFeedback}
            feedback={currentAnswer?.feedback}
            disabled={sessionState.isPaused || submitAnswerMutation.isPending}
            timeLimit={Math.floor((timeLimit - sessionState.readingTimeSpent) / sessionState.questions.length)}
          />

          {/* Next Question Button */}
          {sessionState.showFeedback && (
            <div className="text-center">
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="px-8"
              >
                {sessionState.currentQuestionIndex + 1 >= sessionState.questions.length
                  ? 'Complete Session'
                  : 'Next Question'
                }
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}