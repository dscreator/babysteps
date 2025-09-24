import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parentService } from '../../services/parentService'
import { ParentNotificationPreferences } from '../../types/parent'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<ParentNotificationPreferences>({
    progressMilestones: true,
    studyReminders: true,
    weeklyReports: true,
    emailFrequency: 'weekly'
  })

  const queryClient = useQueryClient()

  // For now, we'll use local state since we don't have a get preferences endpoint
  // In a full implementation, you'd fetch current preferences from the API

  const updatePreferencesMutation = useMutation(
    (newPreferences: ParentNotificationPreferences) => 
      parentService.updateNotificationPreferences(newPreferences),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parentProfile')
        alert('Notification preferences updated successfully!')
      },
      onError: (error: any) => {
        console.error('Failed to update preferences:', error)
        alert('Failed to update notification preferences. Please try again.')
      }
    }
  )

  const handlePreferenceChange = (key: keyof ParentNotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences)
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h3>
      
      <div className="space-y-6">
        {/* Email Notifications */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Progress Milestones</label>
                <p className="text-sm text-gray-500">
                  Get notified when your child achieves significant improvements or milestones
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.progressMilestones}
                  onChange={(e) => handlePreferenceChange('progressMilestones', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Study Reminders</label>
                <p className="text-sm text-gray-500">
                  Receive reminders when your child hasn't practiced for a few days
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.studyReminders}
                  onChange={(e) => handlePreferenceChange('studyReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
                <p className="text-sm text-gray-500">
                  Get comprehensive weekly progress summaries every Sunday
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weeklyReports}
                  onChange={(e) => handlePreferenceChange('weeklyReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Frequency */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Email Frequency</h4>
          <div className="space-y-2">
            {[
              { value: 'daily', label: 'Daily', description: 'Receive notifications as they happen' },
              { value: 'weekly', label: 'Weekly', description: 'Receive a summary once per week' },
              { value: 'monthly', label: 'Monthly', description: 'Receive a summary once per month' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emailFrequency"
                  value={option.value}
                  checked={preferences.emailFrequency === option.value}
                  onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Privacy & Data</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• We only send notifications about progress and study habits</li>
            <li>• Your email is never shared with third parties</li>
            <li>• You can opt out of any notification type at any time</li>
            <li>• Specific answers and essay content are never included in emails</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            loading={updatePreferencesMutation.isLoading}
            variant="primary"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  )
}