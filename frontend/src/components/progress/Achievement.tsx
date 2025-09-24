import { useState, useEffect } from 'react'
import { Award, Star, Trophy, Medal, Crown, Zap, Target, Calendar, TrendingUp } from 'lucide-react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface Achievement {
  id: string
  title: string
  description: string
  category: 'streak' | 'accuracy' | 'time' | 'sessions' | 'improvement' | 'milestone' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  icon: string
  points: number
  requirement: {
    type: 'streak' | 'accuracy' | 'time' | 'sessions' | 'improvement' | 'custom'
    target: number
    subject?: 'math' | 'english' | 'essay' | 'all'
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time'
  }
  progress: {
    current: number
    target: number
    percentage: number
  }
  unlockedAt?: string
  isUnlocked: boolean
  isNew: boolean
}

interface MilestoneEvent {
  id: string
  type: 'achievement_unlocked' | 'goal_completed' | 'streak_milestone' | 'accuracy_milestone'
  title: string
  description: string
  timestamp: string
  points?: number
  celebrationLevel: 'small' | 'medium' | 'large'
}

interface AchievementProps {
  className?: string
}

export function Achievement({ className = '' }: AchievementProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCelebration, setShowCelebration] = useState<MilestoneEvent | null>(null)

  const categories = [
    { key: 'all', name: 'All', icon: Award },
    { key: 'streak', name: 'Streaks', icon: Calendar },
    { key: 'accuracy', name: 'Accuracy', icon: Target },
    { key: 'time', name: 'Time', icon: TrendingUp },
    { key: 'sessions', name: 'Sessions', icon: Zap },
    { key: 'improvement', name: 'Improvement', icon: TrendingUp },
    { key: 'milestone', name: 'Milestones', icon: Trophy },
    { key: 'special', name: 'Special', icon: Crown }
  ]

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    setLoading(true)
    try {
      // Mock data - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first practice session',
          category: 'sessions',
          tier: 'bronze',
          icon: '🎯',
          points: 10,
          requirement: {
            type: 'sessions',
            target: 1,
            subject: 'all'
          },
          progress: {
            current: 1,
            target: 1,
            percentage: 100
          },
          unlockedAt: '2024-01-15T10:30:00Z',
          isUnlocked: true,
          isNew: false
        },
        {
          id: '2',
          title: 'Week Warrior',
          description: 'Maintain a 7-day study streak',
          category: 'streak',
          tier: 'silver',
          icon: '🔥',
          points: 50,
          requirement: {
            type: 'streak',
            target: 7,
            subject: 'all'
          },
          progress: {
            current: 7,
            target: 7,
            percentage: 100
          },
          unlockedAt: '2024-01-22T18:45:00Z',
          isUnlocked: true,
          isNew: false
        },
        {
          id: '3',
          title: 'Math Master',
          description: 'Achieve 90% accuracy in math practice',
          category: 'accuracy',
          tier: 'gold',
          icon: '🧮',
          points: 100,
          requirement: {
            type: 'accuracy',
            target: 90,
            subject: 'math',
            timeframe: 'weekly'
          },
          progress: {
            current: 85,
            target: 90,
            percentage: 94
          },
          isUnlocked: false,
          isNew: false
        },
        {
          id: '4',
          title: 'Time Champion',
          description: 'Practice for 100 hours total',
          category: 'time',
          tier: 'platinum',
          icon: '⏰',
          points: 200,
          requirement: {
            type: 'time',
            target: 6000, // 100 hours in minutes
            subject: 'all',
            timeframe: 'all-time'
          },
          progress: {
            current: 4500,
            target: 6000,
            percentage: 75
          },
          isUnlocked: false,
          isNew: false
        },
        {
          id: '5',
          title: 'Consistency King',
          description: 'Complete practice sessions for 30 consecutive days',
          category: 'streak',
          tier: 'diamond',
          icon: '👑',
          points: 500,
          requirement: {
            type: 'streak',
            target: 30,
            subject: 'all'
          },
          progress: {
            current: 12,
            target: 30,
            percentage: 40
          },
          isUnlocked: false,
          isNew: false
        },
        {
          id: '6',
          title: 'Essay Expert',
          description: 'Write 10 essays with AI feedback',
          category: 'sessions',
          tier: 'gold',
          icon: '✍️',
          points: 150,
          requirement: {
            type: 'sessions',
            target: 10,
            subject: 'essay'
          },
          progress: {
            current: 7,
            target: 10,
            percentage: 70
          },
          isUnlocked: false,
          isNew: false
        },
        {
          id: '7',
          title: 'Rapid Improver',
          description: 'Improve overall accuracy by 15% in one month',
          category: 'improvement',
          tier: 'silver',
          icon: '📈',
          points: 75,
          requirement: {
            type: 'improvement',
            target: 15,
            subject: 'all',
            timeframe: 'monthly'
          },
          progress: {
            current: 12,
            target: 15,
            percentage: 80
          },
          isUnlocked: false,
          isNew: false
        },
        {
          id: '8',
          title: 'Early Bird',
          description: 'Complete a practice session before 8 AM',
          category: 'special',
          tier: 'bronze',
          icon: '🌅',
          points: 25,
          requirement: {
            type: 'custom',
            target: 1,
            subject: 'all'
          },
          progress: {
            current: 1,
            target: 1,
            percentage: 100
          },
          unlockedAt: '2024-01-20T07:30:00Z',
          isUnlocked: true,
          isNew: true
        }
      ]
      
      const mockMilestones: MilestoneEvent[] = [
        {
          id: '1',
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked: Early Bird!',
          description: 'You completed a practice session before 8 AM',
          timestamp: '2024-01-20T07:30:00Z',
          points: 25,
          celebrationLevel: 'medium'
        },
        {
          id: '2',
          type: 'streak_milestone',
          title: '7-Day Streak Achieved!',
          description: 'You\'ve maintained a perfect study streak for a week',
          timestamp: '2024-01-22T18:45:00Z',
          points: 50,
          celebrationLevel: 'large'
        },
        {
          id: '3',
          type: 'accuracy_milestone',
          title: 'Math Accuracy Milestone',
          description: 'You achieved 85% accuracy in math practice',
          timestamp: '2024-01-25T16:20:00Z',
          celebrationLevel: 'small'
        }
      ]
      
      setAchievements(mockAchievements)
      setMilestones(mockMilestones)
      
      // Show celebration for new achievements
      const newAchievement = mockAchievements.find(a => a.isNew && a.isUnlocked)
      if (newAchievement) {
        const celebrationEvent: MilestoneEvent = {
          id: newAchievement.id,
          type: 'achievement_unlocked',
          title: `Achievement Unlocked: ${newAchievement.title}!`,
          description: newAchievement.description,
          timestamp: newAchievement.unlockedAt || new Date().toISOString(),
          points: newAchievement.points,
          celebrationLevel: getTierCelebrationLevel(newAchievement.tier)
        }
        setTimeout(() => setShowCelebration(celebrationEvent), 1000)
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierCelebrationLevel = (tier: Achievement['tier']): MilestoneEvent['celebrationLevel'] => {
    switch (tier) {
      case 'diamond':
      case 'platinum': return 'large'
      case 'gold':
      case 'silver': return 'medium'
      case 'bronze': return 'small'
      default: return 'small'
    }
  }

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-100'
      case 'silver': return 'text-gray-600 bg-gray-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'platinum': return 'text-purple-600 bg-purple-100'
      case 'diamond': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTierIcon = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return <Medal className="w-4 h-4" />
      case 'silver': return <Medal className="w-4 h-4" />
      case 'gold': return <Trophy className="w-4 h-4" />
      case 'platinum': return <Star className="w-4 h-4" />
      case 'diamond': return <Crown className="w-4 h-4" />
      default: return <Award className="w-4 h-4" />
    }
  }

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedAchievements = filteredAchievements.filter(a => a.isUnlocked)
  const lockedAchievements = filteredAchievements.filter(a => !a.isUnlocked)
  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0)

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
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="text-gray-600">Track your progress and unlock rewards</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{unlockedAchievements.length}</div>
            <div className="text-sm text-gray-600">Unlocked</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.key)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Unlocked Achievements ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedAchievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.isNew ? 'ring-2 ring-primary-500' : ''}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getTierColor(achievement.tier)}`}>
                          {getTierIcon(achievement.tier)}
                          {achievement.tier}
                        </span>
                        {achievement.isNew && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            New!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">+{achievement.points}</div>
                    <div className="text-xs text-gray-600">points</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                
                {achievement.unlockedAt && (
                  <div className="text-xs text-gray-500">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            In Progress ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedAchievements.map((achievement) => (
              <Card key={achievement.id} className="opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl grayscale">{achievement.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getTierColor(achievement.tier)}`}>
                        {getTierIcon(achievement.tier)}
                        {achievement.tier}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-400">+{achievement.points}</div>
                    <div className="text-xs text-gray-600">points</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {achievement.progress.current} / {achievement.progress.target}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${achievement.progress.percentage}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600 text-center">
                    {achievement.progress.percentage}% complete
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Milestones */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Milestones</h3>
          <div className="space-y-3">
            {milestones.slice(0, 5).map((milestone) => (
              <Card key={milestone.id} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    {milestone.type === 'achievement_unlocked' && <Trophy className="w-5 h-5 text-primary-600" />}
                    {milestone.type === 'goal_completed' && <Target className="w-5 h-5 text-green-600" />}
                    {milestone.type === 'streak_milestone' && <Calendar className="w-5 h-5 text-orange-600" />}
                    {milestone.type === 'accuracy_milestone' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(milestone.timestamp).toLocaleDateString()}
                      </span>
                      {milestone.points && (
                        <span className="text-sm font-medium text-primary-600">
                          +{milestone.points} points
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{showCelebration.title}</h3>
              <p className="text-gray-600 mb-4">{showCelebration.description}</p>
              {showCelebration.points && (
                <div className="text-3xl font-bold text-primary-600 mb-4">
                  +{showCelebration.points} points
                </div>
              )}
              <Button onClick={() => setShowCelebration(null)}>
                Awesome!
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}