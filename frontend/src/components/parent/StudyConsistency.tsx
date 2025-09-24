import React from 'react'
import { Card } from '../common/Card'

interface StudyConsistencyProps {
  consistencyScore: number
  streakDays: number
  weeklyGoalProgress: number
}

export const StudyConsistency: React.FC<StudyConsistencyProps> = ({
  consistencyScore,
  streakDays,
  weeklyGoalProgress
}) => {
  const getConsistencyMessage = (score: number): { message: string; color: string } => {
    if (score >= 80) {
      return { message: 'Excellent consistency! Your child is maintaining great study habits.', color: 'text-green-600' }
    } else if (score >= 60) {
      return { message: 'Good consistency. Encourage daily practice for better results.', color: 'text-yellow-600' }
    } else if (score >= 40) {
      return { message: 'Moderate consistency. Consider setting up a regular study schedule.', color: 'text-orange-600' }
    } else {
      return { message: 'Low consistency. Daily practice is key to ISEE success.', color: 'text-red-600' }
    }
  }

  const getStreakMessage = (days: number): { message: string; color: string } => {
    if (days >= 14) {
      return { message: 'Amazing streak! This dedication will pay off on exam day.', color: 'text-green-600' }
    } else if (days >= 7) {
      return { message: 'Great streak! Keep up the momentum.', color: 'text-green-600' }
    } else if (days >= 3) {
      return { message: 'Good start! Try to extend this streak.', color: 'text-yellow-600' }
    } else if (days >= 1) {
      return { message: 'Building momentum. Consistency is key!', color: 'text-yellow-600' }
    } else {
      return { message: 'Time to start a new streak!', color: 'text-gray-600' }
    }
  }

  const consistencyInfo = getConsistencyMessage(consistencyScore)
  const streakInfo = getStreakMessage(streakDays)

  // Generate last 7 days for visual representation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date,
      practiced: i >= (7 - Math.min(streakDays, 7)) // Simple approximation
    }
  })

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Study Consistency</h3>
      
      {/* Consistency Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Consistency Score</span>
          <span className="text-lg font-bold text-gray-900">{consistencyScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              consistencyScore >= 80 ? 'bg-green-500' : 
              consistencyScore >= 60 ? 'bg-yellow-500' : 
              consistencyScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(consistencyScore, 100)}%` }}
          />
        </div>
        <p className={`text-sm ${consistencyInfo.color}`}>{consistencyInfo.message}</p>
      </div>

      {/* Study Streak */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Streak</span>
          <div className="flex items-center">
            <span className="text-2xl mr-1">🔥</span>
            <span className="text-lg font-bold text-gray-900">
              {streakDays} {streakDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
        <p className={`text-sm ${streakInfo.color}`}>{streakInfo.message}</p>
      </div>

      {/* Last 7 Days Visual */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Last 7 Days</h4>
        <div className="flex justify-between">
          {last7Days.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  day.practiced 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {day.practiced ? '✓' : '○'}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
          <span className="text-sm text-gray-600">{Math.round(weeklyGoalProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              weeklyGoalProgress >= 100 ? 'bg-green-500' : 
              weeklyGoalProgress >= 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(weeklyGoalProgress, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}