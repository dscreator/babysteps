import React, { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../common';
import { useUpdateProfile } from '../../hooks/useAuthMutations';
import { isApiError } from '../../services/apiService';

interface ProfileSetupProps {
  onComplete: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface FormData {
  examDate: string;
  gradeLevel: number;
  parentEmail: string;
  studyReminders: boolean;
  parentNotifications: boolean;
  dailyGoalMinutes: number;
}

interface FormErrors {
  examDate?: string;
  gradeLevel?: string;
  parentEmail?: string;
  dailyGoalMinutes?: string;
  general?: string;
}

export function ProfileSetup({ onComplete, initialData }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    examDate: '',
    gradeLevel: 6,
    parentEmail: '',
    studyReminders: true,
    parentNotifications: true,
    dailyGoalMinutes: 30,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showExamDateWarning, setShowExamDateWarning] = useState(false);

  const updateProfileMutation = useUpdateProfile();

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    // Parent email validation (optional but must be valid if provided)
    if (formData.parentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid parent/guardian email address';
    }

    // Daily goal validation
    if (formData.dailyGoalMinutes < 10 || formData.dailyGoalMinutes > 120) {
      newErrors.dailyGoalMinutes = 'Daily goal must be between 10 and 120 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let value: any = e.target.value;
    
    if (field === 'gradeLevel' || field === 'dailyGoalMinutes') {
      value = parseInt(value);
    } else if (field === 'studyReminders' || field === 'parentNotifications') {
      value = e.target.checked;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    try {
      const result = await updateProfileMutation.mutateAsync({
        examDate: formData.examDate,
        gradeLevel: formData.gradeLevel,
        parentEmail: formData.parentEmail || undefined,
        preferences: {
          studyReminders: formData.studyReminders,
          parentNotifications: formData.parentNotifications,
          difficultyLevel: 'adaptive' as const,
          dailyGoalMinutes: formData.dailyGoalMinutes,
        },
      });

      console.debug('Profile update result:', result);

      if (!result) {
        onComplete();
        return;
      }

      if (isApiError(result)) {
        setErrors({ general: result.error.message });
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
    }
  };

  const getMinExamDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const calculateStudyDays = () => {
    if (!formData.examDate) return 0;
    const examDate = new Date(formData.examDate);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's set up your personalized study plan
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>
        
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? 'Exam Information' : 'Study Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
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

                {formData.examDate && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                    <p className="text-sm">
                      <strong>{calculateStudyDays()} days</strong> until your exam. 
                      We'll create a personalized study timeline for you!
                    </p>
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

                <Button 
                  type="button"
                  variant="primary" 
                  size="lg" 
                  onClick={handleNextStep}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Parent/Guardian Email (Optional)"
                  type="email"
                  value={formData.parentEmail}
                  onChange={handleInputChange('parentEmail')}
                  error={errors.parentEmail}
                  placeholder="Parent or guardian email for progress updates"
                />

                <div>
                  <label htmlFor="dailyGoalMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Study Goal (minutes)
                  </label>
                  <select
                    id="dailyGoalMinutes"
                    value={formData.dailyGoalMinutes}
                    onChange={handleInputChange('dailyGoalMinutes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                  {errors.dailyGoalMinutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.dailyGoalMinutes}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="studyReminders"
                      type="checkbox"
                      checked={formData.studyReminders}
                      onChange={handleInputChange('studyReminders')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="studyReminders" className="ml-2 block text-sm text-gray-900">
                      Send me daily study reminders
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="parentNotifications"
                      type="checkbox"
                      checked={formData.parentNotifications}
                      onChange={handleInputChange('parentNotifications')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      disabled={!formData.parentEmail}
                    />
                    <label htmlFor="parentNotifications" className="ml-2 block text-sm text-gray-900">
                      Send progress updates to parent/guardian
                      {!formData.parentEmail && (
                        <span className="text-gray-500"> (requires parent email)</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="lg" 
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    loading={updateProfileMutation.isPending}
                    className="flex-1"
                  >
                    Complete Setup
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
