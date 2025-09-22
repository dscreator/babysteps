import { useMemo } from 'react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { EssayAnalysis } from '../../../types/api'

interface EssayStructuralSuggestionsProps {
  analysis: EssayAnalysis
  essayType: 'narrative' | 'expository' | 'persuasive'
  onApplySuggestion?: (suggestionId: string) => void
}

interface StructuralSuggestion {
  id: string
  category: 'introduction' | 'body' | 'conclusion' | 'transitions' | 'organization'
  title: string
  description: string
  example: string
  priority: 'high' | 'medium' | 'low'
  currentScore: number
  targetScore: number
}

const structuralTemplates = {
  narrative: {
    introduction: {
      template: "Hook + Setting + Characters + Conflict Preview",
      example: "The old lighthouse stood silently against the stormy sky, its broken windows like hollow eyes watching over the churning sea. Sarah had always been afraid of storms, but tonight she would have to face her greatest fear to save her younger brother."
    },
    body: {
      template: "Chronological sequence with rising action, climax, and falling action",
      example: "First, describe the initial situation. Then, build tension through a series of events. Finally, reach the climax where the main character faces the central conflict."
    },
    conclusion: {
      template: "Resolution + Reflection + Lesson learned",
      example: "As the storm cleared and the lighthouse beam shone bright again, Sarah realized that courage wasn't the absence of fear—it was acting despite being afraid."
    }
  },
  expository: {
    introduction: {
      template: "Hook + Background + Thesis statement",
      example: "Did you know that the average person spends over 7 hours a day looking at screens? This dramatic increase in screen time has significant effects on our health, productivity, and social relationships."
    },
    body: {
      template: "Topic sentence + Evidence + Explanation + Transition",
      example: "Each paragraph should focus on one main idea, supported by specific examples, statistics, or expert opinions, followed by clear explanation of how this evidence supports your thesis."
    },
    conclusion: {
      template: "Restate thesis + Summarize main points + Call to action",
      example: "In conclusion, while technology offers many benefits, we must be mindful of our screen time to maintain our physical health, mental well-being, and meaningful relationships."
    }
  },
  persuasive: {
    introduction: {
      template: "Attention grabber + Issue + Position statement",
      example: "Imagine a world where students learn at their own pace, explore their passions, and develop critical thinking skills. This vision can become reality if we reform our current education system."
    },
    body: {
      template: "Claim + Evidence + Reasoning + Counterargument",
      example: "Present your strongest arguments with credible evidence, explain why this evidence supports your position, and address potential counterarguments to strengthen your case."
    },
    conclusion: {
      template: "Restate position + Summarize arguments + Compelling call to action",
      example: "The evidence clearly shows that education reform is not just beneficial—it's essential. We must act now to give our students the education they deserve."
    }
  }
}

