import { Router } from 'express'

const router = Router()

// AI tutor routes - will be implemented in task 8
router.post('/explain', (req, res) => {
  res.json({ message: 'AI explanation endpoint - to be implemented in task 8.1' })
})

router.post('/hint', (req, res) => {
  res.json({ message: 'AI hint endpoint - to be implemented in task 8.1' })
})

router.post('/chat', (req, res) => {
  res.json({ message: 'AI chat endpoint - to be implemented in task 8.3' })
})

router.get('/recommendations', (req, res) => {
  res.json({ message: 'AI recommendations endpoint - to be implemented in task 8.2' })
})

export { router as tutorRoutes }