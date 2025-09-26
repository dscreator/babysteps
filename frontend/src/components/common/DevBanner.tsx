import { useMockData } from '../../lib/supabase'

export function DevBanner() {
  const hasSupabaseCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!useMockData && hasSupabaseCredentials) return null

  const message = !hasSupabaseCredentials 
    ? "Missing Supabase Configuration - Using Mock Authentication"
    : "Development Mode - Using Mock Authentication"

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-yellow-800">
            {message}
          </span>
        </div>
      </div>
    </div>
  )
}