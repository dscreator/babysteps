import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import type { DetailedProgress } from '../../types/api'

interface ProgressSummaryProps {
  progress: DetailedProgress
  className?: string
}

export function ProgressSummary({ progress, className }: ProgressSummaryProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'math': return '🔢'
      case 'english': return '📚'
      case 'essay': return '✍️'
      default: return '📊'
    }
  }



  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500'
    if (accuracy >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">{getSubjectIcon(progress.subject)}</span>
          <span className="capitalize">{progress.subject} Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${getAccuracyColor(progress.accuracy)}`}>
              {progress.accuracy}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(progress.timeSpent)}
            </div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {progress.questionsAnswered}
            </div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(progress.questionsAnswered / (progress.timeSpent / 60 || 1))}
            </div>
            <div className="text-sm text-gray-600">Per Hour</div>
          </div>
        </div>

        {/* Accuracy Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Accuracy</span>
            <span>{progress.accuracy}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getAccuracyBgColor(progress.accuracy)}`}
              style={{ width: `${Math.min(progress.accuracy, 100)}%` }}
            />
          </div>
        </div>

        {/* Strong Areas */}
        {progress.strongAreas.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
              <span>💪</span>
              Strong Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {progress.strongAreas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weak Areas */}
        {progress.weakAreas.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              <span>🎯</span>
              Focus Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {progress.weakAreas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {progress.recommendations.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <span>💡</span>
              Recommendations
            </h4>
            <ul className="space-y-2">
              {progress.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📈 Performance Insights</h4>
          <div className="text-sm text-blue-700 space-y-1">
            {progress.accuracy >= 80 && (
              <p>Excellent accuracy! You're mastering this subject.</p>
            )}
            {progress.accuracy >= 60 && progress.accuracy < 80 && (
              <p>Good progress! Focus on weak areas to improve further.</p>
            )}
            {progress.accuracy < 60 && (
              <p>Keep practicing! Consistent effort will improve your scores.</p>
            )}
            
            {progress.timeSpent > 300 && (
              <p>Great dedication with {formatTime(progress.timeSpent)} of practice time!</p>
            )}
            
            {progress.questionsAnswered > 100 && (
              <p>Impressive! You've answered {progress.questionsAnswered} questions.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}