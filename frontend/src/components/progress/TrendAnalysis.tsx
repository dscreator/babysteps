import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, Calendar, Clock, Target, Award } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface TrendData {
  timeRange: 'week' | 'month' | 'quarter'
  performanceTrends: PerformanceTrend[]
  improvementMetrics: ImprovementMetric[]
  consistencyAnalysis: ConsistencyData
  predictions: PredictionData
  insights: Insight[]
}

interface PerformanceTrend {
  date: string
  overall: number
  math: number
  english: number
  essay: number
  sessionsCompleted: number
  timeSpent: number
}

interface ImprovementMetric {
  subject: string
  currentScore: number
  previousScore: number
  improvement: number
  trend: 'up' | 'down' | 'stable'
  velocity: number // points per week
}

interface ConsistencyData {
  studyStreak: number
  averageSessionsPerWeek: number
  consistencyScore: number
  missedDays: number
  bestStreak: number
  weeklyPattern: WeeklyPattern[]
}

interface WeeklyPattern {
  day: string
  averageTime: number
  averageAccuracy: number
  sessionCount: number
}

interface PredictionData {
  examReadiness: number
  projectedScores: {
    math: number
    english: number
    essay: number
  }
  confidenceLevel: number
  recommendedAdjustments: string[]
}

interface Insight {
  type: 'positive' | 'warning' | 'neutral'
  title: string
  description: string
  actionable: boolean
  recommendation?: string
}

interface TrendAnalysisProps {
  className?: string
}

