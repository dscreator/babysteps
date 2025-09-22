import { useState, useMemo } from 'react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import { LoadingSpinner } from '../../common/LoadingSpinner'
import type { EssaySubmission, EssayAnalysis } from '../../../types/api'

interface EssayRevisionTrackerProps {
  submissions: EssaySubmission[]
  analyses: EssayAnalysis[]
  onCompareRevisions?: (submission1: EssaySubmission, submission2: EssaySubmission) => void
}

interface RevisionComparison {
  original: EssaySubmission
  revised: EssaySubmission
  improvements: {
    wordCountChange: number
    scoreImprovement?: number
    structuralChanges: string[]
    contentChanges: string[]
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateWordCount(content: string): number {
  const plain = stripHtml(content)
  if (!plain) return 0
  return plain.split(' ').length
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreImprovement(oldScore: number, newScore: number): {
  change: number
  color: string
  icon: string
} {
  const change = newScore - oldScore
  if (change > 0) {
    return { change, color: 'text-green-600', icon: '↗' }
  } else if (change < 0) {
    return { change, color: 'text-red-600', icon: '↘' }
  }
  return { change, color: 'text-gray-600', icon: '→' }
}

export function EssayRevisionTracker({ 
  submissions, 
  analyses, 
  onCompareRevisions 
}: EssayRevisionTrackerProps) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  // Group submissions by prompt for revision tracking
  const submissionsByPrompt = useMemo(() => {
    const grouped = submissions.reduce((acc, submission) => {
      if (!acc[submission.promptId]) {
        acc[submission.promptId] = []
      }
      acc[submission.promptId].push(submission)
      return acc
    }, {} as Record<string, EssaySubmission[]>)

    // Sort each group by submission date
    Object.keys(grouped).forEach(promptId => {
      grouped[promptId].sort((a, b) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      )
    })

    return grouped
  }, [submissions])

  // Get analysis for a submission
  const getAnalysisForSubmission = (submissionId: string) => {
    return analyses.find(analysis => analysis.submissionId === submissionId)
  }

  // Calculate revision comparisons
  const revisionComparisons = useMemo(() => {
    const comparisons: RevisionComparison[] = []

    Object.values(submissionsByPrompt).forEach(promptSubmissions => {
      for (let i = 1; i < promptSubmissions.length; i++) {
        const original = promptSubmissions[i - 1]
        const revised = promptSubmissions[i]
        
        const originalAnalysis = getAnalysisForSubmission(original.id)
        const revisedAnalysis = getAnalysisForSubmission(revised.id)

        const wordCountChange = revised.wordCount - original.wordCount
        const scoreImprovement = originalAnalysis && revisedAnalysis 
          ? revisedAnalysis.overallScore - originalAnalysis.overallScore 
          : undefined

        // Analyze structural and content changes (simplified)
        const structuralChanges = []
        const contentChanges = []

        if (Math.abs(wordCountChange) > 50) {
          if (wordCountChange > 0) {
            contentChanges.push(`Added ${wordCountChange} words`)
          } else {
            contentChanges.push(`Removed ${Math.abs(wordCountChange)} words`)
          }
        }

        if (revisedAnalysis && originalAnalysis) {
          if (revisedAnalysis.structureScore > originalAnalysis.structureScore + 5) {
            structuralChanges.push('Improved essay organization')
          }
          if (revisedAnalysis.grammarScore > originalAnalysis.grammarScore + 5) {
            structuralChanges.push('Enhanced grammar and mechanics')
          }
          if (revisedAnalysis.vocabularyScore > originalAnalysis.vocabularyScore + 5) {
            contentChanges.push('Improved vocabulary usage')
          }
        }

        comparisons.push({
          original,
          revised,
          improvements: {
            wordCountChange,
            scoreImprovement,
            structuralChanges,
            contentChanges
          }
        })
      }
    })

    return comparisons
  }, [submissionsByPrompt, analyses])

  const handleSubmissionSelect = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId)
      } else if (prev.length < 2) {
        return [...prev, submissionId]
      } else {
        return [prev[1], submissionId]
      }
    })
  }

  const handleCompareSelected = () => {
    if (selectedSubmissions.length === 2) {
      const submission1 = submissions.find(s => s.id === selectedSubmissions[0])
      const submission2 = submissions.find(s => s.id === selectedSubmissions[1])
      
      if (submission1 && submission2) {
        onCompareRevisions?.(submission1, submission2)
        setShowComparison(true)
      }
    }
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium">No essay submissions yet</p>
          <p className="text-sm mt-2">Complete some essay practice sessions to track your revision progress</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revision Progress Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revision Progress Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
            <div className="text-sm text-blue-800">Total Essays</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{revisionComparisons.length}</div>
            <div className="text-sm text-green-800">Revisions Made</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(submissionsByPrompt).length}
            </div>
            <div className="text-sm text-purple-800">Unique Prompts</div>
          </div>
        </div>

        {/* Recent Improvements */}
        {revisionComparisons.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Improvements</h4>
            <div className="space-y-3">
              {revisionComparisons.slice(-3).reverse().map((comparison, index) => {
                const originalAnalysis = getAnalysisForSubmission(comparison.original.id)
                const revisedAnalysis = getAnalysisForSubmission(comparison.revised.id)
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Revision from {formatDate(comparison.original.submittedAt)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {comparison.improvements.structuralChanges.concat(comparison.improvements.contentChanges).join(', ') || 'Content updated'}
                      </div>
                    </div>
                    
                    {comparison.improvements.scoreImprovement !== undefined && (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getScoreImprovement(
                          originalAnalysis?.overallScore || 0,
                          revisedAnalysis?.overallScore || 0
                        ).color}`}>
                          {getScoreImprovement(
                            originalAnalysis?.overallScore || 0,
                            revisedAnalysis?.overallScore || 0
                          ).icon} {Math.abs(comparison.improvements.scoreImprovement).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Score change</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Essay Submission History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Essay Submission History</h3>
          
          {selectedSubmissions.length === 2 && (
            <Button onClick={handleCompareSelected} size="sm">
              Compare Selected ({selectedSubmissions.length})
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {submissions.map((submission) => {
            const analysis = getAnalysisForSubmission(submission.id)
            const isSelected = selectedSubmissions.includes(submission.id)
            
            return (
              <div
                key={submission.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSubmissionSelect(submission.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(submission.submittedAt)}
                      </div>
                      
                      {analysis && (
                        <div className={`text-sm font-medium ${getScoreColor(analysis.overallScore)}`}>
                          {analysis.overallScore.toFixed(1)}%
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {submission.wordCount} words
                      </div>
                      
                      {submission.timeSpent && (
                        <div className="text-xs text-gray-500">
                          {Math.round(submission.timeSpent / 60)} min
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {stripHtml(submission.content).substring(0, 150)}...
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    
                    {analysis && (
                      <div className="text-right">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500">Structure</div>
                            <div className={getScoreColor(analysis.structureScore)}>
                              {analysis.structureScore.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Grammar</div>
                            <div className={getScoreColor(analysis.grammarScore)}>
                              {analysis.grammarScore.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedSubmissions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              {selectedSubmissions.length === 1 
                ? 'Select another essay to compare revisions'
                : 'Click "Compare Selected" to see detailed revision analysis'
              }
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}