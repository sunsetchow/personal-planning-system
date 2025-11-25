import { FocusQuality, Prisma } from '@prisma/client';
import prisma from '../config/database';

/**
 * Time Tracking Service
 * Manages Pomodoro sessions and time analysis
 */

export interface TimeSessionInput {
  title: string;
  category?: string;
  okrCategory?: string;
  objectiveId?: string;
  startTime: Date;
  endTime: Date;
  focusQuality: FocusQuality;
  tags?: string[];
  notes?: string;
  pauseDuration?: number;
  isCompleted?: boolean;
}

export interface TimeAllocationByCategory {
  category: string;
  totalMinutes: number;
  sessionCount: number;
  averageFocusQuality: number;
}

export interface WeeklyTimeAnalysis {
  totalMinutes: number;
  totalSessions: number;
  byCategory: TimeAllocationByCategory[];
  byFocusQuality: {
    full: number;
    partial: number;
    interrupted: number;
    rest: number;
  };
  topActivities: Array<{
    title: string;
    minutes: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    minutes: number;
    sessions: number;
  }>;
}

/**
 * Create a new time session
 */
export const createTimeSession = async (userId: string, data: TimeSessionInput) => {
  const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));

  return prisma.timeSession.create({
    data: {
      userId,
      title: data.title,
      category: data.category,
      okrCategory: data.okrCategory,
      objectiveId: data.objectiveId,
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      focusQuality: data.focusQuality,
      tags: data.tags ? (data.tags as Prisma.InputJsonValue) : undefined,
      notes: data.notes,
      pauseDuration: data.pauseDuration ?? 0,
      isCompleted: data.isCompleted ?? true,
    },
  });
};

/**
 * Get user's time sessions for a date range
 */
export const getTimeSessions = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return prisma.timeSession.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });
};

/**
 * Analyze time allocation for a week
 */
export const analyzeWeeklyTime = async (
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyTimeAnalysis> => {
  const sessions = await getTimeSessions(userId, weekStart, weekEnd);

  if (sessions.length === 0) {
    return {
      totalMinutes: 0,
      totalSessions: 0,
      byCategory: [],
      byFocusQuality: { full: 0, partial: 0, interrupted: 0, rest: 0 },
      topActivities: [],
      dailyBreakdown: [],
    };
  }

  // Calculate totals
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = sessions.length;

  // Group by category
  const categoryMap = new Map<string, { minutes: number; sessions: number; focusScores: number[] }>();

  sessions.forEach((session) => {
    const cat = session.category || 'Uncategorized';
    const existing = categoryMap.get(cat) || { minutes: 0, sessions: 0, focusScores: [] };

    existing.minutes += session.duration;
    existing.sessions += 1;

    // Map focus quality to score: full=1, partial=0.5, interrupted/rest=0
    const focusScore =
      session.focusQuality === FocusQuality.FULL_FOCUS
        ? 1
        : session.focusQuality === FocusQuality.PARTIAL_FOCUS
          ? 0.5
          : 0;
    existing.focusScores.push(focusScore);

    categoryMap.set(cat, existing);
  });

  const byCategory: TimeAllocationByCategory[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      totalMinutes: data.minutes,
      sessionCount: data.sessions,
      averageFocusQuality:
        data.focusScores.reduce((a, b) => a + b, 0) / data.focusScores.length,
    })
  );

  // Sort by time spent
  byCategory.sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Calculate focus quality distribution
  const byFocusQuality = {
    full: sessions
      .filter((s) => s.focusQuality === FocusQuality.FULL_FOCUS)
      .reduce((sum, s) => sum + s.duration, 0),
    partial: sessions
      .filter((s) => s.focusQuality === FocusQuality.PARTIAL_FOCUS)
      .reduce((sum, s) => sum + s.duration, 0),
    interrupted: sessions
      .filter((s) => s.focusQuality === FocusQuality.INTERRUPTED)
      .reduce((sum, s) => sum + s.duration, 0),
    rest: sessions
      .filter((s) => s.focusQuality === FocusQuality.REST)
      .reduce((sum, s) => sum + s.duration, 0),
  };

  // Get top activities by time
  const activityMap = new Map<string, number>();
  sessions.forEach((s) => {
    activityMap.set(s.title, (activityMap.get(s.title) || 0) + s.duration);
  });

  const topActivities = Array.from(activityMap.entries())
    .map(([title, minutes]) => ({ title, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  // Daily breakdown
  const dailyMap = new Map<string, { minutes: number; sessions: number }>();
  sessions.forEach((s) => {
    const dateKey = s.startTime.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) || { minutes: 0, sessions: 0 };
    existing.minutes += s.duration;
    existing.sessions += 1;
    dailyMap.set(dateKey, existing);
  });

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, minutes: data.minutes, sessions: data.sessions }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalMinutes,
    totalSessions,
    byCategory,
    byFocusQuality,
    topActivities,
    dailyBreakdown,
  };
};

/**
 * Map OKR categories to time sessions
 */
export const mapTimeToObjectives = async (
  userId: string,
  weekStart: Date,
  weekEnd: Date
) => {
  const sessions = await getTimeSessions(userId, weekStart, weekEnd);

  // Group sessions by linked objective
  const objectiveMap = new Map<string, { minutes: number; sessions: TimeSessionInput[] }>();

  sessions.forEach((session) => {
    if (session.objectiveId) {
      const existing = objectiveMap.get(session.objectiveId) || {
        minutes: 0,
        sessions: [],
      };
      existing.minutes += session.duration;
      existing.sessions.push(session as any);
      objectiveMap.set(session.objectiveId, existing);
    }
  });

  return Array.from(objectiveMap.entries()).map(([objectiveId, data]) => ({
    objectiveId,
    totalMinutes: data.minutes,
    sessionCount: data.sessions.length,
  }));
};

/**
 * Update or delete time session
 */
export const updateTimeSession = async (
  sessionId: string,
  userId: string,
  data: Partial<TimeSessionInput>
) => {
  // Verify ownership
  const session = await prisma.timeSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  // Recalculate duration if times changed
  let duration = session.duration;
  if (data.startTime || data.endTime) {
    const start = data.startTime || session.startTime;
    const end = data.endTime || session.endTime;
    duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  const updateData: Prisma.TimeSessionUncheckedUpdateInput = {
    duration,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.okrCategory !== undefined) updateData.okrCategory = data.okrCategory;
  if (data.objectiveId !== undefined) updateData.objectiveId = data.objectiveId;
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.focusQuality !== undefined) updateData.focusQuality = data.focusQuality;
  if (data.tags !== undefined) updateData.tags = data.tags as Prisma.InputJsonValue;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.pauseDuration !== undefined) updateData.pauseDuration = data.pauseDuration;
  if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

  return prisma.timeSession.update({
    where: { id: sessionId },
    data: updateData,
  });
};

export const deleteTimeSession = async (sessionId: string, userId: string) => {
  const session = await prisma.timeSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  return prisma.timeSession.delete({
    where: { id: sessionId },
  });
};
