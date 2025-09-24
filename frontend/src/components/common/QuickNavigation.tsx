import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface QuickNavItem {
  label: string
  path: string
  icon: string
  description: string
  variant?: 'primary' | 'secondary'
}

interface QuickNavigationProps {
  title?: string
  items: QuickNavItem[]
  className?: string
}

export function QuickNavigation({ title = "Quick Navigation", items, className = '' }: QuickNavigationProps) {
  const location = useLocation()

  // Filter out current page from navigation
  const filteredItems = items.filter(item => item.path !== location.pathname)

  if (filteredItems.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="grid gap-3">
        {filteredItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-primary-600">
                  {item.label}
                </div>
                <div className="text-sm text-gray-600">
                  {item.description}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// Predefined navigation sets for different contexts
export const practiceModuleNavigation: QuickNavItem[] = [
  {
    label: 'Math Practice',
    path: '/practice/math',
    icon: '🔢',
    description: 'Arithmetic, algebra, geometry, and data analysis'
  },
  {
    label: 'English Practice',
    path: '/practice/english',
    icon: '📚',
    description: 'Reading comprehension and language skills'
  },
  {
    label: 'Vocabulary Practice',
    path: '/practice/vocabulary',
    icon: '📝',
    description: 'Build vocabulary with spaced repetition'
  },
  {
    label: 'Essay Practice',
    path: '/practice/essay',
    icon: '✍️',
    description: 'Writing skills and AI-powered feedback'
  }
]

export const englishModuleNavigation: QuickNavItem[] = [
  {
    label: 'Reading Comprehension',
    path: '/practice/english',
    icon: '📚',
    description: 'Practice with passages and questions'
  },
  {
    label: 'Vocabulary Builder',
    path: '/practice/vocabulary',
    icon: '📝',
    description: 'Flashcards and spaced repetition'
  },
  {
    label: 'English Progress',
    path: '/progress/english',
    icon: '📊',
    description: 'Detailed performance analytics'
  }
]

export const progressNavigation: QuickNavItem[] = [
  {
    label: 'Overall Progress',
    path: '/progress',
    icon: '📈',
    description: 'Complete performance overview'
  },
  {
    label: 'English Progress',
    path: '/progress/english',
    icon: '📊',
    description: 'Reading and vocabulary analytics'
  },
  {
    label: 'AI Tutor',
    path: '/tutor',
    icon: '🤖',
    description: 'Get personalized help and guidance'
  }
]