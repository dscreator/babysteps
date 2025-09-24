import { test, expect } from '@playwright/test'

test.describe('Practice Module E2E Tests', () => {
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
  })

  test.describe('Math Practice', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/practice/math')
    })

    test('should display math practice interface', async ({ page }) => {
      // Mock math problems API
      await page.route('**/practice/math/problems', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                topic: 'arithmetic',
                difficulty: 2,
                question: 'What is 15 + 27?',
                options: ['40', '42', '44', '46'],
                correctAnswer: '42'
              }
            ]
          })
        })
      })

      await expect(page.getByText(/math practice/i)).toBeVisible()
      await expect(page.getByText(/what is 15 \+ 27/i)).toBeVisible()
      await expect(page.getByText('40')).toBeVisible()
      await expect(page.getByText('42')).toBeVisible()
      await expect(page.getByText('44')).toBeVisible()
      await expect(page.getByText('46')).toBeVisible()
    })

    test('should handle answer selection and submission', async ({ page }) => {
      // Mock math problems API
      await page.route('**/practice/math/problems', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                topic: 'arithmetic',
                difficulty: 2,
                question: 'What is 15 + 27?',
                options: ['40', '42', '44', '46'],
                correctAnswer: '42'
              }
            ]
          })
        })
      })

      // Mock answer submission API
      await page.route('**/practice/sessions/*/answers', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isCorrect: true,
              explanation: '15 + 27 = 42',
              nextProblem: null
            }
          })
        })
      })

      // Select the correct answer
      await page.getByText('42').click()
      
      // Submit button should be enabled
      const submitButton = page.getByRole('button', { name: /submit answer/i })
      await expect(submitButton).toBeEnabled()
      
      await submitButton.click()
      
      // Should show feedback
      await expect(page.getByText(/correct/i)).toBeVisible()
      await expect(page.getByText('15 + 27 = 42')).toBeVisible()
    })

    test('should handle incorrect answers', async ({ page }) => {
      // Mock math problems API
      await page.route('**/practice/math/problems', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                topic: 'arithmetic',
                difficulty: 2,
                question: 'What is 15 + 27?',
                options: ['40', '42', '44', '46'],
                correctAnswer: '42'
              }
            ]
          })
        })
      })

      // Mock incorrect answer submission
      await page.route('**/practice/sessions/*/answers', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isCorrect: false,
              explanation: '15 + 27 = 42, not 40',
              nextProblem: null
            }
          })
        })
      })

      // Select incorrect answer
      await page.getByText('40').click()
      await page.getByRole('button', { name: /submit answer/i }).click()
      
      // Should show incorrect feedback
      await expect(page.getByText(/incorrect/i)).toBeVisible()
      await expect(page.getByText('15 + 27 = 42, not 40')).toBeVisible()
    })

    test('should request hints', async ({ page }) => {
      // Mock math problems API
      await page.route('**/practice/math/problems', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                topic: 'arithmetic',
                difficulty: 2,
                question: 'What is 15 + 27?',
                options: ['40', '42', '44', '46'],
                correctAnswer: '42',
                hints: ['Break it down: 15 + 20 + 7']
              }
            ]
          })
        })
      })

      // Mock hint request
      await page.route('**/tutor/hint', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              hint: 'Break it down: 15 + 20 + 7'
            }
          })
        })
      })

      await page.getByRole('button', { name: /get hint/i }).click()
      
      await expect(page.getByText('Break it down: 15 + 20 + 7')).toBeVisible()
    })
  })

  test.describe('English Practice', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/practice/english')
    })

    test('should display reading comprehension', async ({ page }) => {
      // Mock reading passages API
      await page.route('**/practice/english/passages', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                title: 'The Solar System',
                content: 'The solar system consists of the Sun and the objects that orbit it...',
                questions: [
                  {
                    id: '1',
                    question: 'What is at the center of our solar system?',
                    options: ['Earth', 'Moon', 'Sun', 'Mars'],
                    correctAnswer: 'Sun'
                  }
                ]
              }
            ]
          })
        })
      })

      await expect(page.getByText(/english practice/i)).toBeVisible()
      await expect(page.getByText('The Solar System')).toBeVisible()
      await expect(page.getByText(/the solar system consists/i)).toBeVisible()
      await expect(page.getByText(/what is at the center/i)).toBeVisible()
    })

    test('should handle vocabulary practice', async ({ page }) => {
      await page.getByText(/vocabulary/i).click()

      // Mock vocabulary API
      await page.route('**/practice/english/vocabulary', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                word: 'abundant',
                definition: 'existing in large quantities; plentiful',
                synonyms: ['plentiful', 'copious', 'ample'],
                examples: ['The garden had abundant flowers.']
              }
            ]
          })
        })
      })

      await expect(page.getByText('abundant')).toBeVisible()
      await expect(page.getByText(/existing in large quantities/i)).toBeVisible()
    })
  })

  test.describe('Essay Practice', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/practice/essay')
    })

    test('should display essay writing interface', async ({ page }) => {
      // Mock essay prompts API
      await page.route('**/practice/essay/prompts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                prompt: 'Write about a time when you overcame a challenge.',
                type: 'narrative',
                timeLimit: 30
              }
            ]
          })
        })
      })

      await expect(page.getByText(/essay practice/i)).toBeVisible()
      await expect(page.getByText(/write about a time when you overcame/i)).toBeVisible()
      await expect(page.getByRole('textbox')).toBeVisible()
    })

    test('should handle essay submission and analysis', async ({ page }) => {
      // Mock essay prompts API
      await page.route('**/practice/essay/prompts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                prompt: 'Write about a time when you overcame a challenge.',
                type: 'narrative',
                timeLimit: 30
              }
            ]
          })
        })
      })

      // Mock essay analysis API
      await page.route('**/practice/essay/analyze', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              overallScore: 85,
              structure: {
                score: 80,
                feedback: 'Good introduction and conclusion.'
              },
              grammar: {
                score: 90,
                feedback: 'Excellent grammar with minor errors.'
              },
              vocabulary: {
                score: 85,
                feedback: 'Good vocabulary usage.'
              },
              suggestions: [
                'Add more supporting details',
                'Use transition words'
              ]
            }
          })
        })
      })

      // Write essay
      const essayText = 'Last year, I faced a significant challenge when I had to give a presentation in front of my entire class. I was very nervous and scared of public speaking.'
      await page.getByRole('textbox').fill(essayText)
      
      // Submit essay
      await page.getByRole('button', { name: /submit essay/i }).click()
      
      // Should show analysis results
      await expect(page.getByText(/overall score: 85/i)).toBeVisible()
      await expect(page.getByText(/good introduction and conclusion/i)).toBeVisible()
      await expect(page.getByText(/add more supporting details/i)).toBeVisible()
    })
  })

  test.describe('Practice Session Management', () => {
    test('should track practice time', async ({ page }) => {
      await page.goto('/practice/math')

      // Mock session creation
      await page.route('**/practice/sessions', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'session-123',
              startTime: new Date().toISOString(),
              subject: 'math'
            }
          })
        })
      })

      // Should show timer
      await expect(page.getByText(/time:/i)).toBeVisible()
    })

    test('should save progress automatically', async ({ page }) => {
      await page.goto('/practice/math')

      // Mock auto-save API calls
      let saveCallCount = 0
      await page.route('**/practice/sessions/*/progress', async route => {
        saveCallCount++
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      // Interact with the practice interface
      // Auto-save should be triggered
      await page.waitForTimeout(5000) // Wait for auto-save interval

      expect(saveCallCount).toBeGreaterThan(0)
    })
  })
})