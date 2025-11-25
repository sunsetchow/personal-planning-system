import { format } from 'date-fns';
import { WeeklyCheckinResult } from '../weeklyCheckin/checkinOrchestrator';

/**
 * Weekly Journal Generator
 * Generates personal, narrative-style weekly journal entries
 */

export class WeeklyJournalGenerator {
  /**
   * Generate a narrative-style weekly journal in Markdown format
   */
  async generate(data: WeeklyCheckinResult): Promise<string> {
    const sections = [
      this.generateJournalHeader(data),
      this.generateWeekOverview(data),
      this.generateProgressNarrative(data),
      this.generateTimeReflection(data),
      this.generateEmotionalJourney(data),
      this.generateAccomplishmentsStory(data),
      this.generateChallengesReflection(data),
      this.generateLearningsAndInsights(data),
      this.generateGratitudeSection(data),
      this.generateLookingForward(data),
    ];

    return sections.filter(s => s).join('\n\n');
  }

  /**
   * Generate journal header
   */
  private generateJournalHeader(data: WeeklyCheckinResult): string {
    const weekStart = new Date(data.weekStart);
    const weekEnd = new Date(data.weekEnd);

    return `# Weekly Journal: Week of ${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}

*A personal reflection on the week that was.*

---
`;
  }

  /**
   * Generate week overview narrative
   */
  private generateWeekOverview(data: WeeklyCheckinResult): string {
    const totalHours = Math.floor(data.timeAnalysis.summary.totalDuration / 3600);
    const entryRate = data.journalSummary.completionRate;
    const avgMood = data.journalSummary.moodPattern.averageMood;

    let narrative = `## The Week in Review\n\n`;

    // Opening narrative based on the week's character
    if (avgMood >= 7.5 && entryRate >= 80) {
      narrative += `This was a fulfilling week. `;
    } else if (avgMood < 5 || entryRate < 50) {
      narrative += `This week had its challenges. `;
    } else {
      narrative += `This was a steady, productive week. `;
    }

    narrative += `I kept up with my reflections ${entryRate}% of the time`;
    if (entryRate >= 80) {
      narrative += `, maintaining a strong habit of daily introspection`;
    } else if (entryRate >= 50) {
      narrative += `, though there's room to be more consistent`;
    } else {
      narrative += `, and I notice I need to prioritize this practice more`;
    }
    narrative += `. `;

    if (totalHours > 0) {
      narrative += `I invested ${totalHours} hours into focused work`;
      if (totalHours >= 20) {
        narrative += `, showing strong dedication to my goals`;
      } else if (totalHours >= 10) {
        narrative += `, making meaningful progress`;
      } else {
        narrative += `, though I could have been more focused`;
      }
      narrative += `.\n\n`;
    }

    return narrative;
  }

  /**
   * Generate progress narrative
   */
  private generateProgressNarrative(data: WeeklyCheckinResult): string {
    if (data.okrProgress.objectives.length === 0) {
      return '';
    }

    let narrative = `## My Journey Toward Goals\n\n`;

    const progressingObjectives = data.okrProgress.objectives.filter(
      o => o.changePercentage > 0
    );
    const stagnantObjectives = data.okrProgress.objectives.filter(
      o => o.changePercentage === 0
    );

    if (progressingObjectives.length > 0) {
      narrative += `I made tangible progress on ${progressingObjectives.length} of my objectives this week:\n\n`;

      for (const objective of progressingObjectives) {
        const emoji = objective.changePercentage >= 10 ? '🌟' : objective.changePercentage >= 5 ? '✨' : '💫';
        narrative += `${emoji} **${objective.objectiveTitle}** advanced from ${objective.currentProgress.toFixed(0)}% to ${objective.suggestedProgress.toFixed(0)}%`;

        if (objective.changePercentage >= 10) {
          narrative += ` - a breakthrough week! `;
        } else if (objective.changePercentage >= 5) {
          narrative += ` - solid momentum. `;
        } else {
          narrative += ` - steady progress. `;
        }

        // Add supporting activities
        const objSuggestions = data.okrProgress.suggestions.filter(
          s => s.objectiveTitle === objective.objectiveTitle
        );

        if (objSuggestions.length > 0) {
          const activities = objSuggestions
            .flatMap(s => s.supportingActivities.map(a => a.description))
            .slice(0, 2);

          if (activities.length > 0) {
            narrative += `Key activities included ${activities.join(' and ')}.`;
          }
        }

        narrative += `\n\n`;
      }
    }

    if (stagnantObjectives.length > 0 && progressingObjectives.length > 0) {
      narrative += `I notice that `;
      if (stagnantObjectives.length === 1) {
        narrative += `**${stagnantObjectives[0].objectiveTitle}** didn't see movement this week`;
      } else {
        narrative += `${stagnantObjectives.length} objectives didn't see movement this week`;
      }
      narrative += `. This might be an area to focus on next week.\n\n`;
    } else if (stagnantObjectives.length === data.okrProgress.objectives.length) {
      narrative += `This week, I didn't make measurable progress on my tracked objectives. That's okay - not every week will show linear progress. Sometimes we're planting seeds that will bloom later.\n\n`;
    }

    return narrative;
  }

