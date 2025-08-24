import { supabase } from '../config/supabase'
import { RegisterRequest, LoginRequest, UpdateProfileRequest, UserProfile, UserPreferences } from '../types/auth'

export class AuthService {
  async register(data: RegisterRequest): Promise<{ user: UserProfile; session: any }> {
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(`Registration failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed')
    }

    // Create user profile with default preferences
    const defaultPreferences: UserPreferences = {
      studyReminders: true,
      parentNotifications: !!data.parentEmail,
      difficultyLevel: 'adaptive',
      dailyGoalMinutes: 30
    }

    const profileData = {
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      exam_date: data.examDate,
      grade_level: data.gradeLevel,
      parent_email: data.parentEmail || null,
      preferences: defaultPreferences,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    return {
      user: this.mapProfileToUser(profile),
      session: authData.session
    }
  }

  async login(data: LoginRequest): Promise<{ user: UserProfile; session: any }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(`Login failed: ${authError.message}`)
    }

    if (!authData.user || !authData.session) {
      throw new Error('Login failed')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      throw new Error(`Profile retrieval failed: ${profileError.message}`)
    }

    return {
      user: this.mapProfileToUser(profile),
      session: authData.session
    }
  }

  async logout(accessToken: string): Promise<void> {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(`Logout failed: ${error.message}`)
    }
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Profile retrieval failed: ${error.message}`)
    }

    return this.mapProfileToUser(profile)
  }

  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.firstName !== undefined) updateData.first_name = data.firstName
    if (data.lastName !== undefined) updateData.last_name = data.lastName
    if (data.examDate !== undefined) updateData.exam_date = data.examDate
    if (data.gradeLevel !== undefined) updateData.grade_level = data.gradeLevel
    if (data.parentEmail !== undefined) updateData.parent_email = data.parentEmail
    if (data.preferences !== undefined) updateData.preferences = data.preferences

    const { data: profile, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`)
    }

    return this.mapProfileToUser(profile)
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid or expired token')
    }

    return {
      userId: user.id,
      email: user.email!
    }
  }

  private mapProfileToUser(profile: any): UserProfile {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      examDate: profile.exam_date,
      gradeLevel: profile.grade_level,
      parentEmail: profile.parent_email,
      preferences: profile.preferences,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  }
}

export const authService = new AuthService()