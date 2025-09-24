import React from 'react'
import { Card } from '../common/Card'
import { ParentDashboardData } from '../../types/parent'

interface ProgressOverviewProps {
  progress: ParentDashboardData['progress']
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ progress }) => {
  const subjects = [
    { key: 'math', name: 'Mathematics', color: 'blue', data: progress.math },
    { key: 'english', name: 'English', color: 'green', data: progress.english },
    { key: 'essay', name: 'Essay Writing', color: 'purple', data: progress.essay }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getProgressBarColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Subject Progress Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.key} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">{subject.name}</h4>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getColorClasses(subject.color)}`}>
                {subject.data.overallScore}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(subject.color)}`}
                style={{ width: `${Math.min(subject.data.overallScore, 100)}%` }}
              />
            </div>

            {/* Recent Sessions */}
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                <span className="font-medium">{subject.data.recentSessions}</span> sessions this week
              </p>
            </div>

            {/* Weak Areas */}
            {subject.data.weakAreas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement:</p>
                <div className="flex flex-wrap gap-1">
                  {subject.data.weakAreas.slice(0, 3).map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
                    >
                      {area}
                    </span>
                  ))}
                  {subject.data.weakAreas.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{subject.data.weakAreas.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Strong Areas */}
            {subject.data.strongAreas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Strengths:</p>
                <div className="flex flex-wrap gap-1">
                  {subject.data.strongAreas.slice(0, 2).map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    >
                      {area}
                    </span>
                  ))}
                  {subject.data.strongAreas.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{subject.data.strongAreas.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}