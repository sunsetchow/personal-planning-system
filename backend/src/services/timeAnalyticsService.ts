import prisma from '../config/database';
import { FocusQuality } from '@prisma/client';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

/**
 * Time Analytics Service
 * Provides analytics and insights on time tracking data
 */

export interface DailyTimeBreakdown {
  date: string;
  totalDuration: number;
  focusTime: number;
  sessions: number;
  categoryBreakdown: Record<string, number>;
}

export interface CategoryTimeData {
  category: string;
  totalDuration: number;
  focusTime: number;
  sessions: number;
  averageSessionDuration: number;
  objectives: {
    id: string;
    title: string;
    duration: number;
  }[];
}

export interface FocusQualityTrend {
  date: string;
  fullFocus: number;
  partialFocus: number;
  interrupted: number;
  rest: number;
}

export interface ObjectiveTimeData {
  objectiveId: string;
  objectiveTitle: string;
  totalDuration: number;
  focusTime: number;
  sessions: number;
  progress: number; // OKR progress percentage
  timeEfficiency: number; // Progress per hour invested
}

export interface WeeklyTimeReport {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalDuration: number;
    totalFocusTime: number;
    totalSessions: number;
    averageSessionDuration: number;
    averageDailyTime: number;
  };
  categoryBreakdown: CategoryTimeData[];
  dailyBreakdown: DailyTimeBreakdown[];
  focusQualityTrend: FocusQualityTrend[];
  objectiveTimeData: ObjectiveTimeData[];
  recommendations: string[];
}

/**
 * Get weekly time report for a user
 */
