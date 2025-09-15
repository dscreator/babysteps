import { useState } from 'react'
import { CheckCircle, XCircle, BookOpen, TrendingUp, Clock, Target } from 'lucide-react'
import { InlineMath, BlockMath } from 'react-katex'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { StepByStepSolution } from './StepByStepSolution'

interface FeedbackDisplayProps {
  correct: boolean
  userAnswer: string
  correctAnswer?: string
  explanation?: string
  stepByStepSolution?: {
    steps: Array<{
      step: number
      title: string
      content: string
      formula?: string
    }>
  }
  timeSpent: number
  hintsUsed: number
  maxHints: number
  performanceImpact?: {
    accuracyChange: number
    speedRating: 'fast' | 'average' | 'slow'
    difficultyAppropriate: boolean
  }
  onContinue?: () => void
  className?: string
}

export function FeedbackDisplay({
  correct,
  userAnswer,
  correctAnswer,
  explanation,
  stepByStepSolution,
  timeSpent,
  hintsUsed,
  maxHints,
  performanceImpact,
  onContinue,
  className = ''
}: FeedbackDisplayProps) {
  const [showSolution, setShowSolution] = useState(false)

  const renderMathContent = (content: string) => {
    // Simple regex to detect LaTeX math expressions
    const mathRegex = /\$\$(.*?)\$\$|\$(.*?)\$/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mathRegex.exec(content)) !== null) {
      // Add text before the math
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      // Add the math expression
      const mathContent = match[1] || match[2]
      if (match[1]) {
        // Block math ($$...$$)
        parts.push(<BlockMath key={match.index} math={mathContent} />)
      } else {
        // Inline math ($...$)
        parts.push(<InlineMath key={match.index} math={mathContent} />)
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getSpeedRatingColor = (rating: string) => {
    switch (rating) {
      case 'fast': return 'text-green-600'
      case 'average': return 'text-blue-600'
      case 'slow': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getSpeedRatingText = (rating: string) => {
    switch (rating) {
      case 'fast': return 'Quick solve!'
      case 'average': return 'Good pace'
      case 'slow': return 'Take your time'
      default: return 'Good effort'
    }
  }

  return (
    <div className={className}>
      {/* Main Feedback Card */}
      <Card className={`mb-6 ${correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {correct ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xl font-bold ${correct ? 'text-green-800' : 'text-red-800'}`}>
                {correct ? 'Correct!' : 'Not quite right'}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeSpent)}</span>
                </div>
                {hintsUsed > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{hintsUsed}/{maxHints} hints</span>
                  </div>
                )}
              </div>
            </div>

            {/* Answer Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Your Answer:</div>
                <div className={`p-2 rounded ${correct ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                  {renderMathContent(userAnswer)}
                </div>
              </div>
              
              {!correct && correctAnswer && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</div>
                  <div className="p-2 bg-green-100 text-green-900 rounded">
                    {renderMathContent(correctAnswer)}
                  </div>
                </div>
              )}
            </div>

            {/* Explanation */}
            {explanation && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Explanation:</div>
                <div className="text-gray-800 leading-relaxed">
                  {renderMathContent(explanation)}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {performanceImpact && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-white rounded-lg border">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Speed</div>
                  <div className={`font-medium ${getSpeedRatingColor(performanceImpact.speedRating)}`}>
                    {getSpeedRatingText(performanceImpact.speedRating)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Accuracy Impact</div>
                  <div className={`font-medium ${performanceImpact.accuracyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceImpact.accuracyChange >= 0 ? '+' : ''}{performanceImpact.accuracyChange.toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Difficulty</div>
                  <div className={`font-medium ${performanceImpact.difficultyAppropriate ? 'text-blue-600' : 'text-orange-600'}`}>
                    {performanceImpact.difficultyAppropriate ? 'Appropriate' : 'Challenging'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {stepByStepSolution && stepByStepSolution.steps.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {showSolution ? 'Hide' : 'Show'} Step-by-Step Solution
                  </Button>
                )}
              </div>
              
              <div>
                {onContinue && (
                  <Button onClick={onContinue} className="px-6">
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step-by-Step Solution */}
      {stepByStepSolution && stepByStepSolution.steps.length > 0 && (
        <StepByStepSolution
          steps={stepByStepSolution.steps}
          isVisible={showSolution}
          onToggle={() => setShowSolution(!showSolution)}
          className="mb-6"
        />
      )}

      {/* Learning Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Learning Tips</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {correct ? (
                <>
                  <p>• Great job! Try to solve similar problems without hints to build confidence.</p>
                  <p>• Review the solution method to reinforce your understanding.</p>
                  {hintsUsed === 0 && <p>• Excellent work solving this independently!</p>}
                </>
              ) : (
                <>
                  <p>• Review the step-by-step solution to understand where you went wrong.</p>
                  <p>• Practice similar problems to strengthen this concept.</p>
                  {hintsUsed > 0 && <p>• The hints you used contain valuable problem-solving strategies.</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}