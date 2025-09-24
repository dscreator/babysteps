import { Resend } from 'resend'
import { supabase } from '../config/supabase'

interface NotificationTrigger {
  type: 'progress_milestone' | 'study_reminder' | 'weekly_report' | 'access_request'
  userId: string
  data: any
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class NotificationService {
  private resend: Resend

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not found. Email notifications will be disabled.')
      return
    }
    this.resend = new Resend(apiKey)
  }

  async sendProgressMilestone(studentId: string, milestone: {
    subject: string
    achievement: string
    score: number
    improvement: number
  }): Promise<void> {
    try {
      const parentEmails = await this.getParentEmails(studentId, 'progressMilestones')
      if (parentEmails.length === 0) return

      const student = await this.getStudentInfo(studentId)
      const template = this.generateProgressMilestoneTemplate(student, milestone)

      await this.sendEmailToParents(parentEmails, template)
    } catch (error) {
      console.error('Failed to send progress milestone notification:', error)
    }
  }

  async sendStudyReminder(studentId: string, reminderData: {
    daysSinceLastPractice: number
    streakAtRisk: boolean
    examDaysRemaining: number
  }): Promise<void> {
    try {
      const parentEmails = await this.getParentEmails(studentId, 'studyReminders')
      if (parentEmails.length === 0) return

      const student = await this.getStudentInfo(studentId)
      const template = this.generateStudyReminderTemplate(student, reminderData)

      await this.sendEmailToParents(parentEmails, template)
    } catch (error) {
      console.error('Failed to send study reminder notification:', error)
    }
  }

  async sendWeeklyReport(studentId: string, reportData: {
    weeklyStats: {
      totalPracticeTime: number
      sessionsCompleted: number
      averageScore: number
      subjectBreakdown: Record<string, { time: number; score: number }>
    }
    improvements: string[]
    recommendations: string[]
  }): Promise<void> {
    try {
      const parentEmails = await this.getParentEmails(studentId, 'weeklyReports')
      if (parentEmails.length === 0) return

      const student = await this.getStudentInfo(studentId)
      const template = this.generateWeeklyReportTemplate(student, reportData)

      await this.sendEmailToParents(parentEmails, template)
    } catch (error) {
      console.error('Failed to send weekly report notification:', error)
    }
  }

  async sendParentAccessRequest(studentEmail: string, parentEmail: string, accessCode: string): Promise<void> {
    try {
      if (!this.resend) {
        console.warn('Email service not configured')
        return
      }

      const template = this.generateAccessRequestTemplate(studentEmail, accessCode)

      await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@iseetutor.com',
        to: parentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    } catch (error) {
      console.error('Failed to send parent access request notification:', error)
    }
  }

  async processNotificationTrigger(trigger: NotificationTrigger): Promise<void> {
    switch (trigger.type) {
      case 'progress_milestone':
        await this.sendProgressMilestone(trigger.userId, trigger.data)
        break
      case 'study_reminder':
        await this.sendStudyReminder(trigger.userId, trigger.data)
        break
      case 'weekly_report':
        await this.sendWeeklyReport(trigger.userId, trigger.data)
        break
      case 'access_request':
        await this.sendParentAccessRequest(trigger.data.studentEmail, trigger.data.parentEmail, trigger.data.accessCode)
        break
    }
  }

  private async getParentEmails(studentId: string, notificationType: string): Promise<string[]> {
    try {
      const { data: parentAccess, error } = await supabase
        .from('parent_access')
        .select(`
          parent_email,
          parent_accounts!inner(
            notification_preferences
          )
        `)
        .eq('student_id', studentId)
        .eq('access_granted', true)

      if (error) {
        console.error('Error fetching parent emails:', error)
        return []
      }

      return parentAccess
        .filter((access: any) => {
          const prefs = access.parent_accounts?.notification_preferences || {}
          return prefs[notificationType] === true
        })
        .map((access: any) => access.parent_email)
    } catch (error) {
      console.error('Error in getParentEmails:', error)
      return []
    }
  }

  private async getStudentInfo(studentId: string): Promise<any> {
    const { data: student, error } = await supabase
      .from('users')
      .select('first_name, last_name, exam_date, grade_level')
      .eq('id', studentId)
      .single()

    if (error) {
      throw new Error(`Failed to get student info: ${error.message}`)
    }

    return student
  }

  private async sendEmailToParents(parentEmails: string[], template: EmailTemplate): Promise<void> {
    if (!this.resend) {
      console.warn('Email service not configured')
      return
    }

    const promises = parentEmails.map(email =>
      this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@iseetutor.com',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    )

    await Promise.allSettled(promises)
  }

  private generateProgressMilestoneTemplate(student: any, milestone: any): EmailTemplate {
    const subject = `🎉 ${student.first_name} achieved a milestone in ${milestone.subject}!`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Great Progress Update!</h2>
        
        <p>Hi there!</p>
        
        <p>We're excited to share that <strong>${student.first_name}</strong> has reached an important milestone in their ISEE preparation:</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">${milestone.achievement}</h3>
          <p><strong>Subject:</strong> ${milestone.subject}</p>
          <p><strong>Current Score:</strong> ${milestone.score}%</p>
          ${milestone.improvement > 0 ? `<p><strong>Improvement:</strong> +${milestone.improvement}% from last week</p>` : ''}
        </div>
        
        <p>Keep encouraging ${student.first_name} to maintain this excellent progress!</p>
        
        <p>You can view detailed progress reports in your <a href="${process.env.FRONTEND_URL}/parent" style="color: #2563eb;">Parent Dashboard</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent because you have progress milestone notifications enabled. 
          You can update your preferences in your parent dashboard.
        </p>
      </div>
    `
    
    const text = `
Great Progress Update!

${student.first_name} has reached an important milestone in their ISEE preparation:

${milestone.achievement}
Subject: ${milestone.subject}
Current Score: ${milestone.score}%
${milestone.improvement > 0 ? `Improvement: +${milestone.improvement}% from last week` : ''}

Keep encouraging ${student.first_name} to maintain this excellent progress!

View detailed progress reports: ${process.env.FRONTEND_URL}/parent
    `
    
    return { subject, html, text }
  }

  private generateStudyReminderTemplate(student: any, reminderData: any): EmailTemplate {
    const subject = `📚 Study reminder for ${student.first_name}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Study Reminder</h2>
        
        <p>Hi there!</p>
        
        <p>This is a gentle reminder about ${student.first_name}'s ISEE preparation:</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>It's been ${reminderData.daysSinceLastPractice} days since the last practice session.</strong></p>
          ${reminderData.streakAtRisk ? '<p style="color: #dc2626;"><strong>⚠️ Study streak is at risk!</strong></p>' : ''}
          <p><strong>Days until exam:</strong> ${reminderData.examDaysRemaining}</p>
        </div>
        
        <p>Regular practice is key to ISEE success. Consider encouraging ${student.first_name} to:</p>
        <ul>
          <li>Complete a 15-20 minute practice session today</li>
          <li>Focus on areas that need improvement</li>
          <li>Maintain consistent daily practice</li>
        </ul>
        
        <p>You can check their progress and see recommended practice areas in your <a href="${process.env.FRONTEND_URL}/parent" style="color: #2563eb;">Parent Dashboard</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent because you have study reminder notifications enabled. 
          You can update your preferences in your parent dashboard.
        </p>
      </div>
    `
    
    const text = `
Study Reminder

This is a gentle reminder about ${student.first_name}'s ISEE preparation:

It's been ${reminderData.daysSinceLastPractice} days since the last practice session.
${reminderData.streakAtRisk ? '⚠️ Study streak is at risk!' : ''}
Days until exam: ${reminderData.examDaysRemaining}

Regular practice is key to ISEE success. Consider encouraging ${student.first_name} to:
- Complete a 15-20 minute practice session today
- Focus on areas that need improvement  
- Maintain consistent daily practice

Check progress: ${process.env.FRONTEND_URL}/parent
    `
    
    return { subject, html, text }
  }

  private generateWeeklyReportTemplate(student: any, reportData: any): EmailTemplate {
    const subject = `📊 Weekly Progress Report for ${student.first_name}`
    
    const subjectBreakdown = Object.entries(reportData.weeklyStats.subjectBreakdown)
      .map(([subject, stats]: [string, any]) => 
        `<li><strong>${subject.charAt(0).toUpperCase() + subject.slice(1)}:</strong> ${stats.time} minutes, ${stats.score}% average</li>`
      ).join('')
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weekly Progress Report</h2>
        
        <p>Hi there!</p>
        
        <p>Here's ${student.first_name}'s ISEE preparation summary for this week:</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">This Week's Stats</h3>
          <p><strong>Total Practice Time:</strong> ${reportData.weeklyStats.totalPracticeTime} minutes</p>
          <p><strong>Sessions Completed:</strong> ${reportData.weeklyStats.sessionsCompleted}</p>
          <p><strong>Average Score:</strong> ${reportData.weeklyStats.averageScore}%</p>
          
          <h4>Subject Breakdown:</h4>
          <ul>${subjectBreakdown}</ul>
        </div>
        
        ${reportData.improvements.length > 0 ? `
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16a34a; margin-top: 0;">🎯 Areas of Improvement</h3>
          <ul>
            ${reportData.improvements.map((improvement: string) => `<li>${improvement}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${reportData.recommendations.length > 0 ? `
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d97706; margin-top: 0;">💡 Recommendations</h3>
          <ul>
            ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <p>Keep up the great work! You can view detailed analytics in your <a href="${process.env.FRONTEND_URL}/parent" style="color: #2563eb;">Parent Dashboard</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent because you have weekly report notifications enabled. 
          You can update your preferences in your parent dashboard.
        </p>
      </div>
    `
    
    const text = `
Weekly Progress Report for ${student.first_name}

This Week's Stats:
- Total Practice Time: ${reportData.weeklyStats.totalPracticeTime} minutes
- Sessions Completed: ${reportData.weeklyStats.sessionsCompleted}
- Average Score: ${reportData.weeklyStats.averageScore}%

Subject Breakdown:
${Object.entries(reportData.weeklyStats.subjectBreakdown)
  .map(([subject, stats]: [string, any]) => `- ${subject}: ${stats.time} minutes, ${stats.score}% average`)
  .join('\n')}

${reportData.improvements.length > 0 ? `
Areas of Improvement:
${reportData.improvements.map((improvement: string) => `- ${improvement}`).join('\n')}
` : ''}

${reportData.recommendations.length > 0 ? `
Recommendations:
${reportData.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
` : ''}

View detailed analytics: ${process.env.FRONTEND_URL}/parent
    `
    
    return { subject, html, text }
  }

  private generateAccessRequestTemplate(studentEmail: string, accessCode: string): EmailTemplate {
    const subject = 'Parent Access Request - ISEE AI Tutor'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Parent Access Request</h2>
        
        <p>Hello!</p>
        
        <p>You've requested access to monitor the ISEE preparation progress for the student account: <strong>${studentEmail}</strong></p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #1e40af; margin-top: 0;">Your Access Code</h3>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e40af; background-color: white; padding: 15px; border-radius: 4px; border: 2px dashed #2563eb;">
            ${accessCode}
          </div>
          <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">Share this code with your child</p>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Share the access code above with your child</li>
          <li>Ask them to enter this code in their student dashboard</li>
          <li>Once approved, you'll be able to access your <a href="${process.env.FRONTEND_URL}/parent" style="color: #2563eb;">Parent Dashboard</a></li>
        </ol>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">What you'll be able to see:</h4>
          <ul style="margin-bottom: 0;">
            <li>Overall progress and performance trends</li>
            <li>Study consistency and time spent practicing</li>
            <li>Areas of strength and improvement</li>
            <li>Recent practice activity</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Privacy Note:</strong> You will not be able to see specific answers, detailed essay content, or chat conversations. 
          Only progress summaries and performance analytics will be shared.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this access, please ignore this email. The access code will expire in 7 days.
        </p>
      </div>
    `
    
    const text = `
Parent Access Request - ISEE AI Tutor

You've requested access to monitor the ISEE preparation progress for: ${studentEmail}

Your Access Code: ${accessCode}

Next Steps:
1. Share the access code above with your child
2. Ask them to enter this code in their student dashboard  
3. Once approved, you'll be able to access your Parent Dashboard

What you'll be able to see:
- Overall progress and performance trends
- Study consistency and time spent practicing
- Areas of strength and improvement
- Recent practice activity

Privacy Note: You will not be able to see specific answers, detailed essay content, or chat conversations.

Parent Dashboard: ${process.env.FRONTEND_URL}/parent
    `
    
    return { subject, html, text }
  }
}

export const notificationService = new NotificationService()