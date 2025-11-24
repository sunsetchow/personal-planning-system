import prisma from '../config/database';
import { getUserObjectives } from './objectiveService';
import { getUserEntries } from './journalEntryService';

/**
 * Dashboard Service
 * Aggregates data for analytics and insights
 */

interface DashboardStats {
  okrStats: {
    totalObjectives: number;
    activeObjectives: number;
    completedObjectives: number;
    averageProgress: number;
    totalKeyResults: number;
    completedKeyResults: number;
  };
  journalStats: {
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
  };
  recentActivity: {
    lastJournalEntry?: Date;
    lastOKRUpdate?: Date;
    recentAchievements: Array<{
      type: 'objective_completed' | 'key_result_completed' | 'journal_streak';
      title: string;
      date: Date;
    }>;
  };
}

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
  const [objectives, journalEntries] = await Promise.all([
    getUserObjectives(userId),
    getUserEntries(userId),
  ]);

  // Calculate OKR stats
  const totalObjectives = objectives.length;
  const activeObjectives = objectives.filter((o) => o.status === 'ACTIVE').length;
  const completedObjectives = objectives.filter((o) => o.status === 'COMPLETED').length;

  const allKeyResults = objectives.flatMap((o) => o.keyResults);
  const totalKeyResults = allKeyResults.length;
  const completedKeyResults = allKeyResults.filter((kr) => kr.status === 'COMPLETED').length;

  const averageProgress =
    totalObjectives > 0
      ? Math.round(
          objectives.reduce((sum, obj) => {
            const krProgress = obj.keyResults.reduce((acc, kr) => {
              return acc + Math.min(100, (Number(kr.currentValue) / Number(kr.targetValue)) * 100);
            }, 0);
            return sum + (obj.keyResults.length > 0 ? krProgress / obj.keyResults.length : 0);
          }, 0) / totalObjectives
        )
      : 0;

  // Calculate journal stats
  const totalEntries = journalEntries.length;

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateJournalStreaks(journalEntries);

  // Calculate time-based stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const entriesThisWeek = journalEntries.filter((e) => new Date(e.entryDate) >= weekAgo).length;
  const entriesThisMonth = journalEntries.filter((e) => new Date(e.entryDate) >= monthAgo).length;

  // Get recent activity
  const lastJournalEntry = journalEntries.length > 0 ? new Date(journalEntries[0].entryDate) : undefined;

  const lastOKRUpdate = await prisma.okrUpdate.findFirst({
    where: { keyResult: { objective: { userId } } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  // Find recent achievements
  const recentAchievements: DashboardStats['recentActivity']['recentAchievements'] = [];

  // Recently completed objectives (last 30 days)
  const recentCompletedObjectives = objectives.filter((o) => {
    return o.status === 'COMPLETED' && new Date(o.updatedAt) >= monthAgo;
  });

  recentCompletedObjectives.forEach((obj) => {
    recentAchievements.push({
      type: 'objective_completed',
      title: `Completed: ${obj.title}`,
      date: new Date(obj.updatedAt),
    });
  });

  // Recently completed key results
  const recentCompletedKRs = allKeyResults.filter((kr) => {
    return kr.status === 'COMPLETED' && new Date(kr.updatedAt) >= monthAgo;
  });

  recentCompletedKRs.slice(0, 3).forEach((kr) => {
    recentAchievements.push({
      type: 'key_result_completed',
      title: `Completed KR: ${kr.title}`,
      date: new Date(kr.updatedAt),
    });
  });

  // Journal streak milestone
  if (currentStreak >= 7) {
    recentAchievements.push({
      type: 'journal_streak',
      title: `${currentStreak} day journal streak!`,
      date: lastJournalEntry || now,
    });
  }

  // Sort achievements by date
  recentAchievements.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    okrStats: {
      totalObjectives,
      activeObjectives,
      completedObjectives,
      averageProgress,
      totalKeyResults,
      completedKeyResults,
    },
    journalStats: {
      totalEntries,
      currentStreak,
      longestStreak,
      entriesThisWeek,
      entriesThisMonth,
    },
    recentActivity: {
      lastJournalEntry,
      lastOKRUpdate: lastOKRUpdate?.createdAt,
      recentAchievements: recentAchievements.slice(0, 5),
    },
  };
};

/**
 * Get journal entry activity over time
 * (Previously tracked mood and energy, now tracks entry presence)
 */
export const getMoodEnergyTrends = async (userId: string, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId,
      entryDate: { gte: startDate },
    },
    orderBy: { entryDate: 'asc' },
    select: {
      entryDate: true,
    },
  });

  return entries.map((entry) => ({
    date: entry.entryDate.toISOString().split('T')[0],
    hasEntry: true,
  }));
};

/**
 * Get OKR progress over time
 */
export const getOKRProgressTrends = async (userId: string) => {
  const objectives = await getUserObjectives(userId);

  const progressData = await Promise.all(
    objectives.map(async (obj) => {
      // Get recent updates for this objective's key results
      const updates = await prisma.okrUpdate.findMany({
        where: {
          keyResult: { objectiveId: obj.id },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        currentProgress:
          obj.keyResults.length > 0
            ? Math.round(
                obj.keyResults.reduce((acc, kr) => {
                  return acc + Math.min(100, (Number(kr.currentValue) / Number(kr.targetValue)) * 100);
                }, 0) / obj.keyResults.length
              )
            : 0,
        recentUpdates: updates.length,
      };
    })
  );

  return progressData;
};

/**
 * Calculate journal streaks
 */
function calculateJournalStreaks(entries: any[]): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort entries by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let checkDate = new Date(today);
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.entryDate);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (entryDate.getTime() < checkDate.getTime()) {
      break;
    }
  }

  // Calculate longest streak
  let previousDate: Date | null = null;
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.entryDate);
    entryDate.setHours(0, 0, 0, 0);

    if (!previousDate) {
      tempStreak = 1;
    } else {
      const dayDiff = Math.floor((previousDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    previousDate = entryDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
