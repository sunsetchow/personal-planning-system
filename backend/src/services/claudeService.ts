import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { JournalEntry, Objective } from '@prisma/client';

/**
 * Claude AI Service
 * Handles all interactions with Anthropic's Claude API
 */

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY || '',
});

// Use Claude Haiku 4.5 - fastest model for AI insights
const MODEL = 'claude-haiku-4-5-20251001';

interface KeyResultWithObjective {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  objectiveId: string;
  objectiveTitle: string;
}

interface OKRUpdateSuggestion {
  objectiveId: string;
  keyResultId: string;
  suggestedValue: number;
  reasoning: string;
}

interface StructuredInsights {
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
}

/**
 * Analyze a journal entry and provide AI feedback
 */
export const analyzeJournalEntry = async (
  content: string,
  moodScore?: number,
  energyScore?: number
): Promise<string> => {
  if (!env.ANTHROPIC_API_KEY) {
    return "AI analysis is not available. Please configure ANTHROPIC_API_KEY.";
  }

  try {
    const prompt = `You are a thoughtful AI coach helping someone with personal development and goal achievement.

Analyze this journal entry and provide brief, encouraging feedback (2-3 sentences):

Journal Entry: "${content}"
${moodScore ? `Mood: ${moodScore}/10` : ''}
${energyScore ? `Energy: ${energyScore}/10` : ''}

Provide supportive feedback that:
1. Acknowledges their feelings or progress
2. Offers a positive insight or reflection
3. Encourages continued growth

Keep it warm, concise, and actionable.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text : 'Unable to generate feedback.';
  } catch (error: any) {
    console.error('Claude API error:', error);
    return 'AI analysis temporarily unavailable.';
  }
};

/**
 * Suggest OKR updates based on a journal entry
 */
export const suggestOKRUpdates = async (
  journalContent: string,
  objectives: (Objective & { keyResults: any[] })[]
): Promise<OKRUpdateSuggestion[]> => {
  if (!env.ANTHROPIC_API_KEY || objectives.length === 0) {
    return [];
  }

  try {
    // Flatten objectives and key results for easier processing
    const keyResultsWithObjectives: KeyResultWithObjective[] = objectives.flatMap((obj) =>
      obj.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        unit: kr.unit,
        objectiveId: obj.id,
        objectiveTitle: obj.title,
      }))
    );

    if (keyResultsWithObjectives.length === 0) {
      return [];
    }

    const prompt = `You are an AI assistant helping track progress on goals (OKRs - Objectives and Key Results).

Based on this journal entry, determine if any key results should be updated:

Journal Entry:
"${journalContent}"

Current OKRs:
${keyResultsWithObjectives
        .map(
          (kr) =>
            `- ${kr.objectiveTitle} > ${kr.title}: ${kr.currentValue}/${kr.targetValue} ${kr.unit} (ID: ${kr.id})`
        )
        .join('\n')}

If the journal mentions progress on any of these key results, respond with a JSON array of suggested updates.
Each suggestion should have:
- keyResultId: the ID from above
- suggestedValue: the new value based on the journal content
- reasoning: a brief explanation (one sentence)

If NO updates are mentioned, return an empty array: []

Respond ONLY with valid JSON, no other text.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Map suggestions to include objectiveId
    return suggestions.map((s: any) => {
      const kr = keyResultsWithObjectives.find((k) => k.id === s.keyResultId);
      return {
        objectiveId: kr?.objectiveId || '',
        keyResultId: s.keyResultId,
        suggestedValue: Number(s.suggestedValue),
        reasoning: s.reasoning,
      };
    });
  } catch (error: any) {
    console.error('Claude API error in suggestOKRUpdates:', error);
    return [];
  }
};

/**
 * Generate structured insights based on journal entries and OKR progress
 */
