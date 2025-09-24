import { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Calendar, TrendingUp, Target, Award, Download, Filter } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

interface ProgressData {
  overall: {
    accuracy: number
    totalSessions: number
    totalTimeSpent: number
    averageSessionTime: number
    streak: number
    improvement: number
  }
  subjects: {
    math: SubjectProgress
    english: SubjectProgress
    essay: SubjectProgress
  }
  trends: {
    daily: DailyProgress[]
    weekly: WeeklyProgress[]
    monthly: MonthlyProgress[]
  }
  readiness: ReadinessAssessment
}

interface SubjectProgress {
  accuracy: number
  sessionsCompleted: number
  timeSpent: number
  topicBreakdown: Record<string, number>
  weakAreas: string[]
  strongAreas: string[]
  improvement: number
}

interface DailyProgress {
  date: string
  accuracy: number
  sessionsCompleted: number
  timeSpent: number
  subjects: Record<string, number>
}

interface WeeklyProgress {
  week: string
  accuracy: number
  sessionsCompleted: number
  timeSpent: number
  improvement: number
}

interface MonthlyProgress {
  month: string
  accuracy: number
  sessionsCompleted: number
  timeSpent: number
  improvement: number
}

interface ReadinessAssessment {
  overallReadiness: number
  subjectReadiness: Record<string, number>
  recommendations: string[]
  examDate: string
  daysRemaining: number
  studyPlan: StudyPlanItem[]
}

interface StudyPlanItem {
  subject: string
  priority: 'high' | 'medium' | 'low'
  recommendedTime: number
  topics: string[]
}

interface ProgressAnalyticsProps {
  className?: string
}

