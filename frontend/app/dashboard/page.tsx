'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Target, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  // Mock stats - these will be replaced with real API calls
  const avgProgress = 0;
  const totalObjectives = 0;
  const completedObjectives = 0;
  const recentEnergy = '-';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Planner'}
            </h2>
            <p className="text-gray-500">Here&apos;s what&apos;s happening with your goals today.</p>
          </div>
          <div className="hidden md:block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Avg. Progress</div>
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{avgProgress}%</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${avgProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Active Goals</div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {totalObjectives - completedObjectives}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {completedObjectives} completed this period
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Recent Energy</div>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {recentEnergy}
              {recentEnergy !== '-' && (
                <span className="text-lg text-gray-400 font-normal">/10</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Last recorded entry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/okrs/new')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-600 transition-colors">
                  <Target className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Create New OKR</div>
                  <div className="text-xs text-gray-500">Set a new objective and key results</div>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/journal/entries/new')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                  <Zap className="h-5 w-5 text-green-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Write Journal Entry</div>
                  <div className="text-xs text-gray-500">Reflect on your daily progress</div>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/journal/templates/new')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-600 transition-colors">
                  <Sparkles className="h-5 w-5 text-purple-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Create Template</div>
                  <div className="text-xs text-gray-500">Customize your journal questions</div>
                </div>
              </button>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200 rounded-full opacity-20 blur-xl"></div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">Orbit AI Insights</h3>
            </div>

            <div className="prose prose-indigo text-sm text-indigo-800">
              <p>
                Start creating OKRs and journal entries to unlock personalized AI insights
                about your performance patterns and progress trends.
              </p>
              <p className="mt-3">
                The AI will help you identify connections between your daily reflections and
                goal progress, suggesting updates and improvements along the way.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-600 mb-4">
            Phase 4 is complete! You can now use all core features of the planning system:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">OKR Tracking</div>
                <div className="text-sm text-gray-500">
                  Create objectives and track key results with progress indicators
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Daily Journaling</div>
                <div className="text-sm text-gray-500">
                  Write entries with custom templates and track mood/energy
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">→</span>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">AI Integration</div>
                <div className="text-sm text-gray-500">
                  Coming in Phase 5: Claude-powered insights and suggestions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
