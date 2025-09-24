import axios, { AxiosInstance } from 'axios'
import { 
  ParentAccount, 
  StudentLink, 
  ParentDashboardData, 
  CreateParentAccountRequest, 
  ParentLoginRequest,
  ParentNotificationPreferences 
} from '../types/parent'

export interface ParentAuthResponse {
  parent: ParentAccount
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

class ParentService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include parent auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('parent_access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear invalid parent token
          localStorage.removeItem('parent_access_token')
          localStorage.removeItem('parent_data')
          window.location.reload()
        }
        return Promise.reject(error)
      }
    )
  }

  async createAccount(data: CreateParentAccountRequest): Promise<ParentAuthResponse> {
    const response = await this.api.post('/parent/register', data)
    return response.data
  }

  async login(data: ParentLoginRequest): Promise<ParentAuthResponse> {
    const response = await this.api.post('/parent/login', data)
    return response.data
  }

  async getLinkedStudents(): Promise<StudentLink[]> {
    const response = await this.api.get('/parent/students')
    return response.data.students
  }

  async requestStudentAccess(studentEmail: string): Promise<void> {
    await this.api.post('/parent/students/link', { studentEmail })
  }

  async getDashboardData(studentId: string): Promise<ParentDashboardData> {
    const response = await this.api.get(`/parent/dashboard/${studentId}`)
    return response.data
  }

  async updateNotificationPreferences(preferences: ParentNotificationPreferences): Promise<void> {
    await this.api.put('/parent/preferences/notifications', preferences)
  }

  async grantParentAccess(accessCode: string): Promise<void> {
    // This uses the regular student API service since it's a student action
    const { apiService } = await import('./apiService')
    await apiService.post('/student/parent/grant-access', { accessCode })
  }
}

export const parentService = new ParentService()