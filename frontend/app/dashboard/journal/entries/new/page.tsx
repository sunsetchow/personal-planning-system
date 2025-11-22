'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getActiveTemplate, createEntry, type JournalTemplate } from '@/lib/journal';

function NewEntryContent() {
  const [template, setTemplate] = useState<JournalTemplate | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [moodScore, setMoodScore] = useState<number | undefined>();
  const [energyScore, setEnergyScore] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const activeTemplate = await getActiveTemplate();
        if (!activeTemplate) {
          router.push('/dashboard/journal/templates/new');
          return;
        }
        setTemplate(activeTemplate);
      } catch (err) {
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setSubmitting(true);
    setError('');

    try {
      await createEntry({
        templateId: template.id,
        entryDate,
        responses,
        moodScore,
        energyScore,
      });
      router.push('/dashboard/journal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;
  if (!template) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
          <CardDescription>{template.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            </div>

            {template.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label htmlFor={q.id}>{q.question}</Label>
                {q.type === 'multiline' ? (
                  <Textarea id={q.id} onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })} rows={3} />
                ) : q.type === 'scale' || q.type === 'number' ? (
                  <Input id={q.id} type="number" min={q.type === 'scale' ? 1 : undefined} max={q.type === 'scale' ? 10 : undefined}
                    onChange={(e) => setResponses({ ...responses, [q.id]: parseFloat(e.target.value) })} />
                ) : (
                  <Input id={q.id} onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })} />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mood">Mood Score (1-10)</Label>
                <Input id="mood" type="number" min="1" max="10" value={moodScore || ''} onChange={(e) => setMoodScore(e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy">Energy Level (1-10)</Label>
                <Input id="energy" type="number" min="1" max="10" value={energyScore || ''} onChange={(e) => setEnergyScore(e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Entry'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewEntryPage() {
  return <ProtectedRoute><NewEntryContent /></ProtectedRoute>;
}
