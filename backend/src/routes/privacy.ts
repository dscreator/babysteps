import { Router } from 'express'
import { authenticateUser } from '../middleware/auth'
import { privacyComplianceService } from '../services/privacyComplianceService'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

/**
 * Check if user requires parental consent
 */
router.get('/coppa/check', async (req, res) => {
  try {
    const userId = req.user!.id

    const requiresConsent = await privacyComplianceService.requiresParentalConsent(userId)

    res.json({
      success: true,
      data: {
        requiresParentalConsent: requiresConsent
      }
    })
  } catch (error) {
    console.error('Failed to check COPPA requirement:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check COPPA requirement'
    })
  }
})

/**
 * Get parental consent status
 */
router.get('/coppa/consent-status', async (req, res) => {
  try {
    const userId = req.user!.id

    const consentStatus = await privacyComplianceService.getParentalConsentStatus(userId)

    res.json({
      success: true,
      data: consentStatus
    })
  } catch (error) {
    console.error('Failed to get consent status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get consent status'
    })
  }
})

/**
 * Create parental consent record
 */
router.post('/coppa/consent', async (req, res) => {
  try {
    const userId = req.user!.id
    const {
      parentEmail,
      parentName,
      consentType,
      consentGiven,
      verificationMethod
    } = req.body

    if (!parentEmail || !parentName || !consentType || consentGiven === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    const consent = await privacyComplianceService.createParentalConsent({
      studentId: userId,
      parentEmail,
      parentName,
      consentType,
      consentGiven,
      consentDate: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      verificationMethod: verificationMethod || 'email',
      verificationStatus: 'pending'
    })

    res.json({
      success: true,
      data: consent
    })
  } catch (error) {
    console.error('Failed to create parental consent:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create consent'
    })
  }
})

/**
 * Request data deletion
 */
router.post('/data-deletion/request', async (req, res) => {
  try {
    const userId = req.user!.id
    const { requestType, dataTypes, reason } = req.body

    if (!requestType) {
      return res.status(400).json({
        success: false,
        error: 'Request type is required'
      })
    }

    const deletionRequest = await privacyComplianceService.requestDataDeletion({
      userId,
      requestType,
      requestedBy: 'user',
      requestDate: new Date().toISOString(),
      status: 'pending',
      dataTypes: dataTypes || [],
      reason
    })

    // Log the request
    await privacyComplianceService.logAuditEvent(
      userId,
      'data_deletion_requested',
      'privacy',
      deletionRequest.id,
      { requestType, dataTypes, reason },
      req.ip,
      req.get('User-Agent')
    )

    res.json({
      success: true,
      data: deletionRequest
    })
  } catch (error) {
    console.error('Failed to request data deletion:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request data deletion'
    })
  }
})

/**
 * Get user's audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const userId = req.user!.id
    const {
      action,
      resourceType,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query

    const auditLogs = await privacyComplianceService.getAuditLogs(userId, {
      action: action as string,
      resourceType: resourceType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })

    res.json({
      success: true,
      data: auditLogs
    })
  } catch (error) {
    console.error('Failed to get audit logs:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit logs'
    })
  }
})

/**
 * Export user data
 */
