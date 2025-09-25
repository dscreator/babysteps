import express from 'express';
import { healthCheck } from '../middleware/monitoring';
import { checkMemoryUsage, checkCPUUsage, performHealthCheck } from '../utils/performance';

const router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Detailed health check with all services
router.get('/health/detailed', async (req, res) => {
  try {
    const healthChecks = await performHealthCheck();
    const systemMetrics = {
      memory: checkMemoryUsage(),
      cpu: checkCPUUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    const overallHealth = Object.values(healthChecks).every(check => check);

    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      checks: healthChecks,
      metrics: systemMetrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Prometheus metrics endpoint
router.get('/metrics', (req, res) => {
  // This would integrate with a metrics library like prom-client
  const metrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
http_requests_total{method="POST",status="200"} 567
http_requests_total{method="GET",status="404"} 12
http_requests_total{method="POST",status="500"} 3

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 200
http_request_duration_seconds_bucket{le="1.0"} 250
http_request_duration_seconds_bucket{le="2.0"} 280
http_request_duration_seconds_bucket{le="+Inf"} 300
http_request_duration_seconds_sum 45.6
http_request_duration_seconds_count 300

# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
nodejs_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
nodejs_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
nodejs_memory_usage_bytes{type="external"} ${process.memoryUsage().external}

# HELP nodejs_uptime_seconds Node.js uptime in seconds
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds ${process.uptime()}
  `.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// System metrics endpoint
router.get('/metrics/system', (req, res) => {
  const metrics = {
    memory: checkMemoryUsage(),
    cpu: checkCPUUsage(),
    uptime: process.uptime(),
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: new Date().toISOString()
  };

  res.json(metrics);
});

// Performance metrics endpoint
router.get('/metrics/performance', (req, res) => {
  // This would collect and return performance metrics
  const performanceMetrics = {
    averageResponseTime: 150, // ms
    requestsPerSecond: 25,
    errorRate: 0.02, // 2%
    databaseQueryTime: 45, // ms
    aiApiResponseTime: 800, // ms
    cacheHitRate: 0.85, // 85%
    timestamp: new Date().toISOString()
  };

  res.json(performanceMetrics);
});

// Frontend metrics collection endpoint
router.post('/metrics/frontend', (req, res) => {
  const { metrics } = req.body;
  
  // Log frontend performance metrics
  console.log('Frontend metrics received:', {
    pageLoadTime: metrics.pageLoadTime,
    firstContentfulPaint: metrics.firstContentfulPaint,
    largestContentfulPaint: metrics.largestContentfulPaint,
    cumulativeLayoutShift: metrics.cumulativeLayoutShift,
    firstInputDelay: metrics.firstInputDelay,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(200).json({ status: 'received' });
});

export default router;