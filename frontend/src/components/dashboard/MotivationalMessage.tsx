import React from 'react'
import { Card, CardContent } from '../common/Card'
import { getMotivationalMessage, formatExamCountdown } from '../../utils/dateUtils'

interface MotivationalMessageProps {
  examDate: string | Date
  overallProgress: number
  streakDays: number
  className?: string
}

export function MotivationalMessage({ 
  examDate, 
  overallProgress, 
  streakDays, 
  className 
}: MotivationalMessageProps) {
  const countdown = formatExamCountdown(examDate)
  const message = getMotivationalMessage(countdown.daysRemaining, overallProgress, streakDays)
  
  const getBackgroundGradient = () => {
    if (countdown.urgencyLevel === 'critical') {
      return 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
    }
    if (countdown.urgencyLevel === 'high') {
      return 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
    }
    if (countdown.urgencyLevel === 'medium') {
      return 'bg-gradient-to-r from-yellow-50 to-green-50 border-yellow-200'
    }
    return 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
  }
  
  const getAdditionalTips = () => {
    const tips = []
    
    if (countdown.daysRemaining <= 7) {
      tips.push('Focus on reviewing your weak areas')
      tips.push('Take practice tests to build confidence')
      tips.push('Get plenty of rest before exam day')
    } else if (countdown.daysRemaining <= 14) {
      tips.push('Maintain consistent daily practice')
      tips.push('Work on time management skills')
      tips.push('Review fundamental concepts')
    } else {
      tips.push('Build strong foundations in all subjects')
      tips.push('Establish a regular study routine')
      tips.push('Track your progress regularly')
    }
    
    if (streakDays >= 7) {
      tips.push('Your consistency is paying off!')
    }
    
    if (overallProgress >= 80) {
      tips.push("You're well-prepared - keep it up!")
    } else if (overallProgress >= 60) {
      tips.push('Great progress - push for excellence!')
    } else {
      tips.push('Every practice session makes you stronger!')
    }
    
    return tips.slice(0, 3) // Return max 3 tips
  }

  return (
    <Card className={`${className} border-2 ${getBackgroundGradient()}`}>
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {message}
          </h2>
          <p className="text-gray-600">
            Keep up the excellent work on your ISEE preparation!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary-600">
              {countdown.daysRemaining}
            </div>
            <div className="text-sm text-gray-600">Days to go</div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">
              {overallProgress}%
            </div>
            <div className="text-sm text-gray-600">Overall progress</div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {streakDays}
            </div>
            <div className="text-sm text-gray-600">Day streak</div>
          </div>
        </div>
        
        {/* Study Tips */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
            💡 Study Tips for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {getAdditionalTips().map((tip, index) => (
              <div
                key={index}
                className="bg-white/70 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}