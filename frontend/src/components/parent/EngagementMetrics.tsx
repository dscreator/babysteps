import React from 'react'
import { Card } from '../common/Card'
import { ParentDashboardData } from '../../types/parent'

interface EngagementMetricsProps {
  engagement: ParentDashboardData['engagement']
}

export const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ engagement }) => {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatLastPractice = (dateString: string): string => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  const metrics = [
    {
      title: 'Study Streak',
      value: engagement.streakDays,
      unit: engagement.streakDays === 1 ? 'day' : 'days',
      icon: '🔥',
      color: engagement.streakDays >= 7 ? 'text-orange-600' : engagement.streakDays >= 3 ? 'text-yellow-600' : 'text-gray-600',
      bgColor: engagement.streakDays >= 7 ? 'bg-orange-100' : engagement.streakDays >= 3 ? 'bg-yellow-100' : 'bg-gray-100'
    },
    {
      title: 'Total Practice Time',
      value: formatTime(engagement.totalPracticeTime),
      unit: '',
      icon: '⏱️',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Weekly Goal Progress',
      value: Math.round(engagement.weeklyGoalProgress),
      unit: '%',
      icon: '🎯',
      color: engagement.weeklyGoalProgress >= 100 ? 'text-green-600' : engagement.weeklyGoalProgress >= 75 ? 'text-yellow-600' : 'text-red-600',
      bgColor: engagement.weeklyGoalProgress >= 100 ? 'bg-green-100' : engagement.weeklyGoalProgress >= 75 ? 'bg-yellow-100' : 'bg-red-100'
    },
    {
      title: 'Study Consistency',
      value: engagement.consistencyScore,
      unit: '%',
      icon: '📊',
      color: engagement.consistencyScore >= 80 ? 'text-green-600' : engagement.consistencyScore >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: engagement.consistencyScore >= 80 ? 'bg-green-100' : engagement.consistencyScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
    }
  ]

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Engagement & Study Habits</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className={`p-4 rounded-lg ${metric.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}{metric.unit}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Last Practice Info */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Last Practice Session:</span>
          <span className="text-sm text-gray-600">{formatLastPractice(engagement.lastPracticeDate)}</span>
        </div>
      </div>

      {/* Weekly Goal Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Weekly Goal Progress</span>
          <span className="text-sm text-gray-600">{Math.round(engagement.weeklyGoalProgress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              engagement.weeklyGoalProgress >= 100 ? 'bg-green-500' : 
              engagement.weeklyGoalProgress >= 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(engagement.weeklyGoalProgress, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}