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
import { analyzeJournalEntry, suggestOKRUpdates, type OKRUpdateSuggestion } from '@/lib/ai';
import { Sparkles, Lightbulb, CheckCircle, X, ArrowRight } from 'lucide-react';

function NewEntryContent() {
  const [template, setTemplate] = useState<JournalTemplate | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [moodScore, setMoodScore] = useState<number | undefined>();
  const [energyScore, setEnergyScore] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzingEntry, setAnalyzingEntry] = useState(false);

  // OKR Suggestions State
  const [okrSuggestions, setOkrSuggestions] = useState<OKRUpdateSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  // Combine all responses into a single content string for AI analysis
  const getEntryContent = (): string => {
    if (!template) return '';

    const parts: string[] = [];

    template.questions.forEach((q) => {
      const answer = responses[q.id];
      if (answer) {
        parts.push(`${q.question}: ${answer}`);
      }
    });

    return parts.join('\n\n');
  };

  // Analyze journal entry with AI
  const handleAnalyzeEntry = async () => {
    const content = getEntryContent();

    if (!content.trim()) {
      setError('Please add some content to your journal entry first');
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

      // After successful save, get OKR update suggestions
      const content = getEntryContent();
      if (content.trim()) {
        setLoadingSuggestions(true);
        try {
          const suggestions = await suggestOKRUpdates(content);
          if (suggestions.length > 0) {
            setOkrSuggestions(suggestions);
            setShowSuggestions(true);
          } else {
            // No suggestions, go directly to journal page
            router.push('/dashboard/journal');
          }
        } catch (err) {
          console.error('Failed to get OKR suggestions:', err);
          // Don't block the user if suggestions fail
          router.push('/dashboard/journal');
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        router.push('/dashboard/journal');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create entry');
      setSubmitting(false);
    }
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    router.push('/dashboard/journal');
  };

  const handleApplySuggestion = (suggestion: OKRUpdateSuggestion) => {
    // Navigate to the OKR page with the suggestion data
    router.push(`/dashboard/okrs/${suggestion.objectiveId}?suggestedUpdate=${JSON.stringify(suggestion)}`);
  };

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;
  if (!template) return null;

  // Show OKR Suggestions Modal
  if (showSuggestions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                <CardTitle>AI-Suggested OKR Updates</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseSuggestions}
                className="text-white border-white hover:bg-white hover:text-indigo-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-indigo-100">
              Based on your journal entry, here are recommended updates to your OKRs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
                  <p className="mt-4 text-gray-600">Analyzing your entry...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {okrSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {suggestion.reasoning}
                        </p>
                        <p className="text-sm text-gray-600">
                          Suggested value: <span className="font-semibold text-indigo-600">{suggestion.suggestedValue}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="flex items-center gap-1"
                      >
                        Apply
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCloseSuggestions}
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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

            {/* AI Analysis Section */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeEntry}
                disabled={analyzingEntry || !getEntryContent().trim()}
                className="w-full sm:w-auto"
              >
                {analyzingEntry ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Feedback
                  </>
                )}
              </Button>
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-indigo-900 mb-2">AI Feedback</h4>
                    <p className="text-sm text-indigo-800 leading-relaxed">{aiAnalysis}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiAnalysis('')}
                    className="text-indigo-400 hover:text-indigo-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
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
