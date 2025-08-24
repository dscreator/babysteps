import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  examDate: z.string().refine((date) => {
    const examDate = new Date(date)
    const today = new Date()
    return examDate > today
  }, 'Exam date must be in the future'),
  gradeLevel: z.number().int().min(6).max(8),
  parentEmail: z.string().email('Invalid parent email format').optional()
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  examDate: z.string().refine((date) => {
    const examDate = new Date(date)
    const today = new Date()
    return examDate > today
  }, 'Exam date must be in the future').optional(),
  gradeLevel: z.number().int().min(6).max(8).optional(),
  parentEmail: z.string().email('Invalid parent email format').optional(),
  preferences: z.object({
    studyReminders: z.boolean(),
    parentNotifications: z.boolean(),
    difficultyLevel: z.enum(['adaptive', 'beginner', 'intermediate', 'advanced']),
    dailyGoalMinutes: z.number().int().min(10).max(180)
  }).optional()
})

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      next(error)
    }
  }
}