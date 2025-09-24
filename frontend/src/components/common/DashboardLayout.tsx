import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { useProfile } from '../../hooks/useAuthQueries';
import { ProfileSetup } from '../auth/ProfileSetup';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: profile, isLoading, refetch } = useProfile();

  // Show loading while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show profile setup if user hasn't completed their profile
  const needsProfileSetup = !profile?.examDate || !profile?.gradeLevel;
  
  if (needsProfileSetup) {
    return (
      <ProfileSetup
        onComplete={() => refetch()}
        initialData={{
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          email: profile?.email,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}