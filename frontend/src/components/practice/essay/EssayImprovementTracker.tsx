import { useMemo } from 'react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { EssaySubmission, EssayAnalysis } from '../../../types/api'

interface EssayImprovementTrackerProps {
  submissions: EssaySubmission[]
  analyses: EssayAnalysis[]
  onViewDetails?: (submissionId: string) => void
}

interface ImprovementTrend {
  date: string
  overallScore: number
  structureScore: number
  grammarScore: number
  contentScore: number
  vocabularyScore: number
  wordCount: number
  timeSpent?: number
}

interface ImprovementInsight {
  category: 'structure' | 'grammar' | 'content' | 'vocabulary' | 'overall'
  trend: 'improving' | 'declining' | 'stable'
  change: number
  description: string
  recommendation: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

function getTrendColor(trend: 'improving' | 'declining' | 'stable'): string {
  switch (trend) {
    case 'improving': return 'text-green-600'
    case 'declining': return 'text-red-600'
    case 'stable': return 'text-gray-600'
  }
}

function getTrendIcon(trend: 'improving' | 'declining' | 'stable'): string {
  switch (trend) {
    case 'improving': return '↗'
    case 'declining': return '↘'
    case 'stable': return '→'
  }
}

function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const recent = values.slice(-3) // Last 3 values
  const earlier = values.slice(0, -3) // Earlier values
  
