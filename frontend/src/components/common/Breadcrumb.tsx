import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const location = useLocation()
  
  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/', icon: <Home className="w-4 h-4" /> }
    ]

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Map path segments to readable labels
      const labelMap: Record<string, string> = {
        'practice': 'Practice',
        'math': 'Math',
        'english': 'English',
        'vocabulary': 'Vocabulary',
        'essay': 'Essay',
        'progress': 'Progress',
        'tutor': 'AI Tutor'
      }

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Don't add link for the current page (last item)
      const isCurrentPage = index === pathSegments.length - 1
      
      breadcrumbs.push({
        label,
        path: isCurrentPage ? undefined : currentPath
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = items || generateBreadcrumbs()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 mb-6 ${className}`}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          {item.path ? (
            <Link
              to={item.path}
              className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="flex items-center space-x-1 text-gray-900 font-medium">
              {item.icon}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}