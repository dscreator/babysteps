import { useState, useEffect } from 'react'
import { MessageCircle, Calendar, Target, TrendingUp, Zap, Heart, Star, Trophy } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'

interface MotivationalMessage {
  id: string
  type: 'encouragement' | 'milestone' | 'reminder' | 'tip' | 'celebration' | 'challenge'
  title: string
  message: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  context: {
    examDaysRemaining?: number
    currentStreak?: number
    recentPerformance?: 'improving' | 'stable' | 'declining'
    weakSubject?: 'math' | 'english' | 'essay'
    strongSubject?: 'math' | 'english' | 'essay'
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
  }
  triggers: string[]
  displayUntil?: string
  isPersonalized: boolean
  actionable?: {
    text: string
    action: 'practice' | 'review' | 'goal' | 'break'
    subject?: 'math' | 'english' | 'essay'
  }
}

interface UserContext {
  examDate: string
  daysRemaining: number
  currentStreak: number
  recentAccuracy: number
  weakestSubject: 'math' | 'english' | 'essay'
  strongestSubject: 'math' | 'english' | 'essay'
  totalPracticeTime: number
  lastPracticeDate: string
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  performanceTrend: 'improving' | 'stable' | 'declining'
}

interface MotivationalMessagingProps {
  className?: string
  compact?: boolean
}

