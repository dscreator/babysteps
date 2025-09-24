// Service Worker for offline capability and data caching
const CACHE_NAME = 'isee-tutor-v1'
const API_CACHE_NAME = 'isee-tutor-api-v1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
]

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/content\//,
  /\/api\/practice\/math\/problems/,
  /\/api\/practice\/english\/passages/,
  /\/api\/practice\/essay\/prompts/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy for dynamic data
// and cache-first for static content
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const isStaticContent = CACHEABLE_API_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  )

  if (isStaticContent) {
    // Cache-first strategy for static content
    return handleCacheFirst(request, API_CACHE_NAME)
  } else {
    // Network-first strategy for dynamic data
    return handleNetworkFirst(request, API_CACHE_NAME)
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  return handleCacheFirst(request, CACHE_NAME)
}

// Cache-first strategy
async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return cached version and update in background
      updateCacheInBackground(request, cache)
      return cachedResponse
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', error)
    return handleOfflineResponse(request)
  }
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error.message)
    
    // Network failed, try cache
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return handleOfflineResponse(request)
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
  } catch (error) {
    console.log('Background cache update failed:', error.message)
  }
}

// Handle offline responses
function handleOfflineResponse(request) {
  const url = new URL(request.url)
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html')
  }
  
  // Return cached offline data or error response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline - data not available',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
  
  // Return generic offline response
  return new Response('Offline', { status: 503 })
}

// Handle background sync for queued data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-practice-data') {
    event.waitUntil(syncPracticeData())
  } else if (event.tag === 'sync-progress-data') {
    event.waitUntil(syncProgressData())
  }
})

// Sync practice data when online
async function syncPracticeData() {
  try {
    console.log('Syncing practice data...')
    
    // Get queued practice data from IndexedDB
    const queuedData = await getQueuedData('practice')
    
    for (const item of queuedData) {
      try {
        const response = await fetch('/api/practice/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        })
        
        if (response.ok) {
          // Remove from queue after successful sync
          await removeFromQueue('practice', item.id)
          console.log('Synced practice item:', item.id)
        }
      } catch (error) {
        console.error('Failed to sync practice item:', item.id, error)
      }
    }
  } catch (error) {
    console.error('Practice data sync failed:', error)
  }
}

// Sync progress data when online
async function syncProgressData() {
  try {
    console.log('Syncing progress data...')
    
    // Get queued progress data from IndexedDB
    const queuedData = await getQueuedData('progress')
    
    for (const item of queuedData) {
      try {
        const response = await fetch('/api/progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        })
        
        if (response.ok) {
          // Remove from queue after successful sync
          await removeFromQueue('progress', item.id)
          console.log('Synced progress item:', item.id)
        }
      } catch (error) {
        console.error('Failed to sync progress item:', item.id, error)
      }
    }
  } catch (error) {
    console.error('Progress data sync failed:', error)
  }
}

// IndexedDB operations for offline queue
async function getQueuedData(type) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('isee-tutor-offline', 1)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['sync_queue'], 'readonly')
      const store = transaction.objectStore('sync_queue')
      const index = store.index('type')
      const getRequest = index.getAll(type)
      
      getRequest.onsuccess = () => resolve(getRequest.result || [])
      getRequest.onerror = () => reject(getRequest.error)
    }
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

async function removeFromQueue(type, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('isee-tutor-offline', 1)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['sync_queue'], 'readwrite')
      const store = transaction.objectStore('sync_queue')
      const deleteRequest = store.delete(id)
      
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Handle push notifications for sync updates
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    if (data.type === 'sync_update') {
      // Handle sync update notifications
      console.log('Received sync update:', data)
      
      // Notify clients about data updates
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_UPDATE',
            data: data
          })
        })
      })
    }
  } catch (error) {
    console.error('Failed to handle push notification:', error)
  }
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'QUEUE_SYNC':
      queueDataForSync(data)
      break
      
    case 'FORCE_SYNC':
      forceSyncData(data.type)
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

// Queue data for background sync
async function queueDataForSync(data) {
  try {
    const request = indexedDB.open('isee-tutor-offline', 1)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['sync_queue'], 'readwrite')
      const store = transaction.objectStore('sync_queue')
      
      const queueItem = {
        id: crypto.randomUUID(),
        type: data.type,
        data: data.payload,
        timestamp: Date.now()
      }
      
      store.add(queueItem)
    }
    
    // Register background sync
    if ('serviceWorker' in self && 'sync' in self.registration) {
      await self.registration.sync.register(`sync-${data.type}-data`)
    }
  } catch (error) {
    console.error('Failed to queue data for sync:', error)
  }
}

// Force immediate sync
async function forceSyncData(type) {
  if (type === 'practice') {
    await syncPracticeData()
  } else if (type === 'progress') {
    await syncProgressData()
  }
}