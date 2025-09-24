import { render, screen, waitFor } from '../../test/utils'
import { ProgressAnalytics } from './ProgressAnalytics'
import { createMockProgress } from '../../test/utils'
import { vi } from 'vitest'

const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQuery(options)
}))

describe('ProgressAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders progress charts when data is available', async () => {
    const mockData = {
      overallProgress: createMockProgress(),
      subjectTrends: {
        math: [
          { date: '2024-01-01', score: 80 },
          { date: '2024-01-02', score: 85 }
        ],
        english: [
          { date: '2024-01-01', score: 75 },
          { date: '2024-01-02', score: 78 }
        ]
      },
      topicBreakdown: {
        math: { arithmetic: 90, algebra: 80, geometry: 70 },
        english: { reading: 85, vocabulary: 75 }
      }
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByText('Overall Progress')).toBeInTheDocument()
      expect(screen.getByText('Subject Breakdown')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching data', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays error message when data fetch fails', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch analytics')
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    expect(screen.getByText(/Error loading analytics/)).toBeInTheDocument()
  })

  it('shows improvement trends correctly', async () => {
    const mockData = {
      overallProgress: createMockProgress({ overallScore: 85 }),
      subjectTrends: {
        math: [
          { date: '2024-01-01', score: 70 },
          { date: '2024-01-02', score: 85 }
        ]
      },
      improvement: {
        math: 15,
        english: 8,
        essay: 5
      }
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    await waitFor(() => {
      expect(screen.getByText(/15 point improvement/)).toBeInTheDocument()
      expect(screen.getByText(/trending upward/)).toBeInTheDocument()
    })
  })

  it('highlights weak and strong areas', async () => {
    const mockData = {
      overallProgress: createMockProgress({
        weakAreas: ['geometry', 'vocabulary'],
        strongAreas: ['arithmetic', 'grammar']
      }),
      recommendations: [
        'Focus more practice on geometry concepts',
        'Continue building vocabulary through reading'
      ]
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    await waitFor(() => {
      expect(screen.getByText('geometry')).toBeInTheDocument()
      expect(screen.getByText('arithmetic')).toBeInTheDocument()
      expect(screen.getByText(/Focus more practice on geometry/)).toBeInTheDocument()
    })
  })

  it('displays readiness assessment', async () => {
    const mockData = {
      readinessScore: 78,
      readinessLevel: 'Good',
      areasToImprove: ['geometry', 'essay structure'],
      estimatedScore: { min: 75, max: 85 }
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<ProgressAnalytics userId="test-user-123" />)

    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
      expect(screen.getByText(/75-85/)).toBeInTheDocument()
    })
  })
})