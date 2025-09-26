import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, useMockData } from '../lib/supabase'
import { mockAuth, MockUser, MockSession } from '../lib/mockAuth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we have proper Supabase credentials
    const hasSupabaseCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (useMockData || !hasSupabaseCredentials) {
      // Use mock authentication
      mockAuth.getSession().then(({ data: { session } }) => {
        setSession(session as any)
        setUser(session?.user as any ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = mockAuth.onAuthStateChange((_event, session) => {
        setSession(session as any)
        setUser(session?.user as any ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      // Use real Supabase authentication
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const hasSupabaseCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (useMockData || !hasSupabaseCredentials) {
      const { error } = await mockAuth.signIn(email, password)
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    const hasSupabaseCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (useMockData || !hasSupabaseCredentials) {
      const { error } = await mockAuth.signUp(email, password)
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    }
  }

  const signOut = async () => {
    const hasSupabaseCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (useMockData || !hasSupabaseCredentials) {
      const { error } = await mockAuth.signOut()
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}