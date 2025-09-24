import { render, screen } from '../../test/utils'
import { ProtectedRoute } from './ProtectedRoute'
import { vi } from 'vitest'

// Mock the auth context
const mockUseAuth = vi.fn()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('handles authentication state changes', () => {
    const { rerender } = render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Initially loading
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    })
    rerender(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Then authenticated
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false
    })
    rerender(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})