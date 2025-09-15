import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PerformanceDataPoint {
  date: string
  score: number
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[]
  title: string
  subject?: string
  className?: string
}

export function PerformanceChart({ data, title, subject, className }: PerformanceChartProps) {
  const getSubjectColor = (subject?: string) => {
    switch (subject) {
      case 'math':
        return {
          primary: 'rgb(59, 130, 246)', // blue-500
          secondary: 'rgba(59, 130, 246, 0.1)',
        }
      case 'english':
        return {
          primary: 'rgb(34, 197, 94)', // green-500
          secondary: 'rgba(34, 197, 94, 0.1)',
        }
      case 'essay':
        return {
          primary: 'rgb(168, 85, 247)', // purple-500
          secondary: 'rgba(168, 85, 247, 0.1)',
        }
      default:
        return {
          primary: 'rgb(99, 102, 241)', // indigo-500
          secondary: 'rgba(99, 102, 241, 0.1)',
        }
    }
  }

  const colors = getSubjectColor(subject)

  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Score',
        data: data.map(point => point.score),
        borderColor: colors.primary,
        backgroundColor: colors.secondary,
        borderWidth: 3,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex
            const date = new Date(data[dataIndex].date)
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          },
          label: (context: any) => `Score: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: (value: any) => `${value}%`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  const latestScore = data[data.length - 1]?.score || 0
  const previousScore = data[data.length - 2]?.score || 0
  const trend = latestScore - previousScore

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Latest:</span>
            <span className="font-bold text-gray-900">{latestScore}%</span>
            {trend !== 0 && (
              <span className={`flex items-center gap-1 ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? '↗' : '↘'}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
        
        {/* Performance Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm text-gray-500">Best</div>
            <div className="text-lg font-semibold text-green-600">
              {Math.max(...data.map(d => d.score))}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Average</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Sessions</div>
            <div className="text-lg font-semibold text-gray-900">
              {data.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}