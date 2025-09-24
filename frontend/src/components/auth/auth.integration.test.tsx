import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import LoginPage from '../../pages/LoginPage'
import RegisterPage from '../../pages/RegisterPage'

// Integration tests for authentication flow
describe('Authentication Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            {component}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Login Flow', () => {
    it('renders login form with all required fields', () => {
      renderWithProviders(<LoginPage />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      renderWithProviders(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      renderWithProviders(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('handles successful login', async () => {
      // Mock successful login response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '123', email: 'test@example.com' },
            session: { access_token: 'token' }
          }
        })
      } as Response)

      renderWithProviders(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123'
            })
          })
        )
      })
    })

    it('handles login errors', async () => {
      // Mock failed login response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        })
      } as Response)

      renderWithProviders(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Registration Flow', () => {
    it('renders registration form with all required fields', () => {
      renderWithProviders(<RegisterPage />)

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/exam date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates all required fields', async () => {
      renderWithProviders(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('validates password strength', async () => {
      renderWithProviders(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('validates exam date is in future', async () => {
      renderWithProviders(<RegisterPage />)

      const examDateInput = screen.getByLabelText(/exam date/i)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      fireEvent.change(examDateInput, { 
        target: { value: pastDate.toISOString().split('T')[0] } 
      })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/exam date must be in the future/i)).toBeInTheDocument()
      })
    })

    it('handles successful registration', async () => {
      // Mock successful registration response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { 
              id: '123', 
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User'
            },
            session: { access_token: 'token' }
          }
        })
      } as Response)

      renderWithProviders(<RegisterPage />)

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/first name/i), { 
        target: { value: 'Test' } 
      })
      fireEvent.change(screen.getByLabelText(/last name/i), { 
        target: { value: 'User' } 
      })
      fireEvent.change(screen.getByLabelText(/email/i), { 
        target: { value: 'test@example.com' } 
      })
      fireEvent.change(screen.getByLabelText(/password/i), { 
        target: { value: 'password123' } 
      })
      
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      fireEvent.change(screen.getByLabelText(/exam date/i), { 
        target: { value: futureDate.toISOString().split('T')[0] } 
      })
      
      fireEvent.change(screen.getByLabelText(/grade level/i), { 
        target: { value: '7' } 
      })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('test@example.com')
          })
        )
      })
    })
  })

  describe('Authentication State Management', () => {
    it('persists authentication state across page reloads', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn(() => JSON.stringify({
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token' }
        })),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

      renderWithProviders(<div data-testid="auth-test">Auth Test</div>)

      // The auth context should restore the user from localStorage
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth-storage')
      })
    })

    it('clears authentication state on logout', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

      // Mock successful logout response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response)

      renderWithProviders(<div data-testid="auth-test">Auth Test</div>)

      // Simulate logout action
      // This would typically be triggered by a logout button in a real component
      await waitFor(() => {
        // Verify that logout clears local storage
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-storage')
      })
    })
  })
})