router.get('/data-export', async (req, res) => {
  try {
    const userId = req.user!.id
    const { format = 'json' } = req.query

    // Generate data export using database function
    const { data: exportData, error } = await (await import('../config/supabase')).supabase
      .rpc('generate_user_data_export', { target_user_id: userId })

    if (error) {
      throw new Error(`Failed to generate data export: ${error.message}`)
    }

    // Log the export request
    await privacyComplianceService.logAuditEvent(
      userId,
      'data_exported',
      'privacy',
      undefined,
      { format, exportSize: JSON.stringify(exportData).length },
      req.ip,
      req.get('User-Agent')
    )

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`)
      res.json(exportData)
    } else {
      // For other formats, return JSON for now
      res.json({
        success: true,
        data: exportData,
        message: 'Data export generated successfully'
      })
    }
  } catch (error) {
    console.error('Failed to export user data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export data'
    })
  }
})

/**
 * Get privacy settings
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user!.id

    const { data: settings, error } = await (await import('../config/supabase')).supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get privacy settings: ${error.message}`)
    }

    // Return default settings if none exist
    const defaultSettings = {
      dataCollectionConsent: false,
      analyticsConsent: false,
      marketingConsent: false,
      thirdPartySharing: false,
      dataRetentionPeriod: 730,
      autoDeleteInactive: true,
      exportFormat: 'json',
      notificationPreferences: {}
    }

    res.json({
      success: true,
      data: settings || defaultSettings
    })
  } catch (error) {
    console.error('Failed to get privacy settings:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get privacy settings'
    })
  }
})

/**
 * Update privacy settings
 */
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user!.id
    const {
      dataCollectionConsent,
      analyticsConsent,
      marketingConsent,
      thirdPartySharing,
      dataRetentionPeriod,
      autoDeleteInactive,
      exportFormat,
      notificationPreferences
    } = req.body

    const settingsData = {
      user_id: userId,
      data_collection_consent: dataCollectionConsent,
      analytics_consent: analyticsConsent,
      marketing_consent: marketingConsent,
      third_party_sharing: thirdPartySharing,
      data_retention_period: dataRetentionPeriod,
      auto_delete_inactive: autoDeleteInactive,
      export_format: exportFormat,
      notification_preferences: notificationPreferences || {}
    }

    const { data: settings, error } = await (await import('../config/supabase')).supabase
      .from('privacy_settings')
      .upsert(settingsData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update privacy settings: ${error.message}`)
    }

    // Log the settings update
    await privacyComplianceService.logAuditEvent(
      userId,
      'privacy_settings_updated',
      'privacy',
      settings.id,
      { updatedFields: Object.keys(req.body) },
      req.ip,
      req.get('User-Agent')
    )

    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Failed to update privacy settings:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update privacy settings'
    })
  }
})

/**
 * Anonymize user data (partial deletion)
 */
router.post('/anonymize', async (req, res) => {
  try {
    const userId = req.user!.id
    const { dataTypes } = req.body

    if (!dataTypes || !Array.isArray(dataTypes)) {
      return res.status(400).json({
        success: false,
        error: 'Data types array is required'
      })
    }

    // Use database function to anonymize data
    const { data: anonymizedCount, error } = await (await import('../config/supabase')).supabase
      .rpc('anonymize_user_data', {
        target_user_id: userId,
        data_types: dataTypes
      })

    if (error) {
      throw new Error(`Failed to anonymize data: ${error.message}`)
    }

    // Log the anonymization
    await privacyComplianceService.logAuditEvent(
      userId,
      'data_anonymized',
      'privacy',
      undefined,
      { dataTypes, anonymizedCount },
      req.ip,
      req.get('User-Agent')
    )

    res.json({
      success: true,
      data: {
        anonymizedCount,
        dataTypes
      },
      message: 'Data anonymized successfully'
    })
  } catch (error) {
    console.error('Failed to anonymize data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to anonymize data'
    })
  }
})

/**
 * Admin route: Process data deletion request
 */
router.post('/admin/process-deletion/:requestId', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    const { requestId } = req.params

    await privacyComplianceService.processDataDeletion(requestId)

    res.json({
      success: true,
      message: 'Data deletion processed successfully'
    })
  } catch (error) {
    console.error('Failed to process data deletion:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process data deletion'
    })
  }
})

/**
 * Admin route: Apply data retention policy
 */
router.post('/admin/retention-policy', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    const result = await privacyComplianceService.applyDataRetentionPolicy()

    res.json({
      success: true,
      data: result,
      message: 'Data retention policy applied successfully'
    })
  } catch (error) {
    console.error('Failed to apply retention policy:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply retention policy'
    })
  }
})

export default router