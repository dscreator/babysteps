import React from 'react'
import { Card } from '../common/Card'
import { ParentDashboardData } from '../../types/parent'

interface RecentActivityProps {
  activities: ParentDashboardData['recentActivity']
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getSubjectIcon = (subject: string): string => {
    const icons = {
      math: '🔢',
      english: '📚',
      essay: '✍️'
    }
    return icons[subject as keyof typeof icons] || '📖'
  }

  const getSubjectColor = (subject: string): string => {
    const colors = {
      math: 'bg-blue-100 text-blue-800',
      english: 'bg-green-100 text-green-800',
      essay: 'bg-purple-100 text-purple-800'
    }
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPerformanceColor = (performance: number): string => {
    if (performance >= 80) return 'text-green-600'
    if (performance >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">No recent practice sessions</p>
          <p className="text-sm text-gray-500 mt-2">
            Encourage your child to start practicing!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getSubjectIcon(activity.subject)}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(activity.subject)}`}>
                    {activity.subject.charAt(0).toUpperCase() + activity.subject.slice(1)}
                  </span>
                  <span className="text-sm text-gray-600">{formatDate(activity.date)}</span>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-600">
                    Duration: {formatDuration(activity.duration)}
                  </span>
                  <span className={`text-sm font-medium ${getPerformanceColor(activity.performance)}`}>
                    {activity.performance}% accuracy
                  </span>
                </div>
              </div>
            </div>
            
            {/* Performance indicator */}
            <div className="flex items-center">
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    activity.performance >= 80 ? 'bg-green-500' : 
                    activity.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(activity.performance, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length >= 10 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Activity
          </button>
        </div>
      )}
    </Card>
  )
}