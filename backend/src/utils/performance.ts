/**
 * Backend performance optimization utilities
 */

// Database connection pooling configuration
export const dbPoolConfig = {
  min: 2,
  max: 10,
  acquire: 30000,
  idle: 10000,
  evict: 1000,
  handleDisconnects: true
};

// Redis cache configuration
export const cacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'isee-tutor:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
};

// Cache key generators
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

// Memory usage monitoring
export const checkMemoryUsage = () => {
  const usage = process.memoryUsage();
  const formatBytes = (bytes: number) => Math.round(bytes / 1024 / 1024);
  
  const memoryInfo = {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external)
  };
  
  // Alert if memory usage is high
  if (memoryInfo.heapUsed > 500) { // 500MB threshold
    console.warn('High memory usage detected:', memoryInfo);
  }
  
  return memoryInfo;
};

// CPU usage monitoring
export const checkCPUUsage = () => {
  const usage = process.cpuUsage();
  return {
    user: usage.user / 1000000, // Convert to seconds
    system: usage.system / 1000000
  };
};

// Database query optimization helpers
export const optimizeQuery = (query: string): string => {
  // Add query optimization hints
  return query
    .replace(/SELECT \*/g, 'SELECT') // Encourage specific column selection
    .trim();
};

// Response compression middleware setup
export const compressionConfig = {
  level: 6,
  threshold: 1024,
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return true;
  }
};

// API response caching strategy
export const shouldCacheResponse = (req: any): boolean => {
  // Cache GET requests for static content
  if (req.method !== 'GET') return false;
  
  // Don't cache user-specific data
  if (req.path.includes('/user/') || req.path.includes('/progress/')) return false;
  
  // Cache practice content and static data
  return req.path.includes('/practice/') || req.path.includes('/content/');
};

// Background job queue configuration
export const jobQueueConfig = {
  redis: cacheConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};

// Health check utilities
export const performHealthCheck = async () => {
  const checks = {
    database: false,
    redis: false,
    openai: false,
    memory: false,
    disk: false
  };
  
  try {
    // Database health check
    // checks.database = await checkDatabaseConnection();
    
    // Redis health check
    // checks.redis = await checkRedisConnection();
    
    // OpenAI API health check
    // checks.openai = await checkOpenAIConnection();
    
    // Memory check
    const memory = checkMemoryUsage();
    checks.memory = memory.heapUsed < 1000; // Less than 1GB
    
    // Disk space check (simplified)
    checks.disk = true; // Would implement actual disk space check
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  return checks;
};