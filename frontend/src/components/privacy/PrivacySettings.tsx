import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/apiService'
import toast from 'react-hot-toast'

interface PrivacySettings {
  dataCollectionConsent: boolean
  analyticsConsent: boolean
  marketingConsent: boolean
  thirdPartySharing: boolean
  dataRetentionPeriod: number
  autoDeleteInactive: boolean
  exportFormat: 'json' | 'csv' | 'xml'
  notificationPreferences: Record<string, any>
}

export function PrivacySettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PrivacySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDataExport, setShowDataExport] = useState(false)
  const [showDataDeletion, setShowDataDeletion] = useState(false)

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      const response = await apiService.get('/privacy/settings')
      
      if (response.success) {
        setSettings(response.data)
      } else {
        toast.error('Failed to load privacy settings')
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
      toast.error('Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updatedSettings: Partial<PrivacySettings>) => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await apiService.put('/privacy/settings', updatedSettings)
      
      if (response.success) {
        setSettings({ ...settings, ...updatedSettings })
        toast.success('Privacy settings updated')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof PrivacySettings, value: boolean) => {
    if (!settings) return
    
    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)
    saveSettings({ [key]: value })
  }

  const handleRetentionPeriodChange = (period: number) => {
    if (!settings) return
    
    const updatedSettings = { ...settings, dataRetentionPeriod: period }
    setSettings(updatedSettings)
    saveSettings({ dataRetentionPeriod: period })
  }

  const exportUserData = async () => {
    try {
      const response = await fetch('/api/privacy/data-export', {
        headers: {
          'Authorization': `Bearer ${(await import('../../lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-data-${user?.id}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Data export downloaded')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-red-600">Failed to load privacy settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Collection Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Data Collection Consent
              </label>
              <p className="text-sm text-gray-600">
                Allow collection of practice data to improve your learning experience
              </p>
            </div>
            <button
              onClick={() => handleToggle('dataCollectionConsent', !settings.dataCollectionConsent)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.dataCollectionConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.dataCollectionConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Analytics Consent
              </label>
              <p className="text-sm text-gray-600">
                Allow anonymous usage analytics to help improve the app
              </p>
            </div>
            <button
              onClick={() => handleToggle('analyticsConsent', !settings.analyticsConsent)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.analyticsConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.analyticsConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Marketing Communications
              </label>
              <p className="text-sm text-gray-600">
                Receive updates about new features and study tips
              </p>
            </div>
            <button
              onClick={() => handleToggle('marketingConsent', !settings.marketingConsent)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.marketingConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.marketingConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Third-Party Sharing
              </label>
              <p className="text-sm text-gray-600">
                Allow sharing anonymized data with educational partners
              </p>
            </div>
            <button
              onClick={() => handleToggle('thirdPartySharing', !settings.thirdPartySharing)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.thirdPartySharing ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.thirdPartySharing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Retention Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Data Retention Period
            </label>
            <select
              value={settings.dataRetentionPeriod}
              onChange={(e) => handleRetentionPeriodChange(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={365}>1 Year</option>
              <option value={730}>2 Years (Default)</option>
              <option value={1095}>3 Years</option>
              <option value={1825}>5 Years</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              How long to keep your data after account inactivity
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Auto-Delete Inactive Data
              </label>
              <p className="text-sm text-gray-600">
                Automatically delete data after the retention period
              </p>
            </div>
            <button
              onClick={() => handleToggle('autoDeleteInactive', !settings.autoDeleteInactive)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoDeleteInactive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoDeleteInactive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Export Your Data</h4>
              <p className="text-sm text-gray-600">
                Download a copy of all your data
              </p>
            </div>
            <button
              onClick={exportUserData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Export Data
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Your Data</h4>
              <p className="text-sm text-gray-600">
                Request deletion of your personal data
              </p>
            </div>
            <button
              onClick={() => setShowDataDeletion(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Request Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Data Deletion Modal */}
      {showDataDeletion && (
        <DataDeletionModal
          onClose={() => setShowDataDeletion(false)}
          onConfirm={() => {
            setShowDataDeletion(false)
            toast.success('Data deletion request submitted')
          }}
        />
      )}
    </div>
  )
}

interface DataDeletionModalProps {
  onClose: () => void
  onConfirm: () => void
}

function DataDeletionModal({ onClose, onConfirm }: DataDeletionModalProps) {
  const [requestType, setRequestType] = useState<'partial' | 'complete'>('partial')
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const dataTypes = [
    { id: 'practice_data', label: 'Practice Sessions', description: 'Math, English, and Essay practice data' },
    { id: 'progress_data', label: 'Progress Tracking', description: 'Performance analytics and achievements' },
    { id: 'essay_data', label: 'Essay Submissions', description: 'Written essays and AI feedback' },
    { id: 'chat_data', label: 'AI Tutor Conversations', description: 'Chat history with AI tutor' },
    { id: 'sync_data', label: 'Sync Data', description: 'Offline sync and backup data' }
  ]

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await apiService.post('/privacy/data-deletion/request', {
        requestType,
        dataTypes: requestType === 'complete' ? [] : selectedDataTypes,
        reason
      })

      if (response.success) {
        onConfirm()
      } else {
        toast.error('Failed to submit deletion request')
      }
    } catch (error) {
      console.error('Failed to submit deletion request:', error)
      toast.error('Failed to submit deletion request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Data Deletion</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Deletion Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="partial"
                  checked={requestType === 'partial'}
                  onChange={(e) => setRequestType(e.target.value as 'partial')}
                  className="mr-2"
                />
                <span className="text-sm">Partial - Delete specific data types</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="complete"
                  checked={requestType === 'complete'}
                  onChange={(e) => setRequestType(e.target.value as 'complete')}
                  className="mr-2"
                />
                <span className="text-sm">Complete - Delete all data and close account</span>
              </label>
            </div>
          </div>

          {requestType === 'partial' && (
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Select Data Types to Delete
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dataTypes.map(type => (
                  <label key={type.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedDataTypes.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataTypes([...selectedDataTypes, type.id])
                        } else {
                          setSelectedDataTypes(selectedDataTypes.filter(id => id !== type.id))
                        }
                      }}
                      className="mr-2 mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium">{type.label}</span>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please let us know why you're requesting data deletion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (requestType === 'partial' && selectedDataTypes.length === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}