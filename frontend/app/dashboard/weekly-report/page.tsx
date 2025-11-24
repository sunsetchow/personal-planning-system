'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ButtonNew } from '@/components/ui/button-new';
import { getWeeklyReport, WeeklyReportData } from '@/lib/weeklyReport';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Target,
  Award,
  Brain,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function WeeklyReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [weekOffset]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyReport(weekOffset);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load weekly report');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') return 'text-green-600 bg-green-50';
    if (trend === 'declining') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getChangeIndicator = (value: number) => {
    if (value > 0) return <span className="text-green-600">+{value}</span>;
    if (value < 0) return <span className="text-red-600">{value}</span>;
    return <span className="text-gray-600">{value}</span>;
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'objective_completed':
        return <Target className="w-5 h-5 text-indigo-600" />;
      case 'key_result_completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'journal_streak':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'mood_improvement':
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      default:
        return <Award className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-medium">{error || 'Failed to load report'}</p>
            <ButtonNew onClick={loadReport} className="mt-4">
              Try Again
            </ButtonNew>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const weekStart = new Date(report.dateRange.start);
  const weekEnd = new Date(report.dateRange.end);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Weekly Report</h1>
              <p className="text-gray-600 mt-1">
                Week {report.dateRange.weekNumber}, {report.dateRange.year}
              </p>
              <p className="text-sm text-gray-500">
                {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ButtonNew
                variant="secondary"
                size="sm"
                onClick={() => setWeekOffset(weekOffset + 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </ButtonNew>
              <ButtonNew
                variant="secondary"
                size="sm"
                onClick={() => setWeekOffset(weekOffset - 1)}
                disabled={weekOffset === 0}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </ButtonNew>
            </div>
          </div>
        </div>

        {/* Week-over-Week Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Journal Entries</span>
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {report.journalSummary.totalEntries}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getChangeIndicator(report.weekOverWeekComparison.entriesChange)} vs last week
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Mood</span>
              {getTrendIcon(report.journalSummary.moodTrend)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {report.journalSummary.averageMood.toFixed(1)}/10
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getChangeIndicator(report.weekOverWeekComparison.moodChange)} vs last week
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Energy</span>
              {getTrendIcon(report.journalSummary.energyTrend)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {report.journalSummary.averageEnergy.toFixed(1)}/10
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getChangeIndicator(report.weekOverWeekComparison.energyChange)} vs last week
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">OKR Progress</span>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {report.okrProgress.totalProgress}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {report.okrProgress.updatesThisWeek} updates this week
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Journal & OKR Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journal Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Journal Summary</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Mood Trend</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getTrendColor(report.journalSummary.moodTrend)}`}>
                    {getTrendIcon(report.journalSummary.moodTrend)}
                    <span className="text-sm font-medium capitalize">
                      {report.journalSummary.moodTrend}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Energy Trend</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getTrendColor(report.journalSummary.energyTrend)}`}>
                    {getTrendIcon(report.journalSummary.energyTrend)}
                    <span className="text-sm font-medium capitalize">
                      {report.journalSummary.energyTrend}
                    </span>
                  </div>
                </div>
              </div>

              {report.journalSummary.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Highlights</h3>
                  <div className="space-y-3">
                    {report.journalSummary.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="bg-indigo-50 border border-indigo-100 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-indigo-600 font-medium">
                            {format(new Date(highlight.date), 'MMM dd')}
                          </span>
                          {highlight.moodScore && (
                            <span className="text-xs text-indigo-600">
                              Mood: {highlight.moodScore}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {highlight.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OKR Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">OKR Progress</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.okrProgress.objectivesWorkedOn}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Objectives Worked On</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.okrProgress.completedKeyResults}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Key Results Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {report.okrProgress.updatesThisWeek}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Total Updates</div>
                </div>
              </div>

              {report.okrProgress.topObjectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Top Objectives</h3>
                  <div className="space-y-3">
                    {report.okrProgress.topObjectives.map((obj) => (
                      <div key={obj.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {obj.title}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${obj.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-sm font-semibold text-gray-900">
                          {obj.progress}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report.insights.aiSummary}
                </p>
              </div>

              {report.insights.patterns.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Patterns Observed</h3>
                  <div className="space-y-2">
                    {report.insights.patterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.insights.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                  <div className="space-y-2">
                    {report.insights.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Achievements */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
              </div>

              {report.achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No achievements this week yet. Keep going!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getAchievementIcon(achievement.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {achievement.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-indigo-600">
                            {format(new Date(achievement.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
