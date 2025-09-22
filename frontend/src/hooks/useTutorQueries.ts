import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  tutorService, 
  ChatRequest, 
  HintRequest, 
  ExplanationRequest 
} from '../services/tutorService'

// Chat queries
export const useConversations = (limit: number = 20) => {
  return useQuery({
    queryKey: ['conversations', limit],
    queryFn: () => tutorService.getConversations(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useConversation = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationId ? tutorService.getConversation(conversationId) : null,
    enabled: !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Chat mutations
export const useSendMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ChatRequest) => tutorService.sendChatMessage(request),
    onSuccess: (response) => {
      // Update conversation in cache
      queryClient.invalidateQueries({ queryKey: ['conversation', response.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export const useUpdateConversationTitle = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      tutorService.updateConversationTitle(conversationId, title),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export const useDeactivateConversation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (conversationId: string) => tutorService.deactivateConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Tutor assistance queries
export const useTutorStatus = () => {
  return useQuery({
    queryKey: ['tutor', 'status'],
    queryFn: () => tutorService.getStatus(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useRecommendations = (subject: 'math' | 'english' | 'essay') => {
  return useQuery({
    queryKey: ['tutor', 'recommendations', subject],
    queryFn: () => tutorService.getRecommendations(subject),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAnalytics = (subject: 'math' | 'english' | 'essay') => {
  return useQuery({
    queryKey: ['tutor', 'analytics', subject],
    queryFn: () => tutorService.getAnalytics(subject),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useInsights = (subject: 'math' | 'english' | 'essay') => {
  return useQuery({
    queryKey: ['tutor', 'insights', subject],
    queryFn: () => tutorService.getInsights(subject),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContentRecommendations = (subject: 'math' | 'english' | 'essay') => {
  return useQuery({
    queryKey: ['tutor', 'content-recommendations', subject],
    queryFn: () => tutorService.getContentRecommendations(subject),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Tutor assistance mutations
export const useGetHint = () => {
  return useMutation({
    mutationFn: (request: HintRequest) => tutorService.getHint(request),
  })
}

export const useGetExplanation = () => {
  return useMutation({
    mutationFn: (request: ExplanationRequest) => tutorService.getExplanation(request),
  })
}

export const useGetContextualHelp = () => {
  return useMutation({
    mutationFn: ({
      subject,
      helpType,
      currentProblemId
    }: {
      subject: 'math' | 'english' | 'essay'
      helpType: 'stuck' | 'confused' | 'encouragement'
      currentProblemId?: string
    }) => tutorService.getContextualHelp(subject, helpType, currentProblemId),
  })
}

export const useAdjustDifficulty = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      subject,
      currentDifficulty
    }: {
      subject: 'math' | 'english' | 'essay'
      currentDifficulty: number
    }) => tutorService.adjustDifficulty(subject, currentDifficulty),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tutor', 'recommendations', variables.subject] })
      queryClient.invalidateQueries({ queryKey: ['tutor', 'analytics', variables.subject] })
    },
  })
}

export const useProvideFeedback = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      subject,
      feedbackType,
      context
    }: {
      subject: 'math' | 'english' | 'essay'
      feedbackType: 'helpful' | 'not_helpful' | 'too_easy' | 'too_hard'
      context?: Record<string, any>
    }) => tutorService.provideFeedback(subject, feedbackType, context),
    onSuccess: (_, variables) => {
      // Invalidate personalization-related queries
      queryClient.invalidateQueries({ queryKey: ['tutor', 'recommendations', variables.subject] })
      queryClient.invalidateQueries({ queryKey: ['tutor', 'insights', variables.subject] })
    },
  })
}

export const useAdaptContent = () => {
  return useMutation({
    mutationFn: ({
      content,
      contentType
    }: {
      content: Record<string, any>
      contentType: 'problem' | 'explanation' | 'hint' | 'feedback'
    }) => tutorService.adaptContent(content, contentType),
  })
}