'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTemplate, type Question } from '@/lib/journal';

function NewTemplateContent() {
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: 'How are you feeling today? (1-10)', type: 'scale' },
    { id: '2', question: 'What are three things you accomplished today?', type: 'multiline' },
    { id: '3', question: 'What is your top priority for tomorrow?', type: 'text' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), question: '', type: 'text' }]);
  };

  const updateQuestion = (id: string, field: 'question' | 'type', value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createTemplate({ name, questions, isActive: true });
      router.push('/dashboard/journal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Journal Template</CardTitle>
          <CardDescription>Define questions for your daily journal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input id="name" placeholder="My Daily Journal" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-3">
              <Label>Questions</Label>
              {questions.map((q, idx) => (
                <div key={q.id} className="flex gap-2 items-start p-3 border rounded">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Question" value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} required />
                    <Select value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}>
                      <option value="text">Short Text</option>
                      <option value="multiline">Long Text</option>
                      <option value="number">Number</option>
                      <option value="scale">Scale (1-10)</option>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(q.id)} className="text-red-600">×</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuestion} className="w-full">+ Add Question</Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Template'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTemplatePage() {
  return <ProtectedRoute><NewTemplateContent /></ProtectedRoute>;
}