export function TrendAnalysis({ className = '' }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    fetchTrendData()
  }, [selectedTimeRange])

  const fetchTrendData = async () => {
    setLoading(true)
    try {
      // Mock data - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: TrendData = {
        timeRange: selectedTimeRange,
        performanceTrends: generatePerformanceTrends(),
        improvementMetrics: [
          {
            subject: 'Math',
            currentScore: 75,
            previousScore: 68,
            improvement: 7,
            trend: 'up',
            velocity: 2.3
          },
          {
            subject: 'English',
            currentScore: 81,
            previousScore: 79,
            improvement: 2,
            trend: 'up',
            velocity: 0.8
          },
          {
            subject: 'Essay',
            currentScore: 77,
            previousScore: 73,
            improvement: 4,
            trend: 'up',
            velocity: 1.5
          }
        ],
        consistencyAnalysis: {
          studyStreak: 7,
          averageSessionsPerWeek: 4.2,
          consistencyScore: 78,
          missedDays: 3,
          bestStreak: 12,
          weeklyPattern: [
            { day: 'Monday', averageTime: 35, averageAccuracy: 76, sessionCount: 8 },
            { day: 'Tuesday', averageTime: 28, averageAccuracy: 74, sessionCount: 6 },
            { day: 'Wednesday', averageTime: 42, averageAccuracy: 79, sessionCount: 9 },
            { day: 'Thursday', averageTime: 31, averageAccuracy: 77, sessionCount: 7 },
            { day: 'Friday', averageTime: 25, averageAccuracy: 72, sessionCount: 5 },
            { day: 'Saturday', averageTime: 45, averageAccuracy: 81, sessionCount: 10 },
            { day: 'Sunday', averageTime: 38, averageAccuracy: 78, sessionCount: 8 }
          ]
        },
        predictions: {
          examReadiness: 73,
          projectedScores: {
            math: 78,
            english: 83,
            essay: 79
          },
          confidenceLevel: 85,
          recommendedAdjustments: [
            'Increase math practice by 15 minutes daily',
            'Focus on essay structure improvement',
            'Maintain current English practice routine'
          ]
        },
        insights: [
          {
            type: 'positive',
            title: 'Strong Improvement Trend',
            description: 'Your math scores have improved by 7 points over the past month, showing excellent progress.',
            actionable: false
          },
          {
            type: 'warning',
            title: 'Inconsistent Friday Practice',
            description: 'Your practice sessions on Fridays are shorter and less accurate than other days.',
            actionable: true,
            recommendation: 'Consider scheduling longer Friday sessions or moving some practice to other days.'
          },
          {
            type: 'positive',
            title: 'Weekend Performance Peak',
            description: 'You consistently perform best during weekend sessions with higher accuracy and longer study times.',
            actionable: false
          },
          {
            type: 'neutral',
            title: 'Steady English Progress',
            description: 'English scores are improving steadily, though at a slower pace than math.',
            actionable: true,
            recommendation: 'Consider adding vocabulary flashcards to accelerate English improvement.'
          }
        ]
      }
      
      setTrendData(mockData)
    } catch (error) {
      console.error('Failed to fetch trend data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePerformanceTrends = (): PerformanceTrend[] => {
    const trends: PerformanceTrend[] = []
    const days = selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : 90
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate improving trends with some variance
      const baseImprovement = (days - i) / days * 10
      
      trends.push({
        date: date.toISOString().split('T')[0],
        overall: Math.max(60, Math.min(90, 70 + baseImprovement + (Math.random() - 0.5) * 8)),
        math: Math.max(55, Math.min(85, 65 + baseImprovement + (Math.random() - 0.5) * 10)),
        english: Math.max(65, Math.min(95, 75 + baseImprovement * 0.5 + (Math.random() - 0.5) * 6)),
        essay: Math.max(60, Math.min(90, 68 + baseImprovement * 0.8 + (Math.random() - 0.5) * 8)),
        sessionsCompleted: Math.floor(Math.random() * 3) + 1,
        timeSpent: Math.floor(Math.random() * 40) + 20
      })
    }
    
    return trends
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'down': return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'stable': return <Target className="w-5 h-5 text-gray-600" />
    }
  }

  const getInsightIcon = (type: 'positive' | 'warning' | 'neutral') => {
    switch (type) {
      case 'positive': return <Award className="w-5 h-5 text-green-600" />
      case 'warning': return <TrendingDown className="w-5 h-5 text-yellow-600" />
      case 'neutral': return <Target className="w-5 h-5 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!trendData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">Failed to load trend analysis</p>
        <Button onClick={fetchTrendData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
          <p className="text-gray-600">Detailed analysis of your learning progress and patterns</p>
        </div>
        
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </select>
      </div>

      {/* Improvement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendData.improvementMetrics.map((metric, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{metric.subject}</h3>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Score</span>
                <span className="text-xl font-bold text-gray-900">{metric.currentScore}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Improvement</span>
                <span className={`text-sm font-medium ${
                  metric.improvement > 0 ? 'text-green-600' : 
                  metric.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.improvement > 0 ? '+' : ''}{metric.improvement} points
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Velocity</span>
                <span className="text-sm font-medium text-blue-600">
                  +{metric.velocity} pts/week
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Trends Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
        <div className="h-80">
          <Line
            data={{
              labels: trendData.performanceTrends.map(t => 
                new Date(t.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })
              ),
              datasets: [
                {
                  label: 'Overall',
                  data: trendData.performanceTrends.map(t => t.overall),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Math',
                  data: trendData.performanceTrends.map(t => t.math),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: false,
                  tension: 0.4
                },
                {
                  label: 'English',
                  data: trendData.performanceTrends.map(t => t.english),
                  borderColor: 'rgb(245, 158, 11)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  fill: false,
                  tension: 0.4
                },
                {
                  label: 'Essay',
                  data: trendData.performanceTrends.map(t => t.essay),
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
                tooltip: {
                  mode: 'index',
                  intersect: false,
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
              },
              interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
              }
            }}
          />
        </div>
      </Card>

      {/* Consistency Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Consistency */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Consistency</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Current Streak</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {trendData.consistencyAnalysis.studyStreak} days
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Best Streak</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {trendData.consistencyAnalysis.bestStreak} days
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Sessions/Week</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {trendData.consistencyAnalysis.averageSessionsPerWeek}
              </span>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Consistency Score</span>
                <span className="text-lg font-semibold text-gray-900">
                  {trendData.consistencyAnalysis.consistencyScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${trendData.consistencyAnalysis.consistencyScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Weekly Pattern */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Study Pattern</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: trendData.consistencyAnalysis.weeklyPattern.map(p => p.day.slice(0, 3)),
                datasets: [
                  {
                    label: 'Average Time (min)',
                    data: trendData.consistencyAnalysis.weeklyPattern.map(p => p.averageTime),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    yAxisID: 'y'
                  },
                  {
                    label: 'Accuracy (%)',
                    data: trendData.consistencyAnalysis.weeklyPattern.map(p => p.averageAccuracy),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Time (minutes)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Accuracy (%)'
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>

      {/* Predictions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Projected Exam Scores</h4>
            <div className="space-y-3">
              {Object.entries(trendData.predictions.projectedScores).map(([subject, score]) => (
                <div key={subject} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{subject}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence Level</span>
                <span className="text-lg font-semibold text-gray-900">
                  {trendData.predictions.confidenceLevel}%
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Adjustments</h4>
            <div className="space-y-2">
              {trendData.predictions.recommendedAdjustments.map((adjustment, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{adjustment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-4">
          {trendData.insights.map((insight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-gray-700 mb-2">{insight.description}</p>
                  {insight.actionable && insight.recommendation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}