import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'

interface QuickActionProps {
  title: string
  description: string
  icon: string
  path: string
  color: string
  estimatedTime?: string
}

function QuickActionCard({ title, description, icon, path, color, estimatedTime }: QuickActionProps) {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-300 hover:bg-green-50',
    purple: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
    orange: 'border-orange-200 hover:border-orange-300 hover:bg-orange-50',
  }

  return (
    <Link to={path} className="block h-full">
      <Card className={`h-full transition-all duration-200 cursor-pointer ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          {estimatedTime && (
            <div className="text-xs text-gray-500 mb-3">
              ⏱️ ~{estimatedTime}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full">
            Start Practice
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const practiceModules = [
    {
      title: 'Math Practice',
      description: 'Arithmetic, algebra, geometry, and data analysis problems',
      icon: '🔢',
      path: '/practice/math',
      color: 'blue',
      estimatedTime: '15-30 min',
    },
    {
      title: 'English Practice',
      description: 'Reading comprehension and vocabulary building',
      icon: '📚',
      path: '/practice/english',
      color: 'green',
      estimatedTime: '20-25 min',
    },
    {
      title: 'Essay Practice',
      description: 'Writing prompts with AI-powered feedback',
      icon: '✍️',
      path: '/practice/essay',
      color: 'purple',
      estimatedTime: '30-45 min',
    },
  ]

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quick Practice
        </h2>
        <p className="text-sm text-gray-600">
          Jump into practice sessions to improve your ISEE skills
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {practiceModules.map((module) => (
          <QuickActionCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            path={module.path}
            color={module.color}
            estimatedTime={module.estimatedTime}
          />
        ))}
      </div>
      
      {/* Additional Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/progress" className="block">
          <Card className="transition-all duration-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-2xl">📈</div>
              <div>
                <h3 className="font-medium text-gray-900">View Detailed Progress</h3>
                <p className="text-sm text-gray-600">See your performance trends and analytics</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="transition-all duration-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="font-medium text-gray-900">AI Tutor Chat</h3>
              <p className="text-sm text-gray-600">Get help with specific questions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}