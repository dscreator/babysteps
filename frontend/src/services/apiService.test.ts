import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService } from './apiService'

// Mock fetch
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  describe('GET requests', () => {
    it('makes successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await apiService.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('includes authorization header when token is provided', async () => {
      const mockResponse = { data: {} }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      await apiService.get('/protected', { token: 'test-token' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })

    it('handles query parameters', async () => {
      const mockResponse = { data: [] }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      await apiService.get('/search', { 
        params: { q: 'test', limit: 10 } 
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test&limit=10'),
        expect.any(Object)
      )
    })
  })

  describe('POST requests', () => {
    it('makes successful POST request with data', async () => {
      const mockResponse = { success: true, data: { id: 1 } }
      const postData = { name: 'test', value: 123 }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await apiService.post('/create', postData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/create'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(postData)
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error handling', () => {
    it('throws error for 4xx responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid data' })
      } as Response)

      await expect(apiService.get('/error')).rejects.toThrow('Bad Request')
    })

    it('throws error for 5xx responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      } as Response)

      await expect(apiService.get('/server-error')).rejects.toThrow('Internal Server Error')
    })

    it('handles network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      await expect(apiService.get('/network-error')).rejects.toThrow('Network error')
    })

    it('retries failed requests', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' })
        } as Response)

      const result = await apiService.get('/retry-test')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })
  })

  describe('Request interceptors', () => {
    it('adds request timestamp', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      } as Response)

      await apiService.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-Time': expect.any(String)
          })
        })
      )
    })
  })

  describe('Response interceptors', () => {
    it('logs response time for slow requests', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock slow response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({})
          } as Response), 1100)
        )
      )

      await apiService.get('/slow')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow request detected')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Caching', () => {
    it('caches GET requests when enabled', async () => {
      const mockResponse = { data: 'cached' }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      // First request
      const result1 = await apiService.get('/cacheable', { cache: true })
      
      // Second request should use cache
      const result2 = await apiService.get('/cacheable', { cache: true })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('bypasses cache for non-GET requests', async () => {
      const mockResponse = { success: true }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      await apiService.post('/no-cache', {}, { cache: true })
      await apiService.post('/no-cache', {}, { cache: true })

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})