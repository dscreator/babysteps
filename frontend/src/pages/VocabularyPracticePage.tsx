import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, Shuffle, Settings } from 'lucide-react'
import { VocabularySession } from '../components/practice/english/VocabularySession'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { englishService } from '../services/englishService'

interface PracticeSettings {
  mode: 'flashcards' | 'quiz' | 'mixed'
  gradeLevel: number
  difficultyLevel?: number
  wordCount: number
}

export function VocabularyPracticePage() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>({
    mode: 'mixed',
    gradeLevel: 7,
    difficultyLevel: undefined,
    wordCount: 20
  })
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleStartPractice = (mode?: 'flashcards' | 'quiz' | 'mixed') => {
    if (mode) {
      setPracticeSettings(prev => ({ ...prev, mode }))
    }
    setSessionStarted(true)
    setShowSettings(false)
  }

  const handleSessionComplete = () => {
    setSessionStarted(false)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  if (sessionStarted) {
    return (
      <DashboardLayout>
        <VocabularySession
          mode={practiceSettings.mode}
          gradeLevel={practiceSettings.gradeLevel}
          difficultyLevel={practiceSettings.difficultyLevel}
          wordCount={practiceSettings.wordCount}
          onSessionComplete={handleSessionComplete}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Vocabulary Practice</h1>
              <p className="text-gray-600">
                Build your vocabulary with flashcards and quizzes using spaced repetition
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Practice Mode Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Flashcards */}
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flashcards</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Study vocabulary words with interactive flashcards and self-assessment
              </p>
              <Button
                onClick={() => handleStartPractice('flashcards')}
                className="w-full"
                variant="outline"
              >
                Start Flashcards
              </Button>
            </div>
          </Card>

          {/* Quiz Mode */}
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz Mode</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Test your knowledge with multiple choice questions and instant feedback
              </p>
              <Button
                onClick={() => handleStartPractice('quiz')}
                className="w-full"
                variant="outline"
              >
                Start Quiz
              </Button>
            </div>
          </Card>

          {/* Mixed Practice */}
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shuffle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mixed Practice</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Combine flashcards and quizzes for comprehensive vocabulary learning
              </p>
              <Button
                onClick={() => handleStartPractice('mixed')}
                className="w-full"
              >
                Start Mixed Practice
              </Button>
            </div>
          </Card>
        </div>

        {/* Custom Settings */}
        <div className="mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Settings</h3>
                <p className="text-gray-600 text-sm">
                  Adjust difficulty, word count, and grade level for personalized practice
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Customize
              </Button>
            </div>
          </Card>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Practice Settings</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                {/* Practice Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Practice Mode
                  </label>
                  <select
                    value={practiceSettings.mode}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      mode: e.target.value as 'flashcards' | 'quiz' | 'mixed'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="flashcards">Flashcards Only</option>
                    <option value="quiz">Quiz Only</option>
                    <option value="mixed">Mixed Practice</option>
                  </select>
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    value={practiceSettings.gradeLevel}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      gradeLevel: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={6}>Grade 6</option>
                    <option value={7}>Grade 7</option>
                    <option value={8}>Grade 8</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level (Optional)
                  </label>
                  <select
                    value={practiceSettings.difficultyLevel || ''}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      difficultyLevel: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Levels</option>
                    {englishService.getDifficultyLevels().map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Word Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Words
                  </label>
                  <select
                    value={practiceSettings.wordCount}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      wordCount: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={10}>10 words (Quick)</option>
                    <option value={20}>20 words (Standard)</option>
                    <option value={30}>30 words (Extended)</option>
                    <option value={50}>50 words (Intensive)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleStartPractice()}
                  className="flex-1"
                >
                  Start Practice
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Spaced Repetition Info */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Spaced Repetition</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Words you find difficult appear more frequently</li>
                <li>• Easy words are shown less often over time</li>
                <li>• Review intervals increase as you master words</li>
                <li>• Optimizes learning efficiency and retention</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Rating Guide</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Again:</strong> Didn't know it - show soon</li>
                <li>• <strong>Hard:</strong> Difficult - review in a few days</li>
                <li>• <strong>Medium:</strong> Okay - review in a week</li>
                <li>• <strong>Easy:</strong> Knew it well - review later</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}