  /**
   * Generate time reflection
   */
  private generateTimeReflection(data: WeeklyCheckinResult): string {
    if (data.timeAnalysis.summary.totalSessions === 0) {
      return '';
    }

    let narrative = `## How I Spent My Time\n\n`;

    const topCategories = data.timeAnalysis.categoryBreakdown
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 3);

    if (topCategories.length > 0) {
      narrative += `Looking at where my energy went this week, `;
      const topCat = topCategories[0];
      const topHours = Math.floor(topCat.totalDuration / 3600);
      const topMins = Math.floor((topCat.totalDuration % 3600) / 60);

      narrative += `I spent most of my focused time on **${topCat.category}** (${topHours}h ${topMins}m)`;

      if (topCategories.length > 1) {
        const secondCat = topCategories[1];
        const secondHours = Math.floor(secondCat.totalDuration / 3600);
        const secondMins = Math.floor((secondCat.totalDuration % 3600) / 60);
        narrative += `, followed by **${secondCat.category}** (${secondHours}h ${secondMins}m)`;
      }

      narrative += `. `;

      // Reflection on balance
      const totalDuration = data.timeAnalysis.summary.totalDuration;
      const topPercentage = (topCat.totalDuration / totalDuration) * 100;

      if (topPercentage > 60) {
        narrative += `This shows a strong focus on one area, though I wonder if I should diversify my attention more.`;
      } else if (topPercentage < 30) {
        narrative += `My time was well-distributed across different areas, showing good balance.`;
      } else {
        narrative += `This feels like a reasonable balance for where I am right now.`;
      }

      narrative += `\n\n`;
    }

    // Daily consistency reflection
    const daysWithWork = data.timeAnalysis.dailyBreakdown.filter(d => d.sessions > 0).length;
    if (daysWithWork >= 6) {
      narrative += `I maintained daily focus throughout the week, which built strong momentum. `;
    } else if (daysWithWork >= 4) {
      narrative += `I worked focused sessions on ${daysWithWork} days this week. `;
    } else if (daysWithWork > 0) {
      narrative += `I only had focused sessions on ${daysWithWork} days. `;
    }

    if (daysWithWork < 5) {
      narrative += `More consistency could help me build better habits.\n\n`;
    } else {
      narrative += `\n\n`;
    }

