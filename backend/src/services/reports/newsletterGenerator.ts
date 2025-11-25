import { format } from 'date-fns';
import { WeeklyCheckinResult } from '../weeklyCheckin/checkinOrchestrator';

/**
 * Newsletter Generator
 * Generates HTML newspaper-style weekly newsletters
 */

export class NewsletterGenerator {
  /**
   * Generate an HTML newspaper-style newsletter
   */
  async generate(data: WeeklyCheckinResult): Promise<string> {
    const weekStart = new Date(data.weekStart);
    const weekEnd = new Date(data.weekEnd);
    const issueDate = format(new Date(), 'MMMM d, yyyy');
    const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Weekly Progress - ${weekRange}</title>
    <style>
        ${this.getNewsletterStyles()}
    </style>
</head>
<body>
    <div class="newsletter">
        ${this.generateMasthead(weekRange, issueDate)}
        ${this.generateHeadline(data)}
        ${this.generateMainStories(data)}
        ${this.generateSidebarContent(data)}
        ${this.generateFooter(issueDate)}
    </div>
</body>
</html>`;
  }

  /**
   * Get newsletter CSS styles
   */
  private getNewsletterStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background-color: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }

        .newsletter {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 40px;
        }

        .masthead {
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 20px 0;
            margin-bottom: 30px;
            text-align: center;
        }

        .masthead-title {
            font-size: 48px;
            font-weight: bold;
            font-family: 'Georgia', serif;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .masthead-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
        }

        .issue-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
        }

        .headline {
            font-size: 36px;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .subheadline {
            font-size: 18px;
            color: #555;
            margin-bottom: 30px;
            font-style: italic;
        }

        .main-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .article {
            margin-bottom: 30px;
        }

        .article-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            border-left: 4px solid #000;
            padding-left: 10px;
        }

        .article-meta {
            font-size: 12px;
            color: #888;
            margin-bottom: 15px;
            font-style: italic;
        }

        .article-content {
            font-size: 16px;
            text-align: justify;
            margin-bottom: 15px;
        }

        .article-content p {
            margin-bottom: 15px;
        }

        .sidebar {
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
        }

        .sidebar-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }

        .sidebar-section:last-child {
            border-bottom: none;
        }

        .sidebar-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .sidebar-content {
            font-size: 14px;
        }

        .stats-box {
            background: #fff;
            border: 2px solid #000;
            padding: 15px;
            margin-bottom: 15px;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }

        .stat:last-child {
            border-bottom: none;
        }

        .stat-label {
            font-weight: bold;
        }

        .stat-value {
            color: #0066cc;
        }

        ul.bullet-list {
            list-style: none;
            padding-left: 0;
        }

        ul.bullet-list li {
            padding-left: 20px;
            margin-bottom: 8px;
            position: relative;
        }

        ul.bullet-list li:before {
            content: "▪";
            position: absolute;
            left: 0;
            font-weight: bold;
        }

        .highlight-box {
            background: #fffbea;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }

        .quote {
            font-style: italic;
            font-size: 18px;
            padding: 20px;
            border-left: 3px solid #ccc;
            margin: 20px 0;
            background: #f9f9f9;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 3px double #000;
            text-align: center;
            font-size: 12px;
            color: #666;
        }

        .progress-bar {
            height: 20px;
            background: #e0e0e0;
            border-radius: 3px;
            overflow: hidden;
            margin: 10px 0;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2196F3, #4CAF50);
            transition: width 0.3s;
        }

        .emoji {
            font-size: 24px;
            margin-right: 8px;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .newsletter {
                box-shadow: none;
                max-width: 100%;
            }
        }
    `;
  }

  /**
   * Generate masthead (newspaper header)
   */
  private generateMasthead(weekRange: string, issueDate: string): string {
    return `
        <div class="masthead">
            <div class="masthead-title">THE WEEKLY PROGRESS</div>
            <div class="masthead-subtitle">Your Personal Development Chronicle</div>
            <div class="issue-info">
                <span>Week of ${weekRange}</span>
                <span>Published ${issueDate}</span>
            </div>
        </div>
    `;
  }

