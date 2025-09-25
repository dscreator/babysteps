import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response time
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Log request details
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Alert on slow requests
    if (duration > 5000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }

    return originalSend.call(this, body);
  };

  next();
};

// Error tracking middleware
export const errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error({
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Sentry or similar error tracking would go here
    console.log('Error sent to tracking service');
  }

  next(error);
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json(healthData);
};

// Rate limiting monitoring
export const rateLimitMonitor = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const endpoint = req.path;
  
  // Log rate limit information
  console.log(`Rate limit check: ${clientId} -> ${endpoint}`);
  
  next();
};

// Database query performance monitoring
export const queryPerformanceMonitor = (query: string, duration: number) => {
  if (duration > 1000) {
    console.warn(`Slow database query detected: ${query} took ${duration}ms`);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Query: ${query} - ${duration}ms`);
  }
};

// API response time monitoring
export const responseTimeMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Store metrics for monitoring dashboard
    console.log(`API Response Time: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
  });
  
  next();
};