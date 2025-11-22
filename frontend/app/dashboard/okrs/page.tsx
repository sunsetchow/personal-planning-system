'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ButtonNew } from '@/components/ui/button-new';
import { Progress } from '@/components/ui/progress';
import { getObjectives, deleteObjective } from '@/lib/okr';
import { Objective } from '@/lib/types';
import { Plus, ChevronDown, ChevronUp, Target, Trash2 } from 'lucide-react';

function OKRsContent() {
  const [objectives, setObjectives] = useState<(Objective & { progress?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const getPeriodLabel = (periodType: string) => {
    switch (periodType) {
      case 'QUARTERLY':
        return 'Q1 2025';
      case 'SEMI_ANNUAL':
        return 'H1 2025';
      case 'ANNUAL':
        return '2025';
      default:
        return periodType;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading objectives...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Objectives & Key Results</h2>
          <ButtonNew onClick={() => router.push('/dashboard/okrs/new')} variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New Objective
          </ButtonNew>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {objectives.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No objectives</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new quarterly or annual goal.
              </p>
              <div className="mt-6">
                <ButtonNew onClick={() => router.push('/dashboard/okrs/new')}>
                  <Plus className="h-4 w-4 mr-2" /> Create Objective
                </ButtonNew>
              </div>
            </div>
          ) : (
            objectives.map((obj) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                isExpanded={expandedId === obj.id}
                onToggleExpand={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                onDelete={handleDelete}
                getPeriodLabel={getPeriodLabel}
                router={router}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

interface ObjectiveCardProps {
  objective: Objective & { progress?: number };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
  getPeriodLabel: (periodType: string) => string;
  router: any;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  isExpanded,
  onToggleExpand,
  onDelete,
  getPeriodLabel,
  router,
}) => {
  const progress = objective.progress || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className="p-5 flex items-center justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">
              {getPeriodLabel(objective.periodType)}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">{objective.title}</h3>
          </div>
          {objective.description && (
            <p className="text-sm text-gray-600 mb-2">{objective.description}</p>
          )}
          <div className="w-full max-w-md bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <span className="text-2xl font-bold text-gray-700">{progress}%</span>
          {isExpanded ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-5 border-t border-gray-100">
          <div className="space-y-4 mb-6">
            {objective.keyResults && objective.keyResults.length > 0 ? (
              objective.keyResults.map((kr: any) => (
                <div
                  key={kr.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{kr.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span>
                        Target: {kr.targetValue} {kr.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">
                        {kr.currentValue} / {kr.targetValue} {kr.unit}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      {Math.round((kr.currentValue / kr.targetValue) * 100)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No key results yet. Click &quot;View Details&quot; to add key results.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {new Date(objective.startDate).toLocaleDateString()} -{' '}
              {new Date(objective.endDate).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <ButtonNew
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dashboard/okrs/${objective.id}`)}
              >
                View Details
              </ButtonNew>
              <ButtonNew variant="danger" size="sm" onClick={() => onDelete(objective.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </ButtonNew>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function OKRsPage() {
  return (
    <ProtectedRoute>
      <OKRsContent />
    </ProtectedRoute>
  );
}
