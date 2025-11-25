import prisma from '../../config/database';
import { WeeklyCheckinResult } from '../weeklyCheckin/checkinOrchestrator';

/**
 * Report Storage Service
 * Handles saving and retrieving weekly check-in reports from database
 */

export class ReportStorage {
  /**
   * Save a complete weekly check-in to the database
   */
  async saveWeeklyCheckin(
    userId: string,
    checkinResult: WeeklyCheckinResult
  ): Promise<string> {
    const checkin = await prisma.weeklyCheckin.create({
      data: {
        userId,
        weekStart: new Date(checkinResult.weekStart),
        weekEnd: new Date(checkinResult.weekEnd),
        weeklyReport: checkinResult.markdownReport || '',
        weeklyJournal: checkinResult.weeklyJournal || '',
        newsletter: checkinResult.newsletter || '',
        journalSummary: JSON.parse(JSON.stringify(checkinResult.journalSummary)),
        timeAnalysis: JSON.parse(JSON.stringify(checkinResult.timeAnalysis)),
        okrProgress: JSON.parse(JSON.stringify(checkinResult.okrProgress)),
        aiInsights: JSON.parse(JSON.stringify(checkinResult.aiInsights)),
      },
    });

    return checkin.id;
  }

  /**
   * Update an existing weekly check-in with additional reports
   */
  async updateWeeklyCheckin(
    checkinId: string,
    updates: {
      weeklyReport?: string;
      weeklyJournal?: string;
      newsletter?: string;
    }
  ): Promise<void> {
    await prisma.weeklyCheckin.update({
      where: { id: checkinId },
      data: updates,
    });
  }

  /**
   * Get a specific weekly check-in by ID
   */
  async getCheckinById(checkinId: string): Promise<any | null> {
    return await prisma.weeklyCheckin.findUnique({
      where: { id: checkinId },
    });
  }

  /**
   * Get weekly check-in for a specific week
   */
  async getCheckinByWeek(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<any | null> {
    return await prisma.weeklyCheckin.findFirst({
      where: {
        userId,
        weekStart: { lte: weekStart },
        weekEnd: { gte: weekEnd },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's weekly check-in history
   */
  async getCheckinHistory(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    return await prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekEnd: 'desc' },
      take: limit,
      select: {
        id: true,
        weekStart: true,
        weekEnd: true,
        createdAt: true,
        journalSummary: true,
        okrProgress: true,
      },
    });
  }

  /**
   * Get all check-ins for a user
   */
  async getAllCheckins(userId: string): Promise<any[]> {
    return await prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekEnd: 'desc' },
    });
  }

  /**
   * Delete a weekly check-in
   */
  async deleteCheckin(checkinId: string): Promise<void> {
    await prisma.weeklyCheckin.delete({
      where: { id: checkinId },
    });
  }

  /**
   * Check if a check-in exists for a given week
   */
  async checkinExists(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<boolean> {
    const count = await prisma.weeklyCheckin.count({
      where: {
        userId,
        weekStart: { lte: weekStart },
        weekEnd: { gte: weekEnd },
      },
    });

    return count > 0;
  }

  /**
   * Get weekly check-in statistics for a user
   */
  async getCheckinStats(userId: string): Promise<{
    totalCheckins: number;
    averageCompletionRate: number;
    streakWeeks: number;
  }> {
    const checkins = await prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekEnd: 'desc' },
      select: {
        journalSummary: true,
        weekEnd: true,
      },
    });

    const totalCheckins = checkins.length;

    // Calculate average completion rate
    let totalCompletionRate = 0;
    for (const checkin of checkins) {
      const summary = checkin.journalSummary as any;
      if (summary && typeof summary.completionRate === 'number') {
        totalCompletionRate += summary.completionRate;
      }
    }
    const averageCompletionRate = totalCheckins > 0 ? totalCompletionRate / totalCheckins : 0;

    // Calculate streak (consecutive weeks with check-ins)
    let streakWeeks = 0;
    if (checkins.length > 0) {
      streakWeeks = 1;
      for (let i = 0; i < checkins.length - 1; i++) {
        const currentWeekEnd = new Date(checkins[i].weekEnd);
        const previousWeekEnd = new Date(checkins[i + 1].weekEnd);

        // Check if the weeks are consecutive (7 days apart)
        const daysDifference = Math.floor(
          (currentWeekEnd.getTime() - previousWeekEnd.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDifference === 7) {
          streakWeeks++;
        } else {
          break;
        }
      }
    }

    return {
      totalCheckins,
      averageCompletionRate: Math.round(averageCompletionRate),
      streakWeeks,
    };
  }
}
