import { useState } from 'react'
import { Settings, Play, Clock, Target, BookOpen } from 'lucide-react'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'
import { mathService } from '../../../services/mathService'

interface MathSessionConfigProps {
  onStartSession: (config: {
    topics: string[]
    difficultyLevel: number
    problemCount: number
    timeLimit: number
  }) => void
  onCancel?: () => void
}

export function MathSessionConfig({ onStartSession, onCancel }: MathSessionConfigProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2)
  const [problemCount, setProblemCount] = useState<number>(10)
  const [timeLimit, setTimeLimit] = useState<number>(1800) // 30 minutes in seconds

  const availableTopics = mathService.getAvailableTopics()
  const difficultyLevels = mathService.getDifficultyLevels()

  const topicLabels: Record<string, string> = {
    'arithmetic': 'Arithmetic',
    'algebra': 'Algebra',
    'geometry': 'Geometry',
    'data-analysis': 'Data Analysis',
    'fractions': 'Fractions',
    'decimals': 'Decimals',
    'percentages': 'Percentages',
    'ratios': 'Ratios & Proportions',
    'proportions': 'Proportions',
    'basic-equations': 'Basic Equations',
    'coordinate-geometry': 'Coordinate Geometry',
    'probability': 'Probability',
    'statistics': 'Statistics'
  }

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const handleSelectAllTopics = () => {
    setSelectedTopics(availableTopics)
  }

  const handleClearTopics = () => {
    setSelectedTopics([])
  }

  const handleStartSession = () => {
    onStartSession({
      topics: selectedTopics,
      difficultyLevel,
      problemCount,
      timeLimit
    })
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    return `${mins} minutes`
  }

  const getEstimatedTime = (): string => {
    // Estimate 2-3 minutes per problem on average
    const estimatedSeconds = problemCount * 150 // 2.5 minutes per problem
    return formatTime(estimatedSeconds)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Configure Math Practice Session</h2>
          </div>
          <p className="text-gray-600">
            Customize your practice session to focus on specific topics and difficulty levels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Topics and Difficulty */}
          <div className="space-y-6">
            {/* Topic Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Topics</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllTopics}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearTopics}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {availableTopics.map(topic => (
                  <label
                    key={topic}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTopics.includes(topic)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {topicLabels[topic] || topic}
                    </span>
                  </label>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {selectedTopics.length === 0 
                  ? 'No topics selected - all topics will be included'
                  : `${selectedTopics.length} topic${selectedTopics.length === 1 ? '' : 's'} selected`
                }
              </p>
            </div>

            {/* Difficulty Level */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Difficulty Level</h3>
              </div>
              
              <div className="space-y-2">
                {difficultyLevels.map(level => (
                  <label
                    key={level.value}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      difficultyLevel === level.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={level.value}
                      checked={difficultyLevel === level.value}
                      onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                      className="mr-3 mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Session Settings */}
          <div className="space-y-6">
            {/* Problem Count */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Number of Problems</h3>
              </div>
              
              <div className="space-y-3">
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  value={problemCount}
                  onChange={(e) => setProblemCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>5</span>
                  <span className="font-medium text-gray-900">{problemCount} problems</span>
                  <span>25</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Estimated time: {getEstimatedTime()}
              </p>
            </div>

            {/* Time Limit */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Time Limit</h3>
              </div>
              
              <div className="space-y-3">
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={900}>15 minutes</option>
                  <option value={1200}>20 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={2700}>45 minutes</option>
                  <option value={3600}>60 minutes</option>
                  <option value={0}>No time limit</option>
                </select>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {timeLimit === 0 
                  ? 'Take as much time as you need'
                  : `Session will auto-end after ${formatTime(timeLimit)}`
                }
              </p>
            </div>

            {/* Session Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Session Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Topics:</span>
                  <span className="text-gray-900">
                    {selectedTopics.length === 0 ? 'All topics' : `${selectedTopics.length} selected`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="text-gray-900">
                    {difficultyLevels.find(l => l.value === difficultyLevel)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Problems:</span>
                  <span className="text-gray-900">{problemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time limit:</span>
                  <span className="text-gray-900">
                    {timeLimit === 0 ? 'None' : formatTime(timeLimit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleStartSession}
            size="lg"
            className="px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Practice Session
          </Button>
        </div>
      </Card>
    </div>
  )
}