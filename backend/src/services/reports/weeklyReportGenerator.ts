import { format } from 'date-fns';
import { WeeklyCheckinResult } from '../weeklyCheckin/checkinOrchestrator';

/**
 * Weekly Report Generator
 * Generates comprehensive Markdown reports from weekly check-in data
 */

export class WeeklyReportGenerator {
  /**
   * Generate a complete weekly report in Markdown format
   */
  async generate(data: WeeklyCheckinResult): Promise<string> {
    const sections = [
      this.generateHeader(data),
      this.generateExecutiveSummary(data),
      this.generateOKRProgress(data),
      this.generateJournalInsights(data),
      this.generateTimeAnalysis(data),
      this.generateEfficiencyMetrics(data),
      this.generateAIInsights(data),
      this.generateRecommendations(data),
      this.generateActivityCorrelation(data),
      this.generateLookingAhead(data),
    ];

    return sections.filter(s => s).join('\n\n---\n\n');
  }

  /**
   * Generate report header
   */
  private generateHeader(data: WeeklyCheckinResult): string {
    const weekStart = new Date(data.weekStart);
    const weekEnd = new Date(data.weekEnd);

    const totalProgress = data.okrProgress.objectives.length > 0
      ? data.okrProgress.objectives.reduce((sum, obj) => sum + obj.suggestedProgress, 0) /
        data.okrProgress.objectives.length
      : 0;

    const previousProgress = data.okrProgress.objectives.length > 0
      ? data.okrProgress.objectives.reduce((sum, obj) => sum + obj.currentProgress, 0) /
        data.okrProgress.objectives.length
      : 0;

    const weeklyChange = totalProgress - previousProgress;

    return `# 📊 Weekly OKR Report

**Reporting Period**: ${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}

**Overall Progress**: ${previousProgress.toFixed(0)}% → ${totalProgress.toFixed(0)}% (${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(1)}%)

**Weekly Momentum**: ${this.calculateMomentum(weeklyChange)}

---`;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(data: WeeklyCheckinResult): string {
    const totalHours = Math.floor(data.timeAnalysis.summary.totalDuration / 3600);
    const totalMinutes = Math.floor((data.timeAnalysis.summary.totalDuration % 3600) / 60);

    return `## 📋 Executive Summary

${data.aiInsights.summary}

**This Week's Impact**:
- 📝 **Journal Entries**: ${data.journalSummary.totalEntries}/7 days (${data.journalSummary.completionRate}% completion)
- ⏱️ **Focus Time**: ${totalHours}h ${totalMinutes}m across ${data.timeAnalysis.summary.totalSessions} Pomodoro sessions
- 🎯 **OKR Updates**: ${data.okrProgress.suggestions.length} key results with suggested progress
- 💡 **Activities Tracked**: ${data.activityCorrelation.length} activities linked to objectives
- ⭐ **Average Mood**: ${data.journalSummary.moodPattern.averageMood.toFixed(1)}/10 (${data.journalSummary.moodPattern.moodTrend})
- ⚡ **Average Energy**: ${data.journalSummary.moodPattern.averageEnergy.toFixed(1)}/10 (${data.journalSummary.moodPattern.energyTrend})`;
  }

  /**
   * Generate OKR progress section
   */
  private generateOKRProgress(data: WeeklyCheckinResult): string {
    if (data.okrProgress.objectives.length === 0) {
      return `## 🎯 Progress by Objective\n\nNo active objectives this week.`;
    }

    let output = `## 🎯 Progress by Objective\n\n`;

    for (const objective of data.okrProgress.objectives) {
      const changeIndicator = objective.changePercentage > 0 ? '📈' : objective.changePercentage < 0 ? '📉' : '➡️';

      output += `### ${changeIndicator} ${objective.objectiveTitle}\n\n`;
      output += `**Progress**: ${objective.currentProgress.toFixed(0)}% → ${objective.suggestedProgress.toFixed(0)}%`;
      output += ` (${objective.changePercentage >= 0 ? '+' : ''}${objective.changePercentage.toFixed(1)}%)\n\n`;

      const objSuggestions = data.okrProgress.suggestions.filter(
        s => s.objectiveTitle === objective.objectiveTitle
      );

      if (objSuggestions.length > 0) {
        output += `**Key Results Updates**:\n\n`;
        for (const suggestion of objSuggestions) {
          const confidenceBadge = suggestion.confidence === 'high' ? '🟢' : suggestion.confidence === 'medium' ? '🟡' : '🔴';
          output += `- **${suggestion.keyResultTitle}**: ${suggestion.currentProgress.toFixed(0)}% → ${suggestion.suggestedProgress.toFixed(0)}% ${confidenceBadge}\n`;
          output += `  - *${suggestion.reasoning}*\n`;
          output += `  - Supporting: ${suggestion.supportingActivities.length} activities\n`;
        }
        output += '\n';
      } else {
        output += `*No key result updates suggested for this objective*\n\n`;
      }
    }

    return output;
  }

  /**
   * Generate journal insights section
   */
  private generateJournalInsights(data: WeeklyCheckinResult): string {
    const js = data.journalSummary;

    let output = `## 📖 Journal Insights\n\n`;

    output += `**Mood & Energy Trends**:\n`;
    output += `- Mood: ${js.moodPattern.moodTrend} (avg ${js.moodPattern.averageMood.toFixed(1)}/10)\n`;
    output += `- Energy: ${js.moodPattern.energyTrend} (avg ${js.moodPattern.averageEnergy.toFixed(1)}/10)\n\n`;

    if (js.moodPattern.lowDays.length > 0) {
      output += `- ⚠️ Low mood days: ${js.moodPattern.lowDays.length}\n`;
    }
    if (js.moodPattern.highDays.length > 0) {
      output += `- ✨ High energy days: ${js.moodPattern.highDays.length}\n`;
    }
    output += '\n';

    if (js.reflectionThemes.length > 0) {
      output += `**Key Themes**:\n`;
      output += js.reflectionThemes.map(theme => `- ${theme}`).join('\n') + '\n\n';
    }

    if (js.accomplishments.length > 0) {
      output += `**Top Accomplishments**:\n`;
      const topAccomplishments = js.accomplishments
        .filter(a => a.impact === 'high' || a.impact === 'medium')
        .slice(0, 5);
      output += topAccomplishments
        .map(a => {
          const impact = a.impact === 'high' ? '🌟' : '⭐';
          return `- ${impact} ${a.description.substring(0, 100)}${a.description.length > 100 ? '...' : ''}`;
        })
        .join('\n') + '\n\n';
    }

    if (js.challenges.length > 0) {
      output += `**Challenges & Blockers**:\n`;
      output += js.challenges
        .slice(0, 3)
        .map(c => {
          const severity = c.severity === 'high' ? '🔴' : c.severity === 'medium' ? '🟡' : '🟢';
          return `- ${severity} ${c.description.substring(0, 100)}${c.description.length > 100 ? '...' : ''}`;
        })
        .join('\n') + '\n\n';
    }

    return output;
  }

  /**
   * Generate time analysis section
   */
  private generateTimeAnalysis(data: WeeklyCheckinResult): string {
    const ta = data.timeAnalysis;
    const totalHours = Math.floor(ta.summary.totalDuration / 3600);
    const totalMinutes = Math.floor((ta.summary.totalDuration % 3600) / 60);
    const avgSessionMinutes = Math.floor(ta.summary.averageSessionDuration / 60);

    let output = `## ⏱️ Time Analysis\n\n`;

    output += `**Total Focus Time**: ${totalHours}h ${totalMinutes}m\n`;
    output += `**Total Sessions**: ${ta.summary.totalSessions}\n`;
    output += `**Average Session**: ${avgSessionMinutes} minutes\n`;
    output += `**Daily Average**: ${Math.floor(ta.summary.averageDailyTime / 3600)}h ${Math.floor((ta.summary.averageDailyTime % 3600) / 60)}m\n\n`;

    if (ta.categoryBreakdown.length > 0) {
      output += `**Time Allocation by Category**:\n\n`;
      const totalDuration = ta.summary.totalDuration;

      output += ta.categoryBreakdown
        .sort((a, b) => b.totalDuration - a.totalDuration)
        .map(cat => {
          const percentage = (cat.totalDuration / totalDuration) * 100;
          const hours = Math.floor(cat.totalDuration / 3600);
          const minutes = Math.floor((cat.totalDuration % 3600) / 60);
          const bar = '█'.repeat(Math.floor(percentage / 5));
          return `- **${cat.category}**: ${hours}h ${minutes}m (${percentage.toFixed(0)}%) ${bar}`;
        })
        .join('\n') + '\n\n';
    }

    if (ta.dailyBreakdown.length > 0) {
      output += `**Daily Breakdown**:\n\n`;
      output += ta.dailyBreakdown.map(day => {
        const hours = Math.floor(day.totalDuration / 3600);
        const minutes = Math.floor((day.totalDuration % 3600) / 60);
        const date = new Date(day.date);
        return `- ${format(date, 'EEE, MMM d')}: ${hours}h ${minutes}m (${day.sessions} sessions)`;
      }).join('\n') + '\n\n';
    }

    return output;
  }

  /**
   * Generate efficiency metrics
   */
  private generateEfficiencyMetrics(data: WeeklyCheckinResult): string {
    const ta = data.timeAnalysis;
    const focusPercentage = ta.summary.totalDuration > 0
      ? (ta.summary.totalFocusTime / ta.summary.totalDuration) * 100
      : 0;

    let output = `## 📈 Efficiency Metrics\n\n`;

    output += `**Focus Quality**: ${focusPercentage.toFixed(0)}%\n`;
    output += `- Total Focus Time: ${Math.floor(ta.summary.totalFocusTime / 3600)}h ${Math.floor((ta.summary.totalFocusTime % 3600) / 60)}m\n`;
    output += `- Pause Time: ${Math.floor((ta.summary.totalDuration - ta.summary.totalFocusTime) / 3600)}h\n\n`;

    if (ta.focusQualityTrend.length > 0) {
      output += `**Focus Quality Breakdown**:\n`;
      const totalSessions = ta.summary.totalSessions;
      const qualityCounts = ta.focusQualityTrend.reduce((acc, day) => {
        acc.fullFocus += day.fullFocus;
        acc.partialFocus += day.partialFocus;
        acc.interrupted += day.interrupted;
        acc.rest += day.rest;
        return acc;
      }, { fullFocus: 0, partialFocus: 0, interrupted: 0, rest: 0 });

      output += `- 🟢 Full Focus: ${qualityCounts.fullFocus} sessions (${totalSessions > 0 ? ((qualityCounts.fullFocus / totalSessions) * 100).toFixed(0) : 0}%)\n`;
      output += `- 🟡 Partial Focus: ${qualityCounts.partialFocus} sessions (${totalSessions > 0 ? ((qualityCounts.partialFocus / totalSessions) * 100).toFixed(0) : 0}%)\n`;
      output += `- 🔴 Interrupted: ${qualityCounts.interrupted} sessions (${totalSessions > 0 ? ((qualityCounts.interrupted / totalSessions) * 100).toFixed(0) : 0}%)\n\n`;
    }

    if (ta.recommendations.length > 0) {
      output += `**Productivity Insights**:\n`;
      output += ta.recommendations.slice(0, 5).map(rec => `- ${rec}`).join('\n') + '\n\n';
    }

    return output;
  }

  /**
   * Generate AI insights section
   */
  private generateAIInsights(data: WeeklyCheckinResult): string {
    const ai = data.aiInsights;

    let output = `## 🤖 AI-Powered Insights\n\n`;

    if (ai.keyHighlights.length > 0) {
      output += `**✨ Key Highlights**:\n`;
      output += ai.keyHighlights.map(h => `- ${h}`).join('\n') + '\n\n';
    }

    if (ai.areasOfConcern.length > 0) {
      output += `**⚠️ Areas of Concern**:\n`;
      output += ai.areasOfConcern.map(c => `- ${c}`).join('\n') + '\n\n';
    }

    return output;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(data: WeeklyCheckinResult): string {
    if (data.aiInsights.recommendations.length === 0) {
      return '';
    }

    let output = `## 💡 Recommendations for Next Week\n\n`;
    output += data.aiInsights.recommendations.map(rec => `- ${rec}`).join('\n') + '\n\n';

    return output;
  }

  /**
   * Generate activity correlation section
   */
  private generateActivityCorrelation(data: WeeklyCheckinResult): string {
    if (data.activityCorrelation.length === 0) {
      return '';
    }

    let output = `## 🔗 Activities Linked to OKRs\n\n`;

    const byObjective = data.activityCorrelation.reduce((acc, activity) => {
      if (!acc[activity.okrObjective]) {
        acc[activity.okrObjective] = [];
      }
      acc[activity.okrObjective].push(activity);
      return acc;
    }, {} as Record<string, typeof data.activityCorrelation>);

    for (const [objective, activities] of Object.entries(byObjective)) {
      output += `### ${objective}\n\n`;
      for (const activity of activities) {
        const sources = activity.sources.map(s => s === 'journal' ? '📝' : '⏱️').join(' ');
        const time = activity.pomodoroMinutes ? ` (${activity.pomodoroMinutes}min)` : '';
        output += `- ${sources} ${activity.description}${time}\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Generate looking ahead section
   */
  private generateLookingAhead(data: WeeklyCheckinResult): string {
    let output = `## 🔮 Looking Ahead\n\n`;

    // Identify objectives needing attention
    const needsAttention = data.okrProgress.objectives.filter(
      obj => obj.changePercentage === 0
    );

    if (needsAttention.length > 0) {
      output += `**Objectives Needing Attention**:\n`;
      output += needsAttention.map(obj => `- ${obj.objectiveTitle}`).join('\n') + '\n\n';
    }

    // Recommend time allocation based on this week
    const topCategories = data.timeAnalysis.categoryBreakdown
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 3);

    if (topCategories.length > 0) {
      output += `**Continue Focus On**:\n`;
      output += topCategories.map(cat => `- ${cat.category}`).join('\n') + '\n\n';
    }

    output += `---\n\n`;
    output += `*Generated on ${format(new Date(), 'MMMM d, yyyy')} at ${format(new Date(), 'h:mm a')}*`;

    return output;
  }

  /**
   * Calculate weekly momentum
   */
  private calculateMomentum(weeklyChange: number): string {
    if (weeklyChange >= 10) return '🔥 Exceptional Growth Week!';
    if (weeklyChange >= 5) return '🚀 Strong Progress Week!';
    if (weeklyChange > 0) return '📈 Steady Growth';
    if (weeklyChange === 0) return '➡️ Maintaining Pace';
    return '📉 Needs Attention';
  }
}