export const generateStructuredInsights = async (
  journalEntries: JournalEntry[],
  objectives: (Objective & { keyResults: any[] })[]
): Promise<StructuredInsights> => {
  if (!env.ANTHROPIC_API_KEY || journalEntries.length === 0) {
    return {
      summary: "Add journal entries and OKRs to unlock AI insights.",
      patterns: [],
      recommendations: ["Start journaling daily to track your progress"],
      metrics: {
        totalEntries: 0,
        avgProgress: 0,
        activeGoals: objectives.length,
      },
    };
  }

  try {
    // Get recent entries (last 7) - entries come in most-recent-first order
    const recentEntries = journalEntries.slice(0, 7);

    // Calculate metrics
    const moodScores = recentEntries
      .filter((e: any) => e.moodScore !== null)
      .map((e: any) => Number(e.moodScore));
    const energyScores = recentEntries
      .filter((e: any) => e.energyScore !== null)
      .map((e: any) => Number(e.energyScore));

    const avgMood = moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : undefined;
    const avgEnergy = energyScores.length > 0
      ? energyScores.reduce((a, b) => a + b, 0) / energyScores.length
      : undefined;

    // Calculate OKR progress
    const avgProgress =
      objectives.length > 0
        ? objectives.reduce((sum, obj) => {
          const total = obj.keyResults.reduce((acc, kr) => {
            return acc + Math.min(100, (kr.currentValue / kr.targetValue) * 100);
          }, 0);
          return sum + (obj.keyResults.length > 0 ? total / obj.keyResults.length : 0);
        }, 0) / objectives.length
        : 0;

    const metrics = {
      totalEntries: recentEntries.length,
      avgProgress: Math.round(avgProgress),
      activeGoals: objectives.length,
      avgMood: avgMood ? Number(avgMood.toFixed(1)) : undefined,
      avgEnergy: avgEnergy ? Number(avgEnergy.toFixed(1)) : undefined,
    };

    const prompt = `You are an insightful AI coach analyzing someone's personal development journey.

Recent Data:
- Journal Entries: ${metrics.totalEntries} entries in the last week
- Overall OKR Progress: ${metrics.avgProgress}%
- Active Goals: ${metrics.activeGoals}
${metrics.avgMood ? `- Average Mood: ${metrics.avgMood}/10` : ''}
${metrics.avgEnergy ? `- Average Energy: ${metrics.avgEnergy}/10` : ''}

Provide structured insights in JSON format with:
1. "summary": A warm, encouraging 2-3 sentence overview
2. "patterns": Array of 2-3 observed patterns or trends
3. "recommendations": Array of 2-3 specific, actionable next steps

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "patterns": ["...", "..."],
  "recommendations": ["...", "..."]
}`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        summary: 'Insights coming soon.',
        patterns: [],
        recommendations: [],
        metrics,
      };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: textContent.text,
        patterns: [],
        recommendations: [],
        metrics,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || 'Keep up the great work!',
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      metrics,
    };
  } catch (error: any) {
    console.error('Claude API error in generateStructuredInsights:', error);
    return {
      summary: 'Unable to generate insights at this time.',
      patterns: [],
      recommendations: [],
      metrics: {
        totalEntries: journalEntries.length,
        avgProgress: 0,
        activeGoals: objectives.length,
      },
    };
  }
};

/**
 * Legacy function for backward compatibility - returns only summary text
 */
export const generateInsights = async (
  journalEntries: JournalEntry[],
  objectives: (Objective & { keyResults: any[] })[]
): Promise<string> => {
  const structured = await generateStructuredInsights(journalEntries, objectives);
  return structured.summary;
};

/**
 * Suggest key results for a given objective
 */
/**
 * Generate structured output from Claude AI based on a prompt
 */
export const generateStructuredOutput = async (
  prompt: string,
  schema: Record<string, string>
): Promise<Record<string, any>> => {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('AI service is not available. Please configure ANTHROPIC_API_KEY.');
  }

  const schemaDescription = Object.entries(schema)
    .map(([key, type]) => `- ${key}: ${type}`)
    .join('\n');

  const fullPrompt = `${prompt}

Output your response as a JSON object with these exact fields:
${schemaDescription}

Respond only with the JSON object, no other text.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to extract JSON from AI response');
  } catch (error) {
    console.error('Error generating structured output:', error);
    throw error;
  }
};

export const suggestKeyResults = async (objectiveTitle: string): Promise<string[]> => {
  if (!env.ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    const prompt = `Suggest 3 specific, measurable key results for this objective: "${objectiveTitle}"

Each key result should:
- Be specific and measurable
- Include a clear metric
- Be achievable within a quarter/year
- Start with an action verb

Respond with ONLY a JSON array of strings, no other text.
Example: ["Increase X from 0 to 100", "Complete 5 Y sessions", "Reduce Z by 20%"]`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Claude API error in suggestKeyResults:', error);
    return [];
  }
};
