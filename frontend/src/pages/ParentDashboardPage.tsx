import React from 'react'
import { ParentAuthProvider, useParentAuth } from '../contexts/ParentAuthContext'
import { ParentLogin } from '../components/parent/ParentLogin'
import { ParentDashboard } from '../components/parent/ParentDashboard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

const ParentDashboardContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useParentAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return isAuthenticated ? <ParentDashboard /> : <ParentLogin />
}

export const ParentDashboardPage: React.FC = () => {
  return (
    <ParentAuthProvider>
      <ParentDashboardContent />
    </ParentAuthProvider>
  )
}