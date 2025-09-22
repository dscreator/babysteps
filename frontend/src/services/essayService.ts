import { apiService, isApiError } from './apiService'
import type { EssayPrompt, PracticeSessionRequest, PracticeSessionResponse } from '../types/api'

export interface EssayPromptFilters {
  type?: 'narrative' | 'expository' | 'persuasive'
  gradeLevel?: number
  limit?: number
  offset?: number
}

export interface EssaySubmissionPayload {
  content: string
  wordCount: number
  promptId: string
  timeSpentSeconds: number
  notes?: string
}

class EssayService {
  async getPrompts(filters: EssayPromptFilters = {}) {
    const queryParams = new URLSearchParams()

    if (filters.type) queryParams.append('type', filters.type)
    if (filters.gradeLevel) queryParams.append('gradeLevel', filters.gradeLevel.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())

    const search = queryParams.toString()
    const endpoint = search ? '/practice/essay/prompts?' + search : '/practice/essay/prompts'
    const response = await apiService.get<{ prompts: EssayPrompt[] }>(endpoint)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.prompts
  }

  async getPromptById(promptId: string) {
    const response = await apiService.get<{ prompt: EssayPrompt }>('/practice/essay/prompts/' + promptId)

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.prompt
  }

  async createEssaySession(options: { promptId: string; gradeLevel?: number; type?: string; timeLimit?: number }) {
    const sessionRequest: PracticeSessionRequest = {
      subject: 'essay',
      topics: options.type ? [options.type] : undefined,
      difficulty: options.gradeLevel,
      timeLimit: options.timeLimit ?? 30,
    }

    const response = await apiService.post<{ session: PracticeSessionResponse }>(
      '/practice/sessions',
      sessionRequest
    )

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }

  async submitEssay(sessionId: string, payload: EssaySubmissionPayload) {
    const response = await apiService.post<{ session: PracticeSessionResponse }>(
      '/practice/sessions/' + sessionId + '/end',
      {
        questionsAttempted: 1,
        questionsCorrect: 0,
        sessionData: {
          essay: {
            content: payload.content,
            wordCount: payload.wordCount,
            promptId: payload.promptId,
            timeSpentSeconds: payload.timeSpentSeconds,
            notes: payload.notes,
            submittedAt: new Date().toISOString(),
          },
        },
      }
    )

    if (isApiError(response)) {
      throw new Error(response.error.message)
    }

    return response.data.session
  }
}

export const essayService = new EssayService()
