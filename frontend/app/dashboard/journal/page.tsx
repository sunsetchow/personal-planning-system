'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEntries, getActiveTemplate, type JournalEntry } from '@/lib/journal';
import Link from 'next/link';

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
    return <div className="flex justify-center py-12"><div className="text-center">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Daily Journal</h2>
          <p className="text-gray-600 mt-1">Track your daily reflections and progress</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/journal/templates">
            <Button variant="outline">Manage Templates</Button>
          </Link>
          {hasTemplate && (
            <Link href="/dashboard/journal/entries/new">
              <Button>+ New Entry</Button>
            </Link>
          )}
        </div>
      </div>

      {!hasTemplate ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No template yet</h3>
              <p className="text-gray-600 mb-6">Create a journal template to start tracking your daily reflections</p>
              <Link href="/dashboard/journal/templates/new">
                <Button>Create Template</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
              <p className="text-gray-600 mb-6">Start your journaling journey today</p>
              <Link href="/dashboard/journal/entries/new">
                <Button>Create First Entry</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/journal/entries/${entry.id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{new Date(entry.entryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
                    <CardDescription>{entry.template?.name}</CardDescription>
                  </div>
                  {(entry.moodScore || entry.energyScore) && (
                    <div className="flex gap-3 text-sm">
                      {entry.moodScore && <span>😊 {entry.moodScore}/10</span>}
                      {entry.energyScore && <span>⚡ {entry.energyScore}/10</span>}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalContent />
    </ProtectedRoute>
  );
}
