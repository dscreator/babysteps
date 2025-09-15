import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Shuffle } from 'lucide-react'
import { Card } from '../../common/Card'
import { Button } from '../../common/Button'
import type { VocabularyWord } from '../../../types/api'

interface VocabularyQuizProps {
  words: VocabularyWord[]
  onAnswer: (wordId: string, correct: boolean, timeSpent: number, questionType: string) => void
  questionNumber: number
  totalQuestions: number
  showFeedback?: boolean
  disabled?: boolean
}

type QuestionType = 'definition' | 'synonym' | 'usage' | 'antonym'

interface QuizQuestion {
  word: VocabularyWord
  type: QuestionType
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export function VocabularyQuiz({
  words,
  onAnswer,
  questionNumber,
  totalQuestions,
  showFeedback = false,
  disabled = false
}: VocabularyQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [questionStartTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<{
    correct: boolean
    explanation: string
  } | null>(null)

  // Update time spent on this question
  useEffect(() => {
    if (hasSubmitted) return

    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [questionStartTime, hasSubmitted])

  // Generate a quiz question from the current word
  useEffect(() => {
    if (words.length === 0) return

    const word = words[questionNumber - 1]
    if (!word) return

    const question = generateQuestion(word, words)
    setCurrentQuestion(question)
    setSelectedAnswer('')
    setHasSubmitted(false)
    setFeedback(null)
  }, [words, questionNumber])

  const generateQuestion = (targetWord: VocabularyWord, allWords: VocabularyWord[]): QuizQuestion => {
    const questionTypes: QuestionType[] = ['definition', 'synonym', 'usage']
    
    // Add antonym type if the word has antonyms
    if (targetWord.antonyms && targetWord.antonyms.length > 0) {
      questionTypes.push('antonym')
    }

    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)]
    
    switch (randomType) {
      case 'definition':
        return generateDefinitionQuestion(targetWord, allWords)
      case 'synonym':
        return generateSynonymQuestion(targetWord, allWords)
      case 'usage':
        return generateUsageQuestion(targetWord, allWords)
      case 'antonym':
        return generateAntonymQuestion(targetWord, allWords)
      default:
        return generateDefinitionQuestion(targetWord, allWords)
    }
  }

  const generateDefinitionQuestion = (word: VocabularyWord, allWords: VocabularyWord[]): QuizQuestion => {
    const otherWords = allWords.filter(w => w.id !== word.id)
    const wrongOptions = otherWords
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.definition)

    const options = [word.definition, ...wrongOptions].sort(() => 0.5 - Math.random())

    return {
      word,
      type: 'definition',
      question: `What is the definition of "${word.word}"?`,
      options,
      correctAnswer: word.definition,
      explanation: `"${word.word}" means ${word.definition.toLowerCase()}`
    }
  }

  const generateSynonymQuestion = (word: VocabularyWord, allWords: VocabularyWord[]): QuizQuestion => {
    if (!word.synonyms || word.synonyms.length === 0) {
      return generateDefinitionQuestion(word, allWords)
    }

    const correctSynonym = word.synonyms[0]
    const otherWords = allWords.filter(w => w.id !== word.id)
    const wrongOptions = otherWords
      .flatMap(w => w.synonyms || [])
      .filter(s => s !== correctSynonym)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)

