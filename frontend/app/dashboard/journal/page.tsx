'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ButtonNew } from '@/components/ui/button-new';
import { getEntries, getActiveTemplate, type JournalEntry } from '@/lib/journal';
import { Smile, Battery, MessageSquare, Plus, Calendar } from 'lucide-react';

function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [entriesData, activeTemplate] = await Promise.all([
          getEntries({ limit: 10 }),
          getActiveTemplate(),
        ]);
        setEntries(entriesData);
        setHasTemplate(!!activeTemplate);
      } catch (err) {
        console.error('Failed to load journal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading journal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Journal</h2>
            <p className="text-gray-500">Track your daily reflections and progress</p>
          </div>
          <div className="flex gap-2">
            <ButtonNew
              variant="secondary"
              onClick={() => router.push('/dashboard/journal/templates/new')}
            >
              <Plus className="h-4 w-4 mr-2" /> New Template
            </ButtonNew>
            {hasTemplate && (
              <ButtonNew onClick={() => router.push('/dashboard/journal/entries/new')}>
                <MessageSquare className="h-4 w-4 mr-2" /> New Entry
              </ButtonNew>
            )}
          </div>
        </div>

        {!hasTemplate ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No template yet</h3>
              <p className="text-gray-600 mb-6">
                Create a journal template to customize your daily reflection questions
              </p>
              <ButtonNew onClick={() => router.push('/dashboard/journal/templates/new')}>
                <Plus className="h-4 w-4 mr-2" /> Create Template
              </ButtonNew>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No journal entries yet
              </h3>
              <p className="text-gray-600 mb-6">Start your journaling journey today</p>
              <ButtonNew onClick={() => router.push('/dashboard/journal/entries/new')}>
                <Plus className="h-4 w-4 mr-2" /> Create First Entry
              </ButtonNew>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Recent Entries</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/dashboard/journal/entries/${entry.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {new Date(entry.entryDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {entry.template?.name && (
                          <span className="text-xs text-gray-500">• {entry.template.name}</span>
                        )}
                      </div>
                    </div>
                    {(entry.moodScore || entry.energyScore) && (
                      <div className="flex gap-3 text-xs">
                        {entry.moodScore && (
                          <span
                            className={`flex items-center gap-1 ${
                              entry.moodScore >= 7 ? 'text-green-600' : 'text-orange-500'
                            }`}
                          >
                            <Smile className="h-3 w-3" /> {entry.moodScore}/10
                          </span>
                        )}
                        {entry.energyScore && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Battery className="h-3 w-3" /> {entry.energyScore}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show first question response if available */}
                  {entry.responses && Object.keys(entry.responses).length > 0 && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {(() => {
                        const firstKey = Object.keys(entry.responses)[0];
                        const firstResponse = entry.responses[firstKey];
                        return typeof firstResponse === 'string'
                          ? firstResponse
                          : JSON.stringify(firstResponse);
                      })()}
                    </div>
                  )}

                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-indigo-600 font-medium">
                      Click to view full entry →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalContent />
    </ProtectedRoute>
  );
}