    return narrative;
  }

  /**
   * Generate emotional journey narrative
   */
  private generateEmotionalJourney(data: WeeklyCheckinResult): string {
    const mood = data.journalSummary.moodPattern;
    if (mood.averageMood === 0) {
      return '';
    }

    let narrative = `## My Emotional Landscape\n\n`;

    // Overall mood narrative
    if (mood.moodTrend === 'improving') {
      narrative += `My mood improved throughout the week, ending on a higher note than where I started. `;
    } else if (mood.moodTrend === 'declining') {
      narrative += `I noticed my mood declining as the week progressed. `;
    } else {
      narrative += `My mood remained relatively steady this week. `;
    }

    narrative += `On average, I felt about ${mood.averageMood.toFixed(1)}/10`;

    if (mood.averageMood >= 7.5) {
      narrative += ` - generally positive and content`;
    } else if (mood.averageMood >= 6) {
      narrative += ` - decent, with occasional ups and downs`;
    } else if (mood.averageMood >= 4) {
      narrative += ` - somewhat low, struggling at times`;
    } else {
      narrative += ` - a difficult week emotionally`;
    }
    narrative += `. `;

    // Energy levels
    if (mood.averageEnergy >= 7) {
      narrative += `My energy levels were strong (${mood.averageEnergy.toFixed(1)}/10), giving me momentum to tackle challenges. `;
    } else if (mood.averageEnergy >= 5) {
      narrative += `My energy was moderate (${mood.averageEnergy.toFixed(1)}/10), enough to get things done but nothing spectacular. `;
    } else {
      narrative += `My energy was low (${mood.averageEnergy.toFixed(1)}/10), which made everything feel harder. `;
    }

    // Low and high days
    if (mood.lowDays.length > 0) {
      narrative += `\n\nI had ${mood.lowDays.length} particularly challenging day${mood.lowDays.length > 1 ? 's' : ''}`;
      if (mood.lowDays.length <= 2) {
        const dates = mood.lowDays.map(d => format(new Date(d), 'EEEE')).join(' and ');
        narrative += ` on ${dates}`;
      }
      narrative += `. `;
    }

    if (mood.highDays.length > 0) {
      narrative += `But I also had ${mood.highDays.length} energizing day${mood.highDays.length > 1 ? 's' : ''} where I felt truly alive. `;
    }

    narrative += `\n\n`;

    return narrative;
  }

  /**
   * Generate accomplishments story
   */
  private generateAccomplishmentsStory(data: WeeklyCheckinResult): string {
    if (data.journalSummary.accomplishments.length === 0) {
      return '';
    }

    let narrative = `## Moments of Pride\n\n`;

    const highImpact = data.journalSummary.accomplishments.filter(a => a.impact === 'high');
    const mediumImpact = data.journalSummary.accomplishments.filter(a => a.impact === 'medium');

    if (highImpact.length > 0) {
      narrative += `This week, I achieved ${highImpact.length} significant milestone${highImpact.length > 1 ? 's' : ''}:\n\n`;

      for (const acc of highImpact.slice(0, 5)) {
        narrative += `🌟 **${acc.description}**\n\n`;
      }
    }

    if (mediumImpact.length > 0 && mediumImpact.length <= 3) {
      narrative += `I also:\n\n`;
      for (const acc of mediumImpact.slice(0, 3)) {
        narrative += `- ${acc.description}\n`;
      }
      narrative += `\n`;
    }

    if (data.journalSummary.accomplishments.length > 8) {
      narrative += `In total, I recorded ${data.journalSummary.accomplishments.length} accomplishments this week - a testament to consistent effort.\n\n`;
    }

    return narrative;
  }

  /**
   * Generate challenges reflection
   */
  private generateChallengesReflection(data: WeeklyCheckinResult): string {
    if (data.journalSummary.challenges.length === 0) {
      return '';
    }

    let narrative = `## Obstacles and Growth\n\n`;

    narrative += `Not everything was smooth sailing. `;

    const highSeverity = data.journalSummary.challenges.filter(c => c.severity === 'high');
    const mediumSeverity = data.journalSummary.challenges.filter(c => c.severity === 'medium');

    if (highSeverity.length > 0) {
      narrative += `I faced ${highSeverity.length} significant challenge${highSeverity.length > 1 ? 's' : ''} that required real attention:\n\n`;

      for (const challenge of highSeverity.slice(0, 3)) {
        narrative += `- ${challenge.description}\n`;
      }
      narrative += `\n`;
    }

    if (mediumSeverity.length > 0) {
      narrative += `There were also ${mediumSeverity.length} moderate hurdle${mediumSeverity.length > 1 ? 's' : ''} that tested me. `;
    }

    // Reflection on challenges
    if (highSeverity.length > 0 || mediumSeverity.length > 0) {
      narrative += `\n\nWhat I'm learning: challenges are opportunities to grow. Each obstacle I face teaches me something about my resilience and resourcefulness.\n\n`;
    }

    return narrative;
  }

  /**
   * Generate learnings and insights
   */
  private generateLearningsAndInsights(data: WeeklyCheckinResult): string {
    let narrative = `## Insights and Patterns\n\n`;

    // Reflection themes
    if (data.journalSummary.reflectionThemes.length > 0) {
      narrative += `Looking back at my journal entries, some recurring themes emerge:\n\n`;

      for (const theme of data.journalSummary.reflectionThemes.slice(0, 5)) {
        narrative += `- ${theme}\n`;
      }

      narrative += `\nThese patterns tell me something about where my mind and heart have been this week.\n\n`;
    }

    // AI insights
    if (data.aiInsights.keyHighlights.length > 0) {
      narrative += `**What the data reveals:**\n\n`;

      for (const highlight of data.aiInsights.keyHighlights.slice(0, 3)) {
        narrative += `- ${highlight}\n`;
      }
      narrative += `\n`;
    }

    if (data.aiInsights.areasOfConcern.length > 0) {
      narrative += `**Areas for awareness:**\n\n`;

      for (const concern of data.aiInsights.areasOfConcern.slice(0, 2)) {
        narrative += `- ${concern}\n`;
      }
      narrative += `\n`;
    }

    return narrative;
  }

  /**
   * Generate gratitude section
   */
  private generateGratitudeSection(data: WeeklyCheckinResult): string {
    let narrative = `## Gratitude\n\n`;

    if (data.journalSummary.accomplishments.length > 0) {
      narrative += `I'm grateful for the opportunity to make progress on my goals. `;
    }

    if (data.timeAnalysis.summary.totalSessions > 0) {
      narrative += `I appreciate having the ability to focus and do deep work. `;
    }

    const moodTrend = data.journalSummary.moodPattern.moodTrend;
    if (moodTrend === 'improving') {
      narrative += `I'm thankful that my mood improved as the week went on. `;
    } else if (moodTrend === 'stable') {
      narrative += `I'm grateful for emotional stability. `;
    } else if (data.journalSummary.moodPattern.highDays.length > 0) {
      narrative += `I'm thankful for the good days that balanced out the harder ones. `;
    }

    narrative += `\n\nEvery week brings lessons, and for that I am grateful.\n\n`;

    return narrative;
  }

  /**
   * Generate looking forward section
   */
  private generateLookingForward(data: WeeklyCheckinResult): string {
    let narrative = `## Looking Ahead\n\n`;

    // Focus areas for next week
    const stagnantObjectives = data.okrProgress.objectives.filter(
      o => o.changePercentage === 0
    );

    if (stagnantObjectives.length > 0) {
      narrative += `Next week, I want to give more attention to `;
      if (stagnantObjectives.length === 1) {
        narrative += `**${stagnantObjectives[0].objectiveTitle}**`;
      } else if (stagnantObjectives.length === 2) {
        narrative += `**${stagnantObjectives[0].objectiveTitle}** and **${stagnantObjectives[1].objectiveTitle}**`;
      } else {
        narrative += `the ${stagnantObjectives.length} objectives that didn't progress this week`;
      }
      narrative += `. `;
    }

    // Recommendations
    if (data.aiInsights.recommendations.length > 0) {
      narrative += `\n\n**My intentions for the coming week:**\n\n`;

      for (const rec of data.aiInsights.recommendations.slice(0, 3)) {
        narrative += `- ${rec}\n`;
      }
      narrative += `\n`;
    }

    // Closing reflection
    narrative += `Each week is a fresh start. I carry forward what I learned, release what didn't serve me, and step into the next chapter with intention.\n\n`;

    narrative += `---\n\n`;
    narrative += `*Journal entry created on ${format(new Date(), 'MMMM d, yyyy')} at ${format(new Date(), 'h:mm a')}*\n`;
    narrative += `*"The journey of a thousand miles begins with a single step." - Lao Tzu*`;

    return narrative;
  }
}
