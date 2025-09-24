import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentService } from '../../services/parentService'
import { StudentLink, ParentDashboardData } from '../../types/parent'
import { Card } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { StudentSelector } from './StudentSelector'
import { ProgressOverview } from './ProgressOverview'
import { EngagementMetrics } from './EngagementMetrics'
import { RecentActivity } from './RecentActivity'
import { StudyConsistency } from './StudyConsistency'
import { NotificationPreferences } from './NotificationPreferences'

export const ParentDashboard: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  // Get linked students
  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery(
    'linkedStudents',
    () => parentService.getLinkedStudents(),
    {
      onSuccess: (data) => {
        // Auto-select first student with granted access
        const grantedStudent = data.find(s => s.accessGranted)
        if (grantedStudent && !selectedStudentId) {
          setSelectedStudentId(grantedStudent.studentId)
        }
      }
    }
  )

  // Get dashboard data for selected student
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    ['parentDashboard', selectedStudentId],
    () => selectedStudentId ? parentService.getDashboardData(selectedStudentId) : null,
    {
      enabled: !!selectedStudentId,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  )

  if (studentsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Students</h2>
          <p className="text-gray-600">
            {studentsError instanceof Error ? studentsError.message : 'Failed to load student data'}
          </p>
        </Card>
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No Students Linked</h2>
          <p className="text-gray-600 mb-4">
            You haven't linked any student accounts yet. Ask your child to share their access code with you.
          </p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // This would open a modal to request student access
              console.log('Request student access')
            }}
          >
            Link Student Account
          </button>
        </Card>
      </div>
    )
  }

  const selectedStudent = students.find(s => s.studentId === selectedStudentId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
            <p className="text-gray-600">Monitor your child's ISEE preparation progress</p>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            {showPreferences ? 'Hide Settings' : 'Notification Settings'}
          </button>
        </div>

        {/* Notification Preferences */}
        {showPreferences && (
          <div className="mb-6">
            <NotificationPreferences />
          </div>
        )}

        {/* Student Selector */}
        <div className="mb-6">
          <StudentSelector
            students={students}
            selectedStudentId={selectedStudentId}
            onStudentSelect={setSelectedStudentId}
          />
        </div>

        {/* Dashboard Content */}
        {selectedStudentId && selectedStudent?.accessGranted ? (
          dashboardLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : dashboardError ? (
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600">
                {dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard data'}
              </p>
            </Card>
          ) : dashboardData ? (
            <div className="space-y-6">
              {/* Student Info Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {dashboardData.student.firstName} {dashboardData.student.lastName}
                    </h2>
                    <p className="text-gray-600">
                      Grade {dashboardData.student.gradeLevel} • Exam Date: {new Date(dashboardData.student.examDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Days Until Exam</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.ceil((new Date(dashboardData.student.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Progress Overview */}
              <ProgressOverview progress={dashboardData.progress} />

              {/* Engagement Metrics */}
              <EngagementMetrics engagement={dashboardData.engagement} />

              {/* Study Consistency and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StudyConsistency 
                  consistencyScore={dashboardData.engagement.consistencyScore}
                  streakDays={dashboardData.engagement.streakDays}
                  weeklyGoalProgress={dashboardData.engagement.weeklyGoalProgress}
                />
                <RecentActivity activities={dashboardData.recentActivity} />
              </div>
            </div>
          ) : null
        ) : selectedStudent && !selectedStudent.accessGranted ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Pending</h2>
            <p className="text-gray-600 mb-4">
              You've requested access to {selectedStudent.studentName}'s account. 
              They need to approve your access request.
            </p>
            <p className="text-sm text-gray-500">
              Ask your child to enter the access code you received via email.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}