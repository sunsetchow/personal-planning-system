
/**
 * Journal Analyzer Service
 * Analyzes and summarizes weekly journal entries
 */

export interface AccomplishmentSummary {
  description: string;
  date: Date;
  impact: 'high' | 'medium' | 'low';
  category?: string;
}

export interface ChallengeSummary {
  description: string;
  date: Date;
  severity: 'high' | 'medium' | 'low';
}

export interface MoodPattern {
  averageMood: number;
  averageEnergy: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  energyTrend: 'improving' | 'declining' | 'stable';
  lowDays: Date[];
  highDays: Date[];
}

export interface JournalSummary {
  totalEntries: number;
  accomplishments: AccomplishmentSummary[];
  challenges: ChallengeSummary[];
  moodPattern: MoodPattern;
  reflectionThemes: string[];
  completionRate: number; // Percentage of days with entries
}

export class JournalAnalyzer {
  /**
   * Summarize a week of journal entries
   */
  async summarizeWeek(journals: any[]): Promise<JournalSummary> {
    console.log(`📖 Analyzing ${journals.length} journal entries`);

    const accomplishments = this.extractAccomplishments(journals);
    const challenges = this.extractChallenges(journals);
    const moodPattern = this.analyzeMoodPattern(journals);
    const reflectionThemes = this.extractThemes(journals);
    const completionRate = this.calculateCompletionRate(journals);

    return {
      totalEntries: journals.length,
      accomplishments,
      challenges,
      moodPattern,
      reflectionThemes,
      completionRate,
    };
  }

  /**
   * Extract accomplishments from journal entries
   */
  private extractAccomplishments(journals: any[]): AccomplishmentSummary[] {
    const accomplishments: AccomplishmentSummary[] = [];

    for (const journal of journals) {
      const responses = journal.responses as Record<string, any>;

      // Look for accomplishment-related questions
      for (const [question, answer] of Object.entries(responses)) {
        const questionLower = question.toLowerCase();

        if (
          questionLower.includes('accomplish') ||
          questionLower.includes('achievement') ||
          questionLower.includes('win') ||
          questionLower.includes('proud')
        ) {
          const answerText = String(answer || '');
          if (answerText.length > 10) {
            accomplishments.push({
              description: answerText,
              date: new Date(journal.entryDate),
              impact: this.assessImpact(answerText),
            });
          }
        }
      }
    }

    return accomplishments.slice(0, 10); // Top 10
  }

  /**
   * Extract challenges from journal entries
   */
  private extractChallenges(journals: any[]): ChallengeSummary[] {
    const challenges: ChallengeSummary[] = [];

    for (const journal of journals) {
      const responses = journal.responses as Record<string, any>;

      for (const [question, answer] of Object.entries(responses)) {
        const questionLower = question.toLowerCase();

        if (
          questionLower.includes('challenge') ||
          questionLower.includes('difficult') ||
          questionLower.includes('struggle') ||
          questionLower.includes('obstacle')
        ) {
          const answerText = String(answer || '');
          if (answerText.length > 10) {
            challenges.push({
              description: answerText,
              date: new Date(journal.entryDate),
              severity: this.assessSeverity(answerText),
            });
          }
        }
      }
    }

    return challenges.slice(0, 10); // Top 10
  }

  /**
   * Analyze mood patterns across the week
   */
  private analyzeMoodPattern(journals: any[]): MoodPattern {
    if (journals.length === 0) {
      return {
        averageMood: 0,
        averageEnergy: 0,
        moodTrend: 'stable',
        energyTrend: 'stable',
        lowDays: [],
        highDays: [],
      };
    }

    const moods: number[] = [];
    const energies: number[] = [];
    const lowDays: Date[] = [];
    const highDays: Date[] = [];

    for (const journal of journals) {
      if (journal.moodScore) {
        const moodValue = Number(journal.moodScore);
        moods.push(moodValue);

        if (moodValue <= 3) {
          lowDays.push(new Date(journal.entryDate));
        } else if (moodValue >= 8) {
          highDays.push(new Date(journal.entryDate));
        }
      }

      if (journal.energyScore) {
        energies.push(Number(journal.energyScore));
      }
    }

    const averageMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
    const averageEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;

    const moodTrend = this.calculateTrend(moods);
    const energyTrend = this.calculateTrend(energies);

    return {
      averageMood,
      averageEnergy,
      moodTrend,
      energyTrend,
      lowDays,
      highDays,
    };
  }

  /**
   * Extract common themes from journal entries
   */
  private extractThemes(journals: any[]): string[] {
    const themes: Map<string, number> = new Map();
    const commonThemes = [
      'productivity',
      'health',
      'relationships',
      'career',
      'learning',
      'stress',
      'gratitude',
      'goals',
      'challenges',
      'growth',
    ];

    for (const journal of journals) {
      const responses = journal.responses as Record<string, any>;
      const allText = Object.values(responses)
        .map(v => String(v || '').toLowerCase())
        .join(' ');

      for (const theme of commonThemes) {
        if (allText.includes(theme)) {
          themes.set(theme, (themes.get(theme) || 0) + 1);
        }
      }
    }

    return Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  /**
   * Calculate completion rate (days with entries / 7)
   */
  private calculateCompletionRate(journals: any[]): number {
    return Math.round((journals.length / 7) * 100);
  }

  /**
   * Assess impact of an accomplishment
   */
  private assessImpact(text: string): 'high' | 'medium' | 'low' {
    const highImpactWords = ['major', 'significant', 'important', 'big', 'achieved', 'completed'];
    const textLower = text.toLowerCase();

    const highImpactCount = highImpactWords.filter(word => textLower.includes(word)).length;

    if (highImpactCount >= 2 || text.length > 200) return 'high';
    if (highImpactCount >= 1 || text.length > 100) return 'medium';
    return 'low';
  }

  /**
   * Assess severity of a challenge
   */
  private assessSeverity(text: string): 'high' | 'medium' | 'low' {
    const highSeverityWords = ['serious', 'major', 'critical', 'urgent', 'severe', 'struggling'];
    const textLower = text.toLowerCase();

    const highSeverityCount = highSeverityWords.filter(word => textLower.includes(word)).length;

    if (highSeverityCount >= 2) return 'high';
    if (highSeverityCount >= 1) return 'medium';
    return 'low';
  }

  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }
}
