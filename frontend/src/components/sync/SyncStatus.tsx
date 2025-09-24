
import { useRealTimeSync } from '../../hooks/useRealTimeSync'

interface SyncStatusProps {
  showDetails?: boolean
  className?: string
}

export function SyncStatus({ showDetails = false, className = '' }: SyncStatusProps) {
  const { syncStatus, recentEvents, forceSync } = useRealTimeSync()

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-500'
    if (syncStatus.syncInProgress) return 'text-yellow-500'
    if (syncStatus.queuedItems > 0) return 'text-orange-500'
    if (syncStatus.isConnected) return 'text-green-500'
    return 'text-gray-500'
  }

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return '📡'
    if (syncStatus.syncInProgress) return '🔄'
    if (syncStatus.queuedItems > 0) return '⏳'
    if (syncStatus.isConnected) return '✅'
    return '⚪'
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline'
    if (syncStatus.syncInProgress) return 'Syncing...'
    if (syncStatus.queuedItems > 0) return `${syncStatus.queuedItems} pending`
    if (syncStatus.isConnected) return 'Synced'
    return 'Disconnected'
  }

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Never'
    
    const now = new Date()
    const lastSync = new Date(syncStatus.lastSync)
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-lg">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sync Status</h3>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Connection:</span>
          <span className={syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Real-time sync:</span>
          <span className={syncStatus.isConnected ? 'text-green-600' : 'text-gray-600'}>
            {syncStatus.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Queued items:</span>
          <span className={syncStatus.queuedItems > 0 ? 'text-orange-600' : 'text-gray-600'}>
            {syncStatus.queuedItems}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last sync:</span>
          <span className="text-gray-900">{formatLastSync()}</span>
        </div>

        {syncStatus.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {syncStatus.error}
          </div>
        )}

        {syncStatus.queuedItems > 0 && syncStatus.isOnline && (
          <button
            onClick={forceSync}
            disabled={syncStatus.syncInProgress}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
          </button>
        )}

        {recentEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="text-xs text-gray-600 flex justify-between">
                  <span>{event.type.replace('_', ' ')}</span>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}