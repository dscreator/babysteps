import { useState, useEffect } from 'react'
import { HelpCircle, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react'
import { InlineMath, BlockMath } from 'react-katex'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'

interface HintSystemProps {
  hints: string[]
  onHintRequested: (hintIndex: number) => void
  onHintUsageTracked?: (hintIndex: number, timeSpent: number) => void
  disabled?: boolean
  maxHintsAllowed?: number
  className?: string
}

interface HintUsage {
  hintIndex: number
  requestedAt: number
  timeSpent?: number
}

export function HintSystem({
  hints,
  onHintRequested,
  onHintUsageTracked,
  disabled = false,
  maxHintsAllowed = 3,
  className = ''
}: HintSystemProps) {
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set())
  const [hintUsage, setHintUsage] = useState<HintUsage[]>([])
  const [currentHintStartTime, setCurrentHintStartTime] = useState<number | null>(null)

  // Track time spent viewing hints
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentHintStartTime) {
        // User switched away, record time spent
        const timeSpent = Date.now() - currentHintStartTime
        const lastHint = hintUsage[hintUsage.length - 1]
        if (lastHint && !lastHint.timeSpent) {
          const updatedUsage = [...hintUsage]
          updatedUsage[updatedUsage.length - 1].timeSpent = timeSpent
          setHintUsage(updatedUsage)
          onHintUsageTracked?.(lastHint.hintIndex, timeSpent)
        }
        setCurrentHintStartTime(null)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentHintStartTime, hintUsage, onHintUsageTracked])

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

  const requestHint = (hintIndex: number) => {
    if (disabled || revealedHints.has(hintIndex)) return

    // Record hint usage
    const usage: HintUsage = {
      hintIndex,
      requestedAt: Date.now()
    }
    
    setHintUsage(prev => [...prev, usage])
    setRevealedHints(prev => new Set(Array.from(prev).concat(hintIndex)))
    setCurrentHintStartTime(Date.now())
    
    onHintRequested(hintIndex)
  }

  const getHintButtonText = (hintIndex: number) => {
    if (hintIndex === 0) return 'Get First Hint'
    if (hintIndex === 1) return 'Get Another Hint'
    return `Get Hint ${hintIndex + 1}`
  }

  const getHintIcon = (hintIndex: number) => {
    if (hintIndex === 0) return <HelpCircle className="w-4 h-4" />
    if (hintIndex === hints.length - 1) return <Lightbulb className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const getHintButtonVariant = (hintIndex: number): 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' => {
    if (hintIndex === 0) return 'outline'
    if (hintIndex === hints.length - 1) return 'primary'
    return 'outline'
  }

  const getHintButtonColor = (hintIndex: number) => {
    if (hintIndex === 0) return 'text-blue-600 border-blue-300 hover:bg-blue-50'
    if (hintIndex === hints.length - 1) return 'bg-yellow-500 hover:bg-yellow-600 text-white'
    return 'text-green-600 border-green-300 hover:bg-green-50'
  }

  const hintsUsedCount = revealedHints.size
  const hintsRemaining = Math.max(0, maxHintsAllowed - hintsUsedCount)
  const canRequestMoreHints = hintsUsedCount < maxHintsAllowed && hintsUsedCount < hints.length

  if (hints.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {/* Hint Usage Summary */}
      {hintsUsedCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800">
                Hints used: {hintsUsedCount} of {maxHintsAllowed} allowed
              </span>
            </div>
            {hintsRemaining > 0 && (
              <span className="text-yellow-700">
                {hintsRemaining} remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Revealed Hints */}
      {Array.from(revealedHints).sort((a, b) => a - b).map((hintIndex) => (
        <Card key={hintIndex} className="mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-1">
              {hintIndex + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Hint {hintIndex + 1}
                  {hintIndex === 0 && ' (Getting Started)'}
                  {hintIndex === hints.length - 1 && ' (Final Hint)'}
                </span>
              </div>
              <div className="text-blue-900 leading-relaxed">
                {renderMathContent(hints[hintIndex])}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Next Hint Button */}
      {canRequestMoreHints && (
        <div className="text-center">
          {Array.from({ length: Math.min(hints.length, maxHintsAllowed) }, (_, index) => {
            if (revealedHints.has(index)) return null
            
            // Only show the next hint button
            const nextHintIndex = Math.min(...Array.from({ length: hints.length }, (_, i) => i).filter(i => !revealedHints.has(i)))
            if (index !== nextHintIndex) return null

            return (
              <Button
                key={index}
                variant={getHintButtonVariant(index)}
                onClick={() => requestHint(index)}
                disabled={disabled}
                className={`${getHintButtonColor(index)} mb-2`}
              >
                {getHintIcon(index)}
                <span className="ml-2">{getHintButtonText(index)}</span>
              </Button>
            )
          })}
        </div>
      )}

      {/* Hints Exhausted Message */}
      {hintsUsedCount >= maxHintsAllowed && hintsUsedCount < hints.length && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-2" />
          <div className="text-sm text-red-800">
            You've used all {maxHintsAllowed} allowed hints for this problem.
            <br />
            Try to solve it with the hints you have, or submit your best answer.
          </div>
        </div>
      )}

      {/* All Hints Revealed */}
      {hintsUsedCount >= hints.length && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <Lightbulb className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <div className="text-sm text-green-800">
            All available hints have been revealed. You should now have enough information to solve the problem!
          </div>
        </div>
      )}

      {/* Study Impact Warning */}
      {hintsUsedCount > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600">
            <strong>Note:</strong> Using hints is a great way to learn, but try to solve similar problems 
            without hints to build your confidence and test-taking skills.
          </div>
        </div>
      )}
    </div>
  )
}