import { Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { queryClient } from './lib/queryClient'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { MathPracticePage } from './pages/MathPracticePage'
import { EnglishPracticePage } from './pages/EnglishPracticePage'
import { EssayPracticePage } from './pages/EssayPracticePage'
import { ProgressPage } from './pages/ProgressPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
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
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
        </Routes>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App