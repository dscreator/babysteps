import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tutorService, Conversation } from '../../services/tutorService'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ConversationListProps {
  selectedConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: (subject: 'math' | 'english' | 'essay' | 'general') => void
  className?: string
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  className = ''
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const queryClient = useQueryClient()

  // Get conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => tutorService.getConversations(20)
  })

  // Update conversation title mutation
  const updateTitleMutation = useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      tutorService.updateConversationTitle(conversationId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setEditingId(null)
      setEditTitle('')
    }
  })

  // Deactivate conversation mutation
  const deactivateMutation = useMutation({
    mutationFn: (conversationId: string) => tutorService.deactivateConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title || '')
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateTitleMutation.mutate({
        conversationId: editingId,
        title: editTitle.trim()
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'math': return 'bg-blue-100 text-blue-800'
      case 'english': return 'bg-green-100 text-green-800'
      case 'essay': return 'bg-purple-100 text-purple-800'
      case 'general': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return 'No messages yet'
    
    const content = lastMessage.content
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content
    return `${lastMessage.role === 'user' ? 'You: ' : 'Tutor: '}${preview}`
  }

  if (isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">AI Tutor Chats</h3>
          <div className="relative">
            <select
              onChange={(e) => {
                const subject = e.target.value as 'math' | 'english' | 'essay' | 'general'
                if (subject) {
                  onNewConversation(subject)
                  e.target.value = '' // Reset select
                }
              }}
              className="appearance-none bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
              defaultValue=""
            >
              <option value="" disabled>+ New Chat</option>
              <option value="math">🔢 Math</option>
              <option value="english">📚 English</option>
              <option value="essay">✍️ Essay</option>
              <option value="general">🎓 General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="max-h-96 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h4>
            <p className="text-gray-600 mb-4">
              Start a new chat with your AI tutor to get help with your ISEE preparation.
            </p>
            <Button
              onClick={() => onNewConversation('general')}
              className="mx-auto"
            >
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                }`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getSubjectEmoji(conversation.subject)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(conversation.subject)}`}>
                        {conversation.subject}
                      </span>
                    </div>
                    
                    {editingId === conversation.id ? (
                      <div className="mb-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyPress={handleKeyPress}
                          onBlur={handleSaveEdit}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h4 className="font-medium text-gray-900 truncate mb-1">
                        {conversation.title}
                      </h4>
                    )}
                    
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {getLastMessage(conversation)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {conversation.messages.length} messages
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(conversation)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit title"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this conversation?')) {
                          deactivateMutation.mutate(conversation.id)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete conversation"
                      disabled={deactivateMutation.isPending}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}