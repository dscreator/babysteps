import { DashboardLayout } from '../components/common';
import { DashboardContent } from '../components/dashboard';

export function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <DashboardContent />
      </div>
    </DashboardLayout>
  );
}