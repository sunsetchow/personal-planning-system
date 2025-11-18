import { Router } from 'express';
import {
  listObjectives,
  getObjective,
  create,
  update,
  remove,
} from '../controllers/objectiveController';
import {
  listKeyResults,
  create as createKeyResult,
} from '../controllers/keyResultController';
import { authenticate } from '../middleware/auth';

/**
 * Objective routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/objectives
 * @desc    Get all objectives for current user
 * @access  Private
 */
router.get('/', listObjectives);

/**
 * @route   POST /api/objectives
 * @desc    Create a new objective
 * @access  Private
 */
router.post('/', create);

/**
 * @route   GET /api/objectives/:id
 * @desc    Get a single objective by ID
 * @access  Private
 */
router.get('/:id', getObjective);

/**
 * @route   PUT /api/objectives/:id
 * @desc    Update an objective
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   DELETE /api/objectives/:id
 * @desc    Delete an objective
 * @access  Private
 */
router.delete('/:id', remove);

/**
 * @route   GET /api/objectives/:objectiveId/key-results
 * @desc    Get all key results for an objective
 * @access  Private
 */
router.get('/:objectiveId/key-results', listKeyResults);

/**
 * @route   POST /api/objectives/:objectiveId/key-results
 * @desc    Create a new key result for an objective
 * @access  Private
 */
router.post('/:objectiveId/key-results', createKeyResult);

export default router;
