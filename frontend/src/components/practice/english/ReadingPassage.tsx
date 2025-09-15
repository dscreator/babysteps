import { useState, useRef, useEffect } from 'react'
import { Clock, BookOpen, Eye, EyeOff } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { ReadingPassage as ReadingPassageType, VocabularyWord } from '../../../types/api'

interface ReadingPassageProps {
  passage: ReadingPassageType
  vocabulary?: VocabularyWord[]
  showTimer?: boolean
  timeSpent?: number
  onTimeUpdate?: (timeSpent: number) => void
  className?: string
}

interface VocabularyHighlight {
  word: string
  definition: string
  partOfSpeech?: string
  synonyms?: string[]
  examples?: string[]
}

export function ReadingPassage({
  passage,
  vocabulary = [],
  showTimer = true,
  timeSpent = 0,
  onTimeUpdate,
  className = ''
}: ReadingPassageProps) {
  const [selectedWord, setSelectedWord] = useState<VocabularyHighlight | null>(null)
  const [showDefinitions, setShowDefinitions] = useState(true)
  const [readingStartTime] = useState(Date.now())
  const passageRef = useRef<HTMLDivElement>(null)

  // Create vocabulary lookup map
  const vocabularyMap = vocabulary.reduce((map, word) => {
    map[word.word.toLowerCase()] = {
      word: word.word,
      definition: word.definition,
      partOfSpeech: word.partOfSpeech,
      synonyms: word.synonyms,
      examples: word.examples || [word.exampleSentence].filter(Boolean)
    }
    return map
  }, {} as Record<string, VocabularyHighlight>)

  // Update reading time
  useEffect(() => {
    if (!onTimeUpdate) return

    const interval = setInterval(() => {
      const currentTime = Math.floor((Date.now() - readingStartTime) / 1000)
      onTimeUpdate(timeSpent + currentTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [readingStartTime, timeSpent, onTimeUpdate])

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate estimated reading time (average 200 words per minute)
  const estimatedReadingTime = Math.ceil(passage.wordCount / 200)

  // Highlight vocabulary words in the passage
  const highlightVocabulary = (text: string): JSX.Element => {
    if (!showDefinitions || vocabulary.length === 0) {
      return <span>{text}</span>
    }

    // Split text into words while preserving punctuation and spacing
    const words = text.split(/(\s+|[.,!?;:()"])/g)
    
    return (
      <span>
        {words.map((word, index) => {
          const cleanWord = word.toLowerCase().replace(/[.,!?;:()"]/g, '')
          const vocabWord = vocabularyMap[cleanWord]
          
          if (vocabWord && word.trim()) {
            return (
              <span
                key={index}
                className="relative cursor-pointer text-blue-600 underline decoration-dotted hover:bg-blue-50 rounded px-1"
                onClick={() => setSelectedWord(vocabWord)}
                title={`Click to see definition of "${vocabWord.word}"`}
              >
                {word}
              </span>
            )
          }
          
          return <span key={index}>{word}</span>
        })}
      </span>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Passage Header */}
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{passage.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{passage.wordCount} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>~{estimatedReadingTime} min read</span>
              </div>
              {passage.subjectArea && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {passage.subjectArea}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vocabulary.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDefinitions(!showDefinitions)}
                className="flex items-center gap-1"
              >
                {showDefinitions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDefinitions ? 'Hide' : 'Show'} Definitions
              </Button>
            )}
            
            {showTimer && (
              <div className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                Reading Time: {formatTime(timeSpent)}
              </div>
            )}
          </div>
        </div>

        {/* Vocabulary Info */}
        {vocabulary.length > 0 && showDefinitions && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{vocabulary.length} vocabulary words</strong> are highlighted in blue. 
              Click on any highlighted word to see its definition.
            </p>
          </div>
        )}
      </Card>

      {/* Passage Content */}
      <Card>
        <div 
          ref={passageRef}
          className="prose prose-lg max-w-none leading-relaxed text-gray-800"
        >
          {passage.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 last:mb-0">
              {highlightVocabulary(paragraph)}
            </p>
          ))}
        </div>
      </Card>

      {/* Vocabulary Definition Popup */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedWord.word}</h3>
                {selectedWord.partOfSpeech && (
                  <span className="text-sm text-gray-500 italic">
                    {selectedWord.partOfSpeech}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Definition</h4>
                <p className="text-gray-700">{selectedWord.definition}</p>
              </div>

              {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Synonyms</h4>
                  <p className="text-gray-700">{selectedWord.synonyms.join(', ')}</p>
                </div>
              )}

              {selectedWord.examples && selectedWord.examples.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Example</h4>
                  <p className="text-gray-700 italic">"{selectedWord.examples[0]}"</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t">
              <Button
                onClick={() => setSelectedWord(null)}
                className="w-full"
              >
                Got it!
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}