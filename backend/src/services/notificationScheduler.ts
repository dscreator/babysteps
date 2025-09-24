import { supabase } from '../config/supabase'
import { notificationService } from './notificationService'

export class NotificationScheduler {
  private intervals: NodeJS.Timeout[] = []

  start(): void {
    console.log('Starting notification scheduler...')
    
    // Check for study reminders every hour
    const studyReminderInterval = setInterval(() => {
      this.checkStudyReminders().catch(console.error)
    }, 60 * 60 * 1000) // 1 hour
    
    // Send weekly reports every Sunday at 9 AM
    const weeklyReportInterval = setInterval(() => {
      this.checkWeeklyReports().catch(console.error)
    }, 60 * 60 * 1000) // Check every hour, but only send on Sundays
    
    // Check for progress milestones every 30 minutes
    const milestoneInterval = setInterval(() => {
      this.checkProgressMilestones().catch(console.error)
    }, 30 * 60 * 1000) // 30 minutes
    
    this.intervals.push(studyReminderInterval, weeklyReportInterval, milestoneInterval)
  }

  stop(): void {
    console.log('Stopping notification scheduler...')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }

  private async checkStudyReminders(): Promise<void> {
    try {
      // Find students who haven't practiced in 2+ days and have parent notifications enabled
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data: inactiveStudents, error } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          exam_date,
          user_progress!inner(
            last_practice_date,
            streak_days
          ),
          parent_access!inner(
            access_granted,
            parent_accounts!inner(
              notification_preferences
            )
          )
        `)
        .lt('user_progress.last_practice_date', twoDaysAgo.toISOString())
        .eq('parent_access.access_granted', true)

      if (error) {
        console.error('Error fetching inactive students:', error)
        return
      }

      for (const student of inactiveStudents || []) {
        // Check if any parent has study reminders enabled
        const hasReminderEnabled = student.parent_access.some((access: any) =>
          access.parent_accounts?.notification_preferences?.studyReminders === true
        )

        if (!hasReminderEnabled) continue

        const lastPracticeDate = new Date(student.user_progress[0]?.last_practice_date || 0)
        const daysSinceLastPractice = Math.floor(
          (new Date().getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        const examDate = new Date(student.exam_date)
        const examDaysRemaining = Math.ceil(
          (examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )

        const streakAtRisk = student.user_progress[0]?.streak_days > 0 && daysSinceLastPractice >= 2

        await notificationService.sendStudyReminder(student.id, {
          daysSinceLastPractice,
          streakAtRisk,
          examDaysRemaining
        })
      }
    } catch (error) {
      console.error('Error in checkStudyReminders:', error)
    }
  }

  private async checkWeeklyReports(): Promise<void> {
    try {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday
      const hour = now.getHours()

      // Only send on Sundays at 9 AM
      if (dayOfWeek !== 0 || hour !== 9) return

      // Get all students with parent access and weekly reports enabled
      const { data: students, error } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          parent_access!inner(
            access_granted,
            parent_accounts!inner(
              notification_preferences
            )
          )
        `)
        .eq('parent_access.access_granted', true)

      if (error) {
        console.error('Error fetching students for weekly reports:', error)
        return
      }

