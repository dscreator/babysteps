import { useMemo } from 'react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { EssayAnalysis } from '../../../types/api'

interface EssayLanguageEnhancementProps {
  analysis: EssayAnalysis
  essayContent: string
  onApplyEnhancement?: (enhancementId: string) => void
}

interface LanguageEnhancement {
  id: string
  category: 'grammar' | 'vocabulary' | 'sentence-structure' | 'word-choice' | 'mechanics'
  title: string
  description: string
  examples: {
    before: string
    after: string
    explanation: string
  }[]
  priority: 'high' | 'medium' | 'low'
  currentScore: number
  targetScore: number
}

const grammarRules = [
  {
    id: 'subject-verb-agreement',
    title: 'Subject-Verb Agreement',
    description: 'Ensure subjects and verbs agree in number (singular/plural).',
    examples: [
      {
        before: 'The group of students are studying.',
        after: 'The group of students is studying.',
        explanation: '"Group" is singular, so use "is" instead of "are".'
      },
      {
        before: 'Each of the books have different covers.',
        after: 'Each of the books has different covers.',
        explanation: '"Each" is singular, so use "has" instead of "have".'
      }
    ]
  },
  {
    id: 'pronoun-antecedent',
    title: 'Pronoun-Antecedent Agreement',
    description: 'Pronouns must agree with their antecedents in number and gender.',
    examples: [
      {
        before: 'Every student should bring their book.',
        after: 'Every student should bring his or her book.',
        explanation: '"Every student" is singular, so use singular pronouns.'
      }
    ]
  },
  {
    id: 'comma-usage',
    title: 'Comma Usage',
    description: 'Use commas correctly in compound sentences and lists.',
    examples: [
      {
        before: 'I went to the store and I bought milk.',
        after: 'I went to the store, and I bought milk.',
        explanation: 'Use a comma before coordinating conjunctions in compound sentences.'
      }
    ]
  }
]

const vocabularyEnhancements = [
  {
    id: 'word-variety',
    title: 'Word Variety',
    description: 'Use varied vocabulary to avoid repetition and enhance meaning.',
    examples: [
      {
        before: 'The book was good. It had good characters and a good plot.',
        after: 'The book was excellent. It had compelling characters and an engaging plot.',
        explanation: 'Replace repetitive "good" with more specific, descriptive words.'
      }
    ]
  },
  {
    id: 'precise-language',
    title: 'Precise Language',
    description: 'Choose specific, concrete words over vague, general ones.',
    examples: [
      {
        before: 'The weather was bad.',
        after: 'The storm brought torrential rain and fierce winds.',
        explanation: 'Replace vague "bad weather" with specific, vivid description.'
      }
    ]
  },
  {
    id: 'transition-words',
    title: 'Transition Words',
    description: 'Use appropriate transitions to connect ideas smoothly.',
    examples: [
      {
        before: 'I studied hard. I failed the test.',
        after: 'Although I studied hard, I failed the test.',
        explanation: 'Use transitions like "although" to show relationships between ideas.'
      }
    ]
  }
]

const sentenceStructureRules = [
  {
    id: 'sentence-variety',
    title: 'Sentence Variety',
    description: 'Mix simple, compound, and complex sentences for better flow.',
    examples: [
      {
        before: 'I woke up. I ate breakfast. I went to school.',
        after: 'After waking up and eating breakfast, I went to school.',
        explanation: 'Combine short sentences into more complex structures.'
      }
    ]
  },
  {
    id: 'active-voice',
    title: 'Active Voice',
    description: 'Use active voice for clearer, more direct writing.',
    examples: [
      {
        before: 'The ball was thrown by the pitcher.',
        after: 'The pitcher threw the ball.',
        explanation: 'Active voice is more direct and engaging than passive voice.'
      }
    ]
  }
]