export function MotivationalMessaging({ className = '', compact = false }: MotivationalMessagingProps) {
  const [messages, setMessages] = useState<MotivationalMessage[]>([])
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([])

  useEffect(() => {
    fetchUserContext()
  }, [])

  useEffect(() => {
    if (userContext) {
      generateMessages()
    }
  }, [userContext])

  const fetchUserContext = async () => {
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockContext: UserContext = {
        examDate: '2024-03-15',
        daysRemaining: 45,
        currentStreak: 7,
        recentAccuracy: 78,
        weakestSubject: 'math',
        strongestSubject: 'english',
        totalPracticeTime: 1260, // minutes
        lastPracticeDate: '2024-01-30',
        timeOfDay: getTimeOfDay(),
        performanceTrend: 'improving'
      }
      
      setUserContext(mockContext)
    } catch (error) {
      console.error('Failed to fetch user context:', error)
    }
  }

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  const generateMessages = () => {
    if (!userContext) return

    const generatedMessages: MotivationalMessage[] = []

    // Exam countdown messages
    if (userContext.daysRemaining <= 60) {
      if (userContext.daysRemaining <= 7) {
        generatedMessages.push({
          id: 'exam-week',
          type: 'reminder',
          title: 'Final Week!',
          message: `Only ${userContext.daysRemaining} days until your ISEE exam. Focus on reviewing your strongest areas and stay confident!`,
          icon: '🎯',
          priority: 'high',
          context: { examDaysRemaining: userContext.daysRemaining },
          triggers: ['exam_countdown'],
          isPersonalized: true,
          actionable: {
            text: 'Review Practice',
            action: 'review'
          }
        })
      } else if (userContext.daysRemaining <= 30) {
        generatedMessages.push({
          id: 'exam-month',
          type: 'reminder',
          title: 'One Month to Go!',
          message: `${userContext.daysRemaining} days remaining. This is the perfect time to intensify your practice and address weak areas.`,
          icon: '📅',
          priority: 'medium',
          context: { examDaysRemaining: userContext.daysRemaining },
          triggers: ['exam_countdown'],
          isPersonalized: true,
          actionable: {
            text: 'Practice Weak Areas',
            action: 'practice',
            subject: userContext.weakestSubject
          }
        })
      }
    }

    // Streak messages
    if (userContext.currentStreak >= 7) {
      generatedMessages.push({
        id: 'streak-celebration',
        type: 'celebration',
        title: 'Amazing Streak!',
        message: `You've maintained a ${userContext.currentStreak}-day study streak! Your consistency is paying off. Keep it up!`,
        icon: '🔥',
        priority: 'medium',
        context: { currentStreak: userContext.currentStreak },
        triggers: ['streak_milestone'],
        isPersonalized: true
      })
    } else if (userContext.currentStreak === 0) {
      const daysSinceLastPractice = Math.floor((Date.now() - new Date(userContext.lastPracticeDate).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastPractice > 1) {
        generatedMessages.push({
          id: 'comeback-encouragement',
          type: 'encouragement',
          title: 'Ready for a Comeback?',
          message: `It's been ${daysSinceLastPractice} days since your last practice. Every expert was once a beginner - let's get back on track!`,
          icon: '💪',
          priority: 'high',
          context: {},
          triggers: ['missed_practice'],
          isPersonalized: true,
          actionable: {
            text: 'Start Practice',
            action: 'practice'
          }
        })
      }
    }

    // Performance-based messages
    if (userContext.performanceTrend === 'improving') {
      generatedMessages.push({
        id: 'improvement-celebration',
        type: 'celebration',
        title: 'You\'re Improving!',
        message: `Your recent performance shows great improvement! Your hard work is clearly paying off. Keep up the excellent progress!`,
        icon: '📈',
        priority: 'medium',
        context: { recentPerformance: 'improving' },
        triggers: ['performance_improvement'],
        isPersonalized: true
      })
    } else if (userContext.performanceTrend === 'declining') {
      generatedMessages.push({
        id: 'support-message',
        type: 'encouragement',
        title: 'Every Challenge is Growth',
        message: `Don't worry about recent dips in performance. Every challenge is an opportunity to grow stronger. You've got this!`,
        icon: '🌱',
        priority: 'medium',
        context: { recentPerformance: 'declining' },
        triggers: ['performance_decline'],
        isPersonalized: true,
        actionable: {
          text: 'Review Strategies',
          action: 'review'
        }
      })
    }

    // Subject-specific messages
    if (userContext.recentAccuracy < 70) {
      generatedMessages.push({
        id: 'accuracy-focus',
        type: 'tip',
        title: 'Focus on Quality',
        message: `Consider slowing down and focusing on accuracy over speed. Understanding concepts deeply will improve both accuracy and confidence.`,
        icon: '🎯',
        priority: 'medium',
        context: { weakSubject: userContext.weakestSubject },
        triggers: ['low_accuracy'],
        isPersonalized: true,
        actionable: {
          text: 'Practice Fundamentals',
          action: 'practice',
          subject: userContext.weakestSubject
        }
      })
    }

    // Time of day messages
    if (userContext.timeOfDay === 'morning') {
      generatedMessages.push({
        id: 'morning-motivation',
        type: 'encouragement',
        title: 'Great Morning Choice!',
        message: `Starting your day with practice is an excellent habit. Your brain is fresh and ready to absorb new concepts!`,
        icon: '🌅',
        priority: 'low',
        context: { timeOfDay: 'morning' },
        triggers: ['morning_practice'],
        isPersonalized: false
      })
    }

    // Milestone messages
    const totalHours = Math.floor(userContext.totalPracticeTime / 60)
    if (totalHours >= 50 && totalHours < 100) {
      generatedMessages.push({
        id: 'time-milestone',
        type: 'milestone',
        title: 'Halfway to 100 Hours!',
        message: `You've practiced for ${totalHours} hours total. You're building serious expertise - keep going!`,
        icon: '⏰',
        priority: 'medium',
        context: {},
        triggers: ['time_milestone'],
        isPersonalized: true
      })
    }

    // Challenge messages
    if (userContext.currentStreak >= 3 && userContext.performanceTrend === 'stable') {
      generatedMessages.push({
        id: 'challenge-push',
        type: 'challenge',
        title: 'Ready for a Challenge?',
        message: `You've been consistent! Try tackling some harder problems in ${userContext.weakestSubject} to push your limits.`,
        icon: '🚀',
        priority: 'low',
        context: { weakSubject: userContext.weakestSubject },
        triggers: ['challenge_ready'],
        isPersonalized: true,
        actionable: {
          text: 'Take Challenge',
          action: 'practice',
          subject: userContext.weakestSubject
        }
      })
    }

    // Filter out dismissed messages and sort by priority
    const filteredMessages = generatedMessages
      .filter(msg => !dismissedMessages.includes(msg.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    setMessages(compact ? filteredMessages.slice(0, 2) : filteredMessages.slice(0, 5))
  }

  const dismissMessage = (messageId: string) => {
    setDismissedMessages(prev => [...prev, messageId])
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  const handleAction = (action: MotivationalMessage['actionable']) => {
    if (!action) return
    
    // In a real implementation, this would navigate to the appropriate section
    console.log('Action triggered:', action)
    
    // For demo purposes, just show an alert
    switch (action.action) {
      case 'practice':
        alert(`Starting ${action.subject || 'general'} practice session!`)
        break
      case 'review':
        alert('Opening review materials!')
        break
      case 'goal':
        alert('Opening goal setting!')
        break
      case 'break':
        alert('Take a well-deserved break!')
        break
    }
  }

  const getMessageIcon = (type: MotivationalMessage['type']) => {
    switch (type) {
      case 'encouragement': return <Heart className="w-5 h-5 text-pink-600" />
      case 'milestone': return <Trophy className="w-5 h-5 text-yellow-600" />
      case 'reminder': return <Calendar className="w-5 h-5 text-blue-600" />
      case 'tip': return <Star className="w-5 h-5 text-purple-600" />
      case 'celebration': return <Zap className="w-5 h-5 text-green-600" />
      case 'challenge': return <Target className="w-5 h-5 text-red-600" />
      default: return <MessageCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getMessageColor = (type: MotivationalMessage['type']) => {
    switch (type) {
      case 'encouragement': return 'border-pink-200 bg-pink-50'
      case 'milestone': return 'border-yellow-200 bg-yellow-50'
      case 'reminder': return 'border-blue-200 bg-blue-50'
      case 'tip': return 'border-purple-200 bg-purple-50'
      case 'celebration': return 'border-green-200 bg-green-50'
      case 'challenge': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {!compact && (
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Motivational Messages</h3>
        </div>
      )}
      
      {messages.map((message) => (
        <Card key={message.id} className={`border ${getMessageColor(message.type)}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="text-2xl">{message.icon}</div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 mb-1">
                  {getMessageIcon(message.type)}
                  <h4 className="font-medium text-gray-900">{message.title}</h4>
                  {message.isPersonalized && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                      Personalized
                    </span>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dismissMessage(message.id)}
                  className="text-gray-400 hover:text-gray-600 border-none"
                >
                  ×
                </Button>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{message.message}</p>
              
              {message.actionable && (
                <Button
                  size="sm"
                  onClick={() => handleAction(message.actionable)}
                  className="text-xs"
                >
                  {message.actionable.text}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}