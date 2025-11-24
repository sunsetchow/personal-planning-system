'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEntry, updateEntry, deleteEntry, type JournalEntry } from '@/lib/journal';
import { analyzeJournalEntry } from '@/lib/ai';
import {
  Calendar,
  Sparkles,
  Edit3,
  Save,
  X,
  Trash2,
  ArrowLeft,
  Smile,
  Zap
} from 'lucide-react';

function EntryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const entryId = params?.id as string;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editedResponses, setEditedResponses] = useState<Record<string, unknown>>({});
  const [editedMoodScore, setEditedMoodScore] = useState<number | undefined>();
  const [editedEnergyScore, setEditedEnergyScore] = useState<number | undefined>();

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzingEntry, setAnalyzingEntry] = useState(false);

  useEffect(() => {
    const loadEntry = async () => {
      try {
        setLoading(true);
        const data = await getEntry(entryId);
        setEntry(data);
        setEditedResponses(data.responses);
        setEditedMoodScore(data.moodScore);
        setEditedEnergyScore(data.energyScore);
        setAiAnalysis(data.aiFeedback || '');
      } catch (err: any) {
        console.error('Failed to load entry:', err);
        setError(err.response?.data?.message || 'Failed to load journal entry');
      } finally {
        setLoading(false);
      }
    };

    if (entryId) {
      loadEntry();
    }
  }, [entryId]);

  const getEntryContent = (): string => {
    if (!entry?.template) return '';

    const parts: string[] = [];
    entry.template.questions.forEach((q) => {
      const answer = editedResponses[q.id];
      if (answer) {
        parts.push(`${q.question}: ${answer}`);
      }
    });

    return parts.join('\n\n');
  };

  const handleAnalyzeEntry = async () => {
    const content = getEntryContent();

    if (!content.trim()) {
      setError('No content to analyze');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAnalyzingEntry(true);
    setError('');

    try {
      const analysis = await analyzeJournalEntry(content);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setError('Failed to analyze entry. Please try again.');
    } finally {
      setAnalyzingEntry(false);
    }
  };

  const handleSave = async () => {
    if (!entry) return;

    setSaving(true);
    setError('');

    try {
      const updated = await updateEntry(entryId, {
        responses: editedResponses,
        moodScore: editedMoodScore,
        energyScore: editedEnergyScore,
      });
      setEntry(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    setEditedResponses(entry.responses);
    setEditedMoodScore(entry.moodScore);
    setEditedEnergyScore(entry.energyScore);
    setIsEditing(false);
    setError('');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEntry(entryId);
      router.push('/dashboard/journal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete entry');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading entry...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !entry) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard/journal')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Journal
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!entry) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/journal')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Button>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Entry Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{entry.template?.name || 'Journal Entry'}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(entry.entryDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </div>
            <div className="flex gap-4">
              {(entry.moodScore || editedMoodScore) && (
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Smile className="h-4 w-4" />
                    <span>Mood</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {isEditing ? editedMoodScore : entry.moodScore}/10
                  </div>
                </div>
              )}
              {(entry.energyScore || editedEnergyScore) && (
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Zap className="h-4 w-4" />
                    <span>Energy</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {isEditing ? editedEnergyScore : entry.energyScore}/10
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Questions and Responses */}
          <div className="space-y-6">
            {entry.template?.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-base font-semibold text-gray-900">
                  {q.question}
                </Label>
                {isEditing ? (
                  q.type === 'multiline' ? (
                    <Textarea
                      value={(editedResponses[q.id] as string) || ''}
                      onChange={(e) =>
                        setEditedResponses({ ...editedResponses, [q.id]: e.target.value })
                      }
                      rows={4}
                      className="text-gray-700"
                    />
                  ) : q.type === 'scale' || q.type === 'number' ? (
                    <Input
                      type="number"
                      min={q.type === 'scale' ? 1 : undefined}
                      max={q.type === 'scale' ? 10 : undefined}
                      value={(editedResponses[q.id] as number) || ''}
                      onChange={(e) =>
                        setEditedResponses({
                          ...editedResponses,
                          [q.id]: parseFloat(e.target.value),
                        })
                      }
                      className="text-gray-700"
                    />
                  ) : (
                    <Input
                      value={(editedResponses[q.id] as string) || ''}
                      onChange={(e) =>
                        setEditedResponses({ ...editedResponses, [q.id]: e.target.value })
                      }
                      className="text-gray-700"
                    />
                  )
                ) : (
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {entry.responses[q.id]?.toString() || '—'}
                  </div>
                )}
              </div>
            ))}

            {/* Mood and Energy Scores (in edit mode) */}
            {isEditing && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood Score (1-10)</Label>
                  <Input
                    id="mood"
                    type="number"
                    min="1"
                    max="10"
                    value={editedMoodScore || ''}
                    onChange={(e) =>
                      setEditedMoodScore(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energy">Energy Level (1-10)</Label>
                  <Input
                    id="energy"
                    type="number"
                    min="1"
                    max="10"
                    value={editedEnergyScore || ''}
                    onChange={(e) =>
                      setEditedEnergyScore(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          {!isEditing && (
            <div className="pt-6 mt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeEntry}
                  disabled={analyzingEntry}
                  className="gap-2"
                >
                  {analyzingEntry ? (
                    <>
                      <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {aiAnalysis ? 'Refresh Analysis' : 'Get AI Feedback'}
                    </>
                  )}
                </Button>
              </div>

              {aiAnalysis ? (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-indigo-900 mb-2">AI Feedback</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">{aiAnalysis}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Click "Get AI Feedback" to receive personalized insights about this entry</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(entry.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(entry.updatedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}

export default function EntryDetailPage() {
  return (
    <ProtectedRoute>
      <EntryDetailContent />
    </ProtectedRoute>
  );
}
