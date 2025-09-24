import { useState } from 'react'
import { useDashboardData, useDetailedProgress } from '../hooks/useProgressQueries'
import { 
  PerformanceChart, 
  TopicBreakdownChart, 
  StreakTracker, 
  AchievementBadges,
  ProgressSummary 
} from '../components/progress'
import { ProgressAnalytics } from '../components/progress/ProgressAnalytics'
import { ReadinessAssessment } from '../components/progress/ReadinessAssessment'
import { TrendAnalysis } from '../components/progress/TrendAnalysis'
import { GoalSetting } from '../components/progress/GoalSetting'
import { Achievement } from '../components/progress/Achievement'
import { MotivationalMessaging } from '../components/progress/MotivationalMessaging'
import { Card, CardContent } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { DashboardLayout } from '../components/common/DashboardLayout'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { BarChart3, Target, TrendingUp, Calendar, Trophy, MessageCircle } from 'lucide-react'

export function ProgressPage() {
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'english' | 'essay'>('math')
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'readiness' | 'trends' | 'goals' | 'achievements'>('overview')
  
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData()
  const { data: detailedProgress, isLoading: isDetailedLoading, error: detailedError } = useDetailedProgress(selectedSubject)

  const subjects = [
    { key: 'math' as const, name: 'Math', icon: '🔢', color: 'blue' },
    { key: 'english' as const, name: 'English', icon: '📚', color: 'green' },
    { key: 'essay' as const, name: 'Essay', icon: '✍️', color: 'purple' },
  ]

  const tabs = [
    { key: 'overview' as const, name: 'Overview', icon: BarChart3 },
    { key: 'analytics' as const, name: 'Analytics', icon: TrendingUp },
    { key: 'readiness' as const, name: 'Readiness', icon: Target },
    { key: 'trends' as const, name: 'Trends', icon: Calendar },
    { key: 'goals' as const, name: 'Goals', icon: Target },
    { key: 'achievements' as const, name: 'Achievements', icon: Trophy },
  ]

  if (isDashboardLoading) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  if (dashboardError) {
    return (
      <DashboardLayout>
        <Breadcrumb />
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
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <DashboardLayout>
      {/* Breadcrumb Navigation */}
      <Breadcrumb />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
        <p className="text-gray-600">
          Monitor your ISEE preparation progress across all subjects
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
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
        )}

        {activeTab === 'analytics' && <ProgressAnalytics />}
        {activeTab === 'readiness' && <ReadinessAssessment />}
        {activeTab === 'trends' && <TrendAnalysis />}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            <GoalSetting />
            <MotivationalMessaging />
          </div>
        )}
        {activeTab === 'achievements' && <Achievement />}
      </div>
    </DashboardLayout>
  )
}