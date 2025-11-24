'use client';

import { useState, useEffect } from 'react';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Target, Calendar } from 'lucide-react';

interface WeeklySummary {
  totalDuration: number;
  totalFocusTime: number;
  totalSessions: number;
  averageSessionDuration: number;
}

interface CategoryData {
  category: string;
  totalDuration: number;
  sessions: number;
}

export default function TimeAnalyticsPage() {
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch weekly report
      const reportRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-analytics/weekly`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reportData = await reportRes.json();

      if (reportData.success) {
        setWeeklySummary(reportData.data.report.summary);
        setCategoryBreakdown(reportData.data.report.categoryBreakdown);
        setRecommendations(reportData.data.report.recommendations);
      }

      // Fetch category mappings
      const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-mappings?activeOnly=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.data.mappings.map((m: any) => ({
          name: m.categoryName,
          okrCategory: m.okrCategory,
          color: m.hexColor,
        })));
      }

      // Fetch objectives
      const objRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/objectives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const objData = await objRes.json();
      if (objData.success) {
        setObjectives(objData.data.objectives.map((o: any) => ({
          id: o.id,
          title: o.title,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = async (sessionData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();
      if (data.success) {
        alert('Session saved successfully!');
        fetchData(); // Refresh analytics
      } else {
        alert('Failed to save session: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save session');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading time analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Time Analytics</h1>
          <p className="text-muted-foreground">
            Track your time and gain insights into your productivity
          </p>
        </div>
      </div>

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timer">Pomodoro Timer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PomodoroTimer
                onSessionComplete={handleSessionComplete}
                categories={categories}
                objectives={objectives}
              />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">
                      {weeklySummary ? formatDuration(weeklySummary.totalDuration) : '0h 0m'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">
                      {weeklySummary?.totalSessions || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Session</p>
                    <p className="text-2xl font-bold">
                      {weeklySummary ? formatDuration(weeklySummary.averageSessionDuration) : '0h 0m'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Weekly Summary */}
          {weeklySummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(weeklySummary.totalDuration)}</div>
                  <p className="text-xs text-muted-foreground">
                    Focus: {formatDuration(weeklySummary.totalFocusTime)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weeklySummary.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(weeklySummary.averageSessionDuration)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Avg</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(weeklySummary.totalDuration / 7)}
                  </div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Time by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.map((cat, index) => {
                    const percentage = weeklySummary
                      ? (cat.totalDuration / weeklySummary.totalDuration) * 100
                      : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat.category}</span>
                          <span className="text-muted-foreground">
                            {formatDuration(cat.totalDuration)} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!weeklySummary && (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No time data yet</p>
                <p className="text-sm text-muted-foreground">
                  Start tracking your time with the Pomodoro timer to see analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
