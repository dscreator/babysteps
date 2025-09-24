import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiService } from '../../services/apiService'
import toast from 'react-hot-toast'

interface ConsentStatus {
  hasValidConsent: boolean
  consents: any[]
  missingConsents: string[]
}

export function COPPACompliance() {
  const { user } = useAuth()
  const [requiresConsent, setRequiresConsent] = useState<boolean | null>(null)
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConsentForm, setShowConsentForm] = useState(false)

  useEffect(() => {
    checkCOPPARequirement()
  }, [])

  const checkCOPPARequirement = async () => {
    try {
      const [coppaResponse, statusResponse] = await Promise.all([
        apiService.get('/privacy/coppa/check'),
        apiService.get('/privacy/coppa/consent-status')
      ])

      if (coppaResponse.success) {
        setRequiresConsent(coppaResponse.data.requiresParentalConsent)
      }

      if (statusResponse.success) {
        setConsentStatus(statusResponse.data)
      }
    } catch (error) {
      console.error('Failed to check COPPA requirement:', error)
      toast.error('Failed to load consent information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!requiresConsent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-green-500 text-xl">✅</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              No Parental Consent Required
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Based on your grade level, parental consent is not required for your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (consentStatus?.hasValidConsent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-green-500 text-xl">✅</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Parental Consent Verified
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All required parental consents have been obtained and verified.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* COPPA Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-500 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Parental Consent Required
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Since you're under 13, we need your parent or guardian's consent to collect and use your information in accordance with COPPA (Children's Online Privacy Protection Act).
            </p>
          </div>
        </div>
      </div>

      {/* Missing Consents */}
      {consentStatus && consentStatus.missingConsents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Required Consents
          </h4>
          <div className="space-y-2">
            {consentStatus.missingConsents.map(consentType => (
              <div key={consentType} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700 capitalize">
                  {consentType.replace('_', ' ')} Consent
                </span>
                <span className="text-xs text-red-600 font-medium">Missing</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={() => setShowConsentForm(true)}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Get Parental Consent
        </button>
      </div>

      {/* Consent Form Modal */}
      {showConsentForm && (
        <ParentalConsentForm
          onClose={() => setShowConsentForm(false)}
          onSuccess={() => {
            setShowConsentForm(false)
            checkCOPPARequirement()
            toast.success('Consent request sent to parent')
          }}
          missingConsents={consentStatus?.missingConsents || []}
        />
      )}
    </div>
  )
}

interface ParentalConsentFormProps {
  onClose: () => void
  onSuccess: () => void
  missingConsents: string[]
}

function ParentalConsentForm({ onClose, onSuccess, missingConsents }: ParentalConsentFormProps) {
  const [parentEmail, setParentEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!parentEmail || !parentName) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      // Submit consent requests for each missing consent type
      for (const consentType of missingConsents) {
        const response = await apiService.post('/privacy/coppa/consent', {
          parentEmail,
          parentName,
          consentType,
          consentGiven: false, // Will be updated when parent responds
          verificationMethod: 'email'
        })

        if (!response.success) {
          throw new Error(`Failed to create ${consentType} consent request`)
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to submit consent request:', error)
      toast.error('Failed to submit consent request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Request Parental Consent
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent/Guardian Email *
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="parent@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent/Guardian Name *
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Full name"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• We'll send an email to your parent/guardian</li>
              <li>• They'll need to review and approve the consent</li>
              <li>• Once approved, you can use all app features</li>
              <li>• This process ensures your privacy is protected</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Required Consents:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {missingConsents.map(consent => (
                <li key={consent} className="capitalize">
                  • {consent.replace('_', ' ')} consent
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Consent Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}