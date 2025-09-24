import React, { createContext, useContext, useEffect, useState } from 'react'
import { ParentAccount } from '../types/parent'

interface ParentAuthContextType {
  parent: ParentAccount | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined)

export const useParentAuth = () => {
  const context = useContext(ParentAuthContext)
  if (context === undefined) {
    throw new Error('useParentAuth must be used within a ParentAuthProvider')
  }
  return context
}

interface ParentAuthProviderProps {
  children: React.ReactNode
}

export const ParentAuthProvider: React.FC<ParentAuthProviderProps> = ({ children }) => {
  const [parent, setParent] = useState<ParentAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing parent session
    const checkParentAuth = async () => {
      try {
        const token = localStorage.getItem('parent_access_token')
        if (token) {
          // Verify token and get parent profile
          // This would need to be implemented in the parent service
          // For now, we'll just check if token exists
          const parentData = localStorage.getItem('parent_data')
          if (parentData) {
            setParent(JSON.parse(parentData))
          }
        }
      } catch (error) {
        console.error('Parent auth check failed:', error)
        localStorage.removeItem('parent_access_token')
        localStorage.removeItem('parent_data')
      } finally {
        setIsLoading(false)
      }
    }

    checkParentAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { parentService } = await import('../services/parentService')
      const response = await parentService.login({ email, password })
      
      setParent(response.parent)
      localStorage.setItem('parent_access_token', response.session.access_token)
      localStorage.setItem('parent_data', JSON.stringify(response.parent))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setParent(null)
    localStorage.removeItem('parent_access_token')
    localStorage.removeItem('parent_data')
  }

  const value = {
    parent,
    isLoading,
    login,
    logout,
    isAuthenticated: !!parent
  }

  return (
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  )
}