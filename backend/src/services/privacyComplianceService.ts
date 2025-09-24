import { supabase } from '../config/supabase'

export interface ParentalConsent {
  id: string
  studentId: string
  parentEmail: string
  parentName: string
  consentType: 'registration' | 'data_collection' | 'communication'
  consentGiven: boolean
  consentDate: string
  ipAddress?: string
  userAgent?: string
  verificationMethod: 'email' | 'phone' | 'document'
  verificationStatus: 'pending' | 'verified' | 'rejected'
  expiresAt?: string
}

export interface DataDeletionRequest {
  id: string
  userId: string
  requestType: 'partial' | 'complete'
  requestedBy: 'user' | 'parent' | 'admin'
  requestDate: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  completedDate?: string
  dataTypes: string[]
  reason?: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export class PrivacyComplianceService {
  /**
   * Check if user requires parental consent (under 13)
   */
  async requiresParentalConsent(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('exam_date, grade_level, created_at')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return true // Default to requiring consent if uncertain
      }

      // Calculate approximate age based on grade level
      // Grade 6 = ~11 years, Grade 7 = ~12 years, Grade 8 = ~13 years
      const approximateAge = user.grade_level + 5

      return approximateAge < 13
    } catch (error) {
      console.error('Failed to check parental consent requirement:', error)
      return true // Default to requiring consent
    }
  }

  /**
   * Create parental consent record
   */
  async createParentalConsent(consent: Omit<ParentalConsent, 'id'>): Promise<ParentalConsent> {
    try {
      const consentData = {
        student_id: consent.studentId,
        parent_email: consent.parentEmail,
        parent_name: consent.parentName,
        consent_type: consent.consentType,
        consent_given: consent.consentGiven,
        consent_date: consent.consentDate,
        ip_address: consent.ipAddress,
        user_agent: consent.userAgent,
        verification_method: consent.verificationMethod,
        verification_status: consent.verificationStatus,
        expires_at: consent.expiresAt
      }

      const { data, error } = await supabase
        .from('parental_consents')
        .insert(consentData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create parental consent: ${error.message}`)
      }

      // Log the consent creation
      await this.logAuditEvent(consent.studentId, 'parental_consent_created', 'consent', data.id, {
        consentType: consent.consentType,
        parentEmail: consent.parentEmail,
        consentGiven: consent.consentGiven
      })

      return this.mapParentalConsent(data)
    } catch (error) {
      console.error('Failed to create parental consent:', error)
      throw error
    }
  }

  /**
   * Get parental consent status for a student
   */
  async getParentalConsentStatus(studentId: string): Promise<{
    hasValidConsent: boolean
    consents: ParentalConsent[]
    missingConsents: string[]
  }> {
    try {
      const { data: consents, error } = await supabase
        .from('parental_consents')
        .select('*')
        .eq('student_id', studentId)
        .eq('consent_given', true)
        .eq('verification_status', 'verified')

      if (error) {
        throw new Error(`Failed to get parental consent status: ${error.message}`)
      }

      const consentRecords = (consents || []).map(this.mapParentalConsent)
      const requiredConsents = ['registration', 'data_collection', 'communication']
      const existingConsentTypes = consentRecords.map(c => c.consentType)
      const missingConsents = requiredConsents.filter(type => !existingConsentTypes.includes(type))

      // Check if consents are still valid (not expired)
      const validConsents = consentRecords.filter(consent => {
        if (!consent.expiresAt) return true
        return new Date(consent.expiresAt) > new Date()
      })

      return {
        hasValidConsent: missingConsents.length === 0 && validConsents.length === consentRecords.length,
        consents: validConsents,
        missingConsents
      }
    } catch (error) {
      console.error('Failed to get parental consent status:', error)
      throw error
    }
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(request: Omit<DataDeletionRequest, 'id'>): Promise<DataDeletionRequest> {
    try {
      const deletionData = {
        user_id: request.userId,
        request_type: request.requestType,
        requested_by: request.requestedBy,
        request_date: request.requestDate,
        status: request.status,
        data_types: request.dataTypes,
        reason: request.reason
      }

      const { data, error } = await supabase
        .from('data_deletion_requests')
        .insert(deletionData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create data deletion request: ${error.message}`)
      }

      // Log the deletion request
      await this.logAuditEvent(request.userId, 'data_deletion_requested', 'deletion_request', data.id, {
        requestType: request.requestType,
        requestedBy: request.requestedBy,
        dataTypes: request.dataTypes
      })

      return this.mapDataDeletionRequest(data)
    } catch (error) {
      console.error('Failed to request data deletion:', error)
      throw error
    }
  }

  /**
   * Process data deletion request
   */
  async processDataDeletion(requestId: string): Promise<void> {
    try {
      // Get the deletion request
      const { data: request, error: requestError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (requestError || !request) {
        throw new Error('Data deletion request not found')
      }

      // Update status to processing
      await supabase
        .from('data_deletion_requests')
        .update({ status: 'processing' })
        .eq('id', requestId)

      const userId = request.user_id
      const dataTypes = request.data_types || []

      // Delete data based on request type
      if (request.request_type === 'complete') {
        await this.deleteAllUserData(userId)
      } else {
        await this.deletePartialUserData(userId, dataTypes)
      }

      // Update status to completed
      await supabase
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString()
        })
        .eq('id', requestId)

      // Log completion
      await this.logAuditEvent(userId, 'data_deletion_completed', 'deletion_request', requestId, {
        requestType: request.request_type,
        dataTypes
      })

    } catch (error) {
      console.error('Failed to process data deletion:', error)
      
      // Update status to failed
      await supabase
        .from('data_deletion_requests')
        .update({ status: 'failed' })
        .eq('id', requestId)

      throw error
    }
  }

  /**
   * Delete all user data (complete deletion)
   */
  private async deleteAllUserData(userId: string): Promise<void> {
    const tables = [
      'ai_interactions',
      'practice_sessions',
      'user_progress',
      'progress_snapshots',
      'achievements',
      'essay_submissions',
      'essay_analyses',
      'chat_conversations',
      'chat_messages',
      'data_sync',
      'offline_cache',
      'parental_consents',
      'parent_access'
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)

        if (error) {
          console.error(`Failed to delete from ${table}:`, error)
        }
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error)
      }
    }

    // Finally delete the user record
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.error('Failed to delete user record:', userError)
    }
  }

  /**
   * Delete partial user data based on specified types
   */
  private async deletePartialUserData(userId: string, dataTypes: string[]): Promise<void> {
    const dataTypeMapping: Record<string, string[]> = {
      'practice_data': ['practice_sessions', 'ai_interactions'],
      'progress_data': ['user_progress', 'progress_snapshots', 'achievements'],
      'essay_data': ['essay_submissions', 'essay_analyses'],
      'chat_data': ['chat_conversations', 'chat_messages'],
      'sync_data': ['data_sync', 'offline_cache']
    }

    for (const dataType of dataTypes) {
      const tables = dataTypeMapping[dataType] || []
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId)

          if (error) {
            console.error(`Failed to delete ${dataType} from ${table}:`, error)
          }
        } catch (error) {
          console.error(`Error deleting ${dataType} from ${table}:`, error)
        }
      }
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const auditData = {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditData)

      if (error) {
        console.error('Failed to log audit event:', error)
      }
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  /**
   * Get audit logs for a user
   */
  async getAuditLogs(
    userId: string,
    options: {
      action?: string
      resourceType?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })

      if (options.action) {
        query = query.eq('action', options.action)
      }

      if (options.resourceType) {
        query = query.eq('resource_type', options.resourceType)
      }

      if (options.startDate) {
        query = query.gte('timestamp', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('timestamp', options.endDate)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`)
      }

      return (data || []).map(this.mapAuditLogEntry)
    } catch (error) {
      console.error('Failed to get audit logs:', error)
      throw error
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data: string, userId: string): Promise<string> {
    // In a real implementation, this would use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    const encoded = Buffer.from(data).toString('base64')
    
    // Log encryption event
    await this.logAuditEvent(userId, 'data_encrypted', 'encryption', undefined, {
      dataLength: data.length
    })

    return encoded
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData: string, userId: string): Promise<string> {
    // In a real implementation, this would use proper decryption
    // For now, we'll use base64 decoding as a placeholder
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8')
    
    // Log decryption event
    await this.logAuditEvent(userId, 'data_decrypted', 'encryption', undefined, {
      dataLength: decoded.length
    })

    return decoded
  }

  /**
   * Implement data retention policy
   */
  async applyDataRetentionPolicy(): Promise<{
    deletedRecords: number
    processedUsers: number
  }> {
    let deletedRecords = 0
    let processedUsers = 0

    try {
      // Get users who haven't been active for more than 2 years
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      const { data: inactiveUsers, error } = await supabase
        .from('users')
        .select('id, updated_at')
        .lt('updated_at', twoYearsAgo.toISOString())

      if (error) {
        throw new Error(`Failed to get inactive users: ${error.message}`)
      }

      for (const user of inactiveUsers || []) {
        try {
          // Check if user has any recent activity
          const { data: recentSessions } = await supabase
            .from('practice_sessions')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', twoYearsAgo.toISOString())
            .limit(1)

          if (!recentSessions || recentSessions.length === 0) {
            // No recent activity, apply retention policy
            await this.deleteOldUserData(user.id, twoYearsAgo)
            deletedRecords++
          }

          processedUsers++
        } catch (error) {
          console.error(`Failed to process user ${user.id} for retention:`, error)
        }
      }

      console.log(`Data retention policy applied: ${deletedRecords} records deleted, ${processedUsers} users processed`)

      return { deletedRecords, processedUsers }
    } catch (error) {
      console.error('Failed to apply data retention policy:', error)
      throw error
    }
  }

  /**
   * Delete old user data based on retention policy
   */
  private async deleteOldUserData(userId: string, cutoffDate: Date): Promise<void> {
    const tables = [
      'ai_interactions',
      'practice_sessions',
      'progress_snapshots',
      'audit_logs'
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)
          .lt('created_at', cutoffDate.toISOString())

        if (error) {
          console.error(`Failed to delete old data from ${table}:`, error)
        }
      } catch (error) {
        console.error(`Error deleting old data from ${table}:`, error)
      }
    }

    // Log retention policy application
    await this.logAuditEvent(userId, 'retention_policy_applied', 'data_retention', undefined, {
      cutoffDate: cutoffDate.toISOString(),
      tables
    })
  }

  // Mapping functions
  private mapParentalConsent(data: any): ParentalConsent {
    return {
      id: data.id,
      studentId: data.student_id,
      parentEmail: data.parent_email,
      parentName: data.parent_name,
      consentType: data.consent_type,
      consentGiven: data.consent_given,
      consentDate: data.consent_date,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      verificationMethod: data.verification_method,
      verificationStatus: data.verification_status,
      expiresAt: data.expires_at
    }
  }

  private mapDataDeletionRequest(data: any): DataDeletionRequest {
    return {
      id: data.id,
      userId: data.user_id,
      requestType: data.request_type,
      requestedBy: data.requested_by,
      requestDate: data.request_date,
      status: data.status,
      completedDate: data.completed_date,
      dataTypes: data.data_types || [],
      reason: data.reason
    }
  }

  private mapAuditLogEntry(data: any): AuditLogEntry {
    return {
      id: data.id,
      userId: data.user_id,
      action: data.action,
      resourceType: data.resource_type,
      resourceId: data.resource_id,
      details: data.details || {},
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      timestamp: data.timestamp
    }
  }
}

export const privacyComplianceService = new PrivacyComplianceService()