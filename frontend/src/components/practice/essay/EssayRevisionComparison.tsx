import { useMemo } from 'react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { EssaySubmission, EssayAnalysis } from '../../../types/api'

interface EssayRevisionComparisonProps {
  originalSubmission: EssaySubmission
  revisedSubmission: EssaySubmission
  originalAnalysis?: EssayAnalysis
  revisedAnalysis?: EssayAnalysis
  onClose?: () => void
}

interface TextDifference {
  type: 'added' | 'removed' | 'unchanged'
  text: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

function getScoreChange(oldScore: number, newScore: number): {
  change: number
  color: string
  icon: string
  label: string
} {
  const change = newScore - oldScore
  if (change > 5) {
    return { change, color: 'text-green-600', icon: '↗', label: 'Improved' }
  } else if (change < -5) {
    return { change, color: 'text-red-600', icon: '↘', label: 'Declined' }
  } else if (change > 0) {
    return { change, color: 'text-green-500', icon: '↗', label: 'Slight improvement' }
  } else if (change < 0) {
    return { change, color: 'text-red-500', icon: '↘', label: 'Slight decline' }
  }
  return { change, color: 'text-gray-600', icon: '→', label: 'No change' }
}

// Simple diff algorithm for text comparison
function computeTextDiff(original: string, revised: string): TextDifference[] {
  const originalWords = original.split(' ')
  const revisedWords = revised.split(' ')
  const differences: TextDifference[] = []
  
  // This is a simplified diff - in a real implementation, you'd use a proper diff algorithm
  let i = 0, j = 0
  
  while (i < originalWords.length || j < revisedWords.length) {
    if (i >= originalWords.length) {
      // Remaining words are additions
      differences.push({ type: 'added', text: revisedWords.slice(j).join(' ') })
      break
    } else if (j >= revisedWords.length) {
      // Remaining words are removals
      differences.push({ type: 'removed', text: originalWords.slice(i).join(' ') })
      break
    } else if (originalWords[i] === revisedWords[j]) {
      // Words match
      differences.push({ type: 'unchanged', text: originalWords[i] })
      i++
      j++
    } else {
      // Look ahead to find matching words
      let foundMatch = false
      for (let k = j + 1; k < Math.min(j + 10, revisedWords.length); k++) {
        if (originalWords[i] === revisedWords[k]) {
          // Found match - words before k are additions
          differences.push({ type: 'added', text: revisedWords.slice(j, k).join(' ') })
          j = k
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        for (let k = i + 1; k < Math.min(i + 10, originalWords.length); k++) {
          if (originalWords[k] === revisedWords[j]) {
            // Found match - words before k are removals
            differences.push({ type: 'removed', text: originalWords.slice(i, k).join(' ') })
            i = k
            foundMatch = true
            break
          }
        }
      }
      
      if (!foundMatch) {
        // No match found nearby - treat as replacement
        differences.push({ type: 'removed', text: originalWords[i] })
        differences.push({ type: 'added', text: revisedWords[j] })
        i++
        j++
      }
    }
  }
  
  return differences
}

export function EssayRevisionComparison({
  originalSubmission,
  revisedSubmission,
  originalAnalysis,
  revisedAnalysis,
  onClose
}: EssayRevisionComparisonProps) {
  const textDiff = useMemo(() => {
    const originalText = stripHtml(originalSubmission.content)
    const revisedText = stripHtml(revisedSubmission.content)
    return computeTextDiff(originalText, revisedText)
  }, [originalSubmission.content, revisedSubmission.content])

  const improvements = useMemo(() => {
    const changes = []
    
    // Word count changes
    const wordCountChange = revisedSubmission.wordCount - originalSubmission.wordCount
    if (Math.abs(wordCountChange) > 10) {
      if (wordCountChange > 0) {
        changes.push(`Added ${wordCountChange} words for more detailed content`)
      } else {
        changes.push(`Removed ${Math.abs(wordCountChange)} words for better conciseness`)
      }
    }

    // Score improvements
    if (originalAnalysis && revisedAnalysis) {
      const structureChange = getScoreChange(originalAnalysis.structureScore, revisedAnalysis.structureScore)
      const grammarChange = getScoreChange(originalAnalysis.grammarScore, revisedAnalysis.grammarScore)
      const contentChange = getScoreChange(originalAnalysis.contentScore, revisedAnalysis.contentScore)
      const vocabularyChange = getScoreChange(originalAnalysis.vocabularyScore, revisedAnalysis.vocabularyScore)

      if (structureChange.change > 5) {
        changes.push('Improved essay organization and structure')
      }
      if (grammarChange.change > 5) {
        changes.push('Enhanced grammar and sentence mechanics')
      }
      if (contentChange.change > 5) {
        changes.push('Strengthened content development and examples')
      }
      if (vocabularyChange.change > 5) {
        changes.push('Upgraded vocabulary and word choice')
      }
    }

    return changes
  }, [originalSubmission, revisedSubmission, originalAnalysis, revisedAnalysis])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Essay Revision Comparison</h2>
          <p className="text-gray-600 mt-1">
            Comparing revisions from {formatDate(originalSubmission.submittedAt)} to {formatDate(revisedSubmission.submittedAt)}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Comparison
          </Button>
        )}
      </div>