  if (recent.length === 0 || earlier.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length
  
  const change = recentAvg - earlierAvg
  
  if (change > 3) return 'improving'
  if (change < -3) return 'declining'
  return 'stable'
}

export function EssayImprovementTracker({ 
  submissions, 
  analyses, 
  onViewDetails 
}: EssayImprovementTrackerProps) {
  // Create improvement trends data
  const improvementTrends = useMemo(() => {
    const submissionsWithAnalysis = submissions
      .map(submission => ({
        submission,
        analysis: analyses.find(a => a.submissionId === submission.id)
      }))
      .filter(item => item.analysis)
      .sort((a, b) => new Date(a.submission.submittedAt).getTime() - new Date(b.submission.submittedAt).getTime())

    return submissionsWithAnalysis.map(({ submission, analysis }) => ({
      date: submission.submittedAt,
      overallScore: analysis!.overallScore,
      structureScore: analysis!.structureScore,
      grammarScore: analysis!.grammarScore,
      contentScore: analysis!.contentScore,
      vocabularyScore: analysis!.vocabularyScore,
      wordCount: submission.wordCount,
      timeSpent: submission.timeSpent
    }))
  }, [submissions, analyses])

  // Generate improvement insights
  const improvementInsights = useMemo(() => {
    if (improvementTrends.length < 2) return []

    const insights: ImprovementInsight[] = []
    
    const categories = [
      { key: 'overallScore' as const, label: 'overall', name: 'Overall Performance' },
      { key: 'structureScore' as const, label: 'structure', name: 'Essay Structure' },
      { key: 'grammarScore' as const, label: 'grammar', name: 'Grammar & Mechanics' },
      { key: 'contentScore' as const, label: 'content', name: 'Content Development' },
      { key: 'vocabularyScore' as const, label: 'vocabulary', name: 'Vocabulary Usage' }
    ]

    categories.forEach(({ key, label, name }) => {
      const values = improvementTrends.map(trend => trend[key])
      const trend = calculateTrend(values)
      const firstValue = values[0]
      const lastValue = values[values.length - 1]
      const change = lastValue - firstValue

      let description = ''
      let recommendation = ''

      switch (trend) {
        case 'improving':
          description = `Your ${name.toLowerCase()} has improved by ${change.toFixed(1)} points over your recent essays.`
          recommendation = `Keep up the great work! Continue practicing to maintain this positive trend.`
          break
        case 'declining':
          description = `Your ${name.toLowerCase()} has declined by ${Math.abs(change).toFixed(1)} points recently.`
          recommendation = `Focus on ${name.toLowerCase()} in your next essays. Review feedback and practice specific techniques.`
          break
        case 'stable':
          description = `Your ${name.toLowerCase()} has remained consistent around ${lastValue.toFixed(1)} points.`
          recommendation = `Try new techniques or more challenging prompts to push your ${name.toLowerCase()} to the next level.`
          break
      }

      insights.push({
        category: label as any,
        trend,
        change,
        description,
        recommendation
      })
    })

    return insights
  }, [improvementTrends])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (improvementTrends.length === 0) return null

    const latest = improvementTrends[improvementTrends.length - 1]
    const earliest = improvementTrends[0]
    
    const totalImprovement = latest.overallScore - earliest.overallScore
    const averageWordCount = improvementTrends.reduce((sum, trend) => sum + trend.wordCount, 0) / improvementTrends.length
    const averageTimeSpent = improvementTrends
      .filter(trend => trend.timeSpent)
      .reduce((sum, trend) => sum + (trend.timeSpent || 0), 0) / improvementTrends.filter(trend => trend.timeSpent).length

    return {
      totalImprovement,
      averageWordCount: Math.round(averageWordCount),
      averageTimeSpent: Math.round(averageTimeSpent / 60), // Convert to minutes
      essaysCompleted: improvementTrends.length,
      currentScore: latest.overallScore,
      bestScore: Math.max(...improvementTrends.map(t => t.overallScore))
    }
  }, [improvementTrends])

  if (improvementTrends.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium">No analyzed essays yet</p>
          <p className="text-sm mt-2">Complete and analyze some essays to track your improvement over time</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Statistics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(statistics.currentScore)}`}>
                {statistics.currentScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Current Score</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(statistics.bestScore)}`}>
                {statistics.bestScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                statistics.totalImprovement > 0 ? 'text-green-600' : 
                statistics.totalImprovement < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {statistics.totalImprovement > 0 ? '+' : ''}{statistics.totalImprovement.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Total Improvement</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.essaysCompleted}
              </div>
              <div className="text-sm text-gray-600">Essays Analyzed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.averageWordCount}
              </div>
              <div className="text-sm text-gray-600">Avg Words</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.averageTimeSpent}
              </div>
              <div className="text-sm text-gray-600">Avg Minutes</div>
            </div>
          </div>
        </Card>
      )}

      {/* Improvement Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Insights</h3>
        
        <div className="space-y-4">
          {improvementInsights.map((insight) => (
            <div key={insight.category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {insight.category === 'overall' ? 'Overall Performance' : insight.category}
                  </h4>
                  <span className={`text-sm ${getTrendColor(insight.trend)}`}>
                    {getTrendIcon(insight.trend)} {insight.trend}
                  </span>
                </div>
                <div className={`text-sm font-medium ${
                  insight.change > 0 ? 'text-green-600' : 
                  insight.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)} pts
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
              <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                💡 {insight.recommendation}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Score Progression Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Progression</h3>
        
        <div className="space-y-4">
          {/* Simple visual representation - in a real app, you'd use a charting library */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['Overall', 'Structure', 'Grammar', 'Content', 'Vocabulary'].map((category, index) => {
              const key = ['overallScore', 'structureScore', 'grammarScore', 'contentScore', 'vocabularyScore'][index] as keyof ImprovementTrend
              const values = improvementTrends.map(trend => trend[key] as number)
              const latest = values[values.length - 1]
              const trend = calculateTrend(values)
              
              return (
                <div key={category} className="text-center">
                  <div className="text-sm font-medium text-gray-900 mb-2">{category}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(latest)}`}>
                    {latest.toFixed(1)}
                  </div>
                  <div className={`text-xs ${getTrendColor(trend)}`}>
                    {getTrendIcon(trend)} {trend}
                  </div>
                  
                  {/* Simple progress visualization */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        latest >= 85 ? 'bg-green-500' : 
                        latest >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(latest, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Recent Essays Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Essays Timeline</h3>
        
        <div className="space-y-3">
          {improvementTrends.slice(-5).reverse().map((trend, index) => {
            const submission = submissions.find(s => s.submittedAt === trend.date)
            
            return (
              <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(trend.date)}
                    </div>
                    <div className={`text-sm font-medium ${getScoreColor(trend.overallScore)}`}>
                      {trend.overallScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {trend.wordCount} words
                    </div>
                    {trend.timeSpent && (
                      <div className="text-xs text-gray-500">
                        {Math.round(trend.timeSpent / 60)} min
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className={`text-center ${getScoreColor(trend.structureScore)}`}>
                      S: {trend.structureScore.toFixed(0)}
                    </div>
                    <div className={`text-center ${getScoreColor(trend.grammarScore)}`}>
                      G: {trend.grammarScore.toFixed(0)}
                    </div>
                    <div className={`text-center ${getScoreColor(trend.contentScore)}`}>
                      C: {trend.contentScore.toFixed(0)}
                    </div>
                    <div className={`text-center ${getScoreColor(trend.vocabularyScore)}`}>
                      V: {trend.vocabularyScore.toFixed(0)}
                    </div>
                  </div>
                  
                  {onViewDetails && submission && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(submission.id)}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}