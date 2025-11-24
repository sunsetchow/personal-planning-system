'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getObjective, createKeyResult, updateKeyResultProgress, deleteKeyResult } from '@/lib/okr';
import { Objective, KeyResult } from '@/lib/types';
import { ArrowLeft, Target, Plus, Trash2 } from 'lucide-react';

function ObjectiveDetailContent() {
  const params = useParams();
  const router = useRouter();
  const objectiveId = params.id as string;

  const [objective, setObjective] = useState<(Objective & { progress?: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Key Result Form State
  const [showAddKR, setShowAddKR] = useState(false);
  const [krTitle, setKrTitle] = useState('');
  const [krDescription, setKrDescription] = useState('');
  const [krTargetValue, setKrTargetValue] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Progress Update State
  const [updatingKr, setUpdatingKr] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState('');

  const loadObjective = async () => {
    try {
      setLoading(true);
      const data = await getObjective(objectiveId);
      setObjective(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load objective');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjective();
  }, [objectiveId]);

  const handleAddKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createKeyResult(objectiveId, {
        title: krTitle,
        description: krDescription,
        targetValue: parseFloat(krTargetValue),
        unit: krUnit,
        currentValue: 0,
      });

      // Reset form
      setKrTitle('');
      setKrDescription('');
      setKrTargetValue('');
      setKrUnit('');
      setShowAddKR(false);

      // Reload objective
      await loadObjective();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create key result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (krId: string) => {
    try {
      await updateKeyResultProgress(krId, parseFloat(progressValue));
      setUpdatingKr(null);
      setProgressValue('');
      await loadObjective();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleDeleteKR = async (krId: string) => {
    if (!confirm('Are you sure you want to delete this key result?')) return;

    try {
      await deleteKeyResult(krId);
      await loadObjective();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete key result');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return 'text-green-600 bg-green-50';
      case 'AT_RISK':
        return 'text-yellow-600 bg-yellow-50';
      case 'BEHIND':
        return 'text-red-600 bg-red-50';
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateProgress = (kr: KeyResult) => {
    return Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading objective...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!objective) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-xl shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Objective not found</p>
                <Button onClick={() => router.push('/dashboard/okrs')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to OKRs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{objective.title}</h2>
            <p className="text-gray-500 mt-1">{objective.description}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/okrs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to OKRs
          </Button>
        </div>

        {/* Progress Card */}
        {typeof objective.progress === 'number' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completion</span>
                <span className="font-semibold text-gray-900">{objective.progress}%</span>
              </div>
              <Progress value={objective.progress} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Key Results Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Key Results</h3>
            <Button onClick={() => setShowAddKR(!showAddKR)}>
              {showAddKR ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" />Add Key Result</>}
            </Button>
          </div>

          {/* Add Key Result Form */}
          {showAddKR && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">New Key Result</h4>
              <form onSubmit={handleAddKeyResult} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="krTitle">Title *</Label>
                  <Input
                    id="krTitle"
                    placeholder="e.g., Launch 3 new products"
                    value={krTitle}
                    onChange={(e) => setKrTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="krDescription">Description</Label>
                  <Textarea
                    id="krDescription"
                    placeholder="Describe how you'll measure this..."
                    value={krDescription}
                    onChange={(e) => setKrDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="krTarget">Target Value *</Label>
                    <Input
                      id="krTarget"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 100"
                      value={krTargetValue}
                      onChange={(e) => setKrTargetValue(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="krUnit">Unit *</Label>
                    <Input
                      id="krUnit"
                      placeholder="e.g., products, %, $"
                      value={krUnit}
                      onChange={(e) => setKrUnit(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Key Result'}
                </Button>
              </form>
            </div>
          )}

          {/* Key Results List */}
          {objective.keyResults && objective.keyResults.length > 0 ? (
            <div className="space-y-3">
              {objective.keyResults.map((kr) => {
                const progress = calculateProgress(kr);
                return (
                  <div key={kr.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{kr.title}</h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                              kr.status
                            )}`}
                          >
                            {kr.status.replace('_', ' ')}
                          </span>
                        </div>
                        {kr.description && (
                          <p className="text-sm text-gray-600">{kr.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKR(kr.id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {kr.currentValue} / {kr.targetValue} {kr.unit}
                        </span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} />

                      {updatingKr === kr.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="New value"
                            value={progressValue}
                            onChange={(e) => setProgressValue(e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleUpdateProgress(kr.id)}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUpdatingKr(null);
                              setProgressValue('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUpdatingKr(kr.id);
                            setProgressValue(kr.currentValue.toString());
                          }}
                        >
                          Update Progress
                        </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">No key results yet</p>
                <Button onClick={() => setShowAddKR(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Key Result
                </Button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
}

export default function ObjectiveDetailPage() {
  return (
    <ProtectedRoute>
      <ObjectiveDetailContent />
    </ProtectedRoute>
  );
}
