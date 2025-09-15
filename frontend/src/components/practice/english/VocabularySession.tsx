import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, Square, RotateCcw, BookOpen, TrendingUp, Shuffle } from 'lucide-react'
import toast from 'react-hot-toast'
import { VocabularyCard } from './VocabularyCard'
import { VocabularyQuiz } from './VocabularyQuiz'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { englishService } from '../../../services/englishService'
import { mathService } from '../../../services/mathService' // Reuse session management
import type { VocabularyWord, PracticeSessionResponse } from '../../../types/api'

interface VocabularySessionProps {
  mode?: 'flashcards' | 'quiz' | 'mixed'
  gradeLevel?: number
  difficultyLevel?: number
  wordCount?: number
  onSessionComplete?: (session: PracticeSessionResponse) => void
}

interface SpacedRepetitionData {
  wordId: string
  interval: number // days until next review
  repetitions: number
  easeFactor: number
  nextReviewDate: Date
  lastReviewed: Date
}

interface SessionState {
  session: PracticeSessionResponse | null
  words: VocabularyWord[]
  currentWordIndex: number
  mode: 'flashcards' | 'quiz'
  spacedRepetitionData: Record<string, SpacedRepetitionData>
  answers: Array<{
    wordId: string
    correct: boolean
    timeSpent: number
    difficulty: 'easy' | 'medium' | 'hard' | 'again'
    mode: 'flashcards' | 'quiz'
    questionType?: string
  }>
  isActive: boolean
  isPaused: boolean
  showFeedback: boolean
  sessionStartTime: number
  totalTimeSpent: number
}

