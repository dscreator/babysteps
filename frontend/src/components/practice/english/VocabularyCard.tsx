import { useState } from 'react'
import { RotateCcw, Volume2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { VocabularyWord } from '../../../types/api'

interface VocabularyCardProps {
  word: VocabularyWord
  onRate: (rating: 'easy' | 'medium' | 'hard' | 'again') => void
  showAnswer?: boolean
  disabled?: boolean
  cardNumber?: number
  totalCards?: number
}

export function VocabularyCard({
  word,
  onRate,
  showAnswer = false,
  disabled = false,
  cardNumber,
  totalCards
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswer)
  const [showExample, setShowExample] = useState(false)

  const handleFlip = () => {
    if (!disabled) {
      setIsFlipped(!isFlipped)
    }
  }

  const handleRate = (rating: 'easy' | 'medium' | 'hard' | 'again') => {
    if (!disabled) {
      onRate(rating)
      setIsFlipped(false)
      setShowExample(false)
    }
  }

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const getDifficultyColor = (level: number): string => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-red-100 text-red-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (level: number): string => {
    const labels = {
      1: 'Basic',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert'
    }
    return labels[level as keyof typeof labels] || 'Unknown'
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Card Header */}
      {(cardNumber && totalCards) && (
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Card {cardNumber} of {totalCards}
          </span>
        </div>
      )}

      {/* Flashcard */}
      <Card className="min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg">
        <div onClick={handleFlip} className="h-full flex flex-col">
          {/* Front Side - Word */}
          {!isFlipped && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(word.difficultyLevel)}`}>
                  {getDifficultyLabel(word.difficultyLevel)}
                </span>
              </div>
              
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">{word.word}</h2>
                {word.partOfSpeech && (
                  <p className="text-lg text-gray-500 italic">{word.partOfSpeech}</p>
                )}
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    speakWord()
                  }}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Pronounce
                </Button>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-2">Click to reveal definition</p>
                <Eye className="w-6 h-6 text-gray-400 mx-auto" />
              </div>
            </div>
          )}

          {/* Back Side - Definition and Details */}
          {isFlipped && (
            <div className="flex-1 flex flex-col p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{word.word}</h3>
                {word.partOfSpeech && (
                  <p className="text-sm text-gray-500 italic">{word.partOfSpeech}</p>
                )}
              </div>

              <div className="flex-1 space-y-4">
                {/* Definition */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Definition</h4>
                  <p className="text-gray-700 leading-relaxed">{word.definition}</p>
                </div>

                {/* Synonyms */}
                {word.synonyms && word.synonyms.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Synonyms</h4>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms.slice(0, 4).map((synonym, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example */}
                {(word.exampleSentence || (word.examples && word.examples.length > 0)) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Example</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowExample(!showExample)
                        }}
                        className="flex items-center gap-1"
                      >
                        {showExample ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showExample ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showExample && (
                      <p className="text-gray-700 italic">
                        "{word.exampleSentence || word.examples?.[0]}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <p className="text-gray-600 text-sm mb-2">Click to flip back</p>
                <EyeOff className="w-5 h-5 text-gray-400 mx-auto" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Rating Buttons */}
      {isFlipped && !disabled && (
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-gray-600 mb-4">
            How well did you know this word?
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleRate('again')}
              variant="outline"
              className="flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Again
            </Button>
            <Button
              onClick={() => handleRate('hard')}
              variant="outline"
              className="flex items-center justify-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              Hard
            </Button>
            <Button
              onClick={() => handleRate('medium')}
              variant="outline"
              className="flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Medium
            </Button>
            <Button
              onClick={() => handleRate('easy')}
              variant="outline"
              className="flex items-center justify-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4" />
              Easy
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center mt-2">
            <p><strong>Again:</strong> Show this word more often</p>
            <p><strong>Hard:</strong> Show in a few days</p>
            <p><strong>Medium:</strong> Show in a week</p>
            <p><strong>Easy:</strong> Show in 2+ weeks</p>
          </div>
        </div>
      )}

      {/* Flip Button */}
      {!isFlipped && (
        <div className="mt-4 text-center">
          <Button
            onClick={handleFlip}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Flip Card
          </Button>
        </div>
      )}
    </div>
  )
}