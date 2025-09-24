import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('should display login page by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.getByText(/don't have an account/i).click()
    
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByLabel(/exam date/i)).toBeVisible()
    await expect(page.getByLabel(/grade level/i)).toBeVisible()
  })

  test('should validate login form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page.getByText(/invalid email format/i)).toBeVisible()
  })

  test('should handle login attempt', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Mock the API response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      })
    })
    
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('should complete registration form', async ({ page }) => {
    // Navigate to registration
    await page.getByText(/don't have an account/i).click()
    
    // Fill out registration form
    await page.getByLabel(/first name/i).fill('Test')
    await page.getByLabel(/last name/i).fill('User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Set exam date to 30 days from now
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    await page.getByLabel(/exam date/i).fill(futureDate.toISOString().split('T')[0])
    
    await page.getByLabel(/grade level/i).selectOption('7')
    
    // Mock successful registration
    await page.route('**/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User'
            },
            session: { access_token: 'mock-token' }
          }
        })
      })
    })
    
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|success/)
  })

  test('should validate registration form fields', async ({ page }) => {
    // Navigate to registration
    await page.getByText(/don't have an account/i).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/last name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    // Navigate to registration
    await page.getByText(/don't have an account/i).click()
    
    await page.getByLabel(/password/i).fill('123')
    await page.getByRole('button', { name: /create account/i }).click()
    
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
  })

  test('should validate exam date', async ({ page }) => {
    // Navigate to registration
    await page.getByText(/don't have an account/i).click()
    
    // Set exam date to yesterday
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    await page.getByLabel(/exam date/i).fill(pastDate.toISOString().split('T')[0])
    
    await page.getByRole('button', { name: /create account/i }).click()
    
    await expect(page.getByText(/exam date must be in the future/i)).toBeVisible()
  })
})

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          gradeLevel: 7
        },
        session: { access_token: 'mock-token' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should display dashboard components', async ({ page }) => {
    // Mock dashboard API responses
    await page.route('**/progress/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overallProgress: {
              math: 85,
              english: 78,
              essay: 82
            },
            recentSessions: [],
            achievements: []
          }
        })
      })
    })
    
    await expect(page.getByText(/welcome back, test/i)).toBeVisible()
    await expect(page.getByText(/days until exam/i)).toBeVisible()
    await expect(page.getByText(/math practice/i)).toBeVisible()
    await expect(page.getByText(/english practice/i)).toBeVisible()
    await expect(page.getByText(/essay practice/i)).toBeVisible()
  })

  test('should navigate to practice modules', async ({ page }) => {
    // Mock dashboard data
    await page.route('**/progress/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overallProgress: { math: 85, english: 78, essay: 82 },
            recentSessions: [],
            achievements: []
          }
        })
      })
    })
    
    // Click on math practice
    await page.getByText(/math practice/i).click()
    await expect(page).toHaveURL(/math/)
    
    // Go back to dashboard
    await page.goBack()
    
    // Click on english practice
    await page.getByText(/english practice/i).click()
    await expect(page).toHaveURL(/english/)
    
    // Go back to dashboard
    await page.goBack()
    
    // Click on essay practice
    await page.getByText(/essay practice/i).click()
    await expect(page).toHaveURL(/essay/)
  })
})

test.describe('Responsive Design E2E Tests', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Should still show login form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Form should be responsive
    const emailInput = page.getByLabel(/email/i)
    const inputBox = await emailInput.boundingBox()
    expect(inputBox?.width).toBeLessThan(375) // Should fit in mobile width
  })

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Should show login form with proper spacing
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })
})