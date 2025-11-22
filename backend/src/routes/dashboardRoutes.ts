import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as dashboardController from '../controllers/dashboardController';

/**
 * Dashboard Routes
 * Analytics and statistics endpoints
 */
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/stats', dashboardController.getStats);

/**
 * GET /api/dashboard/trends/mood-energy
 * Get mood and energy trends over time
 * Query: ?days=30
 */
router.get('/trends/mood-energy', dashboardController.getMoodEnergyTrendsData);

/**
 * GET /api/dashboard/trends/okr-progress
 * Get OKR progress trends
 */
router.get('/trends/okr-progress', dashboardController.getOKRProgressTrendsData);

export default router;
