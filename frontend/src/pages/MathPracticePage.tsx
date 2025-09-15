import { MathPractice } from '../components/practice/math/MathPractice'
import type { PracticeSessionResponse } from '../types/api'

export function MathPracticePage() {
  // const navigate = useNavigate()

  const handleSessionComplete = (session: PracticeSessionResponse) => {
    // Could navigate to a results page or back to dashboard
    // For now, the session component handles the completion UI
    console.log('Math session completed:', session)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Math Practice</h1>
            <p className="text-gray-600">
              Practice ISEE math problems with personalized difficulty and instant feedback.
            </p>
          </div>
          
          <MathPractice onSessionComplete={handleSessionComplete} />
        </div>
      </div>
    </div>
  )
}