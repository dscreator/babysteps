// Service Worker registration and management utilities

export interface ServiceWorkerStatus {
  isSupported: boolean
  isRegistered: boolean
  isActive: boolean
  registration: ServiceWorkerRegistration | null
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerStatus> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return {
        isSupported: false,
        isRegistered: false,
        isActive: false,
        registration: null
      }
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.registration = registration

      console.log('Service Worker registered successfully:', registration.scope)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available')
              this.updateAvailable = true
              this.notifyUpdateAvailable()
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage)

      return {
        isSupported: true,
        isRegistered: true,
        isActive: registration.active !== null,
        registration
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return {
        isSupported: true,
        isRegistered: false,
        isActive: false,
        registration: null
      }
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const result = await this.registration.unregister()
      console.log('Service Worker unregistered:', result)
      this.registration = null
      return result
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
      return false
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registration found')
    }

    try {
      await this.registration.update()
      console.log('Service Worker update check completed')
    } catch (error) {
      console.error('Service Worker update failed:', error)
      throw error
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return
    }

    // Send skip waiting message to service worker
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // Wait for the new service worker to take control
    await new Promise<void>((resolve) => {
      const handleControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
        resolve()
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    })

    console.log('New service worker activated')
    this.updateAvailable = false
  }

  /**
   * Send message to service worker
   */
  sendMessage(message: any): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }

  /**
   * Queue data for background sync
   */
  queueForSync(type: string, data: any): void {
    this.sendMessage({
      type: 'QUEUE_SYNC',
      data: { type, payload: data }
    })
  }

  /**
   * Force sync specific data type
   */
  forceSync(type: string): void {
    this.sendMessage({
      type: 'FORCE_SYNC',
      data: { type }
    })
  }

  /**
   * Handle messages from service worker
   */
  private handleMessage = (event: MessageEvent) => {
    const { type, data } = event.data

    switch (type) {
      case 'SYNC_UPDATE':
        console.log('Received sync update from service worker:', data)
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('sw-sync-update', { detail: data }))
        break

      case 'CACHE_UPDATED':
        console.log('Cache updated by service worker:', data)
        window.dispatchEvent(new CustomEvent('sw-cache-updated', { detail: data }))
        break

      default:
        console.log('Unknown message from service worker:', type, data)
    }
  }

  /**
   * Notify about available update
   */
  private notifyUpdateAvailable(): void {
    window.dispatchEvent(new CustomEvent('sw-update-available'))
  }

  /**
   * Get current status
   */
  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: this.registration !== null,
      isActive: this.registration?.active !== null,
      registration: this.registration
    }
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  /**
   * Get registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()

/**
 * Initialize service worker with error handling
 */
export async function initializeServiceWorker(): Promise<ServiceWorkerStatus> {
  try {
    const status = await serviceWorkerManager.register()
    
    if (status.isRegistered) {
      console.log('✅ Service Worker initialized successfully')
      
      // Set up periodic sync registration
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.sync.register('periodic-sync')
          console.log('✅ Background sync registered')
        } catch (error) {
          console.warn('⚠️ Background sync registration failed:', error)
        }
      }
    } else {
      console.warn('⚠️ Service Worker registration failed')
    }
    
    return status
  } catch (error) {
    console.error('❌ Service Worker initialization failed:', error)
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: false,
      isActive: false,
      registration: null
    }
  }
}

/**
 * Check if the app is running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

/**
 * Check if the app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return 'beforeinstallprompt' in window
}

/**
 * Prompt user to install PWA
 */
export async function promptInstallPWA(): Promise<boolean> {
  const event = (window as any).deferredPrompt
  
  if (!event) {
    return false
  }

  try {
    event.prompt()
    const result = await event.userChoice
    
    if (result.outcome === 'accepted') {
      console.log('User accepted PWA install prompt')
      return true
    } else {
      console.log('User dismissed PWA install prompt')
      return false
    }
  } catch (error) {
    console.error('PWA install prompt failed:', error)
    return false
  }
}

/**
 * Listen for PWA install prompt
 */
export function setupPWAInstallPrompt(callback: (canInstall: boolean) => void): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    ;(window as any).deferredPrompt = event
    callback(true)
  })

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
    ;(window as any).deferredPrompt = null
    callback(false)
  })
}