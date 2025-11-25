import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { analyzeJournalEntry, suggestOKRUpdates, suggestKeyResults } from '../services/claudeService';
import { getDashboardInsights, forceRegenerateInsights } from '../services/aiInsightService';
import { getUserObjectives } from '../services/objectiveService';
import { ApiError } from '../middleware/errorHandler';

/**
 * AI Controller
 * Handles all AI-powered endpoints using Claude API
 */

/**
 * Analyze a journal entry and provide feedback
 * POST /api/ai/analyze-entry
 */
export const analyzeEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content, moodScore, energyScore } = req.body;

    if (!content) {
      throw new ApiError(400, 'Journal content is required');
    }

    const feedback = await analyzeJournalEntry(content, moodScore, energyScore);

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest OKR updates based on a journal entry
 * POST /api/ai/suggest-okr-updates
 */
export const suggestUpdates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { journalContent } = req.body;

    if (!journalContent) {
      throw new ApiError(400, 'Journal content is required');
    }

    // Get user's objectives with key results
    const objectives = await getUserObjectives(userId);

    if (objectives.length === 0) {
      res.json({ suggestions: [] });
      return;
    }

    const suggestions = await suggestOKRUpdates(journalContent, objectives);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI insights based on journal entries and OKRs with caching
 * GET /api/ai/insights
 * Query params:
 *  - force: boolean - force regeneration even if cache exists
 *  - format: 'simple' | 'structured' - return format (default: 'simple' for backward compatibility)
 */
export const getInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const force = req.query.force === 'true';
    const format = (req.query.format as string) || 'simple';

    let insights;

    if (force) {
      // Force regeneration
      insights = await forceRegenerateInsights(userId);
    } else {
      // Use cache if available
      insights = await getDashboardInsights(userId);
    }

    // Return format based on request
    if (format === 'structured') {
      res.json({
        id: insights.id,
        summary: insights.summary,
        patterns: insights.patterns,
        recommendations: insights.recommendations,
        metrics: insights.metrics,
        generatedAt: insights.generatedAt,
        isCached: insights.isCached,
      });
    } else {
      // Simple format for backward compatibility
      res.json({ insights: insights.summary });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest key results for an objective
 * POST /api/ai/suggest-key-results
 */
export const suggestKRs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { objectiveTitle } = req.body;

    if (!objectiveTitle) {
      throw new ApiError(400, 'Objective title is required');
    }

    const suggestions = await suggestKeyResults(objectiveTitle);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};
