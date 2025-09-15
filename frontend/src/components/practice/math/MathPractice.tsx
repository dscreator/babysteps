import { useState } from 'react'
import { MathSessionConfig } from './MathSessionConfig'
import { MathSession } from './MathSession'
import type { PracticeSessionResponse } from '../../../types/api'

interface MathPracticeProps {
  onSessionComplete?: (session: PracticeSessionResponse) => void
}

interface SessionConfig {
  topics: string[]
  difficultyLevel: number
  problemCount: number
  timeLimit: number
}

type PracticeState = 'config' | 'session' | 'complete'

export function MathPractice({ onSessionComplete }: MathPracticeProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>('config')
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [, setCompletedSession] = useState<PracticeSessionResponse | null>(null)

  const handleStartSession = (config: SessionConfig) => {
    setSessionConfig(config)
    setPracticeState('session')
  }

  const handleSessionComplete = (session: PracticeSessionResponse) => {
    setCompletedSession(session)
    setPracticeState('complete')
    onSessionComplete?.(session)
  }

  // const handleBackToConfig = () => {
  //   setPracticeState('config')
  //   setSessionConfig(null)
  //   setCompletedSession(null)
  // }

  if (practiceState === 'config') {
    return (
      <MathSessionConfig
        onStartSession={handleStartSession}
      />
    )
  }

  if (practiceState === 'session' && sessionConfig) {
    return (
      <MathSession
        topics={sessionConfig.topics}
        difficultyLevel={sessionConfig.difficultyLevel}
        problemCount={sessionConfig.problemCount}
        timeLimit={sessionConfig.timeLimit}
        onSessionComplete={handleSessionComplete}
      />
    )
  }

  // This shouldn't happen, but fallback to config
  return (
    <MathSessionConfig
      onStartSession={handleStartSession}
    />
  )
}