  /**
   * Generate headline story
   */
  private generateHeadline(data: WeeklyCheckinResult): string {
    const progressingObjectives = data.okrProgress.objectives.filter(
      o => o.changePercentage > 0
    );

    let headline = '';
    let subheadline = '';

    if (progressingObjectives.length === 0) {
      headline = 'A Week of Reflection and Recalibration';
      subheadline = 'Strategic pause leads to valuable insights for future growth';
    } else {
      const topObjective = progressingObjectives.sort(
        (a, b) => b.changePercentage - a.changePercentage
      )[0];

      if (topObjective.changePercentage >= 10) {
        headline = `Breakthrough Week: Major Advances in ${this.extractMainKeyword(topObjective.objectiveTitle)}`;
        subheadline = `${progressingObjectives.length} objectives see significant progress as momentum builds`;
      } else if (progressingObjectives.length >= 3) {
        headline = `Steady Growth Across Multiple Fronts`;
        subheadline = `${progressingObjectives.length} objectives advance as consistency pays dividends`;
      } else {
        headline = `Progress Continues on Key Priorities`;
        subheadline = `Focused effort yields measurable results in core areas`;
      }
    }

    return `
        <div class="headline">${headline}</div>
        <div class="subheadline">${subheadline}</div>
    `;
  }

  /**
   * Generate main stories
   */
  private generateMainStories(data: WeeklyCheckinResult): string {
    return `
        <div class="main-content">
            <div class="main-column">
                ${this.generateLeadStory(data)}
                ${this.generateAccomplishmentsStory(data)}
                ${this.generateTimeAnalysisStory(data)}
            </div>
            <div class="sidebar">
                ${this.generateSidebarContent(data)}
            </div>
        </div>
    `;
  }

  /**
   * Generate lead story
   */
  private generateLeadStory(data: WeeklyCheckinResult): string {
    const progressingObjectives = data.okrProgress.objectives.filter(
      o => o.changePercentage > 0
    );

    let story = '<div class="article">';
    story += '<div class="article-title">Week in Review: Progress Report</div>';
    story += '<div class="article-meta">Analysis by AI Assistant</div>';
    story += '<div class="article-content">';

    if (progressingObjectives.length > 0) {
      story += `<p>This week marked ${progressingObjectives.length > 1 ? 'multiple advances' : 'an advance'} across `;
      story += `${progressingObjectives.length} ${progressingObjectives.length === 1 ? 'objective' : 'objectives'}, `;
      story += `demonstrating continued commitment to personal growth and goal achievement.</p>`;

      // Top objective detail
      const topObjective = progressingObjectives.sort(
        (a, b) => b.changePercentage - a.changePercentage
      )[0];

      story += `<p>Leading the way was <strong>${topObjective.objectiveTitle}</strong>, which advanced from `;
      story += `${topObjective.currentProgress.toFixed(0)}% to ${topObjective.suggestedProgress.toFixed(0)}% completion. `;
      story += `This ${topObjective.changePercentage.toFixed(1)}% increase represents tangible progress toward this critical goal.</p>`;

      // Supporting evidence
      const topSuggestions = data.okrProgress.suggestions.filter(
        s => s.objectiveTitle === topObjective.objectiveTitle
      );

      if (topSuggestions.length > 0) {
        story += `<p>Key developments included:`;
        story += '<ul class="bullet-list">';
        for (const suggestion of topSuggestions.slice(0, 3)) {
          story += `<li><strong>${suggestion.keyResultTitle}:</strong> ${suggestion.reasoning}</li>`;
        }
        story += '</ul></p>';
      }
    } else {
      story += `<p>While this week did not see measurable progress on tracked objectives, it provided valuable time for `;
      story += `reflection and strategic planning. Not every week needs to show linear advancement; sometimes the most `;
      story += `important work happens beneath the surface.</p>`;

      story += `<p>${data.aiInsights.summary}</p>`;
    }

    story += '</div></div>';

    return story;
  }

