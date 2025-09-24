import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { parentService } from '../../services/parentService'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Input } from '../common/Input'

interface GrantParentAccessProps {
  onClose?: () => void
}

export const GrantParentAccess: React.FC<GrantParentAccessProps> = ({ onClose }) => {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const grantAccessMutation = useMutation(
    (code: string) => parentService.grantParentAccess(code),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userProfile')
        setAccessCode('')
        setError('')
        alert('Parent access granted successfully!')
        onClose?.()
      },
      onError: (err: any) => {
        setError(err.response?.data?.error || 'Failed to grant parent access')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) {
      setError('Please enter the access code')
      return
    }
    setError('')
    grantAccessMutation.mutate(accessCode.trim().toUpperCase())
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Grant Parent Access</h2>
        <p className="text-gray-600">
          Enter the access code your parent received via email to give them access to your progress.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Access Code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          placeholder="Enter 8-character code"
          maxLength={8}
          className="text-center text-lg font-mono tracking-wider"
          helperText="The code is case-insensitive and 8 characters long"
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={grantAccessMutation.isLoading}
          >
            Grant Access
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={grantAccessMutation.isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Privacy Note:</strong> Your parent will be able to see:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your overall progress and scores</li>
            <li>Study consistency and time spent</li>
            <li>Areas where you're doing well or need improvement</li>
            <li>Recent practice activity</li>
          </ul>
          <p className="mt-3">
            <strong>They will NOT see:</strong> Specific answers, detailed essay content, or chat conversations.
          </p>
        </div>
      </div>
    </Card>
  )
}