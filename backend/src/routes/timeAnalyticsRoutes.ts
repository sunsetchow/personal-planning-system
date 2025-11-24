import { Router } from 'express';
import {
  getWeeklyReport,
  getCategoryAllocation,
  getFocusDistribution,
  getWeekComparison,
} from '../controllers/timeAnalyticsController';
import { authenticate } from '../middleware/auth';

/**
 * Time Analytics routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/time-analytics/weekly
 * @desc    Get weekly time report
 * @access  Private
 * @query   weekStart (optional, defaults to current week)
 */
router.get('/weekly', getWeeklyReport);

/**
 * @route   GET /api/time-analytics/category-allocation
 * @desc    Get time allocation by OKR category
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/category-allocation', getCategoryAllocation);

/**
 * @route   GET /api/time-analytics/focus-quality
 * @desc    Get focus quality distribution
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/focus-quality', getFocusDistribution);

/**
 * @route   GET /api/time-analytics/compare-weeks
 * @desc    Compare current week with previous week
 * @access  Private
 * @query   weekStart (optional, defaults to current week)
 */
router.get('/compare-weeks', getWeekComparison);

export default router;
