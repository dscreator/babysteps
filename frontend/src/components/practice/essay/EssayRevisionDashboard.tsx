import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import { EssayRevisionTracker } from './EssayRevisionTracker'
import { EssayRevisionComparison } from './EssayRevisionComparison'
import { EssayImprovementTracker } from './EssayImprovementTracker'
import { EssayStructuralSuggestions } from './EssayStructuralSuggestions'
import { EssayLanguageEnhancement } from './EssayLanguageEnhancement'
import { essayService } from '../../../services/essayService'
import { queryKeys } from '../../../lib/queryClient'
import type { EssaySubmission, EssayAnalysis, EssayPrompt } from '../../../types/api'

type DashboardView = 'overview' | 'revisions' | 'improvements' | 'structure' | 'language' | 'comparison'

interface EssayRevisionDashboardProps {
  onStartNewEssay?: () => void
}

export function EssayRevisionDashboard({ onStartNewEssay }: EssayRevisionDashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [selectedSubmissions, setSelectedSubmissions] = useState<{
    original: EssaySubmission | null
    revised: EssaySubmission | null
  }>({ original: null, revised: null })
  const [selectedAnalysis, setSelectedAnalysis] = useState<EssayAnalysis | null>(null)

  // Fetch essay history
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: queryKeys.practice.essay.history(),
    queryFn: () => essayService.getEssayHistory(20),
    staleTime: 2 * 60 * 1000,
  })

  // Fetch prompts for context
  const { data: prompts } = useQuery({
    queryKey: queryKeys.practice.essay.prompts({}),
    queryFn: () => essayService.getPrompts({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const submissions = historyData?.submissions || []
  const analyses = historyData?.analyses || []

  // Get prompt for selected analysis
  const selectedPrompt = useMemo(() => {
    if (!selectedAnalysis || !prompts) return null
    const submission = submissions.find(s => s.id === selectedAnalysis.submissionId)
    if (!submission) return null
    return prompts.find(p => p.id === submission.promptId) || null
  }, [selectedAnalysis, submissions, prompts])

  const handleCompareRevisions = (submission1: EssaySubmission, submission2: EssaySubmission) => {
    // Determine which is original and which is revised based on submission date
    const original = new Date(submission1.submittedAt) < new Date(submission2.submittedAt) 
      ? submission1 : submission2
    const revised = new Date(submission1.submittedAt) < new Date(submission2.submittedAt) 
      ? submission2 : submission1

    setSelectedSubmissions({ original, revised })
    setActiveView('comparison')
  }

  const handleViewAnalysisDetails = (submissionId: string) => {
    const analysis = analyses.find(a => a.submissionId === submissionId)
    if (analysis) {
      setSelectedAnalysis(analysis)
      setActiveView('structure')
    }
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'revisions', label: 'Revision Tracking', icon: '🔄' },
    { id: 'improvements', label: 'Progress Trends', icon: '📈' },
    { id: 'structure', label: 'Structure Tips', icon: '🏗️' },
    { id: 'language', label: 'Language Help', icon: '📝' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600">
          <p className="text-lg font-medium">Unable to load essay data</p>
          <p className="text-sm mt-2">Please try again later</p>
        </div>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Essays Yet</h3>
          <p className="text-gray-600 mb-6">
            Start writing essays to track your revision progress and get personalized improvement suggestions.
          </p>
          {onStartNewEssay && (
            <Button onClick={onStartNewEssay} size="lg">
              Write Your First Essay
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Essay Revision Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your writing progress and get personalized improvement suggestions
          </p>
        </div>
        {onStartNewEssay && (
          <Button onClick={onStartNewEssay}>
            Write New Essay
          </Button>
        )}
      </div>

      {/* Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as DashboardView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                <div className="text-sm text-gray-600">Total Essays</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{analyses.length}</div>
                <div className="text-sm text-gray-600">Analyzed Essays</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyses.length > 0 
                    ? Math.max(...analyses.map(a => a.overallScore)).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-sm text-gray-600">Best Score</div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {submissions.slice(0, 5).map((submission) => {
                  const analysis = analyses.find(a => a.submissionId === submission.id)
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Essay submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {submission.wordCount} words
                        </div>
                      </div>
                      {analysis && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {analysis.overallScore.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Overall Score</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveView('revisions')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-1">🔄</span>
                <span className="text-sm">Track Revisions</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setActiveView('improvements')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-1">📈</span>
                <span className="text-sm">View Progress</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setActiveView('structure')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-1">🏗️</span>
                <span className="text-sm">Structure Help</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setActiveView('language')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-1">📝</span>
                <span className="text-sm">Language Tips</span>
              </Button>
            </div>
          </div>
        )}

        {activeView === 'revisions' && (
          <EssayRevisionTracker
            submissions={submissions}
            analyses={analyses}
            onCompareRevisions={handleCompareRevisions}
          />
        )}

        {activeView === 'improvements' && (
          <EssayImprovementTracker
            submissions={submissions}
            analyses={analyses}
            onViewDetails={handleViewAnalysisDetails}
          />
        )}

        {activeView === 'structure' && selectedAnalysis && selectedPrompt && (
          <EssayStructuralSuggestions
            analysis={selectedAnalysis}
            essayType={selectedPrompt.type}
            onApplySuggestion={(suggestionId) => {
              console.log('Apply suggestion:', suggestionId)
              // Could implement suggestion application logic here
            }}
          />
        )}

        {activeView === 'language' && selectedAnalysis && (
          <EssayLanguageEnhancement
            analysis={selectedAnalysis}
            essayContent={submissions.find(s => s.id === selectedAnalysis.submissionId)?.content || ''}
            onApplyEnhancement={(enhancementId) => {
              console.log('Apply enhancement:', enhancementId)
              // Could implement enhancement application logic here
            }}
          />
        )}

        {activeView === 'comparison' && selectedSubmissions.original && selectedSubmissions.revised && (
          <EssayRevisionComparison
            originalSubmission={selectedSubmissions.original}
            revisedSubmission={selectedSubmissions.revised}
            originalAnalysis={analyses.find(a => a.submissionId === selectedSubmissions.original?.id)}
            revisedAnalysis={analyses.find(a => a.submissionId === selectedSubmissions.revised?.id)}
            onClose={() => {
              setActiveView('revisions')
              setSelectedSubmissions({ original: null, revised: null })
            }}
          />
        )}

        {/* Fallback for structure/language views without selected analysis */}
        {(activeView === 'structure' || activeView === 'language') && !selectedAnalysis && (
          <Card className="p-6 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium">Select an analyzed essay</p>
              <p className="text-sm mt-2">
                Go to the improvements section and click "View" on an essay to see detailed suggestions
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setActiveView('improvements')}
              >
                View Essay Progress
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}