import prisma from '../config/database';
import { generateStructuredInsights } from './claudeService';
import { getUserEntries } from './journalEntryService';
import { getUserObjectives } from './objectiveService';

/**
 * AI Insight Service
 * Manages caching and retrieval of AI-generated insights
 */

interface AIInsightResponse {
  id: string;
  summary: string;
  patterns: string[];
  recommendations: string[];
  metrics: {
    totalEntries: number;
    avgProgress: number;
    activeGoals: number;
    avgMood?: number;
    avgEnergy?: number;
  };
  generatedAt: Date;
  isCached: boolean;
}

/**
 * Get or generate AI insights for a user's dashboard
 * Only regenerates if new journal entries have been added since last generation
 */
export const getDashboardInsights = async (userId: string): Promise<AIInsightResponse> => {
  try {
    // Get user's latest journal entry
    const latestEntry = await prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { entryDate: 'desc' },
      select: { entryDate: true },
    });

    // Check for existing cached insights
    const cachedInsight = await prisma.aIInsight.findFirst({
      where: {
        userId,
        insightType: 'dashboard',
      },
      orderBy: { generatedAt: 'desc' },
    });

    // Determine if we need to regenerate insights
    const needsRegeneration =
      !cachedInsight ||
      !cachedInsight.lastJournalEntryDate ||
      !latestEntry ||
      new Date(latestEntry.entryDate) > new Date(cachedInsight.lastJournalEntryDate);

    // If cache is valid, return cached insights
    if (!needsRegeneration && cachedInsight) {
      return {
        id: cachedInsight.id,
        summary: cachedInsight.summary,
        patterns: (cachedInsight.patterns as string[]) || [],
        recommendations: (cachedInsight.recommendations as string[]) || [],
        metrics: cachedInsight.metrics as any,
        generatedAt: cachedInsight.generatedAt,
        isCached: true,
      };
    }

    // Generate new insights
    const [journalEntries, objectives] = await Promise.all([
      getUserEntries(userId),
      getUserObjectives(userId),
    ]);

    const insights = await generateStructuredInsights(journalEntries, objectives);

    // Calculate data range
    const dataRange = {
      startDate: journalEntries.length > 0
        ? journalEntries[journalEntries.length - 1].entryDate
        : new Date(),
      endDate: journalEntries.length > 0
        ? journalEntries[0].entryDate
        : new Date(),
      entryCount: journalEntries.length,
      objectiveCount: objectives.length,
    };

    // Save to cache
    const savedInsight = await prisma.aIInsight.create({
      data: {
        userId,
        insightType: 'dashboard',
        summary: insights.summary,
        patterns: insights.patterns,
        recommendations: insights.recommendations,
        metrics: insights.metrics,
        dataRange,
        lastJournalEntryDate: latestEntry?.entryDate || null,
      },
    });

    // Clean up old cached insights (keep only latest 5)
    const allInsights = await prisma.aIInsight.findMany({
      where: { userId, insightType: 'dashboard' },
      orderBy: { generatedAt: 'desc' },
      select: { id: true },
    });

    if (allInsights.length > 5) {
      const idsToDelete = allInsights.slice(5).map((i) => i.id);
      await prisma.aIInsight.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    return {
      id: savedInsight.id,
      summary: insights.summary,
      patterns: insights.patterns,
      recommendations: insights.recommendations,
      metrics: insights.metrics,
      generatedAt: savedInsight.generatedAt,
      isCached: false,
    };
  } catch (error: any) {
    console.error('Error in getDashboardInsights:', error);
    throw error;
  }
};

/**
 * Force regenerate insights (e.g., when user manually requests refresh)
 */
export const forceRegenerateInsights = async (userId: string): Promise<AIInsightResponse> => {
  try {
    const [journalEntries, objectives] = await Promise.all([
      getUserEntries(userId),
      getUserObjectives(userId),
    ]);

    const insights = await generateStructuredInsights(journalEntries, objectives);

    const latestEntry = await prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { entryDate: 'desc' },
      select: { entryDate: true },
    });

    const dataRange = {
      startDate: journalEntries.length > 0
        ? journalEntries[journalEntries.length - 1].entryDate
        : new Date(),
      endDate: journalEntries.length > 0
        ? journalEntries[0].entryDate
        : new Date(),
      entryCount: journalEntries.length,
      objectiveCount: objectives.length,
    };

    const savedInsight = await prisma.aIInsight.create({
      data: {
        userId,
        insightType: 'dashboard',
        summary: insights.summary,
        patterns: insights.patterns,
        recommendations: insights.recommendations,
        metrics: insights.metrics,
        dataRange,
        lastJournalEntryDate: latestEntry?.entryDate || null,
      },
    });

    return {
      id: savedInsight.id,
      summary: insights.summary,
      patterns: insights.patterns,
      recommendations: insights.recommendations,
      metrics: insights.metrics,
      generatedAt: savedInsight.generatedAt,
      isCached: false,
    };
  } catch (error: any) {
    console.error('Error in forceRegenerateInsights:', error);
    throw error;
  }
};

/**
 * Get insight generation history for a user
 */
export const getInsightHistory = async (userId: string, limit: number = 10) => {
  return prisma.aIInsight.findMany({
    where: { userId, insightType: 'dashboard' },
    orderBy: { generatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      summary: true,
      generatedAt: true,
      lastJournalEntryDate: true,
      metrics: true,
    },
  });
};
