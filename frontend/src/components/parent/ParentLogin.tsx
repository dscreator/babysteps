import React, { useState } from 'react'
import { useParentAuth } from '../../contexts/ParentAuthContext'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Input } from '../common/Input'

export const ParentLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  const { login } = useParentAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (showRegister) {
    return <ParentRegistration onBackToLogin={() => setShowRegister(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
          <p className="text-gray-600">Monitor your child's ISEE preparation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="parent@example.com"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have a parent account?{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create Account
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Need help? Contact your child's teacher or{' '}
            <a href="mailto:support@iseetutor.com" className="text-blue-600 hover:text-blue-700">
              support@iseetutor.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}

interface ParentRegistrationProps {
  onBackToLogin: () => void
}

const ParentRegistration: React.FC<ParentRegistrationProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    studentEmail: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { parentService } = await import('../../services/parentService')
      await parentService.createAccount({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentEmail: formData.studentEmail
      })
      
      // Registration successful, show success message
      alert('Account created successfully! Please check your email for the access code to share with your child.')
      onBackToLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Parent Account</h1>
          <p className="text-gray-600">Get access to your child's progress</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
              placeholder="John"
            />
            <Input
              type="text"
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
              placeholder="Doe"
            />
          </div>

          <Input
            type="email"
            label="Your Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            placeholder="parent@example.com"
          />

          <Input
            type="email"
            label="Student's Email"
            value={formData.studentEmail}
            onChange={(e) => handleInputChange('studentEmail', e.target.value)}
            required
            placeholder="student@example.com"
            helperText="Enter your child's account email"
          />

          <Input
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            placeholder="Create a strong password"
          />

          <Input
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
            placeholder="Confirm your password"
          />

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            After creating your account, you'll receive an access code to share with your child.
          </p>
        </div>
      </Card>
    </div>
  )
}