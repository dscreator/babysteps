import { z } from 'zod'

// Validation schemas for practice-related requests
export const createSessionSchema = z.object({
  subject: z.enum(['math', 'english', 'essay']),
  topics: z.array(z.string()).optional(),
  difficultyLevel: z.number().min(1).max(5).optional()
})

export const updateSessionSchema = z.object({
  questionsAttempted: z.number().min(0).optional(),
  questionsCorrect: z.number().min(0).optional(),
  topics: z.array(z.string()).optional(),
  sessionData: z.record(z.any()).optional()
}).refine(data => {
  // Ensure questionsCorrect is not greater than questionsAttempted
  if (data.questionsCorrect !== undefined && data.questionsAttempted !== undefined) {
    return data.questionsCorrect <= data.questionsAttempted
  }
  return true
}, {
  message: "Questions correct cannot exceed questions attempted"
})

export const endSessionSchema = z.object({
  questionsAttempted: z.number().min(0),
  questionsCorrect: z.number().min(0),
  sessionData: z.record(z.any()).optional()
}).refine(data => data.questionsCorrect <= data.questionsAttempted, {
  message: "Questions correct cannot exceed questions attempted"
})

export const submitAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().min(1).max(1000),
  timeSpent: z.number().min(0).optional()
})

export const getProblemsSchema = z.object({
  topic: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  gradeLevel: z.number().min(6).max(8).optional(),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0)
})

export const getPassagesSchema = z.object({
  gradeLevel: z.number().min(6).max(8).optional(),
  subjectArea: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
  offset: z.number().min(0).default(0)
})

export const getVocabularySchema = z.object({
  difficultyLevel: z.number().min(1).max(5).optional(),
  gradeLevel: z.number().min(6).max(8).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
})

export const getPromptsSchema = z.object({
  type: z.enum(['narrative', 'expository', 'persuasive']).optional(),
  gradeLevel: z.number().min(6).max(8).optional(),
  limit: z.number().min(1).max(20).default(10),
  offset: z.number().min(0).default(0)
})

export const recordInteractionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  interactionType: z.enum(['hint', 'explanation', 'feedback', 'chat']),
  content: z.string().min(1).max(5000),
  context: z.record(z.any()).optional()
})

// Validation helper functions
export function validateCreateSession(data: unknown) {
  return createSessionSchema.parse(data)
}

export function validateUpdateSession(data: unknown) {
  return updateSessionSchema.parse(data)
}

export function validateEndSession(data: unknown) {
  return endSessionSchema.parse(data)
}

export function validateSubmitAnswer(data: unknown) {
  return submitAnswerSchema.parse(data)
}

export function validateGetProblems(data: unknown) {
  return getProblemsSchema.parse(data)
}

export function validateGetPassages(data: unknown) {
  return getPassagesSchema.parse(data)
}

export function validateGetVocabulary(data: unknown) {
  return getVocabularySchema.parse(data)
}

export function validateGetPrompts(data: unknown) {
  return getPromptsSchema.parse(data)
}

export function validateRecordInteraction(data: unknown) {
  return recordInteractionSchema.parse(data)
}

// Custom validation errors
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validation middleware helper
export function createValidationMiddleware<T>(validator: (data: unknown) => T) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = validator(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        })
      }
      
      return res.status(400).json({
        error: 'Invalid request data',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      })
    }
  }
}

// Query parameter validation helper
export function validateQueryParams<T>(validator: (data: unknown) => T, query: any): T {
  // Convert string values to appropriate types
  const processedQuery: any = {}
  
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Try to convert numeric strings to numbers
      if (/^\d+$/.test(value)) {
        processedQuery[key] = parseInt(value, 10)
      } else if (/^\d+\.\d+$/.test(value)) {
        processedQuery[key] = parseFloat(value)
      } else {
        processedQuery[key] = value
      }
    } else {
      processedQuery[key] = value
    }
  })
  
  return validator(processedQuery)
}

// Business logic validation
export function validateSessionOwnership(session: any, userId: string): void {
  if (!session) {
    throw new ValidationError('Session not found')
  }
  
  if (session.userId !== userId) {
    throw new ValidationError('Access denied: Session does not belong to user')
  }
}

export function validateActiveSession(session: any): void {
  if (session.endTime) {
    throw new ValidationError('Session has already ended')
  }
}

export function validateSessionNotEnded(session: any): void {
  if (!session.endTime) {
    throw new ValidationError('Session is still active')
  }
}

export function validateGradeLevel(gradeLevel: number): void {
  if (gradeLevel < 6 || gradeLevel > 8) {
    throw new ValidationError('Grade level must be between 6 and 8')
  }
}

export function validateExamDate(examDate: string): void {
  const date = new Date(examDate)
  const now = new Date()
  
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid exam date format')
  }
  
  if (date <= now) {
    throw new ValidationError('Exam date must be in the future')
  }
  
  // Check if exam date is too far in the future (more than 2 years)
  const twoYearsFromNow = new Date()
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
  
  if (date > twoYearsFromNow) {
    throw new ValidationError('Exam date cannot be more than 2 years in the future')
  }
}

export function validatePracticeTimeLimit(startTime: string, maxMinutes: number = 120): void {
  const start = new Date(startTime)
  const now = new Date()
  const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60)
  
  if (diffMinutes > maxMinutes) {
    throw new ValidationError(`Practice session cannot exceed ${maxMinutes} minutes`)
  }
}