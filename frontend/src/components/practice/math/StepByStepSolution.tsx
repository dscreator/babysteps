import { useState } from 'react'
import { ChevronDown, ChevronRight, BookOpen, Calculator } from 'lucide-react'
import { InlineMath, BlockMath } from 'react-katex'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'

interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

interface StepByStepSolutionProps {
  steps: SolutionStep[]
  isVisible?: boolean
  onToggle?: () => void
  className?: string
}

export function StepByStepSolution({
  steps,
  isVisible = false,
  onToggle,
  className = ''
}: StepByStepSolutionProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber)
    } else {
      newExpanded.add(stepNumber)
    }
    setExpandedSteps(newExpanded)
  }

  const expandAllSteps = () => {
    setExpandedSteps(new Set(steps.map(step => step.step)))
  }

  const collapseAllSteps = () => {
    setExpandedSteps(new Set())
  }

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

  if (!isVisible) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          onClick={onToggle}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Show Step-by-Step Solution
        </Button>
      </div>
    )
  }

  return (
    <Card className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Solution</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAllSteps}
            className="text-xs"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAllSteps}
            className="text-xs"
          >
            Collapse All
          </Button>
          {onToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="text-gray-600"
            >
              Hide
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.step)
          
          return (
            <div
              key={step.step}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleStep(step.step)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {step.step}
                  </div>
                  <span className="font-medium text-gray-900">{step.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <div className="text-gray-700 leading-relaxed mb-3">
                    {renderMathContent(step.content)}
                  </div>
                  
                  {step.formula && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-800 mb-1">Formula:</div>
                      <div className="text-blue-900">
                        {renderMathContent(step.formula)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-sm text-green-800">
          <strong>Study Tip:</strong> Try to work through each step on your own before expanding it. 
          This will help reinforce your understanding of the problem-solving process.
        </div>
      </div>
    </Card>
  )
}