  /**
   * Generate accomplishments story
   */
  private generateAccomplishmentsStory(data: WeeklyCheckinResult): string {
    if (data.journalSummary.accomplishments.length === 0) {
      return '';
    }

    const highImpact = data.journalSummary.accomplishments.filter(a => a.impact === 'high');

    let story = '<div class="article">';
    story += '<div class="article-title"><span class="emoji">🌟</span>Notable Achievements</div>';
    story += '<div class="article-meta">Highlights from daily journals</div>';
    story += '<div class="article-content">';

    story += `<p>A total of ${data.journalSummary.accomplishments.length} accomplishments were recorded this week`;
    if (highImpact.length > 0) {
      story += `, including ${highImpact.length} high-impact milestone${highImpact.length > 1 ? 's' : ''}`;
    }
    story += '.</p>';

    if (highImpact.length > 0) {
      story += '<p><strong>Major Milestones:</strong></p>';
      story += '<ul class="bullet-list">';
      for (const acc of highImpact.slice(0, 5)) {
        story += `<li>${acc.description}</li>`;
      }
      story += '</ul>';
    }

    if (data.activityCorrelation.length > 0) {
      story += `<p>These accomplishments directly contributed to progress on ${new Set(data.activityCorrelation.map(a => a.okrObjective)).size} objectives, `;
      story += 'demonstrating clear alignment between daily actions and long-term goals.</p>';
    }

    story += '</div></div>';

    return story;
  }

  /**
   * Generate time analysis story
   */
  private generateTimeAnalysisStory(data: WeeklyCheckinResult): string {
    if (data.timeAnalysis.summary.totalSessions === 0) {
      return '';
    }

    const totalHours = Math.floor(data.timeAnalysis.summary.totalDuration / 3600);
    const totalMinutes = Math.floor((data.timeAnalysis.summary.totalDuration % 3600) / 60);

    let story = '<div class="article">';
    story += '<div class="article-title"><span class="emoji">⏱️</span>Time Investment Analysis</div>';
    story += '<div class="article-meta">Focus session breakdown</div>';
    story += '<div class="article-content">';

    story += `<p>A total of ${totalHours} hours and ${totalMinutes} minutes were invested in focused work across `;
    story += `${data.timeAnalysis.summary.totalSessions} Pomodoro sessions this week.</p>`;

    // Top categories
    const topCategories = data.timeAnalysis.categoryBreakdown
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 3);

    if (topCategories.length > 0) {
      story += '<p><strong>Time allocation by category:</strong></p>';
      story += '<ul class="bullet-list">';
      for (const cat of topCategories) {
        const catHours = Math.floor(cat.totalDuration / 3600);
        const catMinutes = Math.floor((cat.totalDuration % 3600) / 60);
        const percentage = (cat.totalDuration / data.timeAnalysis.summary.totalDuration) * 100;
        story += `<li><strong>${cat.category}:</strong> ${catHours}h ${catMinutes}m (${percentage.toFixed(0)}%)</li>`;
      }
      story += '</ul>';
    }

    // Focus quality insights
    story += `<p>Focus quality averaged ${(data.timeAnalysis.summary.totalFocusTime / data.timeAnalysis.summary.totalDuration * 100).toFixed(0)}%, `;
    story += 'indicating generally productive work sessions.</p>';

    if (data.timeAnalysis.recommendations.length > 0) {
      story += '<div class="highlight-box">';
      story += '<strong>Productivity Insight:</strong> ';
      story += data.timeAnalysis.recommendations[0];
      story += '</div>';
    }

    story += '</div></div>';

