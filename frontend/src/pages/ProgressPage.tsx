import { useState } from 'react'
import { useDashboardData, useDetailedProgress } from '../hooks/useProgressQueries'
import { 
  PerformanceChart, 
  TopicBreakdownChart, 
  StreakTracker, 
  AchievementBadges,
  ProgressSummary 
} from '../components/progress'
import { Card, CardContent } from '../components/common/Card'
import { Button } from '../components/common/Button'

export function ProgressPage() {
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'english' | 'essay'>('math')
  
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData()
  const { data: detailedProgress, isLoading: isDetailedLoading, error: detailedError } = useDetailedProgress(selectedSubject)

  const subjects = [
    { key: 'math' as const, name: 'Math', icon: '🔢', color: 'blue' },
    { key: 'english' as const, name: 'English', icon: '📚', color: 'green' },
    { key: 'essay' as const, name: 'Essay', icon: '✍️', color: 'purple' },
  ]

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-96 bg-gray-300 rounded-lg"></div>
                  <div className="h-96 bg-gray-300 rounded-lg"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-64 bg-gray-300 rounded-lg"></div>
                  <div className="h-64 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Progress</h1>
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to load progress data
                </h3>
                <p className="text-gray-600">
                  Please try refreshing the page or contact support if the problem persists.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
            <p className="text-gray-600">
              Monitor your ISEE preparation progress across all subjects
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts and Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subject Selection */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Button
                        key={subject.key}
                        variant={selectedSubject === subject.key ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSubject(subject.key)}
                        className="flex items-center gap-2"
                      >
                        <span>{subject.icon}</span>
                        {subject.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              {detailedProgress && (
                <PerformanceChart
                  data={detailedProgress.performanceTrend}
                  title={`${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)} Performance Trend`}
                  subject={selectedSubject}
                />
              )}

              {/* Topic Breakdown Chart */}
              {detailedProgress && (
                <TopicBreakdownChart
                  topicScores={detailedProgress.topicScores}
                  subject={selectedSubject}
                />
              )}

              {/* Progress Summary */}
              {detailedProgress && (
                <ProgressSummary progress={detailedProgress} />
              )}

              {/* Loading state for detailed progress */}
              {isDetailedLoading && (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-96 bg-gray-300 rounded-lg mb-6"></div>
                    <div className="h-96 bg-gray-300 rounded-lg mb-6"></div>
                    <div className="h-64 bg-gray-300 rounded-lg"></div>
                  </div>
                </div>
              )}

              {/* Error state for detailed progress */}
              {detailedError && (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-yellow-600 mb-4">
                      <span className="text-4xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Subject data not available
                    </h3>
                    <p className="text-gray-600">
                      Complete some practice sessions in {selectedSubject} to see detailed progress.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Streak, Goals, and Achievements */}
            <div className="space-y-6">
              {/* Streak Tracker */}
              <StreakTracker
                streakDays={dashboardData.streakDays}
                totalPracticeTime={dashboardData.totalPracticeTime}
                weeklyGoal={dashboardData.weeklyGoal}
              />

              {/* Achievement Badges */}
              <AchievementBadges achievements={dashboardData.achievements} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}