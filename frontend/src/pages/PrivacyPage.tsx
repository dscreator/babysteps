
import { DashboardLayout } from '../components/common/DashboardLayout'
import { PrivacySettings } from '../components/privacy/PrivacySettings'
import { COPPACompliance } from '../components/privacy/COPPACompliance'
import { SyncStatus } from '../components/sync/SyncStatus'

export function PrivacyPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Data</h1>
          <p className="text-gray-600 mt-2">
            Manage your privacy settings, data, and parental consent requirements.
          </p>
        </div>

        {/* COPPA Compliance Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Parental Consent (COPPA Compliance)
          </h2>
          <COPPACompliance />
        </div>

        {/* Sync Status Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Synchronization
          </h2>
          <SyncStatus showDetails={true} />
        </div>

        {/* Privacy Settings Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Privacy Settings
          </h2>
          <PrivacySettings />
        </div>

        {/* Privacy Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Your Privacy Matters
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              We are committed to protecting your privacy and complying with all applicable privacy laws, including COPPA for users under 13.
            </p>
            <p>
              <strong>What we collect:</strong> Practice data, progress information, and usage analytics to improve your learning experience.
            </p>
            <p>
              <strong>How we use it:</strong> To personalize your study plan, track progress, and provide AI-powered tutoring.
            </p>
            <p>
              <strong>Your rights:</strong> You can view, export, or delete your data at any time using the controls above.
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Read our full Privacy Policy →
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}