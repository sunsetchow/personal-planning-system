'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, TrendingUp, Target, Brain, AlertCircle, Download } from 'lucide-react';

export default function WeeklyCheckinPage() {
  const [loading, setLoading] = useState(false);
  const [checkinData, setCheckinData] = useState<any>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const executeCheckin = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        setCheckinData(data.data.checkin);
      } else {
        alert('Failed to execute check-in: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to execute check-in:', error);
      alert('Failed to execute check-in');
    } finally {
      setLoading(false);
    }
  };

  const applySelectedUpdates = async () => {
    if (selectedSuggestions.size === 0) {
      alert('Please select at least one suggestion to apply');
      return;
    }

    const confirmedSuggestions = checkinData.okrProgress.suggestions.filter((s: any) =>
      selectedSuggestions.has(s.keyResultId)
    );

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-checkin/apply-updates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ confirmedSuggestions }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('OKR updates applied successfully!');
        setSelectedSuggestions(new Set());
        // Refresh check-in data
        executeCheckin();
      } else {
        alert('Failed to apply updates: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to apply updates:', error);
      alert('Failed to apply updates');
    }
  };

  const toggleSuggestion = (keyResultId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(keyResultId)) {
      newSelected.delete(keyResultId);
    } else {
      newSelected.add(keyResultId);
    }
    setSelectedSuggestions(newSelected);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-checkin/report/markdown`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Weekly Check-in</h1>
          <p className="text-muted-foreground">
            Analyze your week and get AI-powered insights
          </p>
        </div>
        <div className="flex gap-2">
          {checkinData && (
            <Button onClick={downloadReport} variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download Report
            </Button>
          )}
          <Button onClick={executeCheckin} disabled={loading} size="lg">
            {loading ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Run Weekly Check-in
              </>
            )}
          </Button>
        </div>
      </div>

      {!checkinData && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Ready for your weekly check-in?</h3>
            <p className="text-muted-foreground mb-4">
              Get insights from your journal entries, time tracking, and OKR progress
            </p>
            <Button onClick={executeCheckin}>Start Check-in</Button>
          </CardContent>
        </Card>
      )}

      {checkinData && (
        <div className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>{checkinData.aiInsights.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkinData.aiInsights.keyHighlights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Key Highlights
                  </h4>
                  <ul className="space-y-1">
                    {checkinData.aiInsights.keyHighlights.map((highlight: string, i: number) => (
                      <li key={i} className="text-sm text-green-700">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checkinData.aiInsights.areasOfConcern.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Areas of Concern
                  </h4>
                  <ul className="space-y-1">
                    {checkinData.aiInsights.areasOfConcern.map((concern: string, i: number) => (
                      <li key={i} className="text-sm text-amber-700">
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checkinData.aiInsights.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {checkinData.aiInsights.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-blue-700">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journal Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Journal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="text-2xl font-bold">
                      {checkinData.journalSummary.totalEntries}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">
                      {checkinData.journalSummary.completionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Mood</p>
                    <p className="text-2xl font-bold">
                      {checkinData.journalSummary.moodPattern.averageMood.toFixed(1)}/10
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {checkinData.journalSummary.moodPattern.moodTrend}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Energy</p>
                    <p className="text-2xl font-bold">
                      {checkinData.journalSummary.moodPattern.averageEnergy.toFixed(1)}/10
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {checkinData.journalSummary.moodPattern.energyTrend}
                    </p>
                  </div>
                </div>

                {checkinData.journalSummary.accomplishments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Top Accomplishments</h4>
                    <ul className="space-y-1 text-sm">
                      {checkinData.journalSummary.accomplishments.slice(0, 3).map((acc: any, i: number) => (
                        <li key={i} className="truncate">{acc.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(checkinData.timeAnalysis.summary.totalDuration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">
                      {checkinData.timeAnalysis.summary.totalSessions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Focus Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(checkinData.timeAnalysis.summary.totalFocusTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Avg</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(checkinData.timeAnalysis.summary.averageDailyTime)}
                    </p>
                  </div>
                </div>

                {checkinData.timeAnalysis.categoryBreakdown.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Top Categories</h4>
                    <div className="space-y-2">
                      {checkinData.timeAnalysis.categoryBreakdown.slice(0, 3).map((cat: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{cat.category}</span>
                          <span className="text-muted-foreground">
                            {formatDuration(cat.totalDuration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* OKR Update Suggestions */}
          {checkinData.okrProgress.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    OKR Update Suggestions
                  </span>
                  {selectedSuggestions.size > 0 && (
                    <Button onClick={applySelectedUpdates} size="sm">
                      Apply {selectedSuggestions.size} Update(s)
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions based on your weekly activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkinData.okrProgress.suggestions.map((suggestion: any) => (
                  <div
                    key={suggestion.keyResultId}
                    className={`p-4 border rounded-lg ${
                      selectedSuggestions.has(suggestion.keyResultId)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(suggestion.keyResultId)}
                        onChange={() => toggleSuggestion(suggestion.keyResultId)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{suggestion.objectiveTitle}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.keyResultTitle}
                        </p>
                        <div className="flex items-center gap-4 text-sm mb-2">
                          <span>
                            Current: <strong>{suggestion.currentProgress.toFixed(0)}%</strong>
                          </span>
                          <span>→</span>
                          <span>
                            Suggested: <strong>{suggestion.suggestedProgress.toFixed(0)}%</strong>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              suggestion.confidence === 'high'
                                ? 'bg-green-100 text-green-800'
                                : suggestion.confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {suggestion.confidence} confidence
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Correlation */}
          {checkinData.activityCorrelation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activities Linked to OKRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checkinData.activityCorrelation.map((activity: any, i: number) => (
                    <div key={i} className="border-l-4 border-primary pl-4 py-2">
                      <p className="font-medium">{activity.description}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>→ {activity.okrObjective}</span>
                        <span>•</span>
                        <span>{activity.sources.join(' + ')}</span>
                        {activity.pomodoroMinutes && (
                          <>
                            <span>•</span>
                            <span>{activity.pomodoroMinutes}min</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
