import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { formatExamCountdown } from '../../utils/dateUtils'

interface ExamCountdownProps {
  examDate: string | Date
  className?: string
}

export function ExamCountdown({ examDate, className }: ExamCountdownProps) {
  const countdown = formatExamCountdown(examDate)
  
  const urgencyColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  }
  
  const urgencyIcons = {
    low: '📅',
    medium: '⏰',
    high: '⚡',
    critical: '🚨',
  }

  return (
    <Card className={className} variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{urgencyIcons[countdown.urgencyLevel]}</span>
          ISEE Exam Countdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`rounded-lg p-4 border-2 ${urgencyColors[countdown.urgencyLevel]}`}>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {countdown.daysRemaining}
            </div>
            <div className="text-sm font-medium mb-1">
              {countdown.daysRemaining === 1 ? 'Day' : 'Days'} Remaining
            </div>
            <div className="text-xs opacity-75">
              {countdown.displayText}
            </div>
          </div>
        </div>
        
        {countdown.urgencyLevel === 'critical' && (
          <div className="mt-3 text-center">
            <p className="text-sm text-red-600 font-medium">
              🎯 Final preparation mode - you've got this!
            </p>
          </div>
        )}
        
        {countdown.urgencyLevel === 'high' && (
          <div className="mt-3 text-center">
            <p className="text-sm text-orange-600 font-medium">
              📚 Focus on your weak areas this week
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}