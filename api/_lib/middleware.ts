import { VercelRequest, VercelResponse } from '@vercel/node'
import cors from 'cors'

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware wrapper for Vercel functions
export function withMiddleware(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Handle CORS
    return new Promise((resolve, reject) => {
      cors(corsOptions)(req as any, res as any, (result: any) => {
        if (result instanceof Error) {
          return reject(result)
        }
        return resolve(handler(req, res))
      })
    })
  }
}

// Error handler
export function handleError(res: VercelResponse, error: any, message = 'Internal server error') {
  console.error('API Error:', error)
  
  if (error.status) {
    return res.status(error.status).json({ error: error.message })
  }
  
  return res.status(500).json({ error: message })
}

// Method validation
export function validateMethod(req: VercelRequest, res: VercelResponse, allowedMethods: string[]) {
  if (!allowedMethods.includes(req.method || '')) {
    res.status(405).json({ error: 'Method not allowed' })
    return false
  }
  return true
}