import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { formatPracticeTime } from '../../utils/dateUtils'
import type { ProgressDashboard } from '../../types/api'

interface StudyStreakProps {
  streakDays: number
  weeklyGoal: ProgressDashboard['weeklyGoal']
  totalPracticeTime: number
  className?: string
}

export function StudyStreak({ 
  streakDays, 
  weeklyGoal, 
  totalPracticeTime, 
  className 
}: StudyStreakProps) {
  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🏆'
    if (days >= 14) return '🔥'
    if (days >= 7) return '⚡'
    if (days >= 3) return '🌟'
    return '📚'
  }
  
  const getStreakMessage = (days: number) => {
    if (days === 0) return 'Start your streak today!'
    if (days === 1) return 'Great start! Keep it going!'
    if (days < 7) return `${days} days strong!`
    if (days < 14) return `Amazing ${days}-day streak!`
    if (days < 30) return `Incredible ${days}-day streak!`
    return `Legendary ${days}-day streak!`
  }
  
  const getGoalColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  }
  
  const getGoalBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Study Streak Card */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getStreakEmoji(streakDays)}</span>
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {streakDays}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                {streakDays === 1 ? 'Day' : 'Days'} in a row
              </div>
              <div className="text-xs text-gray-500 mb-4">
                {getStreakMessage(streakDays)}
              </div>
              
              {/* Streak milestones */}
              <div className="flex justify-center gap-2">
                {[3, 7, 14, 30].map((milestone) => (
                  <div
                    key={milestone}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      streakDays >= milestone
                        ? 'bg-primary-100 text-primary-600 border-2 border-primary-300'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {milestone}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Streak milestones
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal Card */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Practice Time
                </span>
                <span className={`text-lg font-bold ${getGoalColor(weeklyGoal.percentage)}`}>
                  {weeklyGoal.percentage.toFixed(0)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getGoalBarColor(weeklyGoal.percentage)}`}
                  style={{ width: `${Math.min(weeklyGoal.percentage, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPracticeTime(weeklyGoal.completed)} completed</span>
                <span>{formatPracticeTime(weeklyGoal.target)} goal</span>
              </div>
            </div>
            
            <div className="text-center">
              {weeklyGoal.percentage >= 100 ? (
                <div className="text-green-600 font-medium text-sm">
                  🎉 Goal achieved! Excellent work!
                </div>
              ) : (
                <div className="text-gray-600 text-sm">
                  {formatPracticeTime(weeklyGoal.target - weeklyGoal.completed)} remaining
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Total Practice Time */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-medium text-gray-900">Total Practice Time</h3>
                <p className="text-sm text-gray-600">All-time study hours</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {formatPracticeTime(totalPracticeTime)}
              </div>
              <div className="text-xs text-gray-500">
                {Math.floor(totalPracticeTime / 60)} hours total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}