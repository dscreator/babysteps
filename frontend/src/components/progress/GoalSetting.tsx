import { useState, useEffect } from 'react'
import { Target, Clock, Calendar, TrendingUp, Save, Plus, X, Edit2 } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface Goal {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'exam'
  category: 'time' | 'accuracy' | 'sessions' | 'topics' | 'custom'
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline?: string
  priority: 'high' | 'medium' | 'low'
  subject?: 'math' | 'english' | 'essay' | 'all'
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  completedAt?: string
}

interface GoalTemplate {
  type: 'daily' | 'weekly' | 'monthly' | 'exam'
  category: 'time' | 'accuracy' | 'sessions' | 'topics' | 'custom'
  title: string
  description: string
  defaultTarget: number
  unit: string
  subject?: 'math' | 'english' | 'essay' | 'all'
}

interface GoalSettingProps {
  className?: string
}

export function GoalSetting({ className = '' }: GoalSettingProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)

  const goalTemplates: GoalTemplate[] = [
    {
      type: 'daily',
      category: 'time',
      title: 'Daily Study Time',
      description: 'Practice for a specific amount of time each day',
      defaultTarget: 30,
      unit: 'minutes',
      subject: 'all'
    },
    {
      type: 'daily',
      category: 'sessions',
      title: 'Daily Practice Sessions',
      description: 'Complete a certain number of practice sessions daily',
      defaultTarget: 2,
      unit: 'sessions',
      subject: 'all'
    },
    {
      type: 'weekly',
      category: 'accuracy',
      title: 'Weekly Accuracy Goal',
      description: 'Achieve a target accuracy percentage for the week',
      defaultTarget: 80,
      unit: '%',
      subject: 'all'
    },
    {
      type: 'weekly',
      category: 'topics',
      title: 'Weekly Topic Mastery',
      description: 'Master a specific number of topics each week',
      defaultTarget: 3,
      unit: 'topics',
      subject: 'math'
    },
    {
      type: 'monthly',
      category: 'sessions',
      title: 'Monthly Practice Goal',
      description: 'Complete a target number of practice sessions per month',
      defaultTarget: 60,
      unit: 'sessions',
      subject: 'all'
    },
    {
      type: 'exam',
      category: 'accuracy',
      title: 'Exam Readiness Target',
      description: 'Achieve target accuracy before exam date',
      defaultTarget: 85,
      unit: '%',
      subject: 'all'
    }
  ]

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      // Mock data - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockGoals: Goal[] = [
        {
          id: '1',
          type: 'daily',
          category: 'time',
          title: 'Daily Study Time',
          description: 'Practice for 30 minutes each day',
          target: 30,
          current: 25,
          unit: 'minutes',
          priority: 'high',
          subject: 'all',
          status: 'active',
          createdAt: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          type: 'weekly',
          category: 'accuracy',
          title: 'Math Accuracy Goal',
          description: 'Achieve 80% accuracy in math practice',
          target: 80,
          current: 75,
          unit: '%',
          deadline: '2024-02-04T23:59:59Z',
          priority: 'medium',
          subject: 'math',
          status: 'active',
          createdAt: '2024-01-28T00:00:00Z'
        },
        {
          id: '3',
          type: 'monthly',
          category: 'sessions',
          title: 'Monthly Practice Sessions',
          description: 'Complete 60 practice sessions this month',
          target: 60,
          current: 45,
          unit: 'sessions',
          deadline: '2024-02-29T23:59:59Z',
          priority: 'medium',
          subject: 'all',
          status: 'active',
          createdAt: '2024-02-01T00:00:00Z'
        },
        {
          id: '4',
          type: 'weekly',
          category: 'topics',
          title: 'Geometry Mastery',
          description: 'Master 3 geometry topics this week',
          target: 3,
          current: 3,
          unit: 'topics',
          deadline: '2024-02-04T23:59:59Z',
          priority: 'high',
          subject: 'math',
          status: 'completed',
          createdAt: '2024-01-28T00:00:00Z',
          completedAt: '2024-02-03T15:30:00Z'
        }
      ]
      
      setGoals(mockGoals)
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData: Partial<Goal>) => {
    try {
      const newGoal: Goal = {
        id: Date.now().toString(),
        type: goalData.type || 'daily',
        category: goalData.category || 'time',
        title: goalData.title || '',
        description: goalData.description || '',
        target: goalData.target || 0,
        current: 0,
        unit: goalData.unit || '',
        deadline: goalData.deadline,
        priority: goalData.priority || 'medium',
        subject: goalData.subject || 'all',
        status: 'active',
        createdAt: new Date().toISOString()
      }
      
      setGoals(prev => [...prev, newGoal])
      setShowCreateModal(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      ))
      setEditingGoal(null)
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      setGoals(prev => prev.filter(goal => goal.id !== goalId))
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(100, Math.round((goal.current / goal.target) * 100))
  }

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'time': return <Clock className="w-5 h-5" />
      case 'accuracy': return <Target className="w-5 h-5" />
      case 'sessions': return <Calendar className="w-5 h-5" />
      case 'topics': return <TrendingUp className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goal Setting</h2>
          <p className="text-gray-600">Set and track your study goals to stay motivated</p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Active Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.filter(goal => goal.status === 'active').map((goal) => (
          <Card key={goal.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(goal.category)}
                <h3 className="font-semibold text-gray-900">{goal.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(goal.priority)}`}>
                  {goal.priority}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingGoal(goal)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {goal.current} / {goal.target} {goal.unit}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(goal)}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{getProgressPercentage(goal)}% complete</span>
                {goal.deadline && (
                  <span className="text-gray-600">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            {goal.subject && goal.subject !== 'all' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-600 capitalize">Subject: {goal.subject}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Completed Goals */}
      {goals.filter(goal => goal.status === 'completed').length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.filter(goal => goal.status === 'completed').map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(goal.category)}
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status)}`}>
                    Completed
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Achieved</span>
                    <span className="text-sm font-medium text-green-600">
                      {goal.target} {goal.unit}
                    </span>
                  </div>
                  
                  {goal.completedAt && (
                    <div className="text-xs text-gray-600">
                      Completed: {new Date(goal.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Goal</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedTemplate(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {!selectedTemplate ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Choose a Goal Template</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goalTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTemplate(template)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {getCategoryIcon(template.category)}
                        <h5 className="font-medium text-gray-900">{template.title}</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">{template.type}</span>
                        <span>{template.defaultTarget} {template.unit}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <GoalForm
                template={selectedTemplate}
                onSave={createGoal}
                onCancel={() => {
                  setShowCreateModal(false)
                  setSelectedTemplate(null)
                }}
              />
            )}
          </Card>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Goal</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingGoal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <GoalForm
              goal={editingGoal}
              onSave={(updates) => updateGoal(editingGoal.id, updates)}
              onCancel={() => setEditingGoal(null)}
              onDelete={() => {
                deleteGoal(editingGoal.id)
                setEditingGoal(null)
              }}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

interface GoalFormProps {
  template?: GoalTemplate
  goal?: Goal
  onSave: (goalData: Partial<Goal>) => void
  onCancel: () => void
  onDelete?: () => void
}

function GoalForm({ template, goal, onSave, onCancel, onDelete }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || template?.title || '',
    description: goal?.description || template?.description || '',
    type: goal?.type || template?.type || 'daily',
    category: goal?.category || template?.category || 'time',
    target: goal?.target || template?.defaultTarget || 0,
    unit: goal?.unit || template?.unit || '',
    priority: goal?.priority || 'medium',
    subject: goal?.subject || template?.subject || 'all',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Goal Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target
          </label>
          <input
            type="number"
            value={formData.target}
            onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Goal['type'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="exam">Exam</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value as Goal['subject'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Subjects</option>
            <option value="math">Math</option>
            <option value="english">English</option>
            <option value="essay">Essay</option>
          </select>
        </div>
      </div>

      {(formData.type === 'weekly' || formData.type === 'monthly' || formData.type === 'exam') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline (Optional)
          </label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete Goal
            </Button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {goal ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </div>
    </form>
  )
}