      {/* Score Comparison */}
      {originalAnalysis && revisedAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Improvements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Overall', original: originalAnalysis.overallScore, revised: revisedAnalysis.overallScore },
              { label: 'Structure', original: originalAnalysis.structureScore, revised: revisedAnalysis.structureScore },
              { label: 'Grammar', original: originalAnalysis.grammarScore, revised: revisedAnalysis.grammarScore },
              { label: 'Content', original: originalAnalysis.contentScore, revised: revisedAnalysis.contentScore },
              { label: 'Vocabulary', original: originalAnalysis.vocabularyScore, revised: revisedAnalysis.vocabularyScore }
            ].map((score) => {
              const change = getScoreChange(score.original, score.revised)
              return (
                <div key={score.label} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">{score.label}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={getScoreColor(score.original)}>{score.original.toFixed(1)}</span>
                    <span className={change.color}>{change.icon}</span>
                    <span className={getScoreColor(score.revised)}>{score.revised.toFixed(1)}</span>
                  </div>
                  <div className={`text-xs mt-1 ${change.color}`}>
                    {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Key Improvements */}
      {improvements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Improvements Made</h3>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{improvement}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Text Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Changes</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-sm leading-relaxed">
            {textDiff.map((diff, index) => {
              if (diff.type === 'unchanged') {
                return (
                  <span key={index} className="text-gray-700">
                    {diff.text}{' '}
                  </span>
                )
              } else if (diff.type === 'added') {
                return (
                  <span key={index} className="bg-green-100 text-green-800 px-1 rounded">
                    {diff.text}{' '}
                  </span>
                )
              } else {
                return (
                  <span key={index} className="bg-red-100 text-red-800 px-1 rounded line-through">
                    {diff.text}{' '}
                  </span>
                )
              }
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Added text</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Removed text</span>
          </div>
        </div>
      </Card>

      {/* Statistics Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {originalSubmission.wordCount} → {revisedSubmission.wordCount}
            </div>
            <div className="text-sm text-gray-600">Word Count</div>
            <div className={`text-xs mt-1 ${
              revisedSubmission.wordCount > originalSubmission.wordCount 
                ? 'text-green-600' 
                : revisedSubmission.wordCount < originalSubmission.wordCount
                ? 'text-red-600'
                : 'text-gray-600'
            }`}>
              {revisedSubmission.wordCount > originalSubmission.wordCount ? '+' : ''}
              {revisedSubmission.wordCount - originalSubmission.wordCount} words
            </div>
          </div>

          {originalSubmission.timeSpent && revisedSubmission.timeSpent && (
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(originalSubmission.timeSpent / 60)} → {Math.round(revisedSubmission.timeSpent / 60)}
              </div>
              <div className="text-sm text-gray-600">Time (minutes)</div>
              <div className={`text-xs mt-1 ${
                revisedSubmission.timeSpent > originalSubmission.timeSpent 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
              }`}>
                {revisedSubmission.timeSpent > originalSubmission.timeSpent ? '+' : ''}
                {Math.round((revisedSubmission.timeSpent - originalSubmission.timeSpent) / 60)} min
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(originalSubmission.wordCount / (originalSubmission.timeSpent || 1800) * 60)} → {Math.round(revisedSubmission.wordCount / (revisedSubmission.timeSpent || 1800) * 60)}
            </div>
            <div className="text-sm text-gray-600">Words/Minute</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {((new Date(revisedSubmission.submittedAt).getTime() - new Date(originalSubmission.submittedAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Days Between</div>
          </div>
        </div>
      </Card>
    </div>
  )
}