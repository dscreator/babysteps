import { useState, useEffect } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import { Clock } from 'lucide-react'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { HintSystem } from './HintSystem'
import { FeedbackDisplay } from './FeedbackDisplay'
import type { MathProblem as MathProblemType } from '../../../types/api'
import 'katex/dist/katex.min.css'

interface MathProblemProps {
    problem: MathProblemType
    onSubmit: (answer: string, timeSpent: number) => void
    onRequestHint: (hintIndex: number) => void
    onHintUsageTracked?: (hintIndex: number, timeSpent: number) => void
    showFeedback?: boolean
    feedback?: {
        correct: boolean
        explanation?: string
        correctAnswer?: string
        hints?: string[]
        stepByStepSolution?: {
            steps: Array<{
                step: number
                title: string
                content: string
                formula?: string
            }>
        }
        hintUsageCount?: number
    }
    timeLimit?: number
    disabled?: boolean
    questionNumber?: number
    totalQuestions?: number
    maxHintsAllowed?: number
}

export function MathProblem({
    problem,
    onSubmit,
    onRequestHint,
    onHintUsageTracked,
    showFeedback = false,
    feedback,
    timeLimit,
    disabled = false,
    questionNumber,
    totalQuestions,
    maxHintsAllowed = 3
}: MathProblemProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string>('')
    const [freeResponseAnswer, setFreeResponseAnswer] = useState<string>('')
    const [timeSpent, setTimeSpent] = useState<number>(0)
    const [startTime] = useState<number>(Date.now())
    const [submittedAnswer, setSubmittedAnswer] = useState<string>('')

    // Timer effect
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)

        return () => clearInterval(interval)
    }, [startTime])

    const isMultipleChoice = problem.options && problem.options.length > 0
    const currentAnswer = isMultipleChoice ? selectedAnswer : freeResponseAnswer

    const validateAnswer = (answer: string): { isValid: boolean; error?: string } => {
        const trimmed = answer.trim()
        
        if (!trimmed) {
            return { isValid: false, error: 'Please enter an answer' }
        }

        // For multiple choice, ensure it's one of the options
        if (isMultipleChoice && problem.options && !problem.options.includes(trimmed)) {
            return { isValid: false, error: 'Please select one of the provided options' }
        }

        // For free response, check for reasonable input
        if (!isMultipleChoice) {
            // Check for obviously invalid inputs
            if (trimmed.length > 100) {
                return { isValid: false, error: 'Answer is too long' }
            }

            // Check for potentially valid mathematical expressions
            const mathPattern = /^[0-9+\-*/().\s\/,=<>a-zA-Z]+$/
            if (!mathPattern.test(trimmed)) {
                return { isValid: false, error: 'Please enter a valid mathematical answer' }
            }
        }

        return { isValid: true }
    }

    const handleSubmit = () => {
        const validation = validateAnswer(currentAnswer)
        
        if (!validation.isValid) {
            // Could show a toast or inline error here
            console.warn('Invalid answer:', validation.error)
            return
        }

        setSubmittedAnswer(currentAnswer)
        onSubmit(currentAnswer, timeSpent)
    }

    const handleRequestHint = (hintIndex: number) => {
        onRequestHint(hintIndex)
    }

    const handleHintUsageTracked = (hintIndex: number, timeSpent: number) => {
        onHintUsageTracked?.(hintIndex, timeSpent)
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
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
            const mathContent = match[1] || match[2] // $$ or $ content
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

    if (showFeedback && feedback) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <FeedbackDisplay
                    correct={feedback.correct}
                    userAnswer={submittedAnswer}
                    correctAnswer={feedback.correctAnswer}
                    explanation={feedback.explanation}
                    stepByStepSolution={feedback.stepByStepSolution}
                    timeSpent={timeSpent}
                    hintsUsed={feedback.hintUsageCount || 0}
                    maxHints={maxHintsAllowed}
                    performanceImpact={{
                        accuracyChange: feedback.correct ? 5 : -2, // Simplified calculation
                        speedRating: timeSpent < 60 ? 'fast' : timeSpent < 120 ? 'average' : 'slow',
                        difficultyAppropriate: true // Could be calculated based on user's performance history
                    }}
                />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {questionNumber && totalQuestions && (
                            <span className="text-sm font-medium text-gray-600">
                                Question {questionNumber} of {totalQuestions}
                            </span>
                        )}
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {problem.topic}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            Difficulty: {problem.difficulty}/4
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
                        </div>
                        {timeLimit && (
                            <div className="text-sm text-gray-500">
                                Limit: {formatTime(timeLimit)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Problem Statement */}
                <div className="mb-8">
                    <div className="text-lg leading-relaxed text-gray-900">
                        {renderMathContent(problem.question)}
                    </div>
                </div>

                {/* Answer Input */}
                <div className="mb-6">
                    {isMultipleChoice ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700 mb-3">Select your answer:</p>
                            {problem.options!.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedAnswer === option
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option}
                                        checked={selectedAnswer === option}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        disabled={disabled}
                                        className="mr-3"
                                    />
                                    <span className="text-gray-900">
                                        {renderMathContent(option)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="freeResponse" className="block text-sm font-medium text-gray-700 mb-2">
                                Enter your answer:
                            </label>
                            <input
                                id="freeResponse"
                                type="text"
                                value={freeResponseAnswer}
                                onChange={(e) => setFreeResponseAnswer(e.target.value)}
                                disabled={disabled}
                                placeholder="Type your answer here..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                For fractions, use format like 3/4. For decimals, use format like 0.75.
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <Button
                        onClick={handleSubmit}
                        disabled={!currentAnswer.trim() || disabled}
                        className="px-8"
                    >
                        Submit Answer
                    </Button>
                </div>
            </Card>

            {/* Hint System */}
            {problem.hints.length > 0 && (
                <HintSystem
                    hints={problem.hints}
                    onHintRequested={handleRequestHint}
                    onHintUsageTracked={handleHintUsageTracked}
                    disabled={disabled}
                    maxHintsAllowed={maxHintsAllowed}
                />
            )}
        </div>
    )
}