import { Router } from 'express';
import {
  listTemplates,
  getActive,
  getTemplate,
  create,
  update,
  remove,
} from '../controllers/journalTemplateController';
import { authenticate } from '../middleware/auth';

/**
 * Journal Template routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/journal-templates
 * @desc    Get all templates for current user
 * @access  Private
 */
router.get('/', listTemplates);

/**
 * @route   GET /api/journal-templates/active
 * @desc    Get active template for current user
 * @access  Private
 */
router.get('/active', getActive);

/**
 * @route   POST /api/journal-templates
 * @desc    Create a new template
 * @access  Private
 */
router.post('/', create);

/**
 * @route   GET /api/journal-templates/:id
 * @desc    Get a single template by ID
 * @access  Private
 */
router.get('/:id', getTemplate);

/**
 * @route   PUT /api/journal-templates/:id
 * @desc    Update a template
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   DELETE /api/journal-templates/:id
 * @desc    Delete a template
 * @access  Private
 */
router.delete('/:id', remove);

export default router;
