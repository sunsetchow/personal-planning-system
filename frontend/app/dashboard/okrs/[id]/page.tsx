'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getObjective, createKeyResult, updateKeyResultProgress, deleteKeyResult } from '@/lib/okr';
import { Objective, KeyResult } from '@/lib/types';

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
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>Objective not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Objective Header */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{objective.title}</h2>
            <p className="text-gray-600 mt-2">{objective.description}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/okrs')}>
            ← Back
          </Button>
        </div>

        {typeof objective.progress === 'number' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-semibold text-gray-900">{objective.progress}%</span>
              </div>
              <Progress value={objective.progress} />
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Key Results Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Key Results</h3>
          <Button onClick={() => setShowAddKR(!showAddKR)}>
            {showAddKR ? 'Cancel' : '+ Add Key Result'}
          </Button>
        </div>

        {/* Add Key Result Form */}
        {showAddKR && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Key Result</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Key Results List */}
        {objective.keyResults && objective.keyResults.length > 0 ? (
          <div className="space-y-4">
            {objective.keyResults.map((kr) => {
              const progress = calculateProgress(kr);
              return (
                <Card key={kr.id}>
                  <CardContent className="pt-6">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No key results yet</p>
                <Button onClick={() => setShowAddKR(true)}>Add First Key Result</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
        </div>
      </main>
    </div>
  );
}

export default function ObjectiveDetailPage() {
  return (
    <ProtectedRoute>
      <ObjectiveDetailContent />
    </ProtectedRoute>
  );
}
