import { Router } from 'express';
import {
  executeCheckin,
  getCheckinStatus,
  applyOKRUpdates,
} from '../controllers/weeklyCheckinController';
import { authenticate } from '../middleware/auth';

/**
 * Weekly Check-in routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/weekly-checkin
 * @desc    Execute weekly check-in workflow
 * @access  Private
 * @body    weekStart (optional Date)
 */
router.post('/', executeCheckin);

/**
 * @route   GET /api/weekly-checkin/status
 * @desc    Get weekly check-in status
 * @access  Private
 * @query   weekStart (optional Date)
 */
router.get('/status', getCheckinStatus);

/**
 * @route   POST /api/weekly-checkin/apply-updates
 * @desc    Apply confirmed OKR update suggestions
 * @access  Private
 * @body    confirmedSuggestions (array of OKRUpdateSuggestion)
 */
router.post('/apply-updates', applyOKRUpdates);

export default router;
