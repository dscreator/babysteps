import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { EnglishProgressDashboard } from '../components/practice/english/EnglishProgressDashboard'
import { Button } from '../components/common/Button'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'

export function EnglishProgressPage() {
  const navigate = useNavigate()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportProgress = async () => {
    setIsExporting(true)
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would generate and download a PDF report
      const blob = new Blob(['English Progress Report - Generated on ' + new Date().toLocaleDateString()], {
        type: 'text/plain'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `english-progress-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My English Progress',
          text: 'Check out my English learning progress on the ISEE AI Tutor!',
          url: window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Progress link copied to clipboard!')
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">English Progress</h1>
                <p className="text-gray-600">
                  Comprehensive analysis of your reading comprehension and vocabulary development
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareProgress}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProgress}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Report'}
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Dashboard */}
        <EnglishProgressDashboard />

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/practice/english')}
              size="lg"
              className="px-8"
            >
              Continue English Practice
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/practice/vocabulary')}
              size="lg"
              className="px-8"
            >
              Practice Vocabulary
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}