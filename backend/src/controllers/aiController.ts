import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  analyzeJournalEntry,
  suggestOKRUpdates,
  generateInsights,
  suggestKeyResults,
} from '../services/claudeService';
import { getUserEntries } from '../services/journalEntryService';
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
 * Generate AI insights based on journal entries and OKRs
 * GET /api/ai/insights
 */
export const getInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get user's data
    const [journalEntries, objectives] = await Promise.all([
      getUserEntries(userId),
      getUserObjectives(userId),
    ]);

    const insights = await generateInsights(journalEntries, objectives);

    res.json({ insights });
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
