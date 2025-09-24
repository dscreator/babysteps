import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { DevBanner } from './components/common/DevBanner'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { MathPracticePage } from './pages/MathPracticePage'
import { EnglishPracticePage } from './pages/EnglishPracticePage'
import { EssayPracticePage } from './pages/EssayPracticePage'
import { VocabularyPracticePage } from './pages/VocabularyPracticePage'
import { EnglishProgressPage } from './pages/EnglishProgressPage'
import { ProgressPage } from './pages/ProgressPage'
import { TutorPage } from './pages/TutorPage'
import { ParentDashboardPage } from './pages/ParentDashboardPage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <DevBanner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/math"
            element={
              <ProtectedRoute>
                <MathPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/english"
            element={
              <ProtectedRoute>
                <EnglishPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/essay"
            element={
              <ProtectedRoute>
                <EssayPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/vocabulary"
            element={
              <ProtectedRoute>
                <VocabularyPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress/english"
            element={
              <ProtectedRoute>
                <EnglishProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor"
            element={
              <ProtectedRoute>
                <TutorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/parent" element={<ParentDashboardPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  )
}

export default App