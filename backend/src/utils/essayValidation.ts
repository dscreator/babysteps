import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// Validation schemas
export const submitEssaySchema = z.object({
  promptId: z.string().uuid('Invalid prompt ID format'),
  content: z.string()
    .min(50, 'Essay must be at least 50 characters long')
    .max(10000, 'Essay exceeds maximum length of 10,000 characters')
    .refine(content => content.trim().length > 0, 'Essay cannot be empty'),
  timeSpent: z.number().min(0).max(300).optional() // 0-300 minutes
})

export const analyzeEssaySchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID format')
})

export const getEssayHistorySchema = z.object({
  limit: z.string().transform(val => parseInt(val)).pipe(
    z.number().min(1).max(50)
  ).optional()
})

// Validation middleware factory
export function createEssayValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body)
      req.validatedData = validatedData
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
      return res.status(400).json({ error: 'Invalid request data' })
    }
  }
}

// Query parameter validation
export function validateEssayQueryParams<T>(schema: z.ZodSchema<T>, params: any): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw new Error('Invalid query parameters')
  }
}

// Content validation helpers
export function validateEssayContent(content: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic length checks
  if (content.length < 50) {
    errors.push('Essay is too short (minimum 50 characters)')
  }

  if (content.length > 10000) {
    errors.push('Essay is too long (maximum 10,000 characters)')
  }

  // Word count checks
  const wordCount = content.trim().split(/\s+/).length
  if (wordCount < 25) {
    warnings.push('Essay is quite short (less than 25 words)')
  }

  if (wordCount > 1000) {
    warnings.push('Essay is quite long (over 1000 words)')
  }

  // Basic structure checks
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
  if (paragraphs.length < 2) {
    warnings.push('Consider organizing your essay into multiple paragraphs')
  }

  // Check for common issues
  if (content.includes('  ')) {
    warnings.push('Multiple consecutive spaces detected')
  }

  if (!/[.!?]$/.test(content.trim())) {
    warnings.push('Essay should end with proper punctuation')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Rate limiting validation
export function validateAnalysisRateLimit(userId: string, recentAnalyses: number): void {
  const maxAnalysesPerHour = 3
  
  if (recentAnalyses >= maxAnalysesPerHour) {
    throw new Error('Rate limit exceeded. You can analyze up to 3 essays per hour.')
  }
}

// Essay prompt validation
export function validateEssayPrompt(prompt: any): boolean {
  return !!(
    prompt &&
    prompt.id &&
    prompt.prompt &&
    prompt.type &&
    ['narrative', 'expository', 'persuasive'].includes(prompt.type) &&
    prompt.grade_level &&
    prompt.grade_level >= 6 &&
    prompt.grade_level <= 8
  )
}