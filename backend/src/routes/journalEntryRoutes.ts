import { Router } from 'express';
import {
  listEntries,
  getByDate,
  getEntry,
  getStats,
  create,
  update,
  remove,
} from '../controllers/journalEntryController';
import { authenticate } from '../middleware/auth';

/**
 * Journal Entry routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/journal-entries
 * @desc    Get all entries for current user
 * @access  Private
 */
router.get('/', listEntries);

/**
 * @route   GET /api/journal-entries/stats
 * @desc    Get entry statistics
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/journal-entries/date/:date
 * @desc    Get entry for a specific date
 * @access  Private
 */
router.get('/date/:date', getByDate);

/**
 * @route   POST /api/journal-entries
 * @desc    Create a new entry
 * @access  Private
 */
router.post('/', create);

/**
 * @route   GET /api/journal-entries/:id
 * @desc    Get a single entry by ID
 * @access  Private
 */
router.get('/:id', getEntry);

/**
 * @route   PUT /api/journal-entries/:id
 * @desc    Update an entry
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   DELETE /api/journal-entries/:id
 * @desc    Delete an entry
 * @access  Private
 */
router.delete('/:id', remove);

export default router;
