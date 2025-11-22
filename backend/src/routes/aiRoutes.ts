import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as aiController from '../controllers/aiController';

/**
 * AI Routes
 * All AI-powered endpoints using Claude API
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/analyze-entry
 * Analyze a journal entry and provide AI feedback
 * Body: { content: string, moodScore?: number, energyScore?: number }
 */
router.post('/analyze-entry', asyncHandler(aiController.analyzeEntry));

/**
 * POST /api/ai/suggest-okr-updates
 * Suggest OKR updates based on journal content
 * Body: { journalContent: string }
 */
router.post('/suggest-okr-updates', asyncHandler(aiController.suggestUpdates));

/**
 * GET /api/ai/insights
 * Generate AI insights based on user's journal entries and OKRs
 */
router.get('/insights', asyncHandler(aiController.getInsights));

/**
 * POST /api/ai/suggest-key-results
 * Suggest key results for a given objective
 * Body: { objectiveTitle: string }
 */
router.post('/suggest-key-results', asyncHandler(aiController.suggestKRs));

export default router;
