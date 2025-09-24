import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { offlineStorageService } from '../services/offlineStorageService'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface SyncStatus {
  isOnline: boolean
  isConnected: boolean
  queuedItems: number
  lastSync: Date | null
  syncInProgress: boolean
  error: string | null
}

export interface SyncEvent {
  type: 'progress_updated' | 'session_updated' | 'user_updated' | 'sync_completed' | 'sync_failed'
  data: any
  timestamp: Date
}

export function useRealTimeSync() {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    queuedItems: 0,
    lastSync: null,
    syncInProgress: false,
    error: null
  })
  
  const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Initialize real-time synchronization
   */
  const initializeSync = useCallback(async () => {
    if (!user?.id) return

    try {
      // Initialize offline storage
      await offlineStorageService.initialize()

      // Create real-time channel
      const channel = supabase
        .channel(`user-sync-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_progress',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => handleRealtimeEvent('progress_updated', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'practice_sessions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => handleRealtimeEvent('session_updated', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          (payload) => handleRealtimeEvent('user_updated', payload)
        )
        .subscribe((status) => {
          setSyncStatus(prev => ({
            ...prev,
            isConnected: status === 'SUBSCRIBED',
            error: status === 'CHANNEL_ERROR' ? 'Connection error' : null
          }))
        })

      channelRef.current = channel

      // Update sync status
      await updateSyncStatus()

      console.log('Real-time sync initialized for user:', user.id)
    } catch (error) {
      console.error('Failed to initialize sync:', error)
      setSyncStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync initialization failed'
      }))
    }
  }, [user?.id])

  /**
   * Handle real-time events
   */
  const handleRealtimeEvent = useCallback((type: SyncEvent['type'], payload: any) => {
    const event: SyncEvent = {
      type,
      data: payload,
      timestamp: new Date()
    }

    setRecentEvents(prev => [event, ...prev.slice(0, 9)]) // Keep last 10 events

    // Update last sync time
    setSyncStatus(prev => ({
      ...prev,
      lastSync: new Date()
    }))
  }, [])

  /**
   * Save data with automatic sync
   */
  const saveData = useCallback(async (
    dataType: 'progress' | 'session' | 'preferences' | 'achievement',
    data: any
  ) => {
    if (!user?.id) return

    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true, error: null }))

      if (navigator.onLine) {
        // Try to save directly to server
        const response = await fetch('/api/sync/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            type: dataType,
            data,
            userId: user.id,
            timestamp: Date.now()
          })
        })

        if (response.ok) {
          setSyncStatus(prev => ({
            ...prev,
            lastSync: new Date(),
            syncInProgress: false
          }))
          return
        }
      }

      // Fallback to offline storage
      await offlineStorageService.storeOfflineData({
        type: dataType,
        data,
        userId: user.id,
        synced: false
      })

      await offlineStorageService.queueForSync({
        type: dataType,
        payload: data,
        userId: user.id
      })

      await updateSyncStatus()
    } catch (error) {
      console.error('Failed to save data:', error)
      setSyncStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Save failed',
        syncInProgress: false
      }))
    }
  }, [user?.id])

  /**
   * Force sync all queued data
   */
  const forceSync = useCallback(async () => {
    if (!user?.id || !navigator.onLine) return

    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true, error: null }))

      const queuedData = await offlineStorageService.getSyncQueue(user.id)
      
      for (const item of queuedData) {
        try {
          const response = await fetch('/api/sync/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              type: item.type,
              data: item.data,
              userId: user.id,
              timestamp: item.timestamp
            })
          })

          if (response.ok) {
            await offlineStorageService.removeFromSyncQueue(item.id)
          }
        } catch (error) {
          console.error('Failed to sync item:', item.id, error)
        }
      }

      await updateSyncStatus()
      
      handleRealtimeEvent('sync_completed', { syncedItems: queuedData.length })
    } catch (error) {
      console.error('Force sync failed:', error)
      setSyncStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed'
      }))
      
      handleRealtimeEvent('sync_failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
    }
  }, [user?.id])

  /**
   * Update sync status from storage
   */
  const updateSyncStatus = useCallback(async () => {
    if (!user?.id) return

    try {
      const queuedData = await offlineStorageService.getSyncQueue(user.id)
      const stats = await offlineStorageService.getStorageStats()

      setSyncStatus(prev => ({
        ...prev,
        queuedItems: queuedData.length,
        isOnline: navigator.onLine
      }))
    } catch (error) {
      console.error('Failed to update sync status:', error)
    }
  }, [user?.id])

  /**
   * Get cached data
   */
  const getCachedData = useCallback(async (key: string) => {
    return await offlineStorageService.getCachedData(key)
  }, [])

  /**
   * Cache data
   */
  const cacheData = useCallback(async (key: string, data: any, expirationMinutes?: number) => {
    await offlineStorageService.cacheData(key, data, expirationMinutes)
  }, [])

  /**
   * Get offline data
   */
  const getOfflineData = useCallback(async (
    type?: 'progress' | 'session' | 'content' | 'practice',
    limit?: number
  ) => {
    if (!user?.id) return []
    return await offlineStorageService.getOfflineData(user.id, type, limit)
  }, [user?.id])

  // Setup online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true, error: null }))
      
      // Auto-sync when coming back online
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        forceSync()
      }, 2000) // Wait 2 seconds before syncing
    }

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false, isConnected: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [forceSync])

  // Initialize sync when user is available
  useEffect(() => {
    if (user?.id) {
      initializeSync()
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id, initializeSync])

  // Periodic sync status updates
  useEffect(() => {
    const interval = setInterval(updateSyncStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [updateSyncStatus])

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_UPDATE') {
        handleRealtimeEvent('sync_completed', event.data.data)
        updateSyncStatus()
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [handleRealtimeEvent, updateSyncStatus])

  return {
    syncStatus,
    recentEvents,
    saveData,
    forceSync,
    getCachedData,
    cacheData,
    getOfflineData,
    updateSyncStatus
  }
}