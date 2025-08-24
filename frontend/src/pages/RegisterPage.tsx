import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components/common';
import { useRegister } from '../hooks/useAuthMutations';
import { isApiError } from '../services/apiService';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  examDate: string;
  gradeLevel: number;
  parentEmail: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  examDate?: string;
  gradeLevel?: string;
  parentEmail?: string;
  general?: string;
}

export function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    examDate: '',
    gradeLevel: 6,
    parentEmail: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showExamDateWarning, setShowExamDateWarning] = useState(false);

  const registerMutation = useRegister();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Exam date validation
    if (!formData.examDate) {
      newErrors.examDate = 'Exam date is required';
    } else {
      const examDate = new Date(formData.examDate);
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);

      if (examDate <= today) {
        newErrors.examDate = 'Exam date must be in the future';
      } else if (examDate < twoWeeksFromNow) {
        setShowExamDateWarning(true);
      } else {
        setShowExamDateWarning(false);
      }
    }

    // Grade level validation
    if (formData.gradeLevel < 6 || formData.gradeLevel > 8) {
      newErrors.gradeLevel = 'Grade level must be between 6 and 8';
    }

    // Parent email validation (optional but must be valid if provided)
    if (formData.parentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid parent/guardian email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'gradeLevel' ? parseInt(e.target.value) : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (isApiError(result)) {
        setErrors({ general: result.error.message });
      }
      // Success is handled by the mutation hook
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Registration failed. Please try again.' });
    }
  };

  const getMinExamDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your ISEE AI Tutor account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                  required
                />
                
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                placeholder="Enter your email"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                placeholder="Create a strong password"
                required
              />
              
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                required
              />

              <Input
                label="ISEE Exam Date"
                type="date"
                value={formData.examDate}
                onChange={handleInputChange('examDate')}
                error={errors.examDate}
                min={getMinExamDate()}
                required
              />

              {showExamDateWarning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Intensive Study Plan Required</h3>
                      <p className="text-sm mt-1">
                        Your exam is less than 2 weeks away. We'll create an intensive study plan to help you prepare effectively.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Grade Level
                </label>
                <select
                  id="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange('gradeLevel')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value={6}>6th Grade</option>
                  <option value={7}>7th Grade</option>
                  <option value={8}>8th Grade</option>
                </select>
                {errors.gradeLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.gradeLevel}</p>
                )}
              </div>

              <Input
                label="Parent/Guardian Email (Optional)"
                type="email"
                value={formData.parentEmail}
                onChange={handleInputChange('parentEmail')}
                error={errors.parentEmail}
                placeholder="Parent or guardian email for progress updates"
              />
              
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                loading={registerMutation.isPending}
                className="w-full"
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}