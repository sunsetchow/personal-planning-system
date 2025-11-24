import prisma from '../config/database';
import { getUserEntries } from './journalEntryService';
import { getUserObjectives } from './objectiveService';
import { generateInsights } from './claudeService';

/**
 * Weekly Report Service
 * Generates comprehensive weekly reports for users
 */

export interface WeeklyReportData {
  dateRange: {
    start: Date;
    end: Date;
    weekNumber: number;
    year: number;
  };
  journalSummary: {
    totalEntries: number;
    averageMood: number;
    averageEnergy: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    energyTrend: 'improving' | 'declining' | 'stable';
    topEmotions: string[];
    highlights: Array<{
      date: Date;
      content: string;
      moodScore?: number;
    }>;
  };
  okrProgress: {
    objectivesWorkedOn: number;
    totalProgress: number;
    completedKeyResults: number;
    updatesThisWeek: number;
    topObjectives: Array<{
      id: string;
      title: string;
      progress: number;
      change: number;
    }>;
  };
  achievements: Array<{
    type: 'objective_completed' | 'key_result_completed' | 'journal_streak' | 'mood_improvement';
    title: string;
    description: string;
    date: Date;
  }>;
  insights: {
    aiSummary: string;
    patterns: string[];
    recommendations: string[];
  };
  weekOverWeekComparison: {
    entriesChange: number;
    moodChange: number;
    energyChange: number;
    progressChange: number;
  };
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((Number(d) - Number(yearStart)) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

/**
 * Calculate trend from array of numbers
 */
function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

/**
 * Generate weekly report for a user
 */
export const generateWeeklyReport = async (
  userId: string,
  weekOffset: number = 0 // 0 = current week, -1 = last week, etc.
): Promise<WeeklyReportData> => {
  // Calculate date range for the week
  const now = new Date();
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday - (weekOffset * 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { week, year } = getWeekNumber(weekStart);

  // Get previous week dates for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

  // Fetch data for current week
  const [allEntries, allObjectives, weekUpdates] = await Promise.all([
    getUserEntries(userId),
    getUserObjectives(userId),
    prisma.okrUpdate.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        keyResult: {
          objective: {
            userId,
          },
        },
      },
      include: {
        keyResult: {
          include: {
            objective: true,
          },
        },
      },
    }),
  ]);

  // Filter entries for current week and previous week
  const weekEntries = allEntries.filter(
    (e) => e.entryDate >= weekStart && e.entryDate <= weekEnd
  );
  const prevWeekEntries = allEntries.filter(
    (e) => e.entryDate >= prevWeekStart && e.entryDate <= prevWeekEnd
  );

  // Journal Summary
  const moodScores = weekEntries
    .filter((e) => e.moodScore !== null)
    .map((e) => Number(e.moodScore));
  const energyScores = weekEntries
    .filter((e) => e.energyScore !== null)
    .map((e) => Number(e.energyScore));

  const averageMood = moodScores.length > 0
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : 0;
  const averageEnergy = energyScores.length > 0
    ? energyScores.reduce((a, b) => a + b, 0) / energyScores.length
    : 0;

  const prevAvgMood = prevWeekEntries
    .filter((e) => e.moodScore !== null)
    .reduce((sum, e) => sum + Number(e.moodScore || 0), 0) / prevWeekEntries.length || 0;
  const prevAvgEnergy = prevWeekEntries
    .filter((e) => e.energyScore !== null)
    .reduce((sum, e) => sum + Number(e.energyScore || 0), 0) / prevWeekEntries.length || 0;

  // Get highlights (entries with high mood or significant content)
  const highlights = weekEntries
    .filter((e) => e.moodScore && Number(e.moodScore) >= 7)
    .sort((a, b) => Number(b.moodScore || 0) - Number(a.moodScore || 0))
    .slice(0, 3)
    .map((e) => {
      // Extract first response or aiFeedback as content
      let content = e.aiFeedback || '';
      if (!content && typeof e.responses === 'object' && e.responses !== null) {
        const responses = e.responses as any;
        const firstKey = Object.keys(responses)[0];
        content = firstKey ? String(responses[firstKey]) : 'Journal entry';
      }
      return {
        date: e.entryDate,
        content: content.substring(0, 200),
        moodScore: e.moodScore ? Number(e.moodScore) : undefined,
      };
    });

  // OKR Progress
  const objectivesWithUpdates = new Set(
    weekUpdates.map((u) => u.keyResult.objectiveId)
  );

  const completedKRsThisWeek = weekUpdates.filter(
    (u) => u.keyResult.status === 'COMPLETED'
  ).length;

  // Calculate progress for each objective
  const objectiveProgress = allObjectives.map((obj) => {
    const totalKRs = obj.keyResults.length;
    if (totalKRs === 0) return { ...obj, progress: 0, change: 0 };

    const currentProgress = obj.keyResults.reduce((sum, kr) => {
      const progress = Math.min(100, (Number(kr.currentValue) / Number(kr.targetValue)) * 100);
      return sum + progress;
    }, 0) / totalKRs;

    return {
      id: obj.id,
      title: obj.title,
      progress: Math.round(currentProgress),
      change: 0, // Calculate based on updates if needed
    };
  });

