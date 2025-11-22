'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Personal Planning System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>OKR Tracking</CardTitle>
              <CardDescription>
                Track your objectives and key results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create and manage your OKRs with progress tracking and visualization.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/okrs'}>
                Manage OKRs →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Journal</CardTitle>
              <CardDescription>
                Reflect on your daily progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create daily journal entries with customizable templates and track your mood and energy levels.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/journal'}>
                Manage Journal →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Get personalized feedback powered by Claude
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Coming in Phase 5: Receive AI-powered insights and recommendations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Visualize your progress and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Coming in Phase 6: View charts and analytics of your progress.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Phase 4 Complete! 🎉</CardTitle>
              <CardDescription>
                Daily journal system is now working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-700">You&apos;re logged in as: <strong>{user?.email}</strong></p>
                <p className="text-gray-600">
                  You can now create journal templates, write daily entries, and track mood and energy levels.
                  Next up: AI integration with Claude for personalized insights and recommendations!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
