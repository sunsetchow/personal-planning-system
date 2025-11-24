import { Router } from 'express';
import {
  listSessions,
  getByDateRange,
  getSession,
  create,
  update,
  remove,
  getStats,
} from '../controllers/pomodoroController';
import { authenticate } from '../middleware/auth';

/**
 * Pomodoro Time Session routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/time-sessions
 * @desc    Get all time sessions for current user (with optional filters)
 * @access  Private
 * @query   limit, startDate, endDate, okrCategory, objectiveId, focusQuality
 */
router.get('/', listSessions);

/**
 * @route   GET /api/time-sessions/stats
 * @desc    Get session statistics for current user
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/time-sessions/range
 * @desc    Get sessions for a specific date range
 * @access  Private
 * @query   startDate (required), endDate (required)
 */
router.get('/range', getByDateRange);

/**
 * @route   POST /api/time-sessions
 * @desc    Create a new time session
 * @access  Private
 */
router.post('/', create);

/**
 * @route   GET /api/time-sessions/:id
 * @desc    Get a single time session by ID
 * @access  Private
 */
router.get('/:id', getSession);

/**
 * @route   PUT /api/time-sessions/:id
 * @desc    Update a time session
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   DELETE /api/time-sessions/:id
 * @desc    Delete a time session
 * @access  Private
 */
router.delete('/:id', remove);

export default router;