export function ProgressAnalytics({ className = '' }: ProgressAnalyticsProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'math' | 'english' | 'essay'>('all')

  useEffect(() => {
    fetchProgressData()
  }, [timeRange, selectedSubject])

  const fetchProgressData = async () => {
    setLoading(true)
    try {
      // Mock data - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: ProgressData = {
        overall: {
          accuracy: 78,
          totalSessions: 45,
          totalTimeSpent: 1260, // minutes
          averageSessionTime: 28,
          streak: 7,
          improvement: 12
        },
        subjects: {
          math: {
            accuracy: 75,
            sessionsCompleted: 18,
            timeSpent: 540,
            topicBreakdown: {
              'Arithmetic': 82,
              'Algebra': 71,
              'Geometry': 68,
              'Data Analysis': 79
            },
            weakAreas: ['Geometry', 'Algebra'],
            strongAreas: ['Arithmetic', 'Data Analysis'],
            improvement: 15
          },
          english: {
            accuracy: 81,
            sessionsCompleted: 15,
            timeSpent: 420,
            topicBreakdown: {
              'Reading Comprehension': 83,
              'Vocabulary': 79,
              'Sentence Completion': 80
            },
            weakAreas: ['Vocabulary'],
            strongAreas: ['Reading Comprehension'],
            improvement: 9
          },
          essay: {
            accuracy: 77,
            sessionsCompleted: 12,
            timeSpent: 300,
            topicBreakdown: {
              'Structure': 75,
              'Grammar': 78,
              'Content': 79,
              'Vocabulary Usage': 76
            },
            weakAreas: ['Structure'],
            strongAreas: ['Content'],
            improvement: 11
          }
        },
        trends: {
          daily: generateDailyTrends(),
          weekly: generateWeeklyTrends(),
          monthly: generateMonthlyTrends()
        },
        readiness: {
          overallReadiness: 73,
          subjectReadiness: {
            'Math': 70,
            'English': 76,
            'Essay': 73
          },
          recommendations: [
            'Focus on geometry practice for math improvement',
            'Increase vocabulary study time',
            'Practice essay structure and organization',
            'Maintain consistent daily practice schedule'
          ],
          examDate: '2024-03-15',
          daysRemaining: 45,
          studyPlan: [
            {
              subject: 'Math',
              priority: 'high',
              recommendedTime: 45,
              topics: ['Geometry', 'Algebra']
            },
            {
              subject: 'English',
              priority: 'medium',
              recommendedTime: 30,
              topics: ['Vocabulary']
            },
            {
              subject: 'Essay',
              priority: 'medium',
              recommendedTime: 30,
              topics: ['Structure', 'Organization']
            }
          ]
        }
      }
      
      setProgressData(mockData)
    } catch (error) {
      console.error('Failed to fetch progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyTrends = (): DailyProgress[] => {
    const trends: DailyProgress[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString().split('T')[0],
        accuracy: 70 + Math.random() * 20,
        sessionsCompleted: Math.floor(Math.random() * 4),
        timeSpent: Math.floor(Math.random() * 60) + 20,
        subjects: {
          math: 70 + Math.random() * 20,
          english: 75 + Math.random() * 15,
          essay: 65 + Math.random() * 25
        }
      })
    }
    return trends
  }

  const generateWeeklyTrends = (): WeeklyProgress[] => {
    const trends: WeeklyProgress[] = []
    for (let i = 7; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - (i * 7))
      trends.push({
        week: `Week of ${date.toLocaleDateString()}`,
        accuracy: 70 + Math.random() * 20,
        sessionsCompleted: Math.floor(Math.random() * 15) + 5,
        timeSpent: Math.floor(Math.random() * 300) + 100,
        improvement: Math.random() * 10 - 5
      })
    }
    return trends
  }

  const generateMonthlyTrends = (): MonthlyProgress[] => {
    const trends: MonthlyProgress[] = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    months.forEach(month => {
      trends.push({
        month,
        accuracy: 70 + Math.random() * 20,
        sessionsCompleted: Math.floor(Math.random() * 50) + 20,
        timeSpent: Math.floor(Math.random() * 1000) + 500,
        improvement: Math.random() * 15 - 5
      })
    })
    return trends
  }

  const exportReport = async () => {
    // Mock export functionality
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      selectedSubject,
      data: progressData
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `progress-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!progressData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">Failed to load progress data</p>
        <Button onClick={fetchProgressData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Analytics</h2>
          <p className="text-gray-600">Comprehensive analysis of your ISEE preparation</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
          
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as 'all' | 'math' | 'english' | 'essay')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Subjects</option>
            <option value="math">Math</option>
            <option value="english">English</option>
            <option value="essay">Essay</option>
          </select>
          
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={exportReport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.overall.accuracy}%</p>
              <p className="text-sm text-green-600">+{progressData.overall.improvement}% this month</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.overall.totalSessions}</p>
              <p className="text-sm text-gray-600">{Math.round(progressData.overall.totalTimeSpent / 60)}h total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.overall.streak} days</p>
              <p className="text-sm text-gray-600">Keep it up! 🔥</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Exam Readiness</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.readiness.overallReadiness}%</p>
              <p className="text-sm text-gray-600">{progressData.readiness.daysRemaining} days left</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Trends Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-80">
          <Line
            data={{
              labels: progressData.trends.daily.map(d => new Date(d.date).toLocaleDateString()),
              datasets: [
                {
                  label: 'Overall Accuracy',
                  data: progressData.trends.daily.map(d => d.accuracy),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Math',
                  data: progressData.trends.daily.map(d => d.subjects.math),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: false,
                  tension: 0.4
                },
                {
                  label: 'English',
                  data: progressData.trends.daily.map(d => d.subjects.english),
                  borderColor: 'rgb(245, 158, 11)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  fill: false,
                  tension: 0.4
                },
                {
                  label: 'Essay',
                  data: progressData.trends.daily.map(d => d.subjects.essay),
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fill: false,
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%'
                    }
                  }
                }
              }
            }}
          />
        </div>
      </Card>

      {/* Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['Math', 'English', 'Essay'],
                datasets: [
                  {
                    label: 'Accuracy (%)',
                    data: [
                      progressData.subjects.math.accuracy,
                      progressData.subjects.english.accuracy,
                      progressData.subjects.essay.accuracy
                    ],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(245, 158, 11)'
                    ],
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%'
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Readiness Assessment */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Readiness</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: Object.keys(progressData.readiness.subjectReadiness),
                datasets: [
                  {
                    data: Object.values(progressData.readiness.subjectReadiness),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(245, 158, 11)'
                    ],
                    borderWidth: 2
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
        <div className="space-y-4">
          {progressData.readiness.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
              </div>
              <p className="text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Study Plan */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Study Plan</h3>
        <div className="space-y-4">
          {progressData.readiness.studyPlan.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{item.subject}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority} priority
                  </span>
                  <span className="text-sm text-gray-600">{item.recommendedTime} min/day</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.topics.map((topic, topicIndex) => (
                  <span key={topicIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}