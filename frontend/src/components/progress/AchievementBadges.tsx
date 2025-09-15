import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import type { Achievement } from '../../types/api'

interface AchievementBadgesProps {
  achievements: Achievement[]
  className?: string
}

interface BadgeProps {
  achievement: Achievement
  size?: 'small' | 'medium' | 'large'
}

function Badge({ achievement, size = 'medium' }: BadgeProps) {
  const isUnlocked = !!achievement.unlockedAt
  const hasProgress = !!achievement.progress
  
  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-20 h-20 text-3xl',
  }
  
  const progressPercentage = hasProgress 
    ? Math.round((achievement.progress!.current / achievement.progress!.target) * 100)
    : 0

  return (
    <div className="relative group">
      {/* Badge Circle */}
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full flex items-center justify-center font-bold
          transition-all duration-300 cursor-pointer
          ${isUnlocked 
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg hover:shadow-xl hover:scale-105' 
            : hasProgress
              ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 hover:from-gray-300 hover:to-gray-400'
              : 'bg-gray-100 text-gray-400'
          }
        `}
      >
        {achievement.icon}
      </div>
      
      {/* Progress Ring for In-Progress Achievements */}
      {hasProgress && !isUnlocked && (
        <svg
          className="absolute inset-0 transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="4"
            strokeDasharray={`${progressPercentage * 2.83} 283`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
      )}
      
      {/* Unlock Glow Effect */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 animate-pulse" />
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-48">
          <div className="font-semibold">{achievement.name}</div>
          <div className="text-gray-300 mt-1">{achievement.description}</div>
          {hasProgress && !isUnlocked && (
            <div className="text-blue-300 mt-1">
              Progress: {achievement.progress!.current}/{achievement.progress!.target}
            </div>
          )}
          {isUnlocked && (
            <div className="text-yellow-300 mt-1">
              Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
            </div>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
      </div>
    </div>
  )
}

export function AchievementBadges({ achievements, className }: AchievementBadgesProps) {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt)
  const inProgressAchievements = achievements.filter(a => !a.unlockedAt && a.progress)
  const lockedAchievements = achievements.filter(a => !a.unlockedAt && !a.progress)
  
  const totalAchievements = achievements.length
  const unlockedCount = unlockedAchievements.length
  const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Achievements
          </span>
          <span className="text-sm font-normal text-gray-500">
            {unlockedCount}/{totalAchievements} ({completionPercentage}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Achievement Progress</span>
            <span>{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
              <span>🌟</span>
              Unlocked ({unlockedAchievements.length})
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {unlockedAchievements.map(achievement => (
                <Badge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <span>⚡</span>
              In Progress ({inProgressAchievements.length})
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {inProgressAchievements.map(achievement => (
                <Badge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <span>🔒</span>
              Locked ({lockedAchievements.length})
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {lockedAchievements.map(achievement => (
                <Badge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {unlockedCount > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-800 mb-1">
                {unlockedCount === 1 && "🎉 First achievement unlocked!"}
                {unlockedCount > 1 && unlockedCount < 5 && "🚀 Great progress on achievements!"}
                {unlockedCount >= 5 && unlockedCount < 10 && "⭐ You're an achievement collector!"}
                {unlockedCount >= 10 && "🏆 Achievement master!"}
              </div>
              <div className="text-sm text-yellow-700">
                {inProgressAchievements.length > 0 
                  ? `Keep going! ${inProgressAchievements.length} more achievements are within reach.`
                  : "Amazing work! You're making excellent progress."
                }
              </div>
            </div>
          </div>
        )}

        {unlockedCount === 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-gray-600">
              <div className="text-lg font-semibold mb-1">🎯 Ready to earn your first achievement?</div>
              <div className="text-sm">Complete practice sessions to start unlocking badges!</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}