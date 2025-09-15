import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { EnglishAnalytics } from './EnglishAnalytics'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'

interface EnglishProgressDashboardProps {
  userId?: string
}

interface RecommendedPractice {
  type: 'reading' | 'vocabulary' | 'mixed'
  title: string
  description: string
  difficulty: number
  estimatedTime: number
  focusAreas: string[]
  icon: React.ReactNode
}

export function EnglishProgressDashboard({ userId }: EnglishProgressDashboardProps) {
  const navigate = useNavigate()
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('month')

  // Mock data for recommended practice sessions
  const recommendedPractice: RecommendedPractice[] = [
    {
      type: 'reading',
      title: 'Inference Practice',
      description: 'Focus on reading between the lines and drawing conclusions',
      difficulty: 3,
      estimatedTime: 25,
      focusAreas: ['Inference Questions', 'Critical Thinking'],
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      type: 'vocabulary',
      title: 'Advanced Vocabulary',
      description: 'Master Level 3-4 vocabulary words with spaced repetition',
      difficulty: 4,
      estimatedTime: 20,
      focusAreas: ['Advanced Vocabulary', 'Word Relationships'],
      icon: <Target className="w-5 h-5" />
    },
    {
      type: 'reading',
      title: 'Complex Passages',
      description: 'Practice with longer, more challenging reading materials',
      difficulty: 3,
      estimatedTime: 30,
      focusAreas: ['Reading Comprehension', 'Complex Texts'],
      icon: <TrendingUp className="w-5 h-5" />
    }
  ]

  const handleStartTargetedPractice = (recommendations: string[]) => {
    // Navigate to appropriate practice based on recommendations
    if (recommendations.some(r => r.toLowerCase().includes('vocabulary'))) {
      navigate('/practice/vocabulary', { 
        state: { 
          targetedPractice: true, 
          recommendations 
        }
      })
    } else {
      navigate('/practice/english', { 
        state: { 
          targetedPractice: true, 
          recommendations 
        }
      })
    }
  }

  const handleStartRecommendedPractice = (practice: RecommendedPractice) => {
    if (practice.type === 'vocabulary') {
      navigate('/practice/vocabulary', {
        state: {
          customSettings: {
            difficultyLevel: practice.difficulty,
            focusAreas: practice.focusAreas
          }
        }
      })
    } else {
      navigate('/practice/english', {
        state: {
          customSettings: {
            difficulty: practice.difficulty,
            focusAreas: practice.focusAreas
          }
        }
      })
    }
  }

  const getDifficultyColor = (difficulty: number): string => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-red-100 text-red-800'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (difficulty: number): string => {
    const labels = {
      1: 'Basic',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert'
    }
    return labels[difficulty as keyof typeof labels] || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">English Progress Dashboard</h2>
          <p className="text-gray-600">Track your reading comprehension and vocabulary development</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="all">All Time</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium text-gray-900">Reading Practice</h3>
              <p className="text-sm text-gray-600">Comprehension & Analysis</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/practice/english')}
              className="flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Start
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium text-gray-900">Vocabulary</h3>
              <p className="text-sm text-gray-600">Flashcards & Quizzes</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/practice/vocabulary')}
              className="flex items-center gap-1"
            >
              <Target className="w-4 h-4" />
              Start
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium text-gray-900">Progress Report</h3>
              <p className="text-sm text-gray-600">Detailed Analytics</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/progress/english')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              View
            </Button>
          </div>
        </Card>
      </div>

      {/* Recommended Practice Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="w-5 h-5 text-blue-600 mr-2" />
            Recommended Practice
          </h3>
          <span className="text-sm text-gray-500">Based on your performance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedPractice.map((practice, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleStartRecommendedPractice(practice)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    {practice.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{practice.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                        {getDifficultyLabel(practice.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {practice.estimatedTime}min
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>

              <p className="text-sm text-gray-600 mb-3">{practice.description}</p>

              <div className="flex flex-wrap gap-1">
                {practice.focusAreas.map((area, areaIndex) => (
                  <span
                    key={areaIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Analytics Component */}
      <EnglishAnalytics
        userId={userId}
        timeRange={selectedTimeRange}
        onStartTargetedPractice={handleStartTargetedPractice}
      />

      {/* Study Tips */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">English Study Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reading Comprehension</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Preview the passage before reading questions</li>
              <li>• Look for topic sentences and main ideas</li>
              <li>• Pay attention to transition words and structure</li>
              <li>• Practice active reading with annotations</li>
              <li>• Time yourself to build reading speed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vocabulary Building</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use spaced repetition for long-term retention</li>
              <li>• Learn words in context, not isolation</li>
              <li>• Focus on word roots, prefixes, and suffixes</li>
              <li>• Practice with synonyms and antonyms</li>
              <li>• Review difficult words more frequently</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}