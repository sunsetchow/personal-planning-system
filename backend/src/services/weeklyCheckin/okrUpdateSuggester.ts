import prisma from '../../config/database';
import { generateStructuredOutput } from '../claudeService';
import { CorrelatedActivity } from './activityCorrelator';

/**
 * OKR Update Suggester Service
 * Generates AI-powered suggestions for updating OKR progress
 */

export interface OKRUpdateSuggestion {
  keyResultId: string;
  keyResultTitle: string;
  objectiveTitle: string;
  currentProgress: number;
  suggestedProgress: number;
  reasoning: string;
  supportingActivities: CorrelatedActivity[];
  confidence: 'high' | 'medium' | 'low';
  userConfirmed: boolean;
}

interface ObjectiveUpdate {
  objectiveId: string;
  objectiveTitle: string;
  currentProgress: number;
  suggestedProgress: number;
  changePercentage: number;
  keyResultSuggestions: number;
}

export interface OKRProgressUpdate {
  objectives: ObjectiveUpdate[];
  suggestions: OKRUpdateSuggestion[];
  appliedUpdates: OKRUpdateSuggestion[];
}

export class OKRUpdateSuggester {
  /**
   * Generate OKR update suggestions based on activities
   */
  async generateSuggestions(
    currentOKRs: any[],
    activities: CorrelatedActivity[]
  ): Promise<OKRProgressUpdate> {
    console.log('💡 Generating OKR update suggestions');

    const suggestions: OKRUpdateSuggestion[] = [];

    for (const objective of currentOKRs) {
      // Find activities related to this objective
      const relatedActivities = activities.filter(
        a => a.okrObjective === objective.title
      );

      if (relatedActivities.length === 0) continue;

      // Generate suggestions for each key result
      for (const keyResult of objective.keyResults || []) {
        const suggestion = await this.generateKeyResultSuggestion(
          objective,
          keyResult,
          relatedActivities
        );

        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return {
      objectives: this.summarizeObjectiveProgress(currentOKRs, suggestions),
      suggestions,
      appliedUpdates: [],
    };
  }

  /**
   * Generate suggestion for a specific key result
   */
  private async generateKeyResultSuggestion(
    objective: any,
    keyResult: any,
    activities: CorrelatedActivity[]
  ): Promise<OKRUpdateSuggestion | null> {
    const currentProgress =
      (Number(keyResult.currentValue) / Number(keyResult.targetValue)) * 100;

    // Create AI prompt
    const prompt = this.createSuggestionPrompt(objective, keyResult, activities);

    try {
      // Use Claude AI to generate suggestion
      const aiResponse = await generateStructuredOutput(prompt, {
        shouldUpdate: 'boolean',
        suggestedProgress: 'number (0-100)',
        reasoning: 'string',
        confidence: 'string (high/medium/low)',
      });

      if (!aiResponse.shouldUpdate) return null;

      const suggestedProgress = Number(aiResponse.suggestedProgress);

      // Only suggest if there's meaningful progress (at least 5%)
      if (suggestedProgress <= currentProgress + 5) return null;

      // Cap suggested progress at 100%
      const cappedProgress = Math.min(suggestedProgress, 100);

      return {
        keyResultId: keyResult.id,
        keyResultTitle: keyResult.title,
        objectiveTitle: objective.title,
        currentProgress,
        suggestedProgress: cappedProgress,
        reasoning: aiResponse.reasoning,
        supportingActivities: activities,
        confidence: aiResponse.confidence as 'high' | 'medium' | 'low',
        userConfirmed: false,
      };
    } catch (error) {
      console.error('Failed to generate AI suggestion:', error);
      return null;
    }
  }

  /**
   * Apply confirmed suggestions and create audit trail
   */
  async applyConfirmedUpdates(
    confirmedSuggestions: OKRUpdateSuggestion[]
  ): Promise<void> {
    console.log(`✅ Applying ${confirmedSuggestions.length} confirmed updates`);

    for (const suggestion of confirmedSuggestions) {
      const keyResult = await prisma.keyResult.findUnique({
        where: { id: suggestion.keyResultId },
      });

      if (!keyResult) continue;

      const newValue =
        (suggestion.suggestedProgress / 100) * Number(keyResult.targetValue);

      // Update key result
      await prisma.keyResult.update({
        where: { id: suggestion.keyResultId },
        data: {
          currentValue: newValue,
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await prisma.okrUpdate.create({
        data: {
          keyResultId: suggestion.keyResultId,
          previousValue: keyResult.currentValue,
          newValue,
          updateType: 'JOURNAL_SUGGESTED',
          notes: `Weekly check-in suggestion: ${suggestion.reasoning}`,
        },
      });

      console.log(
        `✅ Updated ${suggestion.keyResultTitle}: ${keyResult.currentValue} → ${newValue}`
      );
    }
  }

  /**
   * Create AI prompt for generating suggestions
   */
  private createSuggestionPrompt(
    objective: any,
    keyResult: any,
    activities: CorrelatedActivity[]
  ): string {
    const activitiesSummary = activities
      .map(a => {
        const sources = a.sources.join(' + ');
        const time = a.pomodoroMinutes ? ` (${a.pomodoroMinutes}min)` : '';
        return `- ${a.description}${time} [${sources}]`;
      })
      .join('\n');

    return `Analyze if this key result should be updated based on this week's activities.

**Objective**: ${objective.title}
**Key Result**: ${keyResult.title}
**Current Progress**: ${keyResult.currentValue}/${keyResult.targetValue} ${keyResult.unit}
**Current Percentage**: ${Math.round((Number(keyResult.currentValue) / Number(keyResult.targetValue)) * 100)}%

**This Week's Related Activities**:
${activitiesSummary}

**Task**: Determine if progress should be updated and by how much. Be conservative and realistic.

Consider:
1. Do the activities directly contribute to this key result?
2. How much progress do these activities represent?
3. Is the progress measurable and verifiable?

Output your analysis in JSON format with these fields:
- shouldUpdate: boolean (true if progress should be updated)
- suggestedProgress: number (0-100 percentage)
- reasoning: string (brief explanation of your suggestion)
- confidence: string (high/medium/low based on how clear the connection is)`;
  }

  /**
   * Summarize objective-level progress
   */
  private summarizeObjectiveProgress(
    okrs: any[],
    suggestions: OKRUpdateSuggestion[]
  ): ObjectiveUpdate[] {
    return okrs.map(obj => {
      const objSuggestions = suggestions.filter(
        s => s.objectiveTitle === obj.title
      );

      const avgCurrentProgress = this.calculateObjectiveProgress(obj);
      const avgSuggestedProgress =
        objSuggestions.length > 0
          ? objSuggestions.reduce((sum, s) => sum + s.suggestedProgress, 0) /
            objSuggestions.length
          : avgCurrentProgress;

      return {
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        currentProgress: avgCurrentProgress,
        suggestedProgress: avgSuggestedProgress,
        changePercentage: avgSuggestedProgress - avgCurrentProgress,
        keyResultSuggestions: objSuggestions.length,
      };
    });
  }

  /**
   * Calculate overall objective progress from key results
   */
  private calculateObjectiveProgress(objective: any): number {
    const keyResults = objective.keyResults || [];
    if (keyResults.length === 0) return 0;

    const totalProgress = keyResults.reduce((sum: number, kr: any) => {
      const progress =
        (Number(kr.currentValue) / Number(kr.targetValue)) * 100;
      return sum + Math.min(progress, 100);
    }, 0);

    return Math.round(totalProgress / keyResults.length);
  }
}
