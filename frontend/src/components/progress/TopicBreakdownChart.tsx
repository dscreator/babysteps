import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TopicBreakdownChartProps {
  topicScores: Record<string, number>
  subject: string
  className?: string
}

export function TopicBreakdownChart({ topicScores, subject, className }: TopicBreakdownChartProps) {
  const getSubjectColors = (subject: string) => {
    switch (subject) {
      case 'math':
        return {
          primary: 'rgba(59, 130, 246, 0.8)', // blue-500
          border: 'rgb(59, 130, 246)',
          weak: 'rgba(239, 68, 68, 0.8)', // red-500
          weakBorder: 'rgb(239, 68, 68)',
          strong: 'rgba(34, 197, 94, 0.8)', // green-500
          strongBorder: 'rgb(34, 197, 94)',
        }
      case 'english':
        return {
          primary: 'rgba(34, 197, 94, 0.8)', // green-500
          border: 'rgb(34, 197, 94)',
          weak: 'rgba(239, 68, 68, 0.8)',
          weakBorder: 'rgb(239, 68, 68)',
          strong: 'rgba(59, 130, 246, 0.8)',
          strongBorder: 'rgb(59, 130, 246)',
        }
      case 'essay':
        return {
          primary: 'rgba(168, 85, 247, 0.8)', // purple-500
          border: 'rgb(168, 85, 247)',
          weak: 'rgba(239, 68, 68, 0.8)',
          weakBorder: 'rgb(239, 68, 68)',
          strong: 'rgba(34, 197, 94, 0.8)',
          strongBorder: 'rgb(34, 197, 94)',
        }
      default:
        return {
          primary: 'rgba(99, 102, 241, 0.8)', // indigo-500
          border: 'rgb(99, 102, 241)',
          weak: 'rgba(239, 68, 68, 0.8)',
          weakBorder: 'rgb(239, 68, 68)',
          strong: 'rgba(34, 197, 94, 0.8)',
          strongBorder: 'rgb(34, 197, 94)',
        }
    }
  }

  const colors = getSubjectColors(subject)
  const topics = Object.keys(topicScores)
  const scores = Object.values(topicScores)

  // Determine color based on performance
  const getBarColor = (score: number) => {
    if (score >= 80) return { bg: colors.strong, border: colors.strongBorder }
    if (score < 60) return { bg: colors.weak, border: colors.weakBorder }
    return { bg: colors.primary, border: colors.border }
  }

  const chartData = {
    labels: topics.map(topic => 
      topic.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    ),
    datasets: [
      {
        label: 'Score',
        data: scores,
        backgroundColor: scores.map(score => getBarColor(score).bg),
        borderColor: scores.map(score => getBarColor(score).border),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
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
        borderColor: colors.border,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
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
            size: 11,
          },
          maxRotation: 45,
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
  }

  // Calculate statistics
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  const strongTopics = topics.filter((_, index) => scores[index] >= 80)
  const weakTopics = topics.filter((_, index) => scores[index] < 60)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Topic Breakdown</span>
          <span className="text-sm font-normal text-gray-500">
            Average: {averageScore}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Topic Analysis */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          {strongTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">
                Strong Areas ({strongTopics.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {strongTopics.map(topic => (
                  <span
                    key={topic}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                  >
                    {topic.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {weakTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-1">
                Focus Areas ({weakTopics.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {weakTopics.map(topic => (
                  <span
                    key={topic}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                  >
                    {topic.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {strongTopics.length === 0 && weakTopics.length === 0 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                All topics are in the good range (60-79%)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}