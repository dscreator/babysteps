import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { PerformanceChart } from './PerformanceChart'
import { TopicBreakdownChart } from './TopicBreakdownChart'
import { StreakTracker } from './StreakTracker'
import { AchievementBadges } from './AchievementBadges'
import { ProgressSummary } from './ProgressSummary'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}))

// Mock data
const mockPerformanceData = [
  { date: '2024-01-01', score: 60 },
  { date: '2024-01-08', score: 65 },
  { date: '2024-01-15', score: 70 },
  { date: '2024-01-22', score: 75 },
]

const mockTopicScores = {
  'arithmetic': 85,
  'algebra': 72,
  'geometry': 68,
  'data analysis': 79,
}

const mockWeeklyGoal = {
  target: 300,
  completed: 180,
  percentage: 60,
}

const mockAchievements = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first practice session',
    icon: '🎯',
    unlockedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Math Whiz',
    description: 'Score 80% or higher on a math session',
    icon: '🔢',
    progress: {
      current: 72,
      target: 80,
    },
  },
]

const mockDetailedProgress = {
  subject: 'math' as const,
  topicScores: mockTopicScores,
  performanceTrend: mockPerformanceData,
  weakAreas: ['algebra word problems'],
  strongAreas: ['arithmetic'],
  recommendations: ['Focus on algebra word problems'],
  timeSpent: 420,
  questionsAnswered: 156,
  accuracy: 72,
}

describe('Progress Components', () => {
  it('renders PerformanceChart', () => {
    render(
      <PerformanceChart
        data={mockPerformanceData}
        title="Math Performance"
        subject="math"
      />
    )
    expect(screen.getByText('Math Performance')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders TopicBreakdownChart', () => {
    render(
      <TopicBreakdownChart
        topicScores={mockTopicScores}
        subject="math"
      />
    )
    expect(screen.getByText('Topic Breakdown')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders StreakTracker', () => {
    render(
      <StreakTracker
        streakDays={5}
        totalPracticeTime={1240}
        weeklyGoal={mockWeeklyGoal}
      />
    )
    expect(screen.getByText('Study Streak')).toBeInTheDocument()
    expect(screen.getByText('5 days strong! 🔥')).toBeInTheDocument()
    expect(screen.getByText('Weekly Goal')).toBeInTheDocument()
    expect(screen.getByText('Total Practice Time')).toBeInTheDocument()
  })

  it('renders AchievementBadges', () => {
    render(<AchievementBadges achievements={mockAchievements} />)
    expect(screen.getByText('Achievements')).toBeInTheDocument()
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument()
  })

  it('renders ProgressSummary', () => {
    render(<ProgressSummary progress={mockDetailedProgress} />)
    expect(screen.getByText('math Summary')).toBeInTheDocument()
    expect(screen.getAllByText('72%')).toHaveLength(2) // Appears in accuracy and overall accuracy
    expect(screen.getByText('Accuracy')).toBeInTheDocument()
    expect(screen.getByText('Time Spent')).toBeInTheDocument()
    expect(screen.getByText('156')).toBeInTheDocument()
  })
})