function generateStructuralSuggestions(
  analysis: EssayAnalysis, 
  essayType: 'narrative' | 'expository' | 'persuasive'
): StructuralSuggestion[] {
  const suggestions: StructuralSuggestion[] = []
  const templates = structuralTemplates[essayType]

  // Introduction suggestions
  if (analysis.structureScore < 75) {
    suggestions.push({
      id: 'intro-improvement',
      category: 'introduction',
      title: 'Strengthen Your Introduction',
      description: `Your introduction could be more engaging. For ${essayType} essays, try using the ${templates.introduction.template} structure.`,
      example: templates.introduction.example,
      priority: 'high',
      currentScore: analysis.structureScore,
      targetScore: 85
    })
  }

  // Body paragraph suggestions
  if (analysis.contentScore < 75) {
    suggestions.push({
      id: 'body-structure',
      category: 'body',
      title: 'Improve Body Paragraph Structure',
      description: `Your body paragraphs need better organization. ${templates.body.template}`,
      example: templates.body.example,
      priority: 'high',
      currentScore: analysis.contentScore,
      targetScore: 85
    })
  }

  // Conclusion suggestions
  if (analysis.structureScore < 80) {
    suggestions.push({
      id: 'conclusion-enhancement',
      category: 'conclusion',
      title: 'Enhance Your Conclusion',
      description: `Your conclusion should do more than just summarize. ${templates.conclusion.template}`,
      example: templates.conclusion.example,
      priority: 'medium',
      currentScore: analysis.structureScore,
      targetScore: 90
    })
  }

  // Transition suggestions
  if (analysis.structureScore < 70) {
    suggestions.push({
      id: 'transitions',
      category: 'transitions',
      title: 'Add Better Transitions',
      description: 'Your essay needs smoother transitions between paragraphs and ideas to improve flow.',
      example: 'Use transitional phrases like "Furthermore," "In contrast," "As a result," or "Most importantly" to connect your ideas.',
      priority: 'medium',
      currentScore: analysis.structureScore,
      targetScore: 80
    })
  }

  // Organization suggestions
  if (analysis.structureScore < 65) {
    suggestions.push({
      id: 'organization',
      category: 'organization',
      title: 'Improve Overall Organization',
      description: 'Your essay structure needs significant improvement. Consider using a clear outline before writing.',
      example: 'Create an outline: I. Introduction (Hook, Background, Thesis) II. Body Paragraph 1 (Main idea + Support) III. Body Paragraph 2 (Main idea + Support) IV. Conclusion (Summary + Final thought)',
      priority: 'high',
      currentScore: analysis.structureScore,
      targetScore: 75
    })
  }

  return suggestions.sort((a, b) => {
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

function getPriorityIcon(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return '🔥'
    case 'medium': return '⚡'
    case 'low': return '💡'
  }
}

export function EssayStructuralSuggestions({ 
  analysis, 
  essayType, 
  onApplySuggestion 
}: EssayStructuralSuggestionsProps) {
  const suggestions = useMemo(() => 
    generateStructuralSuggestions(analysis, essayType), 
    [analysis, essayType]
  )

  const categoryIcons = {
    introduction: '🎯',
    body: '📝',
    conclusion: '🎬',
    transitions: '🔗',
    organization: '📋'
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-green-600">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-medium">Excellent Structure!</p>
          <p className="text-sm mt-2 text-gray-600">
            Your essay structure is strong. Keep up the great work!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">Structural Improvement Suggestions</h3>
        <p className="text-gray-600 mt-1">
          Targeted recommendations to improve your {essayType} essay structure
        </p>
      </div>

      {/* Priority Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {suggestions.filter(s => s.priority === 'high').length} high priority, {' '}
            {suggestions.filter(s => s.priority === 'medium').length} medium priority, {' '}
            {suggestions.filter(s => s.priority === 'low').length} low priority suggestions
          </div>
          <div className="text-sm text-gray-600">
            Current Structure Score: <span className="font-medium">{analysis.structureScore.toFixed(1)}</span>
          </div>
        </div>
      </Card>

      {/* Suggestions */}
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryIcons[suggestion.category]}</span>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {suggestion.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {getPriorityIcon(suggestion.priority)} {suggestion.priority} priority
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {suggestion.category}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Target Score</div>
                <div className="text-lg font-semibold text-green-600">
                  {suggestion.targetScore}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">{suggestion.description}</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  💡 Example:
                </div>
                <div className="text-sm text-blue-800 italic">
                  "{suggestion.example}"
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Current: {suggestion.currentScore}</span>
                    <span>Target: {suggestion.targetScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(suggestion.currentScore / suggestion.targetScore) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                {onApplySuggestion && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onApplySuggestion(suggestion.id)}
                  >
                    Apply Tips
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Essay Type Specific Tips */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h4 className="text-lg font-semibold text-purple-900 mb-3">
          {essayType.charAt(0).toUpperCase() + essayType.slice(1)} Essay Structure Tips
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-purple-700 font-medium mb-2">Introduction</div>
            <div className="text-sm text-gray-700">
              {structuralTemplates[essayType].introduction.template}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-purple-700 font-medium mb-2">Body Paragraphs</div>
            <div className="text-sm text-gray-700">
              {structuralTemplates[essayType].body.template}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="text-purple-700 font-medium mb-2">Conclusion</div>
            <div className="text-sm text-gray-700">
              {structuralTemplates[essayType].conclusion.template}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}