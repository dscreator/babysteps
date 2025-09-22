import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import type { EssayPrompt } from '../../../types/api'

interface EssayPromptCardProps {
  prompt: EssayPrompt
  onSelect: (prompt: EssayPrompt) => void
}

export function EssayPromptCard({ prompt, onSelect }: EssayPromptCardProps) {
  const preview = prompt.prompt.length > 220 ? prompt.prompt.slice(0, 220) + '…' : prompt.prompt

  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="font-medium capitalize">{prompt.type}</span>
            <span>Grade {prompt.gradeLevel}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Practice Prompt</h3>
        </div>
        <p className="flex-1 text-sm text-gray-700 whitespace-pre-line">{preview}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{(prompt.timeLimit || 30)} min suggested</span>
          <Button size="sm" onClick={() => onSelect(prompt)}>
            Start Essay
          </Button>
        </div>
      </div>
    </Card>
  )
}
