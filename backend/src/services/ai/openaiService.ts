import OpenAI from 'openai'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter for OpenAI API calls
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'openai_api',
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
})

// User-specific rate limiter for essay analysis
const userRateLimiter = new RateLimiterMemory({
  keyPrefix: 'essay_analysis',
  points: 3, // 3 essay analyses per user
  duration: 3600, // Per hour
})

class OpenAIService {
  private client: OpenAI
  private isConfigured: boolean

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    this.isConfigured = !!apiKey

    if (this.isConfigured) {
      this.client = new OpenAI({
        apiKey: apiKey,
      })
    } else {
      console.warn('OpenAI API key not configured. AI features will be disabled.')
    }
  }

  async checkRateLimit(userId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    try {
      // Check global rate limit
      await rateLimiter.consume('global')
      // Check user-specific rate limit
      await userRateLimiter.consume(userId)
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
      throw new Error(`Rate limit exceeded. Try again in ${secs} seconds.`)
    }
  }

  async analyzeEssay(essay: string, prompt: string, rubric?: any): Promise<{
    overallScore: number
    structureScore: number
    grammarScore: number
    contentScore: number
    vocabularyScore: number
    feedback: {
      strengths: string[]
      improvements: string[]
      specific: string[]
    }
    rubricBreakdown: Record<string, { score: number; feedback: string }>
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const systemPrompt = `You are an expert ISEE essay evaluator for middle school students (grades 6-8). 
    Analyze the essay based on ISEE standards and provide constructive, age-appropriate feedback.
    
    Evaluate the essay on these criteria:
    1. Structure & Organization (0-100): Clear introduction, body, conclusion, logical flow
    2. Grammar & Mechanics (0-100): Proper grammar, spelling, punctuation, sentence structure
    3. Content & Ideas (0-100): Relevance to prompt, depth of ideas, examples, creativity
    4. Vocabulary & Style (0-100): Word choice, sentence variety, age-appropriate sophistication
    
    Provide scores and specific, actionable feedback that helps the student improve.
    Be encouraging while identifying areas for growth.`

    const userPrompt = `Essay Prompt: "${prompt}"

Essay to analyze:
"${essay}"

${rubric ? `Rubric: ${JSON.stringify(rubric)}` : ''}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": number (0-100),
  "structureScore": number (0-100),
  "grammarScore": number (0-100),
  "contentScore": number (0-100),
  "vocabularyScore": number (0-100),
  "feedback": {
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2", "improvement3"],
    "specific": ["specific suggestion1", "specific suggestion2", "specific suggestion3"]
  },
  "rubricBreakdown": {
    "structure": {"score": number, "feedback": "detailed feedback"},
    "grammar": {"score": number, "feedback": "detailed feedback"},
    "content": {"score": number, "feedback": "detailed feedback"},
    "vocabulary": {"score": number, "feedback": "detailed feedback"}
  }
}`

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      try {
        return JSON.parse(response)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response)
        throw new Error('Invalid response format from AI service')
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      if (error instanceof Error) {
        throw new Error(`AI analysis failed: ${error.message}`)
      }
      throw new Error('AI analysis failed: Unknown error')
    }
  }

  async generateHint(question: string, context?: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const systemPrompt = `You are a helpful AI tutor for middle school students preparing for the ISEE exam. 
    Provide a helpful hint that guides the student toward the answer without giving it away directly.
    Use age-appropriate language and be encouraging.`

    const userPrompt = `Question: ${question}
    ${context ? `Context: ${context}` : ''}
    
    Please provide a helpful hint that guides the student toward understanding the concept and finding the answer.`

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate hint at this time.'
    } catch (error) {
      console.error('OpenAI hint generation error:', error)
      throw new Error('Failed to generate hint')
    }
  }

  async explainConcept(concept: string, context?: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const systemPrompt = `You are an expert tutor explaining concepts to middle school students (grades 6-8).
    Provide clear, age-appropriate explanations with examples when helpful.
    Break down complex ideas into simpler parts.`

    const userPrompt = `Please explain this concept: ${concept}
    ${context ? `Context: ${context}` : ''}
    
    Provide a clear explanation suitable for a middle school student.`

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 300,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate explanation at this time.'
    } catch (error) {
      console.error('OpenAI explanation error:', error)
      throw new Error('Failed to generate explanation')
    }
  }

  async generateContextualResponse(
    systemPrompt: string, 
    userPrompt: string, 
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const { maxTokens = 300, temperature = 0.7 } = options

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate response at this time.'
    } catch (error) {
      console.error('OpenAI contextual response error:', error)
      throw new Error('Failed to generate contextual response')
    }
  }

  async generatePersonalizedHint(
    question: string, 
    userPerformance: any, 
    attemptCount: number = 1,
    subject: string = 'math'
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const systemPrompt = `You are an AI tutor for middle school students preparing for the ISEE exam.
    Provide personalized hints based on the student's performance and attempt history.
    Be encouraging and age-appropriate in your language.`

    const userPrompt = `Question: ${question}
    Student's performance level: ${userPerformance?.overallScore || 'Unknown'}%
    Subject: ${subject}
    Attempt number: ${attemptCount}
    Weak areas: ${userPerformance?.weakAreas?.join(', ') || 'None identified'}
    Strong areas: ${userPerformance?.strongAreas?.join(', ') || 'None identified'}
    
    Provide a helpful hint that considers their performance level and attempt count.
    ${attemptCount > 1 ? 'They have tried before, so be more specific.' : 'This is their first attempt.'}
    `

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      return completion.choices[0]?.message?.content || 'Unable to generate hint at this time.'
    } catch (error) {
      console.error('OpenAI personalized hint error:', error)
      throw new Error('Failed to generate personalized hint')
    }
  }

  async generateStepByStepExplanation(
    question: string, 
    correctAnswer: string, 
    userAnswer?: string,
    subject: string = 'math'
  ): Promise<{
    explanation: string
    steps: Array<{
      step: number
      title: string
      content: string
      formula?: string
    }>
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI service not configured')
    }

    const systemPrompt = `You are an expert tutor creating step-by-step explanations for middle school students.
    Break down the solution into clear, logical steps that build understanding.
    Use age-appropriate language and include formulas when relevant.`

    const userPrompt = `Question: ${question}
    Correct Answer: ${correctAnswer}
    ${userAnswer ? `Student's Answer: ${userAnswer}` : ''}
    Subject: ${subject}
    
    Provide a step-by-step explanation in the following JSON format:
    {
      "explanation": "Overall explanation of the concept and approach",
      "steps": [
        {
          "step": 1,
          "title": "Step title",
          "content": "Detailed explanation of this step",
          "formula": "Any relevant formula (optional)"
        }
      ]
    }
    
    ${userAnswer && userAnswer !== correctAnswer ? 
      'Also explain where the student went wrong and how to avoid similar mistakes.' : 
      'Focus on reinforcing the correct approach.'
    }`

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      try {
        return JSON.parse(response)
      } catch (parseError) {
        console.error('Failed to parse step-by-step explanation:', response)
        // Return a fallback structure
        return {
          explanation: response,
          steps: [{
            step: 1,
            title: "Solution",
            content: response
          }]
        }
      }
    } catch (error) {
      console.error('OpenAI step-by-step explanation error:', error)
      throw new Error('Failed to generate step-by-step explanation')
    }
  }

  isAvailable(): boolean {
    return this.isConfigured
  }
}

export const openaiService = new OpenAIService()