export const getWeeklyTimeReport = async (
  userId: string,
  weekStartDate?: Date
): Promise<WeeklyTimeReport> => {
  console.log('📊 Generating weekly time report for user:', userId);

  const startDate = weekStartDate ? startOfWeek(weekStartDate, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

  // Fetch all sessions for the week
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
      },
      endTime: {
        lte: endDate,
      },
      isCompleted: true,
    },
    include: {
      objective: {
        include: {
          keyResults: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Calculate summary statistics
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalPauseDuration = sessions.reduce((sum, s) => sum + s.pauseDuration, 0);
  const totalFocusTime = totalDuration - totalPauseDuration;
  const totalSessions = sessions.length;
  const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const daysInWeek = 7;
  const averageDailyTime = totalDuration / daysInWeek;

  // Category breakdown
  const categoryMap = new Map<string, {
    duration: number;
    focusTime: number;
    sessions: number;
    objectives: Map<string, { id: string; title: string; duration: number }>;
  }>();

  sessions.forEach(session => {
    const category = session.okrCategory || 'Uncategorized';
    const focusTime = session.duration - session.pauseDuration;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        duration: 0,
        focusTime: 0,
        sessions: 0,
        objectives: new Map(),
      });
    }

    const catData = categoryMap.get(category)!;
    catData.duration += session.duration;
    catData.focusTime += focusTime;
    catData.sessions += 1;

    // Track objectives within category
    if (session.objective) {
      if (!catData.objectives.has(session.objectiveId!)) {
        catData.objectives.set(session.objectiveId!, {
          id: session.objective.id,
          title: session.objective.title,
          duration: 0,
        });
      }
      catData.objectives.get(session.objectiveId!)!.duration += session.duration;
    }
  });

  const categoryBreakdown: CategoryTimeData[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      totalDuration: data.duration,
      focusTime: data.focusTime,
      sessions: data.sessions,
      averageSessionDuration: data.duration / data.sessions,
      objectives: Array.from(data.objectives.values()).sort((a, b) => b.duration - a.duration),
    })
  ).sort((a, b) => b.totalDuration - a.totalDuration);

  // Daily breakdown
  const dailyMap = new Map<string, {
    duration: number;
    focusTime: number;
    sessions: number;
    categories: Map<string, number>;
  }>();

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyMap.set(dateKey, {
      duration: 0,
      focusTime: 0,
      sessions: 0,
      categories: new Map(),
    });
  });

  sessions.forEach(session => {
    const dateKey = format(session.startTime, 'yyyy-MM-dd');
    const dayData = dailyMap.get(dateKey)!;
    const focusTime = session.duration - session.pauseDuration;
    const category = session.okrCategory || 'Uncategorized';

    dayData.duration += session.duration;
    dayData.focusTime += focusTime;
    dayData.sessions += 1;

    dayData.categories.set(
      category,
      (dayData.categories.get(category) || 0) + session.duration
    );
  });

  const dailyBreakdown: DailyTimeBreakdown[] = Array.from(dailyMap.entries()).map(
    ([date, data]) => ({
      date,
      totalDuration: data.duration,
      focusTime: data.focusTime,
      sessions: data.sessions,
      categoryBreakdown: Object.fromEntries(data.categories),
    })
  );

  // Focus quality trend
  const focusQualityMap = new Map<string, Record<FocusQuality, number>>();

  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    focusQualityMap.set(dateKey, {
      FULL_FOCUS: 0,
      PARTIAL_FOCUS: 0,
      INTERRUPTED: 0,
      REST: 0,
    });
  });

  sessions.forEach(session => {
    const dateKey = format(session.startTime, 'yyyy-MM-dd');
    const qualityData = focusQualityMap.get(dateKey)!;
    qualityData[session.focusQuality] += 1;
  });

  const focusQualityTrend: FocusQualityTrend[] = Array.from(focusQualityMap.entries()).map(
    ([date, data]) => ({
      date,
      fullFocus: data.FULL_FOCUS,
      partialFocus: data.PARTIAL_FOCUS,
      interrupted: data.INTERRUPTED,
      rest: data.REST,
    })
  );

  // Objective time data with progress
  const objectiveMap = new Map<string, {
    title: string;
    duration: number;
    focusTime: number;
    sessions: number;
    progress: number;
  }>();

  sessions.forEach(session => {
    if (session.objective) {
      const objId = session.objectiveId!;
      const focusTime = session.duration - session.pauseDuration;

      if (!objectiveMap.has(objId)) {
        // Calculate overall objective progress from key results
        const totalKeyResults = session.objective.keyResults.length;
        const progress = totalKeyResults > 0
          ? session.objective.keyResults.reduce((sum, kr) => {
              const krProgress = (Number(kr.currentValue) / Number(kr.targetValue)) * 100;
              return sum + Math.min(krProgress, 100);
            }, 0) / totalKeyResults
          : 0;

        objectiveMap.set(objId, {
          title: session.objective.title,
          duration: 0,
          focusTime: 0,
          sessions: 0,
          progress,
        });
      }

      const objData = objectiveMap.get(objId)!;
      objData.duration += session.duration;
      objData.focusTime += focusTime;
      objData.sessions += 1;
    }
  });

  const objectiveTimeData: ObjectiveTimeData[] = Array.from(objectiveMap.entries()).map(
    ([objectiveId, data]) => ({
      objectiveId,
      objectiveTitle: data.title,
      totalDuration: data.duration,
      focusTime: data.focusTime,
      sessions: data.sessions,
      progress: data.progress,
      timeEfficiency: data.duration > 0 ? (data.progress / (data.duration / 3600)) : 0,
    })
  ).sort((a, b) => b.totalDuration - a.totalDuration);

  // Generate recommendations
  const recommendations = generateRecommendations(
    totalDuration,
    totalFocusTime,
    categoryBreakdown,
    focusQualityTrend,
    objectiveTimeData
  );

  const report: WeeklyTimeReport = {
    weekStart: format(startDate, 'yyyy-MM-dd'),
    weekEnd: format(endDate, 'yyyy-MM-dd'),
    summary: {
      totalDuration,
      totalFocusTime,
      totalSessions,
      averageSessionDuration,
      averageDailyTime,
    },
    categoryBreakdown,
    dailyBreakdown,
    focusQualityTrend,
    objectiveTimeData,
    recommendations,
  };

  console.log('✅ Weekly report generated successfully');
  return report;
};

/**
 * Get time allocation by category for a date range
 */
export const getCategoryTimeAllocation = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log('📊 Fetching category time allocation');

  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startTime: { gte: startDate },
      endTime: { lte: endDate },
      isCompleted: true,
    },
    select: {
      okrCategory: true,
      duration: true,
      pauseDuration: true,
    },
  });

  const categoryMap = new Map<string, { duration: number; focusTime: number }>();

  sessions.forEach(session => {
    const category = session.okrCategory || 'Uncategorized';
    const focusTime = session.duration - session.pauseDuration;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { duration: 0, focusTime: 0 });
    }

    const catData = categoryMap.get(category)!;
    catData.duration += session.duration;
    catData.focusTime += focusTime;
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ...data,
  }));
};

/**
 * Get focus quality distribution for a date range
 */
