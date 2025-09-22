import React, { useState } from 'react'
import { TutorChat } from '../components/tutor/TutorChat'
import { ConversationList } from '../components/tutor/ConversationList'

export const TutorPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const [currentSubject, setCurrentSubject] = useState<'math' | 'english' | 'essay' | 'general'>('general')

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  const handleNewConversation = (subject: 'math' | 'english' | 'essay' | 'general') => {
    setCurrentSubject(subject)
    setSelectedConversationId(undefined) // This will create a new conversation
  }

  const handleConversationChange = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Tutor</h1>
          <p className="mt-2 text-gray-600">
            Get personalized help with your ISEE preparation. Ask questions, get explanations, 
            and receive guidance tailored to your learning needs.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              className="h-full"
            />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <TutorChat
              subject={currentSubject}
              conversationId={selectedConversationId}
              onConversationChange={handleConversationChange}
              className="h-full"
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to use the AI Tutor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🔢</div>
              <h3 className="font-medium text-gray-900 mb-1">Math Help</h3>
              <p className="text-sm text-gray-600">
                Get step-by-step solutions and explanations for algebra, geometry, and arithmetic problems.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-medium text-gray-900 mb-1">English Support</h3>
              <p className="text-sm text-gray-600">
                Improve reading comprehension, vocabulary, and verbal reasoning skills.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-medium text-gray-900 mb-1">Essay Guidance</h3>
              <p className="text-sm text-gray-600">
                Learn essay structure, get writing tips, and improve your composition skills.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎓</div>
              <h3 className="font-medium text-gray-900 mb-1">Study Planning</h3>
              <p className="text-sm text-gray-600">
                Get personalized study strategies and test preparation advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}