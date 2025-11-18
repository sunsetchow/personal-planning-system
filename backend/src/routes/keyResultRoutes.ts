import { Router } from 'express';
import {
  getKeyResult,
  update,
  updateProgress,
  remove,
} from '../controllers/keyResultController';
import { authenticate } from '../middleware/auth';

/**
 * Key Result routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/key-results/:id
 * @desc    Get a single key result by ID
 * @access  Private
 */
router.get('/:id', getKeyResult);

/**
 * @route   PUT /api/key-results/:id
 * @desc    Update a key result
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   PATCH /api/key-results/:id/progress
 * @desc    Update progress for a key result
 * @access  Private
 */
router.patch('/:id/progress', updateProgress);

/**
 * @route   DELETE /api/key-results/:id
 * @desc    Delete a key result
 * @access  Private
 */
router.delete('/:id', remove);

export default router;
