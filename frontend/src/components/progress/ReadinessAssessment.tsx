import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, Target, TrendingUp, BookOpen } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ReadinessData {
  overallReadiness: number
  examDate: string
  daysRemaining: number
  subjectReadiness: {
    math: SubjectReadiness
    english: SubjectReadiness
    essay: SubjectReadiness
  }
  recommendations: Recommendation[]
  studyPlan: StudyPlanRecommendation[]
  milestones: Milestone[]
}

interface SubjectReadiness {
  score: number
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical'
  strengths: string[]
  weaknesses: string[]
  timeSpent: number
  sessionsCompleted: number
  recommendedFocus: string[]
}

interface Recommendation {
  type: 'urgent' | 'important' | 'suggested'
  subject: string
  title: string
  description: string
  estimatedImpact: number
  timeRequired: number
}

interface StudyPlanRecommendation {
  subject: string
  dailyMinutes: number
  weeklyGoal: string
  focusAreas: string[]
  priority: 'high' | 'medium' | 'low'
}

interface Milestone {
  title: string
  description: string
  targetDate: string
  completed: boolean
  progress: number
}

interface ReadinessAssessmentProps {
  className?: string
}

export function ReadinessAssessment({ className = '' }: ReadinessAssessmentProps) {
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReadinessData()
  }, [])

  const fetchReadinessData = async () => {
    setLoading(true)
    try {
      // Mock data - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: ReadinessData = {
        overallReadiness: 73,
        examDate: '2024-03-15',
        daysRemaining: 45,
        subjectReadiness: {
          math: {
            score: 70,
            status: 'good',
            strengths: ['Arithmetic', 'Data Analysis'],
            weaknesses: ['Geometry', 'Advanced Algebra'],
            timeSpent: 540,
            sessionsCompleted: 18,
            recommendedFocus: ['Geometric reasoning', 'Algebraic expressions']
          },
          english: {
            score: 76,
            status: 'good',
            strengths: ['Reading Comprehension', 'Main Ideas'],
            weaknesses: ['Vocabulary', 'Inference Questions'],
            timeSpent: 420,
            sessionsCompleted: 15,
            recommendedFocus: ['Advanced vocabulary', 'Critical reading']
          },
          essay: {
            score: 73,
            status: 'needs-improvement',
            strengths: ['Content Development', 'Grammar'],
            weaknesses: ['Organization', 'Transitions'],
            timeSpent: 300,
            sessionsCompleted: 12,
            recommendedFocus: ['Essay structure', 'Paragraph organization']
          }
        },
        recommendations: [
          {
            type: 'urgent',
            subject: 'Math',
            title: 'Focus on Geometry',
            description: 'Your geometry scores are below target. Dedicate extra time to geometric reasoning and proofs.',
            estimatedImpact: 8,
            timeRequired: 30
          },
          {
            type: 'important',
            subject: 'Essay',
            title: 'Improve Essay Structure',
            description: 'Work on organizing your essays with clear introduction, body, and conclusion paragraphs.',
            estimatedImpact: 6,
            timeRequired: 25
          },
          {
            type: 'suggested',
            subject: 'English',
            title: 'Expand Vocabulary',
            description: 'Regular vocabulary practice will help with both reading comprehension and essay writing.',
            estimatedImpact: 5,
            timeRequired: 20
          }
        ],
        studyPlan: [
          {
            subject: 'Math',
            dailyMinutes: 45,
            weeklyGoal: 'Complete 3 geometry practice sessions',
            focusAreas: ['Geometric reasoning', 'Area and perimeter', 'Angle relationships'],
            priority: 'high'
          },
          {
            subject: 'English',
            dailyMinutes: 30,
            weeklyGoal: 'Read 2 passages and learn 25 new vocabulary words',
            focusAreas: ['Advanced vocabulary', 'Inference questions', 'Critical reading'],
            priority: 'medium'
          },
          {
            subject: 'Essay',
            dailyMinutes: 30,
            weeklyGoal: 'Write 2 complete essays with feedback',
            focusAreas: ['Essay structure', 'Paragraph organization', 'Transitions'],
            priority: 'medium'
          }
        ],
        milestones: [
          {
            title: 'Math Geometry Mastery',
            description: 'Achieve 80% accuracy in geometry problems',
            targetDate: '2024-02-15',
            completed: false,
            progress: 65
          },
          {
            title: 'Vocabulary Expansion',
            description: 'Learn 200 new ISEE vocabulary words',
            targetDate: '2024-02-28',
            completed: false,
            progress: 45
          },
          {
            title: 'Essay Structure Improvement',
            description: 'Consistently write well-organized essays',
            targetDate: '2024-03-01',
            completed: false,
            progress: 30
          }
        ]
      }
      
      setReadinessData(mockData)
    } catch (error) {
      console.error('Failed to fetch readiness data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'needs-improvement': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'important': return <Target className="w-5 h-5 text-yellow-600" />
      case 'suggested': return <TrendingUp className="w-5 h-5 text-blue-600" />
      default: return <BookOpen className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!readinessData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">Failed to load readiness assessment</p>
        <Button onClick={fetchReadinessData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overall Readiness */}
      <Card>
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - readinessData.overallReadiness / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{readinessData.overallReadiness}%</div>
                <div className="text-sm text-gray-600">Ready</div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Readiness Assessment</h2>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{readinessData.daysRemaining} days remaining</span>
            </div>
            <div>Exam Date: {new Date(readinessData.examDate).toLocaleDateString()}</div>
          </div>
        </div>
      </Card>

      {/* Subject Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(readinessData.subjectReadiness).map(([subject, data]) => (
          <Card key={subject}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{subject}</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(data.status)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(data.status)}`}>
                  {data.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Readiness Score</span>
                <span className="text-lg font-semibold text-gray-900">{data.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.score}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Strengths</h4>
                <div className="flex flex-wrap gap-1">
                  {data.strengths.map((strength, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Areas to Improve</h4>
                <div className="flex flex-wrap gap-1">
                  {data.weaknesses.map((weakness, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{data.sessionsCompleted} sessions</span>
                <span>{Math.round(data.timeSpent / 60)}h practiced</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Recommendations</h3>
        <div className="space-y-4">
          {readinessData.recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getRecommendationIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rec.type === 'urgent' ? 'bg-red-100 text-red-800' :
                        rec.type === 'important' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.type}
                      </span>
                      <span className="text-sm text-gray-600">{rec.timeRequired} min/day</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subject: {rec.subject}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{rec.estimatedImpact} points potential
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Study Plan */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Study Plan</h3>
        <div className="space-y-4">
          {readinessData.studyPlan.map((plan, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{plan.subject}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    plan.priority === 'high' ? 'bg-red-100 text-red-800' :
                    plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {plan.priority} priority
                  </span>
                  <span className="text-sm font-medium text-gray-900">{plan.dailyMinutes} min/day</span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{plan.weeklyGoal}</p>
              
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Focus Areas:</h5>
                <div className="flex flex-wrap gap-2">
                  {plan.focusAreas.map((area, areaIndex) => (
                    <span key={areaIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Milestones */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
        <div className="space-y-4">
          {readinessData.milestones.map((milestone, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                <span className="text-sm text-gray-600">
                  Due: {new Date(milestone.targetDate).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{milestone.description}</p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">{milestone.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    milestone.completed ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}