  const topObjectives = objectiveProgress
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  const avgOKRProgress = objectiveProgress.length > 0
    ? objectiveProgress.reduce((sum, obj) => sum + obj.progress, 0) / objectiveProgress.length
    : 0;

  // Achievements
  const achievements: WeeklyReportData['achievements'] = [];

  // Check for completed objectives
  const completedObjectives = allObjectives.filter(
    (obj) => obj.status === 'COMPLETED' && obj.updatedAt >= weekStart && obj.updatedAt <= weekEnd
  );
  completedObjectives.forEach((obj) => {
    achievements.push({
      type: 'objective_completed',
      title: `Completed: ${obj.title}`,
      description: `You successfully completed this objective!`,
      date: obj.updatedAt,
    });
  });

  // Check for journal streaks
  if (weekEntries.length === 7) {
    achievements.push({
      type: 'journal_streak',
      title: 'Perfect Week Streak!',
      description: 'You journaled every day this week',
      date: weekEnd,
    });
  }

  // Check for mood improvement
  if (moodScores.length >= 3 && calculateTrend(moodScores) === 'improving') {
    achievements.push({
      type: 'mood_improvement',
      title: 'Mood on the Rise',
      description: 'Your mood improved throughout the week',
      date: weekEnd,
    });
  }

  // Generate AI insights
  let aiSummary = 'No journal entries this week to analyze.';
  const patterns: string[] = [];
  const recommendations: string[] = [];

  if (weekEntries.length > 0) {
    try {
      aiSummary = await generateInsights(weekEntries, allObjectives);

      // Add pattern observations
      if (moodScores.length >= 3) {
        const trend = calculateTrend(moodScores);
        if (trend === 'improving') {
          patterns.push('Your mood has been trending upward this week');
        } else if (trend === 'declining') {
          patterns.push('Your mood has been declining - consider reviewing what might be causing stress');
        }
      }

      if (weekEntries.length >= 5) {
        patterns.push(`Strong journaling habit with ${weekEntries.length} entries this week`);
      }

      if (objectivesWithUpdates.size > 0) {
        patterns.push(`Made progress on ${objectivesWithUpdates.size} objective(s)`);
      }

      // Add recommendations
      if (weekEntries.length < 3) {
        recommendations.push('Try to journal more consistently to track your progress better');
      }

      if (objectivesWithUpdates.size === 0 && allObjectives.length > 0) {
        recommendations.push('No OKR updates this week - schedule time to review your objectives');
      }

      if (averageMood < 5) {
        recommendations.push('Your mood is below average - consider taking breaks and self-care activities');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  }

  // Week over week comparison
  const weekOverWeekComparison = {
    entriesChange: weekEntries.length - prevWeekEntries.length,
    moodChange: Number((averageMood - prevAvgMood).toFixed(1)),
    energyChange: Number((averageEnergy - prevAvgEnergy).toFixed(1)),
    progressChange: Number((avgOKRProgress - 0).toFixed(1)), // Would need previous week OKR data
  };

  return {
    dateRange: {
      start: weekStart,
      end: weekEnd,
      weekNumber: week,
      year,
    },
    journalSummary: {
      totalEntries: weekEntries.length,
      averageMood: Number(averageMood.toFixed(1)),
      averageEnergy: Number(averageEnergy.toFixed(1)),
      moodTrend: calculateTrend(moodScores),
      energyTrend: calculateTrend(energyScores),
      topEmotions: [], // Could be extracted from content analysis
      highlights,
    },
    okrProgress: {
      objectivesWorkedOn: objectivesWithUpdates.size,
      totalProgress: Math.round(avgOKRProgress),
      completedKeyResults: completedKRsThisWeek,
      updatesThisWeek: weekUpdates.length,
      topObjectives,
    },
    achievements,
    insights: {
      aiSummary,
      patterns,
      recommendations,
    },
    weekOverWeekComparison,
  };
};

/**
 * Get available weekly reports for a user
 */
export const getAvailableWeeks = async (userId: string): Promise<Array<{ week: number; year: number; start: Date; end: Date }>> => {
  const entries = await getUserEntries(userId);

  if (entries.length === 0) return [];

  // Get earliest and latest entry
  const dates = entries.map((e) => e.entryDate).sort((a, b) => Number(a) - Number(b));
  const earliest = dates[0];
  const latest = dates[dates.length - 1];

  const weeks: Array<{ week: number; year: number; start: Date; end: Date }> = [];
  const current = new Date(earliest);

  while (current <= latest) {
    const { week, year } = getWeekNumber(current);
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weeks.push({ week, year, start: weekStart, end: weekEnd });
    current.setDate(current.getDate() + 7);
  }

  return weeks.reverse(); // Most recent first
};