export const getFocusQualityDistribution = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log('📊 Fetching focus quality distribution');

  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startTime: { gte: startDate },
      endTime: { lte: endDate },
      isCompleted: true,
    },
    select: {
      focusQuality: true,
      duration: true,
    },
  });

  const distribution = sessions.reduce((acc, session) => {
    acc[session.focusQuality] = (acc[session.focusQuality] || 0) + session.duration;
    return acc;
  }, {} as Record<FocusQuality, number>);

  return distribution;
};

/**
 * Generate AI-powered recommendations based on time data
 */
function generateRecommendations(
  totalDuration: number,
  totalFocusTime: number,
  categoryBreakdown: CategoryTimeData[],
  focusQualityTrend: FocusQualityTrend[],
  objectiveTimeData: ObjectiveTimeData[]
): string[] {
  const recommendations: string[] = [];
  const hoursWorked = totalDuration / 3600;
  const focusPercentage = totalDuration > 0 ? (totalFocusTime / totalDuration) * 100 : 0;

  // Work-life balance check
  if (hoursWorked > 60) {
    recommendations.push('⚠️ You logged over 60 hours this week. Consider taking breaks to avoid burnout.');
  } else if (hoursWorked < 20) {
    recommendations.push('💡 You logged less than 20 hours this week. Consider increasing your focus time to meet your goals.');
  }

  // Focus quality check
  if (focusPercentage < 70) {
    recommendations.push(`🎯 Your focus time is ${focusPercentage.toFixed(1)}%. Try reducing pause time by using the Pomodoro technique.`);
  } else if (focusPercentage > 90) {
    recommendations.push('🌟 Excellent focus discipline! Keep up the great work.');
  }

  // Category balance check
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    const topCategoryPercentage = (topCategory.totalDuration / totalDuration) * 100;

    if (topCategoryPercentage > 70) {
      recommendations.push(`⚖️ ${topCategoryPercentage.toFixed(0)}% of your time went to ${topCategory.category}. Consider balancing other life areas.`);
    }
  }

  // Low efficiency objectives
  const lowEfficiencyObjectives = objectiveTimeData.filter(obj => obj.timeEfficiency < 2);
  if (lowEfficiencyObjectives.length > 0) {
    recommendations.push(`📈 Some objectives have low progress relative to time invested. Review: ${lowEfficiencyObjectives.map(o => o.objectiveTitle).join(', ')}`);
  }

  // High efficiency objectives
  const highEfficiencyObjectives = objectiveTimeData.filter(obj => obj.timeEfficiency > 10);
  if (highEfficiencyObjectives.length > 0) {
    recommendations.push(`🚀 Great progress on: ${highEfficiencyObjectives[0].objectiveTitle}. Keep the momentum!`);
  }

  // Focus quality patterns
  const recentDays = focusQualityTrend.slice(-3);
  const recentInterruptions = recentDays.reduce((sum, day) => sum + day.interrupted, 0);
  if (recentInterruptions > 5) {
    recommendations.push('🔕 High interruptions detected in recent days. Try blocking focus time on your calendar.');
  }

  return recommendations;
}

/**
 * Compare current week with previous week
 */
export const compareWeeks = async (userId: string, currentWeekStart: Date) => {
  console.log('📊 Comparing weekly performance');

  const currentReport = await getWeeklyTimeReport(userId, currentWeekStart);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousReport = await getWeeklyTimeReport(userId, previousWeekStart);

  const comparison = {
    currentWeek: currentReport.summary,
    previousWeek: previousReport.summary,
    changes: {
      totalDuration: currentReport.summary.totalDuration - previousReport.summary.totalDuration,
      totalSessions: currentReport.summary.totalSessions - previousReport.summary.totalSessions,
      averageSessionDuration: currentReport.summary.averageSessionDuration - previousReport.summary.averageSessionDuration,
      focusTime: currentReport.summary.totalFocusTime - previousReport.summary.totalFocusTime,
    },
    percentageChanges: {
      totalDuration: previousReport.summary.totalDuration > 0
        ? ((currentReport.summary.totalDuration - previousReport.summary.totalDuration) / previousReport.summary.totalDuration) * 100
        : 0,
      focusTime: previousReport.summary.totalFocusTime > 0
        ? ((currentReport.summary.totalFocusTime - previousReport.summary.totalFocusTime) / previousReport.summary.totalFocusTime) * 100
        : 0,
    },
  };

  return comparison;
};
