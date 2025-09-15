import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Target, BookOpen, Zap, AlertCircle } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { englishService } from '../../../services/englishService'

interface EnglishAnalyticsProps {
  userId?: string
  timeRange?: 'week' | 'month' | 'all'
  onStartTargetedPractice?: (recommendations: string[]) => void
}

interface PerformanceData {
  questionTypePerformance: {
    main_idea: { correct: number; total: number; accuracy: number }
    detail: { correct: number; total: number; accuracy: number }
    inference: { correct: number; total: number; accuracy: number }
    vocabulary: { correct: number; total: number; accuracy: number }
  }
  vocabularyGaps: {
    difficultyLevel: number
    wordsStruggled: number
    totalWords: number
    gapPercentage: number
  }[]
  performanceTrend: {
    date: string
    accuracy: number
    questionsAnswered: number
  }[]
  readingSpeed: number // words per minute
  comprehensionAccuracy: number
  vocabularyMastery: number
  weakAreas: string[]
  strongAreas: string[]
  recommendations: string[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export function EnglishAnalytics({ 
  userId, 
  timeRange = 'month',
  onStartTargetedPractice 
}: EnglishAnalyticsProps) {
  // Fetch English performance data
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['english-analytics', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/practice/analytics/english?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch English analytics')
      }
      
      const data = await response.json()
      return data.analytics as PerformanceData
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <Card>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Complete some English practice sessions to see your analytics.</p>
        </div>
      </Card>
    )
  }

  // Prepare chart data
  const questionTypeData = Object.entries(performanceData.questionTypePerformance).map(([type, data]) => ({
    type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    accuracy: data.accuracy,
    correct: data.correct,
    total: data.total
  }))

  const vocabularyGapData = performanceData.vocabularyGaps.map(gap => ({
    level: `Level ${gap.difficultyLevel}`,
    gapPercentage: gap.gapPercentage,
    wordsStruggled: gap.wordsStruggled,
    totalWords: gap.totalWords
  }))

  const trendData = performanceData.performanceTrend.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reading Speed</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.readingSpeed} WPM</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {performanceData.readingSpeed >= 200 ? 'Above average' : 'Room for improvement'}
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comprehension</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.comprehensionAccuracy}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {performanceData.comprehensionAccuracy >= 75 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className="text-sm text-gray-600">
              {performanceData.comprehensionAccuracy >= 75 ? 'Strong performance' : 'Needs improvement'}
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vocabulary Mastery</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.vocabularyMastery}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {performanceData.vocabularyMastery >= 80 ? 'Excellent' : 'Keep practicing'}
            </span>
          </div>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'accuracy' ? `${value}%` : value,
                  name === 'accuracy' ? 'Accuracy' : 'Questions Answered'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Type Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Question Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vocabulary Gaps */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vocabulary Gaps by Difficulty</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vocabularyGapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Gap Percentage']} />
                <Bar dataKey="gapPercentage" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            Strong Areas
          </h3>
          <div className="space-y-2">
            {performanceData.strongAreas.map((area, index) => (
              <div key={index} className="flex items-center p-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-green-800">{area}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            Areas for Improvement
          </h3>
          <div className="space-y-2">
            {performanceData.weakAreas.map((area, index) => (
              <div key={index} className="flex items-center p-2 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-red-800">{area}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 text-blue-600 mr-2" />
          Personalized Recommendations
        </h3>
        <div className="space-y-3">
          {performanceData.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                {index + 1}
              </div>
              <span className="text-sm text-blue-800 flex-1">{recommendation}</span>
            </div>
          ))}
        </div>
        
        {onStartTargetedPractice && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => onStartTargetedPractice(performanceData.recommendations)}
              className="w-full"
            >
              Start Targeted Practice
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}