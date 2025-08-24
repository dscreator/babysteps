// Test setup file
import { beforeAll, afterAll } from 'vitest'

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
})

afterAll(() => {
  // Cleanup after tests
})