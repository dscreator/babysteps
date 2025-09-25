/**
 * Monitoring and performance tracking utilities
 */

// Error tracking configuration
export const initErrorTracking = () => {
  // Initialize Sentry or similar error tracking service
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Sentry initialization would go here
    console.log('Error tracking initialized for production');
  }
};

// Performance monitoring
export const trackPerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await fn.apply(null, args);
      const duration = performance.now() - start;
      
      // Log performance metrics
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      // Send to monitoring service in production
      if (import.meta.env.PROD) {
        // Analytics tracking would go here
        console.log(`Performance: ${name} - ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Error in ${name} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// User experience metrics
export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    // Track user actions for analytics
    console.log(`User action: ${action}`, metadata);
  }
};

// API response time tracking
export const trackAPICall = (endpoint: string, duration: number, success: boolean) => {
  if (import.meta.env.PROD) {
    console.log(`API Call: ${endpoint} - ${duration.toFixed(2)}ms - ${success ? 'Success' : 'Failed'}`);
  }
};

// Memory usage monitoring
export const checkMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usage = {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576)
    };
    
    if (usage.used / usage.limit > 0.8) {
      console.warn('High memory usage detected:', usage);
    }
    
    return usage;
  }
  return null;
};