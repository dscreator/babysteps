import React, { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tutorService, ChatMessage, Conversation, ChatRequest } from '../../services/tutorService'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface TutorChatProps {
  subject: 'math' | 'english' | 'essay' | 'general'
  conversationId?: string
  context?: Record<string, any>
  onConversationChange?: (conversationId: string) => void
  className?: string
}

export const TutorChat: React.FC<TutorChatProps> = ({
  subject,
  conversationId,
  context,
  onConversationChange,
  className = ''
}) => {
  const [message, setMessage] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  // Get conversation data
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationId ? tutorService.getConversation(conversationId) : null,
    enabled: !!conversationId
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (request: ChatRequest) => tutorService.sendChatMessage(request),
    onSuccess: (response) => {
      setMessage('')
      setSuggestions(response.suggestions || [])
      
      // Update conversation in cache
      if (response.isNewConversation && onConversationChange) {
        onConversationChange(response.conversationId)
      }
      
      // Invalidate and refetch conversation
      queryClient.invalidateQueries({ queryKey: ['conversation', response.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: any) => {
      console.error('Error sending message:', error)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return

    const request: ChatRequest = {
      conversationId,
      message: message.trim(),
      subject,
      context
    }

    sendMessageMutation.mutate(request)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    textareaRef.current?.focus()
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSubjectEmoji = (subject: string) => {
    switch (subject) {
      case 'math': return '🔢'
      case 'english': return '📚'
      case 'essay': return '✍️'
      case 'general': return '🎓'
      default: return '💬'
    }
  }

  const messages = conversation?.messages || []

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getSubjectEmoji(subject)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {conversation?.title || `${subject.charAt(0).toUpperCase() + subject.slice(1)} Tutor`}
            </h3>
            <p className="text-sm text-gray-500">Ask me anything about your ISEE prep!</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoadingConversation ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👋</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Hi there! I'm your AI tutor
            </h4>
            <p className="text-gray-600 mb-4">
              I'm here to help you prepare for the ISEE exam. Ask me questions about {subject === 'general' ? 'any subject' : subject}, 
              get explanations, or just chat about your study goals!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "How should I study for the ISEE?",
                "I'm stuck on a problem",
                "Can you explain this concept?",
                "What should I practice next?"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 py-1 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        {sendMessageMutation.isError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {sendMessageMutation.error?.message || 'Failed to send message. Please try again.'}
          </div>
        )}
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your ISEE prep..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-32"
              rows={1}
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="px-4 py-2 self-end"
          >
            {sendMessageMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}