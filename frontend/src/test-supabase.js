// Simple test to verify Supabase connection
import { supabase } from './lib/supabase.js'

console.log('Testing Supabase connection...')
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error)
  } else {
    console.log('Supabase connection successful:', data)
  }
})