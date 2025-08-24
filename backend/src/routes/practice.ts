import { Router } from 'express'

const router = Router()

// Math practice routes - will be implemented in task 5
router.get('/math/problems', (req, res) => {
  res.json({ message: 'Math problems endpoint - to be implemented in task 5.1' })
})

router.post('/math/submit', (req, res) => {
  res.json({ message: 'Math submission endpoint - to be implemented in task 5.2' })
})

// English practice routes - will be implemented in task 6
router.get('/english/passages', (req, res) => {
  res.json({ message: 'English passages endpoint - to be implemented in task 6.1' })
})

router.post('/english/submit', (req, res) => {
  res.json({ message: 'English submission endpoint - to be implemented in task 6.3' })
})

// Essay practice routes - will be implemented in task 7
router.get('/essay/prompts', (req, res) => {
  res.json({ message: 'Essay prompts endpoint - to be implemented in task 7.1' })
})

router.post('/essay/submit', (req, res) => {
  res.json({ message: 'Essay submission endpoint - to be implemented in task 7.1' })
})

router.post('/essay/analyze', (req, res) => {
  res.json({ message: 'Essay analysis endpoint - to be implemented in task 7.2' })
})

export { router as practiceRoutes }