    // If not enough wrong synonyms, add some random words
    while (wrongOptions.length < 3) {
      const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!wrongOptions.includes(randomWord.word)) {
        wrongOptions.push(randomWord.word)
      }
    }

    const options = [correctSynonym, ...wrongOptions].sort(() => 0.5 - Math.random())

    return {
      word,
      type: 'synonym',
      question: `Which word is a synonym for "${word.word}"?`,
      options,
      correctAnswer: correctSynonym,
      explanation: `"${correctSynonym}" is a synonym for "${word.word}" - they both mean ${word.definition.toLowerCase()}`
    }
  }

  const generateUsageQuestion = (word: VocabularyWord, allWords: VocabularyWord[]): QuizQuestion => {
    const sentence = word.exampleSentence || (word.examples && word.examples[0])
    
    if (!sentence) {
      return generateDefinitionQuestion(word, allWords)
    }

    // Replace the target word with a blank
    const blankSentence = sentence.replace(new RegExp(`\\b${word.word}\\b`, 'gi'), '______')
    
    const otherWords = allWords.filter(w => w.id !== word.id)
    const wrongOptions = otherWords
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.word)

    const options = [word.word, ...wrongOptions].sort(() => 0.5 - Math.random())

    return {
      word,
      type: 'usage',
      question: `Complete the sentence: "${blankSentence}"`,
      options,
      correctAnswer: word.word,
      explanation: `"${word.word}" fits best because it means ${word.definition.toLowerCase()}`
    }
  }

  const generateAntonymQuestion = (word: VocabularyWord, allWords: VocabularyWord[]): QuizQuestion => {
    if (!word.antonyms || word.antonyms.length === 0) {
      return generateDefinitionQuestion(word, allWords)
    }

    const correctAntonym = word.antonyms[0]
    const otherWords = allWords.filter(w => w.id !== word.id)
    const wrongOptions = otherWords
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.word)

    const options = [correctAntonym, ...wrongOptions].sort(() => 0.5 - Math.random())

    return {
      word,
      type: 'antonym',
      question: `Which word is an antonym (opposite) of "${word.word}"?`,
      options,
      correctAnswer: correctAntonym,
      explanation: `"${correctAntonym}" is the opposite of "${word.word}"`
    }
  }

  const handleSubmit = () => {
    if (!selectedAnswer || hasSubmitted || !currentQuestion) return
    
    setHasSubmitted(true)
    const correct = selectedAnswer === currentQuestion.correctAnswer
    
    setFeedback({
      correct,
      explanation: currentQuestion.explanation
    })

    onAnswer(currentQuestion.word.id, correct, timeSpent, currentQuestion.type)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels = {
      definition: 'Definition',
      synonym: 'Synonym',
      usage: 'Usage',
      antonym: 'Antonym'
    }
    return labels[type]
  }

  const getQuestionTypeColor = (type: QuestionType): string => {
    const colors = {
      definition: 'bg-blue-100 text-blue-800',
      synonym: 'bg-green-100 text-green-800',
      usage: 'bg-purple-100 text-purple-800',
      antonym: 'bg-orange-100 text-orange-800'
    }
    return colors[type]
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shuffle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Generating question...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(currentQuestion.type)}`}>
            {getQuestionTypeLabel(currentQuestion.type)}
          </span>
        </div>

        <div className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
          <Clock className="w-4 h-4 inline mr-1" />
          {formatTime(timeSpent)}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
          const isSelected = selectedAnswer === option
          const isCorrect = showFeedback && option === currentQuestion.correctAnswer
          const isIncorrect = showFeedback && isSelected && option !== currentQuestion.correctAnswer
          
          return (
            <button
              key={index}
              onClick={() => !disabled && !hasSubmitted && setSelectedAnswer(option)}
              disabled={disabled || hasSubmitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                isCorrect
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : isIncorrect
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled || hasSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isIncorrect
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {showFeedback && isCorrect && <CheckCircle className="w-5 h-5" />}
                  {showFeedback && isIncorrect && <XCircle className="w-5 h-5" />}
                  {(!showFeedback || (!isCorrect && !isIncorrect)) && optionLetter}
                </div>
                <span className="flex-1 leading-relaxed">{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Submit Button */}
      {!showFeedback && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedAnswer ? 'Answer selected' : 'Select an answer to continue'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || disabled || hasSubmitted}
            size="lg"
            className="px-8"
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* Feedback Display */}
      {showFeedback && feedback && (
        <div className="mt-6 pt-6 border-t">
          <div className={`p-4 rounded-lg ${
            feedback.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                feedback.correct ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {feedback.correct ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <XCircle className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium mb-2 ${
                  feedback.correct ? 'text-green-900' : 'text-red-900'
                }`}>
                  {feedback.correct ? 'Correct!' : 'Incorrect'}
                </h4>
                
                <p className={`text-sm ${
                  feedback.correct ? 'text-green-800' : 'text-red-800'
                }`}>
                  {feedback.explanation}
                </p>

                {!feedback.correct && (
                  <div className="mt-2 text-sm text-red-800">
                    <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}