      for (const student of students || []) {
        // Check if any parent has weekly reports enabled
        const hasWeeklyReportEnabled = student.parent_access.some((access: any) =>
          access.parent_accounts?.notification_preferences?.weeklyReports === true
        )

        if (!hasWeeklyReportEnabled) continue

        const weeklyStats = await this.getWeeklyStats(student.id)
        const improvements = await this.getWeeklyImprovements(student.id)
        const recommendations = await this.getWeeklyRecommendations(student.id, weeklyStats)

        await notificationService.sendWeeklyReport(student.id, {
          weeklyStats,
          improvements,
          recommendations
        })
      }
    } catch (error) {
      console.error('Error in checkWeeklyReports:', error)
    }
  }

  private async checkProgressMilestones(): Promise<void> {
    try {
      // This would check for significant score improvements, streak achievements, etc.
      // For now, we'll implement a basic version that checks for score improvements

      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      // Find recent practice sessions with significant improvements
      const { data: recentSessions, error } = await supabase
        .from('practice_sessions')
        .select(`
          user_id,
          subject,
          questions_attempted,
          questions_correct,
          created_at,
          users!inner(
            first_name,
            last_name,
            parent_access!inner(
              access_granted,
              parent_accounts!inner(
                notification_preferences
              )
            )
          )
        `)
        .gte('created_at', oneDayAgo.toISOString())
        .gt('questions_attempted', 0)

      if (error) {
        console.error('Error fetching recent sessions:', error)
        return
      }

      // Group sessions by user and subject to calculate improvements
      const userSubjectSessions = new Map<string, any[]>()

      for (const session of recentSessions || []) {
        const key = `${session.user_id}-${session.subject}`
        if (!userSubjectSessions.has(key)) {
          userSubjectSessions.set(key, [])
        }
        userSubjectSessions.get(key)!.push(session)
      }

      for (const [key, sessions] of userSubjectSessions) {
        const [userId, subject] = key.split('-')
        const student = sessions[0].users

        // Check if any parent has milestone notifications enabled
        const hasMilestoneEnabled = student.parent_access.some((access: any) =>
          access.parent_accounts?.notification_preferences?.progressMilestones === true
        )

        if (!hasMilestoneEnabled) continue

        // Calculate current performance
        const totalAttempted = sessions.reduce((sum, s) => sum + s.questions_attempted, 0)
        const totalCorrect = sessions.reduce((sum, s) => sum + s.questions_correct, 0)
        const currentScore = Math.round((totalCorrect / totalAttempted) * 100)

        // Get historical performance for comparison
        const historicalScore = await this.getHistoricalScore(userId, subject)
        const improvement = currentScore - historicalScore

        // Send milestone notification for significant improvements (10+ points)
        if (improvement >= 10) {
          await notificationService.sendProgressMilestone(userId, {
            subject: subject.charAt(0).toUpperCase() + subject.slice(1),
            achievement: `Significant improvement in ${subject}!`,
            score: currentScore,
            improvement
          })
        }

        // Check for streak milestones
        const { data: progress } = await supabase
          .from('user_progress')
          .select('streak_days')
          .eq('user_id', userId)
          .eq('subject', subject)
          .single()

        const streakDays = progress?.streak_days || 0
        if ([7, 14, 30, 60].includes(streakDays)) {
          await notificationService.sendProgressMilestone(userId, {
            subject: 'Study Consistency',
            achievement: `${streakDays}-day study streak achieved!`,
            score: 100,
            improvement: 0
          })
        }
      }
    } catch (error) {
      console.error('Error in checkProgressMilestones:', error)
    }
  }

  private async getWeeklyStats(userId: string): Promise<any> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('subject, start_time, end_time, questions_attempted, questions_correct')
      .eq('user_id', userId)
      .gte('start_time', oneWeekAgo.toISOString())

    if (error) {
      console.error('Error fetching weekly stats:', error)
      return {
        totalPracticeTime: 0,
        sessionsCompleted: 0,
        averageScore: 0,
        subjectBreakdown: {}
      }
    }

    const subjectBreakdown: Record<string, { time: number; score: number; sessions: number }> = {}
    let totalTime = 0
    let totalAttempted = 0
    let totalCorrect = 0

    for (const session of sessions || []) {
      const duration = session.end_time 
        ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
        : 0

      totalTime += duration
      totalAttempted += session.questions_attempted || 0
      totalCorrect += session.questions_correct || 0

      if (!subjectBreakdown[session.subject]) {
        subjectBreakdown[session.subject] = { time: 0, score: 0, sessions: 0 }
      }

      subjectBreakdown[session.subject].time += duration
      subjectBreakdown[session.subject].sessions += 1

      if (session.questions_attempted > 0) {
        const sessionScore = (session.questions_correct / session.questions_attempted) * 100
        subjectBreakdown[session.subject].score = 
          (subjectBreakdown[session.subject].score * (subjectBreakdown[session.subject].sessions - 1) + sessionScore) / 
          subjectBreakdown[session.subject].sessions
      }
    }

    // Round subject scores
    Object.keys(subjectBreakdown).forEach(subject => {
      subjectBreakdown[subject].score = Math.round(subjectBreakdown[subject].score)
    })

    return {
      totalPracticeTime: totalTime,
      sessionsCompleted: sessions?.length || 0,
      averageScore: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
      subjectBreakdown
    }
  }

  private async getWeeklyImprovements(userId: string): Promise<string[]> {
    // This would analyze progress over the week and identify improvements
    // For now, return a simple implementation
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('subject, strong_areas')
      .eq('user_id', userId)

    if (error) return []

    const improvements: string[] = []
    for (const p of progress || []) {
      if (p.strong_areas && p.strong_areas.length > 0) {
        improvements.push(`Showing strength in ${p.subject}: ${p.strong_areas.slice(0, 2).join(', ')}`)
      }
    }

    return improvements
  }

  private async getWeeklyRecommendations(userId: string, weeklyStats: any): Promise<string[]> {
    const recommendations: string[] = []

    // Analyze weekly stats and provide recommendations
    if (weeklyStats.totalPracticeTime < 150) { // Less than 2.5 hours per week
      recommendations.push('Consider increasing practice time to at least 30 minutes per day')
    }

    if (weeklyStats.averageScore < 70) {
      recommendations.push('Focus on reviewing fundamental concepts before attempting new problems')
    }

    // Subject-specific recommendations
    Object.entries(weeklyStats.subjectBreakdown).forEach(([subject, stats]: [string, any]) => {
      if (stats.score < 60) {
        recommendations.push(`${subject} needs extra attention - consider additional practice in this area`)
      }
    })

    if (weeklyStats.sessionsCompleted < 5) {
      recommendations.push('Try to practice more consistently - aim for at least one session per day')
    }

    return recommendations
  }

  private async getHistoricalScore(userId: string, subject: string): Promise<number> {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('questions_attempted, questions_correct')
      .eq('user_id', userId)
      .eq('subject', subject)
      .gte('start_time', twoWeeksAgo.toISOString())
      .lt('start_time', oneWeekAgo.toISOString())

    if (error || !sessions || sessions.length === 0) return 0

    const totalAttempted = sessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0)
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0)

    return totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
  }
}

export const notificationScheduler = new NotificationScheduler()