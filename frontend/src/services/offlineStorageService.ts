// IndexedDB wrapper for offline data storage
export interface OfflineData {
  id: string
  type: 'practice' | 'progress' | 'content' | 'session'
  data: any
  timestamp: number
  userId: string
  synced: boolean
}

export interface CacheEntry {
  key: string
  data: any
  timestamp: number
  expiresAt?: number
}

class OfflineStorageService {
  private dbName = 'isee-tutor-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('offline_data')) {
          const offlineStore = db.createObjectStore('offline_data', { keyPath: 'id' })
          offlineStore.createIndex('type', 'type', { unique: false })
          offlineStore.createIndex('userId', 'userId', { unique: false })
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false })
          offlineStore.createIndex('synced', 'synced', { unique: false })
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('userId', 'userId', { unique: false })
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        if (!db.objectStoreNames.contains('user_preferences')) {
          const prefsStore = db.createObjectStore('user_preferences', { keyPath: 'userId' })
        }
      }
    })
  }

  /**
   * Store data offline
   */
  async storeOfflineData(data: Omit<OfflineData, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) {
      await this.initialize()
    }

    const offlineData: OfflineData = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...data
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite')
      const store = transaction.objectStore('offline_data')
      const request = store.add(offlineData)

      request.onsuccess = () => resolve(offlineData.id)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get offline data by type and user
   */
  async getOfflineData(
    userId: string,
    type?: OfflineData['type'],
    limit?: number
  ): Promise<OfflineData[]> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readonly')
      const store = transaction.objectStore('offline_data')
      const index = store.index('userId')
      const request = index.getAll(userId)

      request.onsuccess = () => {
        let results = request.result || []

        // Filter by type if specified
        if (type) {
          results = results.filter(item => item.type === type)
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp)

        // Apply limit if specified
        if (limit) {
          results = results.slice(0, limit)
        }

        resolve(results)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update offline data sync status
   */
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite')
      const store = transaction.objectStore('offline_data')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.synced = true
          const updateRequest = store.put(data)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve() // Data not found, consider it synced
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Get unsynced data for background sync
   */
  async getUnsyncedData(userId: string, type?: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readonly')
      const store = transaction.objectStore('offline_data')
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => {
        let results = (request.result || []).filter(item => item.userId === userId)

        if (type) {
          results = results.filter(item => item.type === type)
        }

        // Sort by timestamp (oldest first for sync)
        results.sort((a, b) => a.timestamp - b.timestamp)

        resolve(results)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Queue data for background sync
   */
  async queueForSync(data: {
    type: string
    payload: any
    userId: string
  }): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const queueItem = {
      id: crypto.randomUUID(),
      type: data.type,
      data: data.payload,
      userId: data.userId,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite')
      const store = transaction.objectStore('sync_queue')
      const request = store.add(queueItem)

      request.onsuccess = () => {
        resolve()
        // Notify service worker about queued data
        this.notifyServiceWorker('QUEUE_SYNC', data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get queued sync data
   */
  async getSyncQueue(userId: string, type?: string): Promise<any[]> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly')
      const store = transaction.objectStore('sync_queue')
      const index = store.index('userId')
      const request = index.getAll(userId)

      request.onsuccess = () => {
        let results = request.result || []

        if (type) {
          results = results.filter(item => item.type === type)
        }

        resolve(results)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite')
      const store = transaction.objectStore('sync_queue')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Cache API responses
   */
  async cacheData(key: string, data: any, expirationMinutes?: number): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const cacheEntry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : undefined
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.put(cacheEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        
        if (!result) {
          resolve(null)
          return
        }

        // Check if expired
        if (result.expiresAt && Date.now() > result.expiresAt) {
          // Remove expired entry
          this.removeCachedData(key)
          resolve(null)
          return
        }

        resolve(result.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove cached data
   */
  async removeCachedData(key: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const index = store.index('expiresAt')
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()))

      let deletedCount = 0

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Store user preferences offline
   */
  async storeUserPreferences(userId: string, preferences: any): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['user_preferences'], 'readwrite')
      const store = transaction.objectStore('user_preferences')
      const request = store.put({ userId, preferences, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any | null> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['user_preferences'], 'readonly')
      const store = transaction.objectStore('user_preferences')
      const request = store.get(userId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.preferences : null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    offlineDataCount: number
    syncQueueCount: number
    cacheCount: number
    estimatedSize: number
  }> {
    if (!this.db) {
      await this.initialize()
    }

    const [offlineCount, queueCount, cacheCount] = await Promise.all([
      this.getStoreCount('offline_data'),
      this.getStoreCount('sync_queue'),
      this.getStoreCount('cache')
    ])

    // Estimate storage size (rough calculation)
    const estimatedSize = (offlineCount + queueCount + cacheCount) * 1024 // Rough estimate

    return {
      offlineDataCount: offlineCount,
      syncQueueCount: queueCount,
      cacheCount: cacheCount,
      estimatedSize
    }
  }

  /**
   * Clear all offline data for a user
   */
  async clearUserData(userId: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const stores = ['offline_data', 'sync_queue', 'user_preferences']
    
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        if (storeName === 'user_preferences') {
          const request = store.delete(userId)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        } else {
          const index = store.index('userId')
          const request = index.openCursor(userId)
          
          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              cursor.delete()
              cursor.continue()
            } else {
              resolve()
            }
          }
          
          request.onerror = () => reject(request.error)
        }
      })
    }
  }

  /**
   * Get count of items in a store
   */
  private async getStoreCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Notify service worker
   */
  private notifyServiceWorker(type: string, data: any): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, data })
    }
  }

  /**
   * Check if we're currently offline
   */
  isOffline(): boolean {
    return !navigator.onLine
  }

  /**
   * Force sync all queued data
   */
  async forceSyncAll(userId: string): Promise<void> {
    const queuedData = await this.getSyncQueue(userId)
    
    if (queuedData.length > 0) {
      this.notifyServiceWorker('FORCE_SYNC', { type: 'all' })
    }
  }
}

export const offlineStorageService = new OfflineStorageService()