import { Router } from 'express';
import {
  executeCheckin,
  getCheckinStatus,
  downloadMarkdownReport,
  downloadWeeklyJournal,
  downloadNewsletter,
  applyOKRUpdates,
  getCheckinHistory,
  getCheckinById,
  getCheckinStats,
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
 * @route   GET /api/weekly-checkin/report/markdown
 * @desc    Download weekly report as markdown file
 * @access  Private
 * @query   weekStart (optional Date)
 */
router.get('/report/markdown', downloadMarkdownReport);

/**
 * @route   GET /api/weekly-checkin/report/journal
 * @desc    Download weekly journal as markdown file
 * @access  Private
 * @query   weekStart (optional Date)
 */
router.get('/report/journal', downloadWeeklyJournal);

/**
 * @route   GET /api/weekly-checkin/report/newsletter
 * @desc    Download weekly newsletter as HTML file
 * @access  Private
 * @query   weekStart (optional Date)
 */
router.get('/report/newsletter', downloadNewsletter);

/**
 * @route   POST /api/weekly-checkin/apply-updates
 * @desc    Apply confirmed OKR update suggestions
 * @access  Private
 * @body    confirmedSuggestions (array of OKRUpdateSuggestion)
 */
router.post('/apply-updates', applyOKRUpdates);

/**
 * @route   GET /api/weekly-checkin/history
 * @desc    Get user's weekly check-in history
 * @access  Private
 * @query   limit (optional number)
 */
router.get('/history', getCheckinHistory);

/**
 * @route   GET /api/weekly-checkin/stats
 * @desc    Get weekly check-in statistics
 * @access  Private
 */
router.get('/stats', getCheckinStats);

/**
 * @route   GET /api/weekly-checkin/:id
 * @desc    Get weekly check-in by ID
 * @access  Private
 * @param   id (check-in ID)
 */
router.get('/:id', getCheckinById);

export default router;
