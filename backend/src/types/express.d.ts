import { UserProfile } from './auth'

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile
      validatedData?: any
    }
  }
}

export {}