function generateLanguageEnhancements(
  analysis: EssayAnalysis,
  essayContent: string
): LanguageEnhancement[] {
  const enhancements: LanguageEnhancement[] = []

  // Grammar enhancements
  if (analysis.grammarScore < 80) {
    grammarRules.forEach(rule => {
      enhancements.push({
        id: `grammar-${rule.id}`,
        category: 'grammar',
        title: rule.title,
        description: rule.description,
        examples: rule.examples,
        priority: analysis.grammarScore < 60 ? 'high' : 'medium',
        currentScore: analysis.grammarScore,
        targetScore: 85
      })
    })
  }

  // Vocabulary enhancements
  if (analysis.vocabularyScore < 80) {
    vocabularyEnhancements.forEach(enhancement => {
      enhancements.push({
        id: `vocabulary-${enhancement.id}`,
        category: 'vocabulary',
        title: enhancement.title,
        description: enhancement.description,
        examples: enhancement.examples,
        priority: analysis.vocabularyScore < 60 ? 'high' : 'medium',
        currentScore: analysis.vocabularyScore,
        targetScore: 85
      })
    })
  }

  // Sentence structure enhancements
  if (analysis.grammarScore < 75 || analysis.vocabularyScore < 75) {
    sentenceStructureRules.forEach(rule => {
      enhancements.push({
        id: `sentence-${rule.id}`,
        category: 'sentence-structure',
        title: rule.title,
        description: rule.description,
        examples: rule.examples,
        priority: 'medium',
        currentScore: Math.min(analysis.grammarScore, analysis.vocabularyScore),
        targetScore: 80
      })
    })
  }

  // Mechanics (punctuation, capitalization)
  if (analysis.grammarScore < 70) {
    enhancements.push({
      id: 'mechanics-punctuation',
      category: 'mechanics',
      title: 'Punctuation and Mechanics',
      description: 'Review punctuation rules and capitalization conventions.',
      examples: [
        {
          before: 'its a beautiful day, isnt it.',
          after: "It's a beautiful day, isn't it?",
          explanation: 'Use apostrophes for contractions and proper end punctuation.'
        }
      ],
      priority: 'high',
      currentScore: analysis.grammarScore,
      targetScore: 80
    })
  }

  return enhancements.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
  }
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'grammar': return '📝'
    case 'vocabulary': return '📚'
    case 'sentence-structure': return '🔗'
    case 'word-choice': return '🎯'
    case 'mechanics': return '⚙️'
    default: return '💡'
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'grammar': return 'bg-blue-50 border-blue-200'
    case 'vocabulary': return 'bg-green-50 border-green-200'
    case 'sentence-structure': return 'bg-purple-50 border-purple-200'
    case 'word-choice': return 'bg-orange-50 border-orange-200'
    case 'mechanics': return 'bg-gray-50 border-gray-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

export function EssayLanguageEnhancement({ 
  analysis, 
  essayContent, 
  onApplyEnhancement 
}: EssayLanguageEnhancementProps) {
  const enhancements = useMemo(() => 
    generateLanguageEnhancements(analysis, essayContent), 
    [analysis, essayContent]
  )

  const categoryStats = useMemo(() => {
    const stats = {
      grammar: { count: 0, avgScore: analysis.grammarScore },
      vocabulary: { count: 0, avgScore: analysis.vocabularyScore },
      'sentence-structure': { count: 0, avgScore: (analysis.grammarScore + analysis.vocabularyScore) / 2 },
      'word-choice': { count: 0, avgScore: analysis.vocabularyScore },
      mechanics: { count: 0, avgScore: analysis.grammarScore }
    }

    enhancements.forEach(enhancement => {
      if (stats[enhancement.category]) {
        stats[enhancement.category].count++
      }
    })

    return stats
  }, [enhancements, analysis])

  if (enhancements.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-green-600">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-medium">Excellent Language Use!</p>
          <p className="text-sm mt-2 text-gray-600">
            Your grammar and vocabulary are strong. Keep up the great work!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">Language Enhancement Recommendations</h3>
        <p className="text-gray-600 mt-1">
          Improve your grammar, vocabulary, and writing mechanics
        </p>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(categoryStats).map(([category, stats]) => (
          <Card key={category} className={`p-4 ${getCategoryColor(category)}`}>
            <div className="text-center">
              <div className="text-2xl mb-2">{getCategoryIcon(category)}</div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {category.replace('-', ' ')}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {stats.count} suggestions
              </div>
              <div className="text-sm font-semibold mt-1">
                {stats.avgScore.toFixed(1)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Enhancement Recommendations */}
      <div className="space-y-4">
        {enhancements.map((enhancement) => (
          <Card key={enhancement.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(enhancement.category)}</span>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {enhancement.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(enhancement.priority)}`}>
                      {enhancement.priority} priority
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {enhancement.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Score</div>
                <div className="text-lg font-semibold text-blue-600">
                  {enhancement.currentScore.toFixed(1)}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{enhancement.description}</p>

            {/* Examples */}
            <div className="space-y-3">
              {enhancement.examples.map((example, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-2">❌ Before:</div>
                      <div className="text-sm text-gray-800 italic bg-red-50 p-2 rounded">
                        "{example.before}"
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-2">✅ After:</div>
                      <div className="text-sm text-gray-800 italic bg-green-50 p-2 rounded">
                        "{example.after}"
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    💡 {example.explanation}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress and Action */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex-1 mr-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Current: {enhancement.currentScore.toFixed(1)}</span>
                  <span>Target: {enhancement.targetScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(enhancement.currentScore / enhancement.targetScore) * 100}%` 
                    }}
                  />
                </div>
              </div>
              
              {onApplyEnhancement && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onApplyEnhancement(enhancement.id)}
                >
                  Practice This
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Reference Guide */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Quick Reference Guide</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Grammar Checklist</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check subject-verb agreement</li>
              <li>• Ensure pronoun clarity</li>
              <li>• Use proper comma placement</li>
              <li>• Avoid run-on sentences</li>
              <li>• Check verb tenses consistency</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Vocabulary Tips</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use specific, concrete words</li>
              <li>• Vary your word choices</li>
              <li>• Include transition words</li>
              <li>• Choose active voice</li>
              <li>• Use precise adjectives and adverbs</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}