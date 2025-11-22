'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getObjectives, deleteObjective } from '@/lib/okr';
import { Objective } from '@/lib/types';
import Link from 'next/link';

function OKRsContent() {
  const [objectives, setObjectives] = useState<(Objective & { progress?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadObjectives = async () => {
    try {
      setLoading(true);
      const data = await getObjectives();
      setObjectives(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load objectives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjectives();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      await deleteObjective(id);
      setObjectives(objectives.filter((obj) => obj.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete objective');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPeriodLabel = (periodType: string) => {
    switch (periodType) {
      case 'QUARTERLY':
        return 'Quarterly';
      case 'SEMI_ANNUAL':
        return 'Semi-Annual';
      case 'ANNUAL':
        return 'Annual';
      default:
        return periodType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-gray-600">Loading objectives...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="mb-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Objectives & Key Results
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your goals and measure progress
              </p>
            </div>
            <Link href="/dashboard/okrs/new">
              <Button size="lg">+ New Objective</Button>
            </Link>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              {error}
            </div>
          )}

          {objectives.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No objectives yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first objective to start tracking your goals
                  </p>
                  <Link href="/dashboard/okrs/new">
                    <Button>Create Objective</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {objectives.map((objective) => (
                <Card key={objective.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{objective.title}</CardTitle>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              objective.status
                            )}`}
                          >
                            {objective.status}
                          </span>
                        </div>
                        <CardDescription>{objective.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/okrs/${objective.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(objective.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {getPeriodLabel(objective.periodType)} • {new Date(objective.startDate).toLocaleDateString()} - {new Date(objective.endDate).toLocaleDateString()}
                        </span>
                        <span>{objective.keyResults?.length || 0} Key Results</span>
                      </div>
                      {typeof objective.progress === 'number' && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {objective.progress}%
                            </span>
                          </div>
                          <Progress value={objective.progress} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OKRsPage() {
  return (
    <ProtectedRoute>
      <OKRsContent />
    </ProtectedRoute>
  );
}
