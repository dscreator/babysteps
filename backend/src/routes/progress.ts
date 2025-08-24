import { Router } from 'express'

const router = Router()

// Progress tracking routes - will be implemented in task 9
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Progress dashboard endpoint - to be implemented in task 9.1' })
})

router.get('/detailed/:subject', (req, res) => {
  res.json({ message: 'Detailed progress endpoint - to be implemented in task 9.1' })
})

router.post('/goals', (req, res) => {
  res.json({ message: 'Goals endpoint - to be implemented in task 9.2' })
})

router.get('/analytics/performance', (req, res) => {
  res.json({ message: 'Performance analytics endpoint - to be implemented in task 9.1' })
})

export { router as progressRoutes }