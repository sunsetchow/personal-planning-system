'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PomodoroTimerProps {
  onSessionComplete?: (session: SessionData) => void;
  categories?: { name: string; okrCategory: string; color: string }[];
  objectives?: { id: string; title: string }[];
}

interface SessionData {
  title: string;
  category?: string;
  okrCategory?: string;
  objectiveId?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  pauseDuration: number;
  focusQuality: string;
  notes?: string;
}

type TimerState = 'idle' | 'running' | 'paused';

export function PomodoroTimer({ onSessionComplete, categories = [], objectives = [] }: PomodoroTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionLength, setSessionLength] = useState(25);

  // Session data
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [notes, setNotes] = useState('');

  // Tracking
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPauseDuration, setTotalPauseDuration] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerState === 'paused' || timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    if (timeLeft === 0 && timerState === 'running') {
      handleComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!title.trim()) {
      alert('Please enter a session title');
      return;
    }

    if (timerState === 'idle') {
      setStartTime(new Date());
      setTimeLeft(sessionLength * 60);
    }

    if (timerState === 'paused' && pauseStartTime) {
      // Calculate pause duration
      const pauseDuration = (new Date().getTime() - pauseStartTime.getTime()) / 1000;
      setTotalPauseDuration(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }

    setTimerState('running');
  };

  const handlePause = () => {
    setTimerState('paused');
    setPauseStartTime(new Date());
  };

  const handleStop = () => {
    if (window.confirm('Are you sure you want to stop this session?')) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!startTime) return;

    const endTime = new Date();
    const actualDuration = (endTime.getTime() - startTime.getTime()) / 1000;

    // Calculate pause duration if currently paused
    let finalPauseDuration = totalPauseDuration;
    if (pauseStartTime) {
      finalPauseDuration += (endTime.getTime() - pauseStartTime.getTime()) / 1000;
    }

    // Determine focus quality based on pause percentage
    const pausePercentage = (finalPauseDuration / actualDuration) * 100;
    let focusQuality = 'FULL_FOCUS';
    if (pausePercentage > 30) {
      focusQuality = 'INTERRUPTED';
    } else if (pausePercentage > 10) {
      focusQuality = 'PARTIAL_FOCUS';
    }

    const selectedCategory = categories.find(c => c.name === category);

    const sessionData: SessionData = {
      title,
      category,
      okrCategory: selectedCategory?.okrCategory,
      objectiveId: objectiveId || undefined,
      startTime,
      endTime,
      duration: Math.floor(actualDuration),
      pauseDuration: Math.floor(finalPauseDuration),
      focusQuality,
      notes: notes || undefined,
    };

    if (onSessionComplete) {
      await onSessionComplete(sessionData);
    }

    // Reset timer
    setTimerState('idle');
    setTimeLeft(sessionLength * 60);
    setTitle('');
    setCategory('');
    setObjectiveId('');
    setNotes('');
    setStartTime(null);
    setPauseStartTime(null);
    setTotalPauseDuration(0);
  };

  const progress = ((sessionLength * 60 - timeLeft) / (sessionLength * 60)) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#2C50CF"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {timerState === 'idle' || timerState === 'paused' ? (
              <Button onClick={handleStart} size="lg">
                <Play className="h-5 w-5 mr-2" />
                {timerState === 'idle' ? 'Start' : 'Resume'}
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="lg">
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}
            {timerState !== 'idle' && (
              <Button onClick={handleStop} variant="destructive" size="lg">
                <Square className="h-5 w-5 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>

        {/* Session Configuration */}
        {timerState === 'idle' && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="session-length">Session Length (minutes)</Label>
              <Select
                value={sessionLength.toString()}
                onValueChange={(value) => {
                  setSessionLength(parseInt(value));
                  setTimeLeft(parseInt(value) * 60);
                }}
              >
                <SelectTrigger id="session-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on?"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name} ({cat.okrCategory})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="objective">Link to Objective</Label>
              <Select value={objectiveId} onValueChange={setObjectiveId}>
                <SelectTrigger id="objective">
                  <SelectValue placeholder="Select an objective (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {objectives.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this session..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Session Info when running */}
        {timerState !== 'idle' && (
          <div className="space-y-2 pt-4 border-t text-sm">
            <p>
              <strong>Working on:</strong> {title}
            </p>
            {category && (
              <p>
                <strong>Category:</strong> {category}
              </p>
            )}
            {pauseStartTime && (
              <p className="text-amber-600">
                ⏸️ Paused - Total pause time: {Math.floor(totalPauseDuration / 60)}m
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
