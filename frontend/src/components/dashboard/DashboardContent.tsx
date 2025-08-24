import React from 'react'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ExamCountdown } from './ExamCountdown'
import { ProgressOverview } from './ProgressOverview'
import { QuickActions } from './QuickActions'
import { StudyStreak } from './StudyStreak'
import { MotivationalMessage } from './MotivationalMessage'
import { useDashboardData } from '../../hooks/useProgressQueries'
import { useProfile } from '../../hooks/useAuthQueries'

export function DashboardContent() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: dashboardData, isLoading: dashboardLoading, error } = useDashboardData()

  if (profileLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
        <p className="text-gray-600 mb-4">There was an error loading your dashboard data.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!profile?.examDate) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Exam date not set</h3>
        <p className="text-gray-600">Please complete your profile setup to see your personalized dashboard.</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No dashboard data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message and Exam Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MotivationalMessage
            examDate={profile.examDate}
            overallProgress={dashboardData.overallProgress.overall}
            streakDays={dashboardData.streakDays}
          />
        </div>
        <div>
          <ExamCountdown examDate={profile.examDate} />
        </div>
      </div>

      {/* Progress Overview */}
      <ProgressOverview progress={dashboardData.overallProgress} />

      {/* Study Streak and Goals */}
      <StudyStreak
        streakDays={dashboardData.streakDays}
        weeklyGoal={dashboardData.weeklyGoal}
        totalPracticeTime={dashboardData.totalPracticeTime}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      {dashboardData.recentSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Practice Sessions
          </h2>
          <div className="space-y-3">
            {dashboardData.recentSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {session.subject === 'math' && '🔢'}
                    {session.subject === 'english' && '📚'}
                    {session.subject === 'essay' && '✍️'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {session.subject} Practice
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.questionsCorrect}/{session.questionsAttempted} correct
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary-600">
                    {session.score}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.startTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {dashboardData.achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlockedAt
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {achievement.description}
                  </p>
                  {achievement.unlockedAt ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✅ Unlocked
                    </span>
                  ) : achievement.progress ? (
                    <div className="text-xs text-gray-500">
                      {achievement.progress.current}/{achievement.progress.target}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}