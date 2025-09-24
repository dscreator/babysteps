import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import { practiceRoutes } from './routes/practice'
import { progressRoutes } from './routes/progress'
import { tutorRoutes } from './routes/tutor'
import { parentRoutes, studentParentRoutes } from './routes/parent'
import { notificationRoutes } from './routes/notifications'
import { notificationScheduler } from './services/notificationScheduler'
import syncRoutes from './routes/sync'
import privacyRoutes from './routes/privacy'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'OK', // Could add actual DB health check
        openai: 'OK',   // Could add actual OpenAI health check
        email: 'OK'     // Could add actual email service health check
      }
    }
    
    res.json(health)
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/practice', practiceRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/tutor', tutorRoutes)
app.use('/api/parent', parentRoutes)
app.use('/api/student/parent', studentParentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/privacy', privacyRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    
    // Start notification scheduler
    notificationScheduler.start()
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully')
      notificationScheduler.stop()
      process.exit(0)
    })
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully')
      notificationScheduler.stop()
      process.exit(0)
    })
  })
}

export default app