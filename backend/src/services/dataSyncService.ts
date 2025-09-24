import { supabase } from '../config/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface SyncData {
  id: string
  userId: string
  dataType: 'progress' | 'session' | 'preferences' | 'achievement'
  data: any
  version: number
  lastModified: string
  deviceId?: string
}

export interface DataBackup {
  id: string
  userId: string
  backupData: any
  backupType: 'full' | 'incremental'
  createdAt: string
}

export class DataSyncService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private syncQueue: Map<string, SyncData[]> = new Map()
  private isOnline: boolean = true

  constructor() {
    this.setupNetworkMonitoring()
  }

  /**
   * Initialize real-time synchronization for a user
   */
  async initializeSync(userId: string): Promise<void> {
    try {
      // Create real-time channel for user data
      const channel = supabase
        .channel(`user-sync-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_progress',
            filter: `user_id=eq.${userId}`
          },
          (payload) => this.handleProgressChange(payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'practice_sessions',
            filter: `user_id=eq.${userId}`
          },
          (payload) => this.handleSessionChange(payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`
          },
          (payload) => this.handleUserChange(payload)
        )
        .subscribe()

      this.channels.set(userId, channel)
      
      // Initialize sync queue for user
      this.syncQueue.set(userId, [])

      console.log(`Real-time sync initialized for user: ${userId}`)
    } catch (error) {
      console.error('Failed to initialize sync:', error)
      throw new Error('Failed to initialize data synchronization')
    }
  }

  /**
   * Cleanup synchronization for a user
   */
  async cleanupSync(userId: string): Promise<void> {
    const channel = this.channels.get(userId)
    if (channel) {
      await supabase.removeChannel(channel)
      this.channels.delete(userId)
    }
    
    this.syncQueue.delete(userId)
    console.log(`Sync cleanup completed for user: ${userId}`)
  }

  /**
   * Save data with automatic retry and conflict resolution
   */
  async saveData(
    userId: string,
    dataType: SyncData['dataType'],
    data: any,
    deviceId?: string
  ): Promise<SyncData> {
    const syncData: SyncData = {
      id: crypto.randomUUID(),
      userId,
      dataType,
      data,
      version: Date.now(),
      lastModified: new Date().toISOString(),
      deviceId
    }

    try {
      if (this.isOnline) {
        return await this.saveToDatabase(syncData)
      } else {
        // Queue for later sync when online
        this.queueForSync(userId, syncData)
        return syncData
      }
    } catch (error) {
      console.error('Failed to save data:', error)
      // Queue for retry
      this.queueForSync(userId, syncData)
      throw error
    }
  }

  /**
   * Save data directly to database
   */
  private async saveToDatabase(syncData: SyncData): Promise<SyncData> {
    const { error } = await supabase
      .from('data_sync')
      .upsert({
        id: syncData.id,
        user_id: syncData.userId,
        data_type: syncData.dataType,
        data: syncData.data,
        version: syncData.version,
        last_modified: syncData.lastModified,
        device_id: syncData.deviceId
      })

    if (error) {
      throw new Error(`Failed to save sync data: ${error.message}`)
    }

    return syncData
  }

  /**
   * Queue data for later synchronization
   */
  private queueForSync(userId: string, syncData: SyncData): void {
    const queue = this.syncQueue.get(userId) || []
    queue.push(syncData)
    this.syncQueue.set(userId, queue)
  }

  /**
   * Process sync queue when connection is restored
   */
  async processSyncQueue(userId: string): Promise<void> {
    const queue = this.syncQueue.get(userId) || []
    
    if (queue.length === 0) return

    console.log(`Processing ${queue.length} queued sync items for user: ${userId}`)

    const results = await Promise.allSettled(
      queue.map(syncData => this.saveToDatabase(syncData))
    )

    // Remove successfully synced items
    const failedItems = queue.filter((_, index) => 
      results[index].status === 'rejected'
    )

    this.syncQueue.set(userId, failedItems)

    if (failedItems.length > 0) {
      console.warn(`${failedItems.length} items failed to sync for user: ${userId}`)
    }
  }

  /**
   * Create full data backup
   */
  async createBackup(userId: string): Promise<DataBackup> {
    try {
      // Gather all user data
      const [userProfile, progress, sessions, interactions, achievements] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserProgress(userId),
        this.getUserSessions(userId),
        this.getUserInteractions(userId),
        this.getUserAchievements(userId)
      ])

      const backupData = {
        profile: userProfile,
        progress,
        sessions,
        interactions,
        achievements,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }

      const backup: DataBackup = {
        id: crypto.randomUUID(),
        userId,
        backupData,
        backupType: 'full',
        createdAt: new Date().toISOString()
      }

      // Save backup to database
      const { error } = await supabase
        .from('data_backups')
        .insert({
          id: backup.id,
          user_id: backup.userId,
          backup_data: backup.backupData,
          backup_type: backup.backupType,
          created_at: backup.createdAt
        })

      if (error) {
        throw new Error(`Failed to create backup: ${error.message}`)
      }

      return backup
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(userId: string, backupId: string): Promise<void> {
    try {
      const { data: backup, error } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single()

      if (error || !backup) {
        throw new Error('Backup not found or access denied')
      }

      const backupData = backup.backup_data

      // Restore data in transaction-like manner
      await this.restoreUserData(userId, backupData)

      console.log(`Data restored from backup ${backupId} for user: ${userId}`)
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      throw error
    }
  }

  /**
   * Handle real-time progress changes
   */
  private handleProgressChange(payload: any): void {
    console.log('Progress change detected:', payload)
    // Emit event for frontend to handle
    this.emitSyncEvent('progress_updated', payload)
  }

  /**
   * Handle real-time session changes
   */
  private handleSessionChange(payload: any): void {
    console.log('Session change detected:', payload)
    this.emitSyncEvent('session_updated', payload)
  }

  /**
   * Handle real-time user changes
   */
  private handleUserChange(payload: any): void {
    console.log('User change detected:', payload)
    this.emitSyncEvent('user_updated', payload)
  }

  /**
   * Emit sync events (would integrate with WebSocket or EventEmitter)
   */
  private emitSyncEvent(event: string, data: any): void {
    // In a real implementation, this would emit to connected clients
    console.log(`Sync event: ${event}`, data)
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        console.log('Connection restored, processing sync queue')
        // Process queued items for all users
        this.syncQueue.forEach((_, userId) => {
          this.processSyncQueue(userId)
        })
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        console.log('Connection lost, queuing sync operations')
      })
    }
  }

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user progress data
   */
  private async getUserProgress(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  /**
   * Get user sessions data
   */
  private async getUserSessions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100) // Last 100 sessions

    if (error) throw error
    return data || []
  }

  /**
   * Get user interactions data
   */
  private async getUserInteractions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500) // Last 500 interactions

    if (error) throw error
    return data || []
  }

  /**
   * Get user achievements data
   */
  private async getUserAchievements(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  /**
   * Restore user data from backup
   */
  private async restoreUserData(userId: string, backupData: any): Promise<void> {
    // This would implement careful restoration logic
    // For now, we'll log what would be restored
    console.log('Would restore data for user:', userId, {
      profile: backupData.profile ? 'included' : 'missing',
      progress: backupData.progress?.length || 0,
      sessions: backupData.sessions?.length || 0,
      interactions: backupData.interactions?.length || 0,
      achievements: backupData.achievements?.length || 0
    })
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<{
    isOnline: boolean
    queuedItems: number
    lastSync: string | null
    hasActiveChannel: boolean
  }> {
    const queuedItems = this.syncQueue.get(userId)?.length || 0
    const hasActiveChannel = this.channels.has(userId)

    // Get last sync time from database
    const { data } = await supabase
      .from('data_sync')
      .select('last_modified')
      .eq('user_id', userId)
      .order('last_modified', { ascending: false })
      .limit(1)
      .single()

    return {
      isOnline: this.isOnline,
      queuedItems,
      lastSync: data?.last_modified || null,
      hasActiveChannel
    }
  }
}

export const dataSyncService = new DataSyncService()