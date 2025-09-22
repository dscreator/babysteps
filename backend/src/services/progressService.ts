import { supabase } from '../config/supabase'
import {
  UserProgress,
  ProgressSnapshot,
  PracticeSession
} from '../types/practice'
import { practiceService } from './practiceService'

export class ProgressService {
  /**
   * Get or create user progress for a subject
   */
  async getUserProgress(userId: string, subject: 'math' | 'english' | 'essay'): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Create new progress record
        return await this.createUserProgress(userId, subject)
      }
      throw new Error(`Failed to fetch user progress: ${error.message}`)
    }

    return this.mapUserProgress(data)
  }

  /**
   * Create initial user progress record
   */
  async createUserProgress(userId: string, subject: 'math' | 'english' | 'essay'): Promise<UserProgress> {
    const progressData = {
      user_id: userId,
      subject,
      overall_score: 0,
      topic_scores: {},
      streak_days: 0,
      total_practice_time: 0,
      weak_areas: [],
      strong_areas: []
    }

    const { data, error } = await supabase
      .from('user_progress')
      .insert(progressData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user progress: ${error.message}`)
    }

    return this.mapUserProgress(data)
  }

  /**
   * Update user progress based on recent sessions
   */
  async updateUserProgress(userId: string, subject: 'math' | 'english' | 'essay'): Promise<UserProgress> {
    // Get current progress
    const currentProgress = await this.getUserProgress(userId, subject)
    
    // Get session statistics
    const sessionStats = await practiceService.getSessionStats(userId, subject)
    
    // Get recent sessions for detailed analysis
    const recentSessions = await practiceService.getUserSessions(userId, {
      subject,
      limit: 50,
      includeActive: false
    })

    // Calculate new metrics
    const overallScore = sessionStats.averageAccuracy
    const topicScores = this.calculateTopicScores(recentSessions)
    const streakDays = await this.calculateStreakDays(userId)
    const { weakAreas, strongAreas } = this.identifyStrengthsAndWeaknesses(topicScores)

    // Update progress record
    const updateData = {
      overall_score: overallScore,
      topic_scores: topicScores,
      streak_days: streakDays,
      total_practice_time: sessionStats.totalPracticeTime,
      last_practice_date: recentSessions.length > 0 ? recentSessions[0].startTime.split('T')[0] : null,
      weak_areas: weakAreas,
      strong_areas: strongAreas
    }

    const { data, error } = await supabase
      .from('user_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('subject', subject)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user progress: ${error.message}`)
    }

    return this.mapUserProgress(data)
  }

  /**
   * Get progress for all subjects
   */
  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    const subjects: ('math' | 'english' | 'essay')[] = ['math', 'english', 'essay']
    const progressPromises = subjects.map(subject => this.getUserProgress(userId, subject))
    
    return await Promise.all(progressPromises)
  }

  /**
   * Create a progress snapshot for historical tracking
   */
  async createProgressSnapshot(userId: string, subject: 'math' | 'english' | 'essay'): Promise<ProgressSnapshot> {
    const progress = await this.getUserProgress(userId, subject)
    const sessionStats = await practiceService.getSessionStats(userId, subject)

    const performanceData = {
      overallScore: progress.overallScore,
      topicScores: progress.topicScores,
      totalSessions: sessionStats.totalSessions,
      totalQuestions: sessionStats.totalQuestions,
      correctAnswers: sessionStats.correctAnswers,
      averageAccuracy: sessionStats.averageAccuracy,
      totalPracticeTime: sessionStats.totalPracticeTime,
      streakDays: progress.streakDays,
      weakAreas: progress.weakAreas,
      strongAreas: progress.strongAreas
    }

    const snapshotData = {
      user_id: userId,
      subject,
      performance_data: performanceData
    }

    const { data, error } = await supabase
      .from('progress_snapshots')
      .insert(snapshotData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create progress snapshot: ${error.message}`)
    }

    return this.mapProgressSnapshot(data)
  }

  /**
   * Get progress snapshots for trend analysis
   */
  async getProgressSnapshots(
    userId: string,
    subject?: 'math' | 'english' | 'essay',
    days: number = 30
  ): Promise<ProgressSnapshot[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('progress_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (subject) {
      query = query.eq('subject', subject)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch progress snapshots: ${error.message}`)
    }

    return data?.map(this.mapProgressSnapshot) || []
  }

  /**
   * Update essay progress based on essay analyses
   */
  async updateEssayProgress(userId: string, essayAnalyses: any[]): Promise<UserProgress> {
    if (essayAnalyses.length === 0) {
      return await this.getUserProgress(userId, 'essay')
    }

    // Calculate overall essay performance
    const overallScore = essayAnalyses.reduce((sum, analysis) => sum + analysis.overall_score, 0) / essayAnalyses.length

    // Calculate topic scores by essay type
    const topicScores: Record<string, number[]> = {}
    
    // Get essay submissions to determine types
    const submissionIds = essayAnalyses.map(a => a.submission_id)
    const { data: submissions } = await supabase
      .from('essay_submissions')
      .select(`
        id,
        essay_prompts (type)
      `)
      .in('id', submissionIds)

    essayAnalyses.forEach(analysis => {
      const submission = submissions?.find(s => s.id === analysis.submission_id)
      const essayType = submission?.essay_prompts?.type || 'general'
      
      if (!topicScores[essayType]) {
        topicScores[essayType] = []
      }
      topicScores[essayType].push(analysis.overall_score)
    })

    // Average scores by topic
    const averageTopicScores: Record<string, number> = {}
    Object.entries(topicScores).forEach(([topic, scores]) => {
      averageTopicScores[topic] = scores.reduce((sum, score) => sum + score, 0) / scores.length
    })

    // Identify strengths and weaknesses
    const { weakAreas, strongAreas } = this.identifyStrengthsAndWeaknesses(averageTopicScores)

    // Calculate streak days
    const streakDays = await this.calculateStreakDays(userId)

    // Update progress record
    const updateData = {
      overall_score: overallScore,
      topic_scores: averageTopicScores,
      streak_days: streakDays,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      last_practice_date: new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        subject: 'essay',
        ...updateData
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update essay progress: ${error.message}`)
    }

    return this.mapUserProgress(data)
  }

  /**
   * Get comprehensive dashboard data including essay performance
   */
  async getDashboardData(userId: string): Promise<{
    overallProgress: UserProgress[]
    recentSessions: PracticeSession[]
    streakDays: number
    weeklyGoalProgress: {
      target: number
      completed: number
      percentage: number
    }
    upcomingMilestones: string[]
    essayPerformance?: {
      totalEssays: number
      averageScore: number
      recentImprovement: number
      strongAreas: string[]
      weakAreas: string[]
    }
  }> {
    const [overallProgress, recentSessions] = await Promise.all([
      this.getAllUserProgress(userId),
      practiceService.getUserSessions(userId, { limit: 10, includeActive: false })
    ])

    const streakDays = await this.calculateStreakDays(userId)

    // Get essay performance data
    const { data: essayAnalyses } = await supabase
      .from('essay_analyses')
      .select(`
        *,
        essay_submissions!inner (
          user_id,
          submitted_at
        )
      `)
      .eq('essay_submissions.user_id', userId)
      .order('essay_submissions.submitted_at', { ascending: false })
      .limit(10)

    let essayPerformance
    if (essayAnalyses && essayAnalyses.length > 0) {
      const totalEssays = essayAnalyses.length
      const averageScore = essayAnalyses.reduce((sum, a) => sum + a.overall_score, 0) / totalEssays
      
      // Calculate recent improvement (last 3 vs previous 3)
      let recentImprovement = 0
      if (essayAnalyses.length >= 6) {
        const recent = essayAnalyses.slice(0, 3)
        const previous = essayAnalyses.slice(3, 6)
        const recentAvg = recent.reduce((sum, a) => sum + a.overall_score, 0) / 3
        const previousAvg = previous.reduce((sum, a) => sum + a.overall_score, 0) / 3
        recentImprovement = recentAvg - previousAvg
      }

      // Get essay progress for strengths/weaknesses
      const essayProgress = overallProgress.find(p => p.subject === 'essay')
      
      essayPerformance = {
        totalEssays,
        averageScore,
        recentImprovement,
        strongAreas: essayProgress?.strongAreas || [],
        weakAreas: essayProgress?.weakAreas || []
      }
    }
    
    // Calculate weekly goal progress (assuming 300 minutes per week target)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weeklyMinutes = recentSessions
      .filter(session => new Date(session.startTime) >= weekStart)
      .reduce((sum, session) => {
        if (session.endTime) {
          const duration = Math.round(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
          )
          return sum + duration
        }
        return sum
      }, 0)

    const weeklyGoalProgress = {
      target: 300, // 5 hours per week
      completed: weeklyMinutes,
      percentage: Math.min((weeklyMinutes / 300) * 100, 100)
    }

    // Generate upcoming milestones
    const upcomingMilestones = this.generateUpcomingMilestones(overallProgress, streakDays)

    return {
      overallProgress,
      recentSessions,
      streakDays,
      weeklyGoalProgress,
      upcomingMilestones,
      essayPerformance
    }
  }

  /**
   * Calculate topic-specific scores from recent sessions
   */
  private calculateTopicScores(sessions: PracticeSession[]): Record<string, number> {
    const topicStats: Record<string, { correct: number; total: number }> = {}

    sessions.forEach(session => {
      session.topics.forEach(topic => {
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 }
        }
        
        // Distribute session performance across topics
        const topicWeight = 1 / session.topics.length
        topicStats[topic].correct += session.questionsCorrect * topicWeight
        topicStats[topic].total += session.questionsAttempted * topicWeight
      })
    })

    const topicScores: Record<string, number> = {}
    Object.entries(topicStats).forEach(([topic, stats]) => {
      topicScores[topic] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })

    return topicScores
  }

  /**
   * Calculate current streak days
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('start_time')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })

    if (error || !data || data.length === 0) {
      return 0
    }

    let streakDays = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const sessionDates = new Set(
      data.map(session => new Date(session.start_time).toDateString())
    )

    // Check if user practiced today or yesterday to start streak
    const today = currentDate.toDateString()
    const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toDateString()

    if (!sessionDates.has(today) && !sessionDates.has(yesterday)) {
      return 0
    }

    // Count consecutive days backwards
    while (sessionDates.has(currentDate.toDateString())) {
      streakDays++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streakDays
  }

  /**
   * Identify strengths and weaknesses based on topic scores
   */
  private identifyStrengthsAndWeaknesses(topicScores: Record<string, number>): {
    weakAreas: string[]
    strongAreas: string[]
  } {
    const topics = Object.entries(topicScores)
    
    if (topics.length === 0) {
      return { weakAreas: [], strongAreas: [] }
    }

    const sortedTopics = topics.sort(([, a], [, b]) => b - a)
    
    const weakAreas = sortedTopics
      .filter(([, score]) => score < 70)
      .map(([topic]) => topic)
      .slice(0, 3) // Top 3 weak areas

    const strongAreas = sortedTopics
      .filter(([, score]) => score >= 85)
      .map(([topic]) => topic)
      .slice(0, 3) // Top 3 strong areas

    return { weakAreas, strongAreas }
  }

  /**
   * Generate upcoming milestones based on current progress
   */
  private generateUpcomingMilestones(progress: UserProgress[], streakDays: number): string[] {
    const milestones: string[] = []

    // Streak milestones
    const nextStreakMilestone = Math.ceil((streakDays + 1) / 5) * 5
    if (nextStreakMilestone <= 30) {
      milestones.push(`${nextStreakMilestone}-day study streak`)
    }

    // Subject-specific milestones
    progress.forEach(subjectProgress => {
      const score = subjectProgress.overallScore
      if (score < 80) {
        const nextScoreMilestone = Math.ceil(score / 10) * 10
        milestones.push(`${nextScoreMilestone}% accuracy in ${subjectProgress.subject}`)
      }
    })

    // Practice time milestones
    const totalTime = progress.reduce((sum, p) => sum + p.totalPracticeTime, 0)
    const nextTimeMilestone = Math.ceil((totalTime + 1) / 60) * 60
    if (nextTimeMilestone <= 600) { // Up to 10 hours
      milestones.push(`${nextTimeMilestone} minutes of practice time`)
    }

    return milestones.slice(0, 3) // Return top 3 milestones
  }

  // Private mapping methods
  private mapUserProgress(data: any): UserProgress {
    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      overallScore: data.overall_score || 0,
      topicScores: data.topic_scores || {},
      streakDays: data.streak_days || 0,
      totalPracticeTime: data.total_practice_time || 0,
      lastPracticeDate: data.last_practice_date,
      weakAreas: data.weak_areas || [],
      strongAreas: data.strong_areas || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapProgressSnapshot(data: any): ProgressSnapshot {
    return {
      id: data.id,
      userId: data.user_id,
      snapshotDate: data.snapshot_date,
      subject: data.subject,
      performanceData: data.performance_data || {},
      createdAt: data.created_at
    }
  }
}

export const progressService = new ProgressService()