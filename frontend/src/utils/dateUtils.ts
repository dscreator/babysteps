/**
 * Calculate days remaining until exam date
 */
export function calculateDaysUntilExam(examDate: string | Date): number {
  const exam = new Date(examDate)
  const today = new Date()
  
  // Reset time to start of day for accurate day calculation
  exam.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = exam.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays) // Don't return negative days
}

/**
 * Calculate hours remaining until exam date
 */
export function calculateHoursUntilExam(examDate: string | Date): number {
  const exam = new Date(examDate)
  const now = new Date()
  
  const diffTime = exam.getTime() - now.getTime()
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  
  return Math.max(0, diffHours) // Don't return negative hours
}

/**
 * Check if exam date is urgent (less than 2 weeks away)
 */
export function isExamUrgent(examDate: string | Date): boolean {
  const daysRemaining = calculateDaysUntilExam(examDate)
  return daysRemaining <= 14 && daysRemaining > 0
}

/**
 * Format exam countdown display
 */
export function formatExamCountdown(examDate: string | Date): {
  daysRemaining: number
  hoursRemaining: number
  isUrgent: boolean
  displayText: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
} {
  const daysRemaining = calculateDaysUntilExam(examDate)
  const hoursRemaining = calculateHoursUntilExam(examDate)
  const isUrgent = isExamUrgent(examDate)
  
  let displayText: string
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  
  if (daysRemaining === 0) {
    displayText = 'Exam is today!'
    urgencyLevel = 'critical'
  } else if (daysRemaining === 1) {
    displayText = 'Exam is tomorrow!'
    urgencyLevel = 'critical'
  } else if (daysRemaining <= 3) {
    displayText = `${daysRemaining} days until exam`
    urgencyLevel = 'critical'
  } else if (daysRemaining <= 7) {
    displayText = `${daysRemaining} days until exam`
    urgencyLevel = 'high'
  } else if (daysRemaining <= 14) {
    displayText = `${daysRemaining} days until exam`
    urgencyLevel = 'medium'
  } else {
    displayText = `${daysRemaining} days until exam`
    urgencyLevel = 'low'
  }
  
  return {
    daysRemaining,
    hoursRemaining,
    isUrgent,
    displayText,
    urgencyLevel
  }
}

/**
 * Format practice time in minutes to human readable format
 */
export function formatPracticeTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Get motivational message based on exam timeline and progress
 */
export function getMotivationalMessage(
  daysRemaining: number,
  overallProgress: number,
  streakDays: number
): string {
  const messages = {
    critical: [
      "Final push! You've got this! 🚀",
      "Almost there - stay focused! 💪",
      "Exam time is here - you're ready! ⭐",
    ],
    high: [
      "One week to go - time to shine! ✨",
      "Final week prep - you're doing great! 🎯",
      "Almost exam time - keep pushing! 🔥",
    ],
    medium: [
      "Two weeks left - perfect timing! 📚",
      "Great progress - keep it up! 🌟",
      "You're on track - stay consistent! 💯",
    ],
    low: [
      "Plenty of time to prepare well! 📖",
      "Building strong foundations! 🏗️",
      "Consistent practice pays off! 📈",
    ],
  }
  
  let category: keyof typeof messages
  if (daysRemaining <= 3) category = 'critical'
  else if (daysRemaining <= 7) category = 'high'
  else if (daysRemaining <= 14) category = 'medium'
  else category = 'low'
  
  // Add streak bonus messages
  if (streakDays >= 7) {
    const streakMessages = [
      `Amazing ${streakDays}-day streak! 🔥`,
      `${streakDays} days strong - incredible! ⚡`,
      `Unstoppable ${streakDays}-day streak! 🚀`,
    ]
    return streakMessages[Math.floor(Math.random() * streakMessages.length)]
  }
  
  const categoryMessages = messages[category]
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)]
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(date)
}