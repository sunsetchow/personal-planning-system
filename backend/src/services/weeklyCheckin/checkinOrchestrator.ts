import prisma from '../../config/database';
import { JournalAnalyzer, JournalSummary } from './journalAnalyzer';
import { ActivityCorrelator, CorrelatedActivity } from './activityCorrelator';
import { OKRUpdateSuggester, OKRProgressUpdate } from './okrUpdateSuggester';
import { getWeeklyTimeReport, WeeklyTimeReport } from '../timeAnalyticsService';
import { WeeklyReportGenerator } from '../reports/weeklyReportGenerator';

/**
 * Weekly Check-in Orchestrator
 * Coordinates the entire weekly check-in workflow
 */

export interface WeeklyCheckinRequest {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}

export interface AIInsightReport {
  summary: string;
  keyHighlights: string[];
  areasOfConcern: string[];
  recommendations: string[];
}

export interface WeeklyCheckinResult {
  journalSummary: JournalSummary;
  timeAnalysis: WeeklyTimeReport;
  okrProgress: OKRProgressUpdate;
  activityCorrelation: CorrelatedActivity[];
  aiInsights: AIInsightReport;
  weekStart: string;
  weekEnd: string;
  markdownReport?: string;
}

export class WeeklyCheckinOrchestrator {
  private journalAnalyzer: JournalAnalyzer;
  private activityCorrelator: ActivityCorrelator;
  private okrUpdateSuggester: OKRUpdateSuggester;
  private reportGenerator: WeeklyReportGenerator;

  constructor() {
    this.journalAnalyzer = new JournalAnalyzer();
    this.activityCorrelator = new ActivityCorrelator();
    this.okrUpdateSuggester = new OKRUpdateSuggester();
    this.reportGenerator = new WeeklyReportGenerator();
  }

  /**
   * Execute the weekly check-in workflow
   */
  async executeCheckin(
    request: WeeklyCheckinRequest
  ): Promise<WeeklyCheckinResult> {
    console.log(`🚀 Starting weekly check-in for user ${request.userId}...`);

    // Step 1: Analyze daily journals
    console.log('📖 Step 1/6: Analyzing daily journals...');
    const journals = await this.getJournalEntries(request);
    const journalSummary = await this.journalAnalyzer.summarizeWeek(journals);

    // Step 2: Analyze Pomodoro time sessions
    console.log('⏱️ Step 2/6: Analyzing time sessions...');
    const timeAnalysis = await getWeeklyTimeReport(
      request.userId,
      request.weekStart
    );

    // Step 3: Get current OKR state
    console.log('🎯 Step 3/6: Reading current OKRs...');
    const currentOKRs = await this.getCurrentOKRs(request.userId);

    // Step 4: Correlate activities from journals and time sessions
    console.log('🔗 Step 4/6: Correlating activities with OKRs...');
    const activityCorrelation = await this.activityCorrelator.correlate(
      journalSummary,
      timeAnalysis,
      currentOKRs
    );

    // Step 5: Generate OKR update suggestions
    console.log('💡 Step 5/6: Generating OKR update suggestions...');
    const okrProgress = await this.okrUpdateSuggester.generateSuggestions(
      currentOKRs,
      activityCorrelation
    );

    // Step 6: Generate AI insights
    console.log('🤖 Step 6/7: Generating AI insights...');
    const aiInsights = this.generateInsights(
      journalSummary,
      timeAnalysis,
      okrProgress
    );

    // Step 7: Generate Markdown report
    console.log('📄 Step 7/7: Generating report...');
    const result: WeeklyCheckinResult = {
      journalSummary,
      timeAnalysis,
      okrProgress,
      activityCorrelation,
      aiInsights,
      weekStart: request.weekStart.toISOString(),
      weekEnd: request.weekEnd.toISOString(),
    };

    const markdownReport = await this.reportGenerator.generate(result);

    console.log('✅ Weekly check-in completed!');

    return {
      ...result,
      markdownReport,
    };
  }

  /**
   * Get journal entries for the week
   */
  private async getJournalEntries(
    request: WeeklyCheckinRequest
  ): Promise<any[]> {
    return await prisma.journalEntry.findMany({
      where: {
        userId: request.userId,
        entryDate: {
          gte: request.weekStart,
          lte: request.weekEnd,
        },
      },
      include: { template: true },
      orderBy: { entryDate: 'asc' },
    });
  }

  /**
   * Get current active OKRs
   */
  private async getCurrentOKRs(userId: string): Promise<any[]> {
    return await prisma.objective.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        keyResults: true,
      },
    });
  }

  /**
   * Generate AI insights from all data
   */
  private generateInsights(
    journalSummary: JournalSummary,
    timeAnalysis: WeeklyTimeReport,
    okrProgress: OKRProgressUpdate
  ): AIInsightReport {
    const keyHighlights: string[] = [];
    const areasOfConcern: string[] = [];
    const recommendations: string[] = [];

    // Journal insights
    if (journalSummary.completionRate >= 80) {
      keyHighlights.push(
        `Strong journaling consistency: ${journalSummary.completionRate}% completion rate`
      );
    } else if (journalSummary.completionRate < 50) {
      areasOfConcern.push(
        `Low journaling consistency: ${journalSummary.completionRate}% completion rate`
      );
      recommendations.push(
        'Try setting a daily reminder to complete your journal entries'
      );
    }

    if (journalSummary.moodPattern.moodTrend === 'declining') {
      areasOfConcern.push(
        `Mood trend is declining (avg: ${journalSummary.moodPattern.averageMood.toFixed(1)}/10)`
      );
      recommendations.push(
        'Consider scheduling self-care activities or talking to someone you trust'
      );
    } else if (journalSummary.moodPattern.moodTrend === 'improving') {
      keyHighlights.push(
        `Mood trend is improving (avg: ${journalSummary.moodPattern.averageMood.toFixed(1)}/10)`
      );
    }

    // Time analysis insights
    const totalHours = timeAnalysis.summary.totalDuration / 3600;
    if (totalHours > 0) {
      keyHighlights.push(
        `${totalHours.toFixed(1)} hours of focused work logged this week`
      );
    }

    // OKR insights
    const progressingObjectives = okrProgress.objectives.filter(
      o => o.changePercentage > 0
    );
    if (progressingObjectives.length > 0) {
      keyHighlights.push(
        `Progress on ${progressingObjectives.length} objective(s) this week`
      );
    }

    const stagnantObjectives = okrProgress.objectives.filter(
      o => o.changePercentage === 0
    );
    if (stagnantObjectives.length > 0 && stagnantObjectives.length < okrProgress.objectives.length) {
      areasOfConcern.push(
        `${stagnantObjectives.length} objective(s) with no progress this week`
      );
      recommendations.push(
        'Review stagnant objectives - consider breaking them into smaller milestones'
      );
    }

    // Combine with existing recommendations from time analysis
    if (timeAnalysis.recommendations.length > 0) {
      recommendations.push(...timeAnalysis.recommendations.slice(0, 3));
    }

    // Generate summary
    const summary = this.generateSummaryText(
      journalSummary,
      timeAnalysis,
      okrProgress
    );

    return {
      summary,
      keyHighlights,
      areasOfConcern,
      recommendations,
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummaryText(
    journalSummary: JournalSummary,
    timeAnalysis: WeeklyTimeReport,
    okrProgress: OKRProgressUpdate
  ): string {
    const parts: string[] = [];

    parts.push(
      `This week, you completed ${journalSummary.totalEntries} journal entries (${journalSummary.completionRate}% completion).`
    );

    const totalHours = Math.round(timeAnalysis.summary.totalDuration / 3600);
    if (totalHours > 0) {
      parts.push(
        `You logged ${totalHours} hours of focused work across ${timeAnalysis.summary.totalSessions} Pomodoro sessions.`
      );
    }

    if (journalSummary.accomplishments.length > 0) {
      parts.push(
        `You recorded ${journalSummary.accomplishments.length} accomplishments.`
      );
    }

    const progressCount = okrProgress.suggestions.length;
    if (progressCount > 0) {
      parts.push(
        `Based on your activities, we suggest updating ${progressCount} key result(s).`
      );
    }

    if (journalSummary.moodPattern.averageMood > 0) {
      parts.push(
        `Your average mood was ${journalSummary.moodPattern.averageMood.toFixed(1)}/10 (${journalSummary.moodPattern.moodTrend}).`
      );
    }

    return parts.join(' ');
  }
}
