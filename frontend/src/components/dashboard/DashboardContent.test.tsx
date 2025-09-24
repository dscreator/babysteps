import { render, screen, waitFor } from '../../test/utils'
import { DashboardContent } from './DashboardContent'
import { createMockUser, createMockProgress } from '../../test/utils'
import { vi } from 'vitest'

// Mock the hooks
const mockUseAuth = vi.fn()
const mockUseQuery = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQuery(options)
}))

describe('DashboardContent', () => {
  const mockUser = createMockUser({
    examDate: new Date('2024-06-01'),
    firstName: 'John'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    })
  })

  it('renders dashboard components when data is loaded', async () => {
    const mockProgressData = {
      overallProgress: createMockProgress(),
      recentSessions: [],
      achievements: []
    }

    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null
    })

    render(<DashboardContent />)

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John/)).toBeInTheDocument()
      expect(screen.getByTestId('exam-countdown')).toBeInTheDocument()
      expect(screen.getByTestId('progress-overview')).toBeInTheDocument()
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching data', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<DashboardContent />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows error state when data fetch fails', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch dashboard data')
    })

    render(<DashboardContent />)

    expect(screen.getByText(/Error loading dashboard/)).toBeInTheDocument()
  })

  it('displays exam countdown correctly', async () => {
    const futureExamDate = new Date()
    futureExamDate.setDate(futureExamDate.getDate() + 30)
    
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, examDate: futureExamDate },
      loading: false
    })

    mockUseQuery.mockReturnValue({
      data: { overallProgress: createMockProgress(), recentSessions: [], achievements: [] },
      isLoading: false,
      error: null
    })

    render(<DashboardContent />)

    await waitFor(() => {
      expect(screen.getByTestId('exam-countdown')).toBeInTheDocument()
    })
  })

  it('shows motivational message based on progress', async () => {
    const mockProgressData = {
      overallProgress: createMockProgress({ overallScore: 95 }),
      recentSessions: [],
      achievements: []
    }

    mockUseQuery.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null
    })

    render(<DashboardContent />)

    await waitFor(() => {
      expect(screen.getByTestId('motivational-message')).toBeInTheDocument()
    })
  })
})