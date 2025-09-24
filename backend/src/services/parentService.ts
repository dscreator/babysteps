import { supabase } from '../config/supabase'
import { 
  ParentAccount, 
  ParentAccess, 
  ParentDashboardData, 
  CreateParentAccountRequest, 
  ParentLoginRequest,
  LinkStudentRequest,
  ParentNotificationPreferences
} from '../types/parent'

export class ParentService {
  async createParentAccount(data: CreateParentAccountRequest): Promise<{ parent: ParentAccount; session: any }> {
    // Create parent user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(`Parent account creation failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Parent user creation failed')
    }

    // Create parent profile
    const profileData = {
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profile, error: profileError } = await supabase
      .from('parent_accounts')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Parent profile creation failed: ${profileError.message}`)
    }

    // Request access to student account
    await this.requestStudentAccess(authData.user.id, data.studentEmail)

    return {
      parent: this.mapProfileToParent(profile),
      session: authData.session
    }
  }

  async loginParent(data: ParentLoginRequest): Promise<{ parent: ParentAccount; session: any }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(`Parent login failed: ${authError.message}`)
    }

    if (!authData.user || !authData.session) {
      throw new Error('Parent login failed')
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from('parent_accounts')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      throw new Error(`Parent profile retrieval failed: ${profileError.message}`)
    }

    return {
      parent: this.mapProfileToParent(profile),
      session: authData.session
    }
  }

  async requestStudentAccess(parentId: string, studentEmail: string): Promise<void> {
    // Find student by email
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', studentEmail)
      .single()

    if (studentError || !student) {
      throw new Error('Student not found')
    }

    // Generate access code
    const { data: accessCodeData, error: accessCodeError } = await supabase
      .rpc('generate_access_code')

    if (accessCodeError) {
      throw new Error('Failed to generate access code')
    }

    // Get parent account
    const { data: parentAccount, error: parentError } = await supabase
      .from('parent_accounts')
      .select('email')
      .eq('id', parentId)
      .single()

    if (parentError || !parentAccount) {
      throw new Error('Parent account not found')
    }

    // Create or update parent access record
    const { error: accessError } = await supabase
      .from('parent_access')
      .upsert({
        student_id: student.id,
        parent_email: parentAccount.email,
        parent_account_id: parentId,
        access_code: accessCodeData,
        access_requested_at: new Date().toISOString(),
        access_granted: false,
        notifications_enabled: true
      })

    if (accessError) {
      throw new Error(`Failed to request student access: ${accessError.message}`)
    }

    // Send access request notification email
    try {
      const { notificationService } = await import('./notificationService')
      await notificationService.sendParentAccessRequest(studentEmail, parentAccount.email, accessCodeData)
    } catch (emailError) {
      console.error('Failed to send access request email:', emailError)
      // Don't throw error here as the access request was created successfully
    }
  }

  async grantStudentAccess(studentId: string, accessCode: string): Promise<void> {
    // Verify access code and update access
    const { data: accessRecord, error: accessError } = await supabase
      .from('parent_access')
      .select('*')
      .eq('student_id', studentId)
      .eq('access_code', accessCode)
      .eq('access_granted', false)
      .single()

    if (accessError || !accessRecord) {
      throw new Error('Invalid access code or request not found')
    }

    // Grant access
    const { error: updateError } = await supabase
      .from('parent_access')
      .update({
        access_granted: true,
        access_granted_at: new Date().toISOString()
      })
      .eq('id', accessRecord.id)

    if (updateError) {
      throw new Error(`Failed to grant access: ${updateError.message}`)
    }
  }

  async getLinkedStudents(parentId: string): Promise<Array<{ studentId: string; studentName: string; examDate: string; gradeLevel: number; accessGranted: boolean }>> {
    const { data: linkedStudents, error } = await supabase
      .from('parent_access')
      .select(`
        student_id,
        access_granted,
        users!inner(
          id,
          first_name,
          last_name,
          exam_date,
          grade_level
        )
      `)
      .eq('parent_account_id', parentId)

    if (error) {
      throw new Error(`Failed to get linked students: ${error.message}`)
    }

    return linkedStudents.map((link: any) => ({
      studentId: link.student_id,
      studentName: `${link.users.first_name} ${link.users.last_name}`,
      examDate: link.users.exam_date,
      gradeLevel: link.users.grade_level,
      accessGranted: link.access_granted
    }))
  }

  async getParentDashboardData(parentId: string, studentId: string): Promise<ParentDashboardData> {
    // Verify parent has access to this student
    const { data: accessCheck, error: accessError } = await supabase
      .from('parent_access')
      .select('access_granted')
      .eq('parent_account_id', parentId)
      .eq('student_id', studentId)
      .eq('access_granted', true)
      .single()

    if (accessError || !accessCheck) {
      throw new Error('Access denied to student data')
    }

    // Get student basic info
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, first_name, last_name, exam_date, grade_level')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      throw new Error('Student not found')
    }

    // Get progress data for all subjects
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', studentId)

    if (progressError) {
      throw new Error(`Failed to get progress data: ${progressError.message}`)
    }

    // Get recent practice sessions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentSessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('subject, start_time, end_time, questions_attempted, questions_correct')
      .eq('user_id', studentId)
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false })

    if (sessionsError) {
      throw new Error(`Failed to get recent sessions: ${sessionsError.message}`)
    }

    // Process progress data
    const progressBySubject = progressData.reduce((acc: any, progress: any) => {
      acc[progress.subject] = {
        overallScore: progress.overall_score || 0,
        recentSessions: recentSessions.filter((s: any) => s.subject === progress.subject).length,
        weakAreas: progress.weak_areas || [],
        strongAreas: progress.strong_areas || []
      }
      return acc
    }, {})

    // Calculate engagement metrics
    const totalPracticeTime = progressData.reduce((sum: number, p: any) => sum + (p.total_practice_time || 0), 0)
    const maxStreakDays = Math.max(...progressData.map((p: any) => p.streak_days || 0))
    const lastPracticeDate = progressData.reduce((latest: string, p: any) => {
      return p.last_practice_date && p.last_practice_date > latest ? p.last_practice_date : latest
    }, '')

    // Calculate weekly goal progress (assuming 5 sessions per week target)
    const weeklyGoalProgress = Math.min(recentSessions.length / 5 * 100, 100)

    // Calculate consistency score based on practice frequency
    const consistencyScore = this.calculateConsistencyScore(recentSessions)

    // Process recent activity
    const recentActivity = recentSessions.slice(0, 10).map((session: any) => ({
      date: session.start_time,
      subject: session.subject,
      duration: session.end_time ? 
        Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000) : 0,
      performance: session.questions_attempted > 0 ? 
        Math.round((session.questions_correct / session.questions_attempted) * 100) : 0
    }))

    return {
      student: {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        examDate: student.exam_date,
        gradeLevel: student.grade_level
      },
      progress: {
        math: progressBySubject.math || { overallScore: 0, recentSessions: 0, weakAreas: [], strongAreas: [] },
        english: progressBySubject.english || { overallScore: 0, recentSessions: 0, weakAreas: [], strongAreas: [] },
        essay: progressBySubject.essay || { overallScore: 0, recentSessions: 0, weakAreas: [], strongAreas: [] }
      },
      engagement: {
        streakDays: maxStreakDays,
        totalPracticeTime,
        lastPracticeDate,
        weeklyGoalProgress,
        consistencyScore
      },
      recentActivity
    }
  }

  async updateNotificationPreferences(parentId: string, preferences: ParentNotificationPreferences): Promise<void> {
    const { error } = await supabase
      .from('parent_accounts')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', parentId)

    if (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`)
    }
  }

  private calculateConsistencyScore(sessions: any[]): number {
    if (sessions.length === 0) return 0

    // Group sessions by date
    const sessionsByDate = sessions.reduce((acc: any, session: any) => {
      const date = new Date(session.start_time).toDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Calculate consistency based on how many days had practice
    const daysWithPractice = Object.keys(sessionsByDate).length
    const totalDays = 7 // Looking at last 7 days
    
    return Math.round((daysWithPractice / totalDays) * 100)
  }

  private mapProfileToParent(profile: any): ParentAccount {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  }
}

export const parentService = new ParentService()