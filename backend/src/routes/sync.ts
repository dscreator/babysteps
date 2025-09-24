import { Router } from 'express'
import { authenticateUser } from '../middleware/auth'
import { dataSyncService } from '../services/dataSyncService'
import { dataMigrationService } from '../services/dataMigrationService'
import { practiceService } from '../services/practiceService'
import { progressService } from '../services/progressService'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

/**
 * Initialize sync for a user
 */
router.post('/initialize', async (req, res) => {
  try {
    const userId = req.user!.id

    await dataSyncService.initializeSync(userId)

    res.json({
      success: true,
      message: 'Sync initialized successfully'
    })
  } catch (error) {
    console.error('Failed to initialize sync:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize sync'
    })
  }
})

/**
 * Save data with sync
 */
router.post('/save', async (req, res) => {
  try {
    const userId = req.user!.id
    const { type, data, timestamp, deviceId } = req.body

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Type and data are required'
      })
    }

    const syncData = await dataSyncService.saveData(userId, type, data, deviceId)

    res.json({
      success: true,
      data: syncData
    })
  } catch (error) {
    console.error('Failed to save sync data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save data'
    })
  }
})

/**
 * Get sync status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user!.id

    const status = await dataSyncService.getSyncStatus(userId)

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync status'
    })
  }
})

/**
 * Force sync queued data
 */
router.post('/force', async (req, res) => {
  try {
    const userId = req.user!.id

    await dataSyncService.processSyncQueue(userId)

    res.json({
      success: true,
      message: 'Sync completed successfully'
    })
  } catch (error) {
    console.error('Failed to force sync:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync data'
    })
  }
})

/**
 * Create data backup
 */
router.post('/backup', async (req, res) => {
  try {
    const userId = req.user!.id

    const backup = await dataSyncService.createBackup(userId)

    res.json({
      success: true,
      data: backup
    })
  } catch (error) {
    console.error('Failed to create backup:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup'
    })
  }
})

/**
 * Restore from backup
 */
router.post('/restore/:backupId', async (req, res) => {
  try {
    const userId = req.user!.id
    const { backupId } = req.params

    await dataSyncService.restoreFromBackup(userId, backupId)

    res.json({
      success: true,
      message: 'Data restored successfully'
    })
  } catch (error) {
    console.error('Failed to restore from backup:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore data'
    })
  }
})

/**
 * Get migration status
 */
router.get('/migrations/status', async (req, res) => {
  try {
    const migrationCheck = await dataMigrationService.checkMigrationsNeeded()

    res.json({
      success: true,
      data: migrationCheck
    })
  } catch (error) {
    console.error('Failed to check migration status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check migrations'
    })
  }
})

/**
 * Run pending migrations
 */
router.post('/migrations/run', async (req, res) => {
  try {
    // Only allow admin users to run migrations
    if (req.user!.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    await dataMigrationService.runMigrations()

    res.json({
      success: true,
      message: 'Migrations completed successfully'
    })
  } catch (error) {
    console.error('Failed to run migrations:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run migrations'
    })
  }
})

/**
 * Get migration history
 */
router.get('/migrations/history', async (req, res) => {
  try {
    const userId = req.user!.id
    const history = await dataMigrationService.getMigrationHistory(userId)

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Failed to get migration history:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get migration history'
    })
  }
})

/**
 * Migrate user data
 */
router.post('/migrations/user', async (req, res) => {
  try {
    const userId = req.user!.id
    const { fromVersion, toVersion } = req.body

    if (!fromVersion || !toVersion) {
      return res.status(400).json({
        success: false,
        error: 'fromVersion and toVersion are required'
      })
    }

    await dataMigrationService.migrateUserData(userId, fromVersion, toVersion)

    res.json({
      success: true,
      message: 'User data migration completed successfully'
    })
  } catch (error) {
    console.error('Failed to migrate user data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to migrate user data'
    })
  }
})

/**
 * Sync practice data (for offline sync)
 */
router.post('/practice', async (req, res) => {
  try {
    const userId = req.user!.id
    const { sessions, answers } = req.body

    // Process synced practice sessions
    if (sessions && Array.isArray(sessions)) {
      for (const sessionData of sessions) {
        try {
          if (sessionData.id) {
            // Update existing session
            await practiceService.updateSession(
              sessionData.id,
              userId,
              sessionData
            )
          } else {
            // Create new session
            await practiceService.createSession(userId, sessionData)
          }
        } catch (error) {
          console.error('Failed to sync session:', sessionData.id, error)
        }
      }
    }

    // Process synced answers
    if (answers && Array.isArray(answers)) {
      for (const answerData of answers) {
        try {
          await practiceService.submitAnswer(userId, answerData)
        } catch (error) {
          console.error('Failed to sync answer:', answerData, error)
        }
      }
    }

    res.json({
      success: true,
      message: 'Practice data synced successfully'
    })
  } catch (error) {
    console.error('Failed to sync practice data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync practice data'
    })
  }
})

/**
 * Sync progress data (for offline sync)
 */
router.post('/progress', async (req, res) => {
  try {
    const userId = req.user!.id
    const { progressUpdates } = req.body

    if (progressUpdates && Array.isArray(progressUpdates)) {
      for (const update of progressUpdates) {
        try {
          await progressService.updateUserProgress(userId, update.subject)
        } catch (error) {
          console.error('Failed to sync progress update:', update, error)
        }
      }
    }

    res.json({
      success: true,
      message: 'Progress data synced successfully'
    })
  } catch (error) {
    console.error('Failed to sync progress data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync progress data'
    })
  }
})

/**
 * Health check endpoint for connectivity testing
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    status: 'healthy'
  })
})

/**
 * Cleanup sync for a user
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const userId = req.user!.id

    await dataSyncService.cleanupSync(userId)

    res.json({
      success: true,
      message: 'Sync cleanup completed'
    })
  } catch (error) {
    console.error('Failed to cleanup sync:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup sync'
    })
  }
})

export default router