    return story;
  }

  /**
   * Generate sidebar content
   */
  private generateSidebarContent(data: WeeklyCheckinResult): string {
    return `
        ${this.generateStatsBox(data)}
        ${this.generateMoodEnergyBox(data)}
        ${this.generateRecommendationsBox(data)}
        ${this.generateQuoteBox(data)}
    `;
  }

  /**
   * Generate stats box
   */
  private generateStatsBox(data: WeeklyCheckinResult): string {
    const totalHours = Math.floor(data.timeAnalysis.summary.totalDuration / 3600);
    const avgObjectiveProgress = data.okrProgress.objectives.length > 0
      ? data.okrProgress.objectives.reduce((sum, obj) => sum + obj.suggestedProgress, 0) / data.okrProgress.objectives.length
      : 0;

    return `
        <div class="sidebar-section">
            <div class="sidebar-title">By The Numbers</div>
            <div class="stats-box">
                <div class="stat">
                    <span class="stat-label">Journal Completion</span>
                    <span class="stat-value">${data.journalSummary.completionRate}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Focus Hours</span>
                    <span class="stat-value">${totalHours}h</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Pomodoro Sessions</span>
                    <span class="stat-value">${data.timeAnalysis.summary.totalSessions}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Avg OKR Progress</span>
                    <span class="stat-value">${avgObjectiveProgress.toFixed(0)}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Accomplishments</span>
                    <span class="stat-value">${data.journalSummary.accomplishments.length}</span>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate mood & energy box
   */
  private generateMoodEnergyBox(data: WeeklyCheckinResult): string {
    const mood = data.journalSummary.moodPattern;

    let moodIcon = '😊';
    if (mood.averageMood >= 8) moodIcon = '😄';
    else if (mood.averageMood >= 6) moodIcon = '🙂';
    else if (mood.averageMood >= 4) moodIcon = '😐';
    else moodIcon = '😔';

    let energyIcon = '⚡';
    if (mood.averageEnergy >= 8) energyIcon = '⚡⚡⚡';
    else if (mood.averageEnergy >= 6) energyIcon = '⚡⚡';
    else if (mood.averageEnergy < 4) energyIcon = '🔋';

    return `
        <div class="sidebar-section">
            <div class="sidebar-title">Mood & Energy</div>
            <div class="sidebar-content">
                <div style="margin-bottom: 15px;">
                    <strong>Mood Average:</strong> ${moodIcon} ${mood.averageMood.toFixed(1)}/10
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${mood.averageMood * 10}%"></div>
                    </div>
                    <em>${mood.moodTrend}</em>
                </div>
                <div>
                    <strong>Energy Average:</strong> ${energyIcon} ${mood.averageEnergy.toFixed(1)}/10
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${mood.averageEnergy * 10}%"></div>
                    </div>
                    <em>${mood.energyTrend}</em>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate recommendations box
   */
  private generateRecommendationsBox(data: WeeklyCheckinResult): string {
    if (data.aiInsights.recommendations.length === 0) {
      return '';
    }

    return `
        <div class="sidebar-section">
            <div class="sidebar-title">Next Week's Focus</div>
            <div class="sidebar-content">
                <ul class="bullet-list">
                    ${data.aiInsights.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
  }

  /**
   * Generate quote box
   */
  private generateQuoteBox(data: WeeklyCheckinResult): string {
    const quotes = [
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
      { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Progress is impossible without change.", author: "George Bernard Shaw" },
    ];

    // Select quote based on week's progress
    const progressingObjectives = data.okrProgress.objectives.filter(o => o.changePercentage > 0);
    const quoteIndex = progressingObjectives.length > 0 ? 1 : 4;

    return `
        <div class="sidebar-section">
            <div class="sidebar-title">Inspiration</div>
            <div class="quote">
                "${quotes[quoteIndex % quotes.length].text}"
                <div style="margin-top: 10px; text-align: right; font-size: 14px;">
                    — ${quotes[quoteIndex % quotes.length].author}
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate footer
   */
  private generateFooter(issueDate: string): string {
    return `
        <div class="footer">
            <p><strong>The Weekly Progress</strong></p>
            <p>Your personal development chronicle, delivered weekly</p>
            <p>Published on ${issueDate}</p>
            <p style="margin-top: 15px; font-style: italic;">
                "Every accomplishment starts with the decision to try."
            </p>
        </div>
    `;
  }

  /**
   * Extract main keyword from objective title
   */
  private extractMainKeyword(title: string): string {
    // Extract the most significant word (usually after "Build", "Improve", etc.)
    const words = title.split(' ').filter(w => w.length > 4);
    return words[words.length - 1] || title;
  }
}
