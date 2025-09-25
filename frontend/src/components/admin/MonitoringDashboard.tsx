import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SystemMetrics {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number;
  timestamp: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  databaseQueryTime: number;
  aiApiResponseTime: number;
  cacheHitRate: number;
  timestamp: string;
}

const MonitoringDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [systemResponse, performanceResponse, healthResponse] = await Promise.all([
          fetch('/api/monitoring/metrics/system'),
          fetch('/api/monitoring/metrics/performance'),
          fetch('/api/monitoring/health/detailed')
        ]);

        const systemData = await systemResponse.json();
        const performanceData = await performanceResponse.json();
        const healthData = await healthResponse.json();

        setSystemMetrics(systemData);
        setPerformanceMetrics(performanceData);
        setHealthStatus(healthData.status === 'healthy' ? 'healthy' : 'warning');
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
        setHealthStatus('critical');
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const memoryChartData = systemMetrics ? {
    labels: ['RSS', 'Heap Total', 'Heap Used', 'External'],
    datasets: [{
      label: 'Memory Usage (MB)',
      data: [
        systemMetrics.memory.rss,
        systemMetrics.memory.heapTotal,
        systemMetrics.memory.heapUsed,
        systemMetrics.memory.external
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  } : null;

  const performanceChartData = performanceMetrics ? {
    labels: ['Response Time', 'DB Query Time', 'AI API Time'],
    datasets: [{
      label: 'Response Times (ms)',
      data: [
        performanceMetrics.averageResponseTime,
        performanceMetrics.databaseQueryTime,
        performanceMetrics.aiApiResponseTime
      ],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  } : null;

  const cacheHitRateData = performanceMetrics ? {
    labels: ['Cache Hits', 'Cache Misses'],
    datasets: [{
      data: [
        performanceMetrics.cacheHitRate * 100,
        (1 - performanceMetrics.cacheHitRate) * 100
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(healthStatus)}`}>
          System Status: {healthStatus.toUpperCase()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Uptime</h3>
          <p className="text-3xl font-bold text-blue-600">
            {systemMetrics ? Math.floor(systemMetrics.uptime / 3600) : 0}h
          </p>
          <p className="text-sm text-gray-500">Hours online</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Requests/sec</h3>
          <p className="text-3xl font-bold text-green-600">
            {performanceMetrics?.requestsPerSecond || 0}
          </p>
          <p className="text-sm text-gray-500">Current load</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Error Rate</h3>
          <p className="text-3xl font-bold text-red-600">
            {performanceMetrics ? (performanceMetrics.errorRate * 100).toFixed(2) : 0}%
          </p>
          <p className="text-sm text-gray-500">Last 5 minutes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Cache Hit Rate</h3>
          <p className="text-3xl font-bold text-purple-600">
            {performanceMetrics ? (performanceMetrics.cacheHitRate * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-500">Cache efficiency</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Memory Usage</h3>
          {memoryChartData && (
            <Bar
              data={memoryChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Memory Usage by Type (MB)'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Performance Metrics Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Response Times</h3>
          {performanceChartData && (
            <Bar
              data={performanceChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Average Response Times (ms)'
                  }
                }
              }}
            />
          )}
        </div>

        {/* Cache Hit Rate Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Cache Performance</h3>
          {cacheHitRateData && (
            <Doughnut
              data={cacheHitRateData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  title: {
                    display: true,
                    text: 'Cache Hit Rate'
                  }
                }
              }}
            />
          )}
        </div>

        {/* System Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">CPU Usage:</span>
              <span className="font-medium">
                {systemMetrics ? `${(systemMetrics.cpu.user + systemMetrics.cpu.system).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Used:</span>
              <span className="font-medium">
                {systemMetrics ? `${systemMetrics.memory.heapUsed} MB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-sm">
                {systemMetrics ? new Date(systemMetrics.timestamp).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Alerts</h3>
        <div className="space-y-2">
          {performanceMetrics && performanceMetrics.errorRate > 0.05 && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-red-700">High error rate detected: {(performanceMetrics.errorRate * 100).toFixed(2)}%</span>
            </div>
          )}
          {performanceMetrics && performanceMetrics.averageResponseTime > 1000 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-yellow-700">Slow response times: {performanceMetrics.averageResponseTime}ms average</span>
            </div>
          )}
          {systemMetrics && systemMetrics.memory.heapUsed > 500 && (
            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-orange-700">High memory usage: {systemMetrics.memory.heapUsed}MB</span>
            </div>
          )}
          {healthStatus === 'healthy' && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-700">All systems operational</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;