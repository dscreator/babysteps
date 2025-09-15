import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'

interface StreakTrackerProps {
  streakDays: number
  totalPracticeTime: number
  weeklyGoal: {
    target: number
    completed: number
    percentage: number
  }
  className?: string
}

export function StreakTracker({ 
  streakDays, 
  totalPracticeTime, 
  weeklyGoal, 
  className 
}: StreakTrackerProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your streak today! 🚀"
    if (days === 1) return "Great start! Keep it going! 💪"
    if (days < 7) return `${days} days strong! 🔥`
    if (days < 30) return `Amazing ${days}-day streak! 🌟`
    return `Incredible ${days}-day streak! You're unstoppable! 🏆`
  }

  const getStreakColor = (days: number) => {
    if (days === 0) return 'text-gray-500'
    if (days < 7) return 'text-orange-600'
    if (days < 30) return 'text-red-600'
    return 'text-purple-600'
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

  // Generate streak visualization (last 14 days)
  const generateStreakDays = () => {
    const days = []
    const today = new Date()
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const isActive = i < streakDays
      const isToday = i === 0
      
      days.push({
        date,
        isActive,
        isToday,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
      })
    }
    
    return days
  }

  const streakVisualization = generateStreakDays()

  return (
    <div className={className}>
      {/* Study Streak Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            Study Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className={`text-4xl font-bold ${getStreakColor(streakDays)}`}>
              {streakDays}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {streakDays === 1 ? 'day' : 'days'}
            </div>
            <div className={`text-sm font-medium mt-2 ${getStreakColor(streakDays)}`}>
              {getStreakMessage(streakDays)}
            </div>
          </div>
          
          {/* 14-day streak visualization */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {streakVisualization.slice(0, 7).map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{day.dayName}</div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                    day.isActive
                      ? day.isToday
                        ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                        : 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {streakVisualization.slice(7, 14).map((day, index) => (
              <div key={index + 7} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{day.dayName}</div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                    day.isActive
                      ? day.isToday
                        ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                        : 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Weekly Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Progress</span>
            <span className={`text-lg font-bold ${getGoalColor(weeklyGoal.percentage)}`}>
              {weeklyGoal.percentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getGoalBarColor(weeklyGoal.percentage)}`}
              style={{ width: `${Math.min(weeklyGoal.percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(weeklyGoal.completed)} completed</span>
            <span>{formatTime(weeklyGoal.target)} goal</span>
          </div>
          
          {weeklyGoal.percentage >= 100 ? (
            <div className="mt-3 p-2 bg-green-50 rounded-lg text-center">
              <span className="text-sm font-medium text-green-700">
                🎉 Goal achieved! Great work this week!
              </span>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg text-center">
              <span className="text-sm text-blue-700">
                {formatTime(weeklyGoal.target - weeklyGoal.completed)} remaining to reach your goal
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Practice Time Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            Total Practice Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {formatTime(totalPracticeTime)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              across all subjects
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-sm text-gray-500">Daily Average</div>
                <div className="text-lg font-semibold text-gray-900">
                  {streakDays > 0 ? formatTime(Math.round(totalPracticeTime / streakDays)) : '0m'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Sessions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(totalPracticeTime / 25)} {/* Assuming 25min average session */}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}