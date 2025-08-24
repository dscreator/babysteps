import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiService, isApiError } from '../apiService'

// Mock fetch
global.fetch = vi.fn()

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } }
      })
    }
  }
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  }
}))

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await apiService.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      )

      expect(result).toEqual({
        data: mockData,
        error: null,
        success: true,
      })
    })

    it('should handle API errors', async () => {
      const mockError = { message: 'Not found', code: 'NOT_FOUND' }
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => mockError,
      })

      const result = await apiService.get('/test')

      expect(isApiError(result)).toBe(true)
      if (isApiError(result)) {
        expect(result.error.message).toBe('Not found')
        expect(result.error.code).toBe('NOT_FOUND')
      }
    })

    it('should handle network errors', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await apiService.get('/test')

      expect(isApiError(result)).toBe(true)
      if (isApiError(result)) {
        expect(result.error.message).toBe('Network error')
        expect(result.error.code).toBe('NETWORK_ERROR')
      }
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' }
      const postData = { name: 'Test' }
      
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await apiService.post('/test', postData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      )

      expect(result).toEqual({
        data: mockData,
        error: null,
        success: true,
      })
    })
  })

  describe('isApiError type guard', () => {
    it('should correctly identify API errors', () => {
      const error = {
        data: null,
        error: { message: 'Test error' },
        success: false,
      }

      expect(isApiError(error)).toBe(true)
    })

    it('should correctly identify successful responses', () => {
      const success = {
        data: { test: true },
        error: null,
        success: true,
      }

      expect(isApiError(success)).toBe(false)
    })
  })
})