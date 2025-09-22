import { DashboardLayout } from '../components/common/DashboardLayout'
import { EssayPractice } from '../components/practice/essay'
import type { PracticeSessionResponse } from '../types/api'

export function EssayPracticePage() {
  const handleSessionComplete = (_session: PracticeSessionResponse) => {
    // Placeholder for future navigation or analytics updates
  }

  return (
    <DashboardLayout>
      <EssayPractice onSessionComplete={handleSessionComplete} />
    </DashboardLayout>
  )
}
