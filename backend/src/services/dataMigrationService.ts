import { supabase } from '../config/supabase'

export interface MigrationScript {
  version: number
  name: string
  up: string
  down?: string
  description?: string
}

export interface MigrationStatus {
  id: string
  userId?: string
  migrationType: string
  fromVersion?: number
  toVersion: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  errorMessage?: string
  startedAt: string
  completedAt?: string
}

export class DataMigrationService {
  private migrations: MigrationScript[] = [
    {
      version: 1,
      name: 'Initial Schema',
      description: 'Initial database schema setup',
      up: `
        -- Initial schema is already applied
        SELECT 1;
      `
    },
    {
      version: 2,
      name: 'Add Data Sync Tables',
      description: 'Add tables for data synchronization and offline support',
      up: `
        -- This migration is handled by the SQL file
        SELECT 1;
      `
    }
  ]

  /**
   * Get current schema version
   */
  async getCurrentVersion(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('schema_versions')
        .select('version_number')
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.warn('No schema version found, assuming version 0')
        return 0
      }

      return data.version_number
    } catch (error) {
      console.error('Failed to get current schema version:', error)
      return 0
    }
  }

  /**
   * Check if migrations are needed
   */
  async checkMigrationsNeeded(): Promise<{
    needed: boolean
    currentVersion: number
    latestVersion: number
    pendingMigrations: MigrationScript[]
  }> {
    const currentVersion = await this.getCurrentVersion()
    const latestVersion = Math.max(...this.migrations.map(m => m.version))
    
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion)

    return {
      needed: pendingMigrations.length > 0,
      currentVersion,
      latestVersion,
      pendingMigrations
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
    const { needed, pendingMigrations } = await this.checkMigrationsNeeded()

    if (!needed) {
      console.log('No migrations needed')
      return
    }

    console.log(`Running ${pendingMigrations.length} pending migrations`)

    for (const migration of pendingMigrations) {
      await this.runMigration(migration)
    }

    console.log('All migrations completed successfully')
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: MigrationScript): Promise<void> {
    console.log(`Running migration ${migration.version}: ${migration.name}`)

    // Record migration start
    const migrationRecord = await this.createMigrationRecord({
      migrationType: 'schema',
      toVersion: migration.version,
      status: 'in_progress'
    })

    try {
      // Execute migration SQL
      const { error } = await supabase.rpc('execute_migration', {
        migration_sql: migration.up
      })

      if (error) {
        throw new Error(`Migration SQL failed: ${error.message}`)
      }

      // Record schema version
      await this.recordSchemaVersion(migration)

      // Update migration status
      await this.updateMigrationStatus(migrationRecord.id, 'completed')

      console.log(`Migration ${migration.version} completed successfully`)
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error)
      
      await this.updateMigrationStatus(
        migrationRecord.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )

      throw error
    }
  }

  /**
   * Migrate user data to new schema version
   */
  async migrateUserData(
    userId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<void> {
    console.log(`Migrating user data from version ${fromVersion} to ${toVersion}`)

    const migrationRecord = await this.createMigrationRecord({
      userId,
      migrationType: 'user_data',
      fromVersion,
      toVersion,
      status: 'in_progress'
    })

    try {
      // Apply user-specific data migrations
      await this.applyUserDataMigrations(userId, fromVersion, toVersion)

      await this.updateMigrationStatus(migrationRecord.id, 'completed')
      console.log(`User data migration completed for user: ${userId}`)
    } catch (error) {
      console.error(`User data migration failed for user ${userId}:`, error)
      
      await this.updateMigrationStatus(
        migrationRecord.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )

      throw error
    }
  }

  /**
   * Apply user-specific data migrations
   */
  private async applyUserDataMigrations(
    userId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<void> {
    // Example migration logic for different version ranges
    
    if (fromVersion < 2 && toVersion >= 2) {
      // Migration from v1 to v2: Add sync metadata to existing data
      await this.addSyncMetadataToUserData(userId)
    }

    // Add more migration logic as needed for future versions
  }

  /**
   * Add sync metadata to existing user data (example migration)
   */
  private async addSyncMetadataToUserData(userId: string): Promise<void> {
    // Update user progress records to include sync metadata
    const { error: progressError } = await supabase
      .from('user_progress')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (progressError) {
      throw new Error(`Failed to update user progress: ${progressError.message}`)
    }

    // Update practice sessions to include sync metadata
    const { error: sessionsError } = await supabase
      .from('practice_sessions')
      .update({
        session_data: supabase.raw(`
          COALESCE(session_data, '{}') || '{"migrated": true, "migration_version": 2}'::jsonb
        `)
      })
      .eq('user_id', userId)

    if (sessionsError) {
      throw new Error(`Failed to update practice sessions: ${sessionsError.message}`)
    }
  }

  /**
   * Create backup before migration
   */
  async createPreMigrationBackup(userId?: string): Promise<string> {
    const backupId = crypto.randomUUID()
    
    try {
      let backupData: any = {}

      if (userId) {
        // Backup specific user data
        const [profile, progress, sessions, interactions] = await Promise.all([
          this.getUserProfile(userId),
          this.getUserProgress(userId),
          this.getUserSessions(userId),
          this.getUserInteractions(userId)
        ])

        backupData = {
          type: 'user_backup',
          userId,
          profile,
          progress,
          sessions,
          interactions
        }
      } else {
        // Backup schema information
        const { data: schemaVersions } = await supabase
          .from('schema_versions')
          .select('*')
          .order('version_number', { ascending: true })

        backupData = {
          type: 'schema_backup',
          schemaVersions
        }
      }

      const { error } = await supabase
        .from('data_backups')
        .insert({
          id: backupId,
          user_id: userId,
          backup_data: backupData,
          backup_type: 'full',
          created_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Failed to create backup: ${error.message}`)
      }

      console.log(`Pre-migration backup created: ${backupId}`)
      return backupId
    } catch (error) {
      console.error('Failed to create pre-migration backup:', error)
      throw error
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(version: number): Promise<void> {
    const migration = this.migrations.find(m => m.version === version)
    
    if (!migration || !migration.down) {
      throw new Error(`No rollback script available for version ${version}`)
    }

    console.log(`Rolling back migration ${version}: ${migration.name}`)

    const migrationRecord = await this.createMigrationRecord({
      migrationType: 'rollback',
      fromVersion: version,
      toVersion: version - 1,
      status: 'in_progress'
    })

    try {
      // Execute rollback SQL
      const { error } = await supabase.rpc('execute_migration', {
        migration_sql: migration.down
      })

      if (error) {
        throw new Error(`Rollback SQL failed: ${error.message}`)
      }

      // Remove schema version record
      await supabase
        .from('schema_versions')
        .delete()
        .eq('version_number', version)

      await this.updateMigrationStatus(migrationRecord.id, 'completed')
      console.log(`Migration ${version} rolled back successfully`)
    } catch (error) {
      console.error(`Rollback failed for version ${version}:`, error)
      
      await this.updateMigrationStatus(
        migrationRecord.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )

      throw error
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(userId?: string): Promise<MigrationStatus[]> {
    let query = supabase
      .from('data_migrations')
      .select('*')
      .order('started_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get migration history: ${error.message}`)
    }

    return data?.map(this.mapMigrationStatus) || []
  }

  /**
   * Create migration record
   */
  private async createMigrationRecord(migration: {
    userId?: string
    migrationType: string
    fromVersion?: number
    toVersion: number
    status: 'pending' | 'in_progress'
  }): Promise<MigrationStatus> {
    const migrationData = {
      user_id: migration.userId,
      migration_type: migration.migrationType,
      from_version: migration.fromVersion,
      to_version: migration.toVersion,
      status: migration.status,
      started_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('data_migrations')
      .insert(migrationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create migration record: ${error.message}`)
    }

    return this.mapMigrationStatus(data)
  }

  /**
   * Update migration status
   */
  private async updateMigrationStatus(
    id: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      completed_at: new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabase
      .from('data_migrations')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Failed to update migration status:', error)
    }
  }

  /**
   * Record schema version
   */
  private async recordSchemaVersion(migration: MigrationScript): Promise<void> {
    const { error } = await supabase
      .from('schema_versions')
      .insert({
        version_number: migration.version,
        version_name: migration.name,
        migration_script: migration.up,
        rollback_script: migration.down,
        applied_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to record schema version: ${error.message}`)
    }
  }

  // Helper methods for data retrieval
  private async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  private async getUserProgress(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserSessions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  }

  private async getUserInteractions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  }

  private mapMigrationStatus(data: any): MigrationStatus {
    return {
      id: data.id,
      userId: data.user_id,
      migrationType: data.migration_type,
      fromVersion: data.from_version,
      toVersion: data.to_version,
      status: data.status,
      errorMessage: data.error_message,
      startedAt: data.started_at,
      completedAt: data.completed_at
    }
  }
}

export const dataMigrationService = new DataMigrationService()