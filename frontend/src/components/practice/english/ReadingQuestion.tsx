import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { ReadingQuestion as ReadingQuestionType } from '../../../types/api'

interface ReadingQuestionProps {
  question: ReadingQuestionType
  questionNumber: number
  totalQuestions: number
  onSubmit: (answer: string, timeSpent: number) => void
  showFeedback?: boolean
  feedback?: {
    correct: boolean
    explanation?: string
    correctAnswer?: string
  }
  disabled?: boolean
  timeLimit?: number
}

export function ReadingQuestion({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  showFeedback = false,
  feedback,
  disabled = false,
  timeLimit
}: ReadingQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [questionStartTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Update time spent on this question
  useEffect(() => {
    if (hasSubmitted) return

    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [questionStartTime, hasSubmitted])

  const handleSubmit = () => {
    if (!selectedAnswer || hasSubmitted) return
    
    setHasSubmitted(true)
    onSubmit(selectedAnswer, timeSpent)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'main_idea': 'Main Idea',
      'detail': 'Supporting Details',
      'inference': 'Inference',
      'vocabulary': 'Vocabulary in Context'
    }
    return typeLabels[type] || 'Reading Comprehension'
  }

  const getQuestionTypeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      'main_idea': 'bg-purple-100 text-purple-800',
      'detail': 'bg-blue-100 text-blue-800',
      'inference': 'bg-green-100 text-green-800',
      'vocabulary': 'bg-orange-100 text-orange-800'
    }
    return typeColors[type] || 'bg-gray-100 text-gray-800'
  }

  const isTimeWarning = timeLimit && timeSpent > timeLimit * 0.8
  const isTimeUp = timeLimit && timeSpent >= timeLimit

  return (
    <Card className="max-w-4xl mx-auto">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.questionType)}`}>
            {getQuestionTypeLabel(question.questionType)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {timeLimit && (
            <div className={`text-sm font-mono px-3 py-1 rounded ${
              isTimeUp ? 'bg-red-100 text-red-800' :
              isTimeWarning ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <Clock className="w-4 h-4 inline mr-1" />
              {formatTime(timeSpent)}
              {timeLimit && ` / ${formatTime(timeLimit)}`}
            </div>
          )}
          
          {!timeLimit && (
            <div className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
              <Clock className="w-4 h-4 inline mr-1" />
              {formatTime(timeSpent)}
            </div>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
          const isSelected = selectedAnswer === option
          const isCorrect = showFeedback && option === question.correctAnswer
          const isIncorrect = showFeedback && isSelected && option !== question.correctAnswer
          
          return (
            <button
              key={index}
              onClick={() => !disabled && !hasSubmitted && setSelectedAnswer(option)}
              disabled={disabled || hasSubmitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                isCorrect
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : isIncorrect
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled || hasSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isIncorrect
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {showFeedback && isCorrect && <CheckCircle className="w-5 h-5" />}
                  {showFeedback && isIncorrect && <XCircle className="w-5 h-5" />}
                  {(!showFeedback || (!isCorrect && !isIncorrect)) && optionLetter}
                </div>
                <span className="flex-1 leading-relaxed">{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Submit Button */}
      {!showFeedback && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedAnswer ? 'Answer selected' : 'Select an answer to continue'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || disabled || hasSubmitted || isTimeUp}
            size="lg"
            className="px-8"
          >
            {isTimeUp ? 'Time Up' : 'Submit Answer'}
          </Button>
        </div>
      )}

      {/* Feedback Display */}
      {showFeedback && feedback && (
        <div className="mt-6 pt-6 border-t">
          <div className={`p-4 rounded-lg ${
            feedback.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                feedback.correct ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {feedback.correct ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <XCircle className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium mb-2 ${
                  feedback.correct ? 'text-green-900' : 'text-red-900'
                }`}>
                  {feedback.correct ? 'Correct!' : 'Incorrect'}
                </h4>
                
                {feedback.explanation && (
                  <div className={`text-sm ${
                    feedback.correct ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{feedback.explanation}</p>
                    </div>
                  </div>
                )}

                {!feedback.correct && feedback.correctAnswer && (
                  <div className="mt-2 text-sm text-red-800">
                    <strong>Correct answer:</strong> {feedback.correctAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Warning */}
      {isTimeWarning && !isTimeUp && !showFeedback && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Time warning: {formatTime(timeLimit! - timeSpent)} remaining
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}