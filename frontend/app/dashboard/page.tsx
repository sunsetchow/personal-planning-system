'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Target, TrendingUp, Zap, Sparkles, Calendar, Award,
  Flame, Trophy, CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAIInsights } from '@/lib/ai';
import { getDashboardStats, getMoodEnergyTrends, type DashboardStats } from '@/lib/dashboard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodEnergyData, setMoodEnergyData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardStats, trendsData] = await Promise.all([
          getDashboardStats(),
          getMoodEnergyTrends(14), // Last 14 days
        ]);

        setStats(dashboardStats);
        setMoodEnergyData(trendsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Load AI insights when stats are available
  useEffect(() => {
    const loadInsights = async () => {
      if (!stats || stats.okrStats.totalObjectives === 0) return;

      setIsLoadingInsights(true);
      try {
        const insights = await getAIInsights();
        setAiInsights(insights);
      } catch (error) {
        console.error('Failed to load AI insights:', error);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    loadInsights();
  }, [stats]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
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

        {/* Stats Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Avg. Progress</div>
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.okrStats.averageProgress || 0}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${stats?.okrStats.averageProgress || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {stats?.okrStats.completedKeyResults || 0} of {stats?.okrStats.totalKeyResults || 0} KRs
              completed
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Active Goals</div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.okrStats.activeObjectives || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.okrStats.completedObjectives || 0} completed this period
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-4">
              <div className="text-sm font-medium text-gray-500">Journal Streak</div>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.journalStats.currentStreak || 0}
              <span className="text-lg text-gray-400 font-normal ml-1">days</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Longest: {stats?.journalStats.longestStreak || 0} days
            </p>
          </div>
        </div>

        {/* Stats Cards Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Journal Activity</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.journalStats.entriesThisWeek || 0}
                </div>
                <div className="text-xs text-gray-500">Entries this week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.journalStats.entriesThisMonth || 0}
                </div>
                <div className="text-xs text-gray-500">Entries this month</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.journalStats.averageMood?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500">Avg. Mood</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.journalStats.averageEnergy?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500">Avg. Energy</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Achievements</h3>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              {stats?.recentActivity.recentAchievements.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Complete objectives and maintain journal streaks to earn achievements!
                </p>
              ) : (
                stats?.recentActivity.recentAchievements.slice(0, 3).map((achievement, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {achievement.type === 'objective_completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {achievement.type === 'key_result_completed' && (
                        <Award className="h-5 w-5 text-blue-600" />
                      )}
                      {achievement.type === 'journal_streak' && (
                        <Flame className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood & Energy Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood & Energy Trends</h3>
            <div className="h-64">
              {moodEnergyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodEnergyData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis hide domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMood)"
                      name="Mood"
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEnergy)"
                      name="Energy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>No journal data yet</p>
                  <p className="text-xs mt-1">Start journaling to see trends</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200 rounded-full opacity-20 blur-xl"></div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">Orbit AI Insights</h3>
            </div>

            {isLoadingInsights ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                <div className="h-4 bg-indigo-200 rounded w-full"></div>
                <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
              </div>
            ) : aiInsights ? (
              <div className="prose prose-indigo text-sm text-indigo-800">
                <p>{aiInsights}</p>
              </div>
            ) : (
              <div className="prose prose-indigo text-sm text-indigo-800">
                <p>
                  Start creating OKRs and journal entries to unlock personalized AI insights
                  about your performance patterns and progress trends.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/dashboard/okrs/new')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-600 transition-colors">
                <Target className="h-5 w-5 text-indigo-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Create New OKR</div>
                <div className="text-xs text-gray-500">Set a new objective</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/journal/entries/new')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                <Zap className="h-5 w-5 text-green-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Write Journal Entry</div>
                <div className="text-xs text-gray-500">Reflect on your day</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/journal/templates/new')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-600 transition-colors">
                <Sparkles className="h-5 w-5 text-purple-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Create Template</div>
                <div className="text-xs text-gray-500">Customize questions</div>
              </div>
            </button>
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
