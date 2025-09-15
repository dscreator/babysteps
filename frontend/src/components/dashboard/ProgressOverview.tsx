
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import type { ProgressDashboard } from '../../types/api'

interface ProgressOverviewProps {
  progress: ProgressDashboard['overallProgress']
  className?: string
}

interface SubjectCardProps {
  subject: string
  score: number
  icon: string
  color: string
}

function SubjectCard({ subject, score, icon, color }: SubjectCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-medium text-gray-900 capitalize">{subject}</h3>
          </div>
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(score)}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {score >= 80 && 'Excellent progress! 🌟'}
          {score >= 60 && score < 80 && 'Good work, keep going! 👍'}
          {score < 60 && 'Focus area - practice more! 📚'}
        </div>
      </CardContent>
    </Card>
  )
}

export function ProgressOverview({ progress, className }: ProgressOverviewProps) {
  const subjects = [
    { key: 'math', name: 'Math', icon: '🔢', color: 'blue' },
    { key: 'english', name: 'English', icon: '📚', color: 'green' },
    { key: 'essay', name: 'Essay', icon: '✍️', color: 'purple' },
  ]

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Subject Progress
        </h2>
        <p className="text-sm text-gray-600">
          Your recent performance across all practice areas
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.key}
            subject={subject.name}
            score={progress[subject.key as keyof typeof progress] || 0}
            icon={subject.icon}
            color={subject.color}
          />
        ))}
      </div>
      
      {/* Overall Progress Card */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-primary-600">
              {progress.overall}%
            </span>
            <span className="text-sm text-gray-500">
              Average across all subjects
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${Math.min(progress.overall, 100)}%` }}
            />
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            {progress.overall >= 80 && (
              <span className="text-green-600 font-medium">
                🎉 Outstanding! You're well-prepared for the ISEE!
              </span>
            )}
            {progress.overall >= 60 && progress.overall < 80 && (
              <span className="text-yellow-600 font-medium">
                📈 Great progress! Keep practicing to reach your goal!
              </span>
            )}
            {progress.overall < 60 && (
              <span className="text-orange-600 font-medium">
                💪 Building momentum! Consistent practice will improve your score!
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}