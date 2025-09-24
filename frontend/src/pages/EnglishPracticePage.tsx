import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Settings, BarChart3 } from 'lucide-react'
import { EnglishSession } from '../components/practice/english/EnglishSession'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { DashboardLayout } from '../components/common/DashboardLayout'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { QuickNavigation, englishModuleNavigation } from '../components/common/QuickNavigation'
import { englishService } from '../services/englishService'

interface PracticeSettings {
  gradeLevel: number
  subjectArea: string
  timeLimit: number
}

export function EnglishPracticePage() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>({
    gradeLevel: 7,
    subjectArea: '',
    timeLimit: 2700 // 45 minutes
  })
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleStartPractice = () => {
    setSessionStarted(true)
    setShowSettings(false)
  }

  const handleSessionComplete = () => {
    setSessionStarted(false)
    // Could show completion modal or redirect
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  if (sessionStarted) {
    return (
      <DashboardLayout>
        <EnglishSession
          gradeLevel={practiceSettings.gradeLevel}
          subjectArea={practiceSettings.subjectArea || undefined}
          timeLimit={practiceSettings.timeLimit}
          onSessionComplete={handleSessionComplete}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">English Practice</h1>
              <p className="text-gray-600">
                Improve your reading comprehension and vocabulary skills with ISEE-aligned content
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

        {/* Practice Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Quick Start */}
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Practice</h3>
              <p className="text-gray-600 mb-4">
                Start immediately with a reading passage and questions at your grade level
              </p>
              <Button
                onClick={handleStartPractice}
                className="w-full"
              >
                Start Reading Practice
              </Button>
            </div>
          </Card>

          {/* Custom Settings */}
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Practice</h3>
              <p className="text-gray-600 mb-4">
                Choose specific topics, difficulty levels, and time limits
              </p>
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="w-full"
              >
                Customize Settings
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>Grade 6</option>
                    <option value={7}>Grade 7</option>
                    <option value={8}>Grade 8</option>
                  </select>
                </div>

                {/* Subject Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Area (Optional)
                  </label>
                  <select
                    value={practiceSettings.subjectArea}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      subjectArea: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Topics</option>
                    {englishService.getAvailableSubjectAreas().map(area => (
                      <option key={area} value={area}>
                        {area.charAt(0).toUpperCase() + area.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit
                  </label>
                  <select
                    value={practiceSettings.timeLimit}
                    onChange={(e) => setPracticeSettings(prev => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1800}>30 minutes</option>
                    <option value={2700}>45 minutes</option>
                    <option value={3600}>60 minutes</option>
                    <option value={0}>No time limit</option>
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
                  onClick={handleStartPractice}
                  className="flex-1"
                >
                  Start Practice
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mb-8">
          <QuickNavigation 
            title="Related Practice Modules"
            items={englishModuleNavigation}
          />
        </div>

        {/* Practice Tips */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">English Practice Tips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reading Comprehension</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Read the passage carefully before looking at questions</li>
                <li>• Look for main ideas and supporting details</li>
                <li>• Pay attention to transition words and paragraph structure</li>
                <li>• Use context clues for unfamiliar vocabulary</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Question Strategies</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Read questions carefully and identify what's being asked</li>
                <li>• Eliminate obviously wrong answers first</li>
                <li>• Look back at the passage to find evidence</li>
                <li>• Don't overthink - go with your first instinct</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/progress')}
            className="inline-flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View English Progress
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}