export function VocabularySession({
  mode = 'mixed',
  gradeLevel = 7,
  difficultyLevel,
  wordCount = 20,
  onSessionComplete
}: VocabularySessionProps) {
  const queryClient = useQueryClient()
  
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    words: [],
    currentWordIndex: 0,
    mode: mode === 'mixed' ? 'flashcards' : mode,
    spacedRepetitionData: {},
    answers: [],
    isActive: false,
    isPaused: false,
    showFeedback: false,
    sessionStartTime: 0,
    totalTimeSpent: 0
  })

  const [sessionTimer, setSessionTimer] = useState<number>(0)

  // Fetch vocabulary words for the session
  const { data: vocabularyWords, isLoading: wordsLoading } = useQuery({
    queryKey: ['vocabulary-words', { gradeLevel, difficultyLevel, limit: wordCount }],
    queryFn: () => englishService.getVocabularyWords({
      gradeLevel,
      difficultyLevel,
      limit: wordCount
    }),
    enabled: !sessionState.isActive && sessionState.words.length === 0
  })

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => englishService.createEnglishSession({
      gradeLevel,
      timeLimit: 1800 // 30 minutes for vocabulary
    }),
    onSuccess: (session) => {
      setSessionState(prev => ({
        ...prev,
        session,
        isActive: true,
        sessionStartTime: Date.now()
      }))
      toast.success('Vocabulary practice session started!')
    },
    onError: (error) => {
      toast.error(`Failed to start session: ${error.message}`)
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
          words: sessionState.words,
          answers: sessionState.answers,
          spacedRepetitionData: sessionState.spacedRepetitionData,
          totalTimeSpent: sessionTimer,
          mode: sessionState.mode
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
      
      toast.success('Vocabulary practice session completed!')
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
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionState.isActive, sessionState.isPaused])

  // Initialize words and spaced repetition data when fetched
  useEffect(() => {
    if (vocabularyWords && vocabularyWords.length > 0 && sessionState.words.length === 0) {
      // Load existing spaced repetition data from localStorage
      const savedData = localStorage.getItem('vocabulary-spaced-repetition')
      const existingData = savedData ? JSON.parse(savedData) : {}

      // Initialize spaced repetition data for new words
      const spacedRepetitionData: Record<string, SpacedRepetitionData> = {}
      
      vocabularyWords.forEach(word => {
        if (existingData[word.id]) {
          spacedRepetitionData[word.id] = {
            ...existingData[word.id],
            nextReviewDate: new Date(existingData[word.id].nextReviewDate),
            lastReviewed: new Date(existingData[word.id].lastReviewed)
          }
        } else {
          spacedRepetitionData[word.id] = {
            wordId: word.id,
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date(),
            lastReviewed: new Date()
          }
        }
      })

      // Sort words by spaced repetition priority (due for review first)
      const sortedWords = [...vocabularyWords].sort((a, b) => {
        const aData = spacedRepetitionData[a.id]
        const bData = spacedRepetitionData[b.id]
        return aData.nextReviewDate.getTime() - bData.nextReviewDate.getTime()
      })

      setSessionState(prev => ({
        ...prev,
        words: sortedWords,
        spacedRepetitionData
      }))
    }
  }, [vocabularyWords, sessionState.words.length])

  // Spaced repetition algorithm (SM-2)
  const updateSpacedRepetition = useCallback((
    wordId: string, 
    rating: 'easy' | 'medium' | 'hard' | 'again'
  ) => {
    setSessionState(prev => {
      const data = prev.spacedRepetitionData[wordId]
      if (!data) return prev

      let quality: number
      switch (rating) {
        case 'again': quality = 0; break
        case 'hard': quality = 2; break
        case 'medium': quality = 3; break
        case 'easy': quality = 5; break
        default: quality = 3
      }

      let newInterval: number
      let newRepetitions: number
      let newEaseFactor: number

      if (quality < 3) {
        // Incorrect response - reset
        newRepetitions = 0
        newInterval = 1
        newEaseFactor = data.easeFactor
      } else {
        // Correct response
        newRepetitions = data.repetitions + 1
        newEaseFactor = Math.max(1.3, data.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        if (newRepetitions === 1) {
          newInterval = 1
        } else if (newRepetitions === 2) {
          newInterval = 6
        } else {
          newInterval = Math.round(data.interval * newEaseFactor)
        }
      }

      const nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

      const updatedData = {
        ...data,
        interval: newInterval,
        repetitions: newRepetitions,
        easeFactor: newEaseFactor,
        nextReviewDate,
        lastReviewed: new Date()
      }

      const newSpacedRepetitionData = {
        ...prev.spacedRepetitionData,
        [wordId]: updatedData
      }

      // Save to localStorage
      localStorage.setItem('vocabulary-spaced-repetition', JSON.stringify(newSpacedRepetitionData))

      return {
        ...prev,
        spacedRepetitionData: newSpacedRepetitionData
      }
    })
  }, [])

  const handleStartSession = useCallback(() => {
    if (sessionState.words.length === 0) {
      toast.error('No vocabulary words available. Please try again.')
      return
    }
    
    createSessionMutation.mutate()
  }, [sessionState.words.length, createSessionMutation])

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
      words: [],
      currentWordIndex: 0,
      mode: mode === 'mixed' ? 'flashcards' : mode,
      spacedRepetitionData: {},
      answers: [],
      isActive: false,
      isPaused: false,
      showFeedback: false,
      sessionStartTime: 0,
      totalTimeSpent: 0
    })
    setSessionTimer(0)
    queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] })
  }, [mode, queryClient])

  const handleFlashcardRate = useCallback((rating: 'easy' | 'medium' | 'hard' | 'again') => {
    const currentWord = sessionState.words[sessionState.currentWordIndex]
    if (!currentWord) return

    const newAnswer = {
      wordId: currentWord.id,
      correct: rating !== 'again',
      timeSpent: Math.floor((Date.now() - sessionState.sessionStartTime) / 1000),
      difficulty: rating,
      mode: 'flashcards' as const
    }

    setSessionState(prev => ({
      ...prev,
      answers: [...prev.answers, newAnswer]
    }))

    // Update spaced repetition
    updateSpacedRepetition(currentWord.id, rating)

    // Move to next word or switch mode
    handleNextWord()
  }, [sessionState.words, sessionState.currentWordIndex, sessionState.sessionStartTime, updateSpacedRepetition])

  const handleQuizAnswer = useCallback((wordId: string, correct: boolean, timeSpent: number, questionType: string) => {
    const newAnswer = {
      wordId,
      correct,
      timeSpent,
      difficulty: correct ? 'medium' : 'again' as const,
      mode: 'quiz' as const,
      questionType
    }

    setSessionState(prev => ({
      ...prev,
      answers: [...prev.answers, newAnswer],
      showFeedback: true
    }))

    // Update spaced repetition based on correctness
    updateSpacedRepetition(wordId, correct ? 'medium' : 'again')
  }, [updateSpacedRepetition])

  const handleNextWord = useCallback(() => {
    const nextIndex = sessionState.currentWordIndex + 1
    
    if (nextIndex >= sessionState.words.length) {
      // Session complete
      handleEndSession()
      return
    }

    // Switch between flashcards and quiz in mixed mode
    let nextMode = sessionState.mode
    if (mode === 'mixed') {
      nextMode = Math.random() > 0.5 ? 'flashcards' : 'quiz'
    }

    setSessionState(prev => ({
      ...prev,
      currentWordIndex: nextIndex,
      mode: nextMode,
      showFeedback: false
    }))
  }, [sessionState.currentWordIndex, sessionState.words.length, sessionState.mode, mode, handleEndSession])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionProgress = () => {
    const completed = sessionState.answers.length
    const total = sessionState.words.length
    const correct = sessionState.answers.filter(a => a.correct).length
    const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0
    
    return { completed, total, correct, accuracy }
  }

  // Loading state
  if (wordsLoading || createSessionMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          {wordsLoading ? 'Loading vocabulary words...' : 'Starting session...'}
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
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vocabulary Practice</h2>
            <p className="text-gray-600 mb-6">
              Learn and review vocabulary words using spaced repetition for better retention
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Words</div>
                <div className="text-gray-600">{sessionState.words.length} words</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Mode</div>
                <div className="text-gray-600 capitalize">{mode}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Grade Level</div>
                <div className="text-gray-600">Grade {gradeLevel}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-900">Difficulty</div>
                <div className="text-gray-600">
                  {difficultyLevel ? `Level ${difficultyLevel}` : 'Mixed'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartSession}
              disabled={sessionState.words.length === 0}
              size="lg"
              className="px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Vocabulary Practice
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
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
            <p className="text-gray-600 mb-6">Great job practicing vocabulary with spaced repetition.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{progress.completed}</div>
                <div className="text-sm text-gray-600">Words Practiced</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{progress.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatTime(sessionTimer)}</div>
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
  const progress = getSessionProgress()
  const currentWord = sessionState.words[sessionState.currentWordIndex]

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading word...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Session Header */}
      <div className="mb-6">
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-medium text-gray-900">Progress: </span>
                <span className="text-gray-600">
                  {progress.completed} / {progress.total} words
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">Accuracy: </span>
                <span className={`${progress.accuracy >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {progress.accuracy}%
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">Mode: </span>
                <span className="text-gray-600 capitalize">{sessionState.mode}</span>
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
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Current Word Practice */}
      <div className="mb-6">
        {sessionState.mode === 'flashcards' ? (
          <VocabularyCard
            word={currentWord}
            onRate={handleFlashcardRate}
            disabled={sessionState.isPaused}
            cardNumber={sessionState.currentWordIndex + 1}
            totalCards={sessionState.words.length}
          />
        ) : (
          <VocabularyQuiz
            words={sessionState.words}
            onAnswer={handleQuizAnswer}
            questionNumber={sessionState.currentWordIndex + 1}
            totalQuestions={sessionState.words.length}
            showFeedback={sessionState.showFeedback}
            disabled={sessionState.isPaused}
          />
        )}
      </div>

      {/* Next Word Button for Quiz Mode */}
      {sessionState.mode === 'quiz' && sessionState.showFeedback && (
        <div className="text-center">
          <Button
            onClick={handleNextWord}
            size="lg"
            className="px-8"
          >
            {sessionState.currentWordIndex + 1 >= sessionState.words.length
              ? 'Complete Session'
              : 'Next Word'
            }
          </Button>
        </div>
      )}
    </div>
  )
}