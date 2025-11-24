import { JournalSummary } from './journalAnalyzer';
import { WeeklyTimeReport } from '../timeAnalyticsService';

/**
 * Activity Correlator Service
 * Correlates journal accomplishments and Pomodoro sessions with OKR objectives
 */

export interface CorrelatedActivity {
  description: string;
  okrObjective: string;
  okrKeyResult?: string;
  sources: ('journal' | 'pomodoro')[];
  journalDate?: Date;
  pomodoroMinutes?: number;
  focusQuality?: number;
  impact: 'high' | 'medium' | 'low';
}

export class ActivityCorrelator {
  /**
   * Correlate activities from journals and time sessions with OKRs
   */
  async correlate(
    journalSummary: JournalSummary,
    timeAnalysis: WeeklyTimeReport,
    currentOKRs: any[]
  ): Promise<CorrelatedActivity[]> {
    console.log('🔗 Correlating activities with OKRs');

    const activities: CorrelatedActivity[] = [];

    // Map journal accomplishments to OKRs
    for (const accomplishment of journalSummary.accomplishments) {
      const okr = this.mapAccomplishmentToOKR(accomplishment.description, currentOKRs);

      if (okr) {
        activities.push({
          description: accomplishment.description,
          okrObjective: okr.objectiveTitle,
          okrKeyResult: okr.keyResultTitle,
          sources: ['journal'],
          journalDate: accomplishment.date,
          impact: accomplishment.impact,
        });
      }
    }

    // Map Pomodoro category time to OKRs
    for (const categoryData of timeAnalysis.categoryBreakdown) {
      const okr = this.mapCategoryToOKR(categoryData.category, currentOKRs);

      if (okr) {
        const totalMinutes = Math.floor(categoryData.totalDuration / 60);
        activities.push({
          description: `${totalMinutes} minutes focused on ${categoryData.category}`,
          okrObjective: okr.objectiveTitle,
          sources: ['pomodoro'],
          pomodoroMinutes: totalMinutes,
          focusQuality: Math.round((categoryData.focusTime / categoryData.totalDuration) * 100),
          impact: this.calculateTimeImpact(totalMinutes),
        });
      }
    }

    // Map objective-specific time sessions
    for (const objTime of timeAnalysis.objectiveTimeData) {
      const objective = currentOKRs.find((o: any) => o.id === objTime.objectiveId);

      if (objective) {
        const totalMinutes = Math.floor(objTime.totalDuration / 60);
        activities.push({
          description: `${totalMinutes} minutes on "${objTime.objectiveTitle}"`,
          okrObjective: objTime.objectiveTitle,
          sources: ['pomodoro'],
          pomodoroMinutes: totalMinutes,
          focusQuality: Math.round((objTime.focusTime / objTime.totalDuration) * 100),
          impact: this.calculateTimeImpact(totalMinutes),
        });
      }
    }

    return this.mergeAndDeduplicateActivities(activities);
  }

  /**
   * Map journal accomplishment to OKR using keyword matching
   */
  private mapAccomplishmentToOKR(
    description: string,
    okrs: any[]
  ): { objectiveTitle: string; keyResultTitle?: string } | null {
    const keywords = description.toLowerCase();

    // Category-based keyword mapping
    const categoryMap: Record<string, string[]> = {
      relationship: ['friend', 'social', 'network', 'connect', 'event', 'people', 'meeting'],
      career: ['interview', 'application', 'job', 'career', 'company', 'work', 'resume'],
      leadership: ['present', 'lead', 'speak', 'pdp', 'club', 'team', 'organize'],
      academic: ['study', 'exam', 'assignment', 'course', 'class', 'research', 'paper'],
      personal: ['exercise', 'health', 'habit', 'read', 'practice', 'skill'],
    };

    // Try to match by category
    for (const [category, words] of Object.entries(categoryMap)) {
      if (words.some(word => keywords.includes(word))) {
        const matchingObjective = okrs.find(
          (o: any) =>
            o.title.toLowerCase().includes(category) ||
            o.description?.toLowerCase().includes(category)
        );

        if (matchingObjective) {
          return {
            objectiveTitle: matchingObjective.title,
          };
        }
      }
    }

    // Try direct title matching
    for (const okr of okrs) {
      const titleWords = okr.title.toLowerCase().split(' ');
      if (titleWords.some((word: string) => keywords.includes(word) && word.length > 4)) {
        return {
          objectiveTitle: okr.title,
        };
      }
    }

    return null;
  }

  /**
   * Map OKR category to objective
   */
  private mapCategoryToOKR(
    okrCategory: string,
    okrs: any[]
  ): { objectiveTitle: string } | null {
    const matchingObjective = okrs.find((o: any) =>
      o.title.toLowerCase().includes(okrCategory.toLowerCase())
    );

    return matchingObjective ? { objectiveTitle: matchingObjective.title } : null;
  }

  /**
   * Calculate impact based on time invested
   */
  private calculateTimeImpact(minutes: number): 'high' | 'medium' | 'low' {
    if (minutes >= 120) return 'high';
    if (minutes >= 60) return 'medium';
    return 'low';
  }

  /**
   * Merge and deduplicate similar activities
   */
  private mergeAndDeduplicateActivities(
    activities: CorrelatedActivity[]
  ): CorrelatedActivity[] {
    const grouped = new Map<string, CorrelatedActivity[]>();

    // Group by objective and similar description
    for (const activity of activities) {
      const key = `${activity.okrObjective}-${activity.description.substring(0, 20)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(activity);
    }

    // Merge activities with same key
    return Array.from(grouped.values()).map(group => {
      if (group.length === 1) return group[0];

      // Merge multiple sources
      const merged = { ...group[0] };
      merged.sources = Array.from(new Set(group.flatMap(a => a.sources)));

      // Sum Pomodoro minutes if multiple entries
      const totalMinutes = group.reduce((sum, a) => sum + (a.pomodoroMinutes || 0), 0);
      if (totalMinutes > 0) {
        merged.pomodoroMinutes = totalMinutes;
      }

      return merged;
    });
  }
}
