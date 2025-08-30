// Mock authentication for development without Supabase
export interface MockUser {
  id: string
  email: string
  user_metadata: {
    firstName?: string
    lastName?: string
  }
}

export interface MockSession {
  user: MockUser
  access_token: string
  expires_at: number
}

class MockAuthService {
  private currentUser: MockUser | null = null
  private currentSession: MockSession | null = null
  private listeners: ((session: MockSession | null) => void)[] = []

  constructor() {
    // Check for existing session in localStorage
    const savedSession = localStorage.getItem('mock_session')
    if (savedSession) {
      try {
        this.currentSession = JSON.parse(savedSession)
        this.currentUser = this.currentSession?.user || null
      } catch (e) {
        localStorage.removeItem('mock_session')
      }
    }
  }

  async signUp(email: string, password: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: {}
    }

    const session: MockSession = {
      user,
      access_token: `mock-token-${Date.now()}`,
      expires_at: Date.now() + 3600000 // 1 hour
    }

    this.currentUser = user
    this.currentSession = session
    localStorage.setItem('mock_session', JSON.stringify(session))
    
    this.notifyListeners(session)
    
    return { data: { user, session }, error: null }
  }

  async signIn(email: string, password: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo, accept any email/password
    const user: MockUser = {
      id: `mock-user-${email.replace('@', '-').replace('.', '-')}`,
      email,
      user_metadata: {
        firstName: 'Demo',
        lastName: 'User'
      }
    }

    const session: MockSession = {
      user,
      access_token: `mock-token-${Date.now()}`,
      expires_at: Date.now() + 3600000 // 1 hour
    }

    this.currentUser = user
    this.currentSession = session
    localStorage.setItem('mock_session', JSON.stringify(session))
    
    this.notifyListeners(session)
    
    return { data: { user, session }, error: null }
  }

  async signOut() {
    this.currentUser = null
    this.currentSession = null
    localStorage.removeItem('mock_session')
    this.notifyListeners(null)
    
    return { error: null }
  }

  getSession() {
    return Promise.resolve({ 
      data: { session: this.currentSession }, 
      error: null 
    })
  }

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    const listener = (session: MockSession | null) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    }
    
    this.listeners.push(listener)
    
    // Call immediately with current state
    setTimeout(() => listener(this.currentSession), 0)
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(listener)
            if (index > -1) {
              this.listeners.splice(index, 1)
            }
          }
        }
      }
    }
  }

  private notifyListeners(session: MockSession | null) {
    this.listeners.forEach(listener => listener(session))
  }
}

export const mockAuth = new MockAuthService()