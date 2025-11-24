import { Router } from 'express';
import {
  listMappings,
  getMapping,
  getMappingByName,
  mapCategory,
  getMappingsByOkr,
  create,
  update,
  remove,
} from '../controllers/categoryMappingController';
import { authenticate } from '../middleware/auth';

/**
 * Category Mapping routes
 * All routes require authentication
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/category-mappings
 * @desc    Get all category mappings for current user
 * @access  Private
 * @query   activeOnly (boolean)
 */
router.get('/', listMappings);

/**
 * @route   POST /api/category-mappings
 * @desc    Create a new category mapping
 * @access  Private
 */
router.post('/', create);

/**
 * @route   POST /api/category-mappings/map
 * @desc    Map a category name to OKR category
 * @access  Private
 * @body    categoryName (string, required)
 */
router.post('/map', mapCategory);

/**
 * @route   GET /api/category-mappings/name/:name
 * @desc    Get category mapping by name
 * @access  Private
 */
router.get('/name/:name', getMappingByName);

/**
 * @route   GET /api/category-mappings/okr/:category
 * @desc    Get all mappings for a specific OKR category
 * @access  Private
 */
router.get('/okr/:category', getMappingsByOkr);

/**
 * @route   GET /api/category-mappings/:id
 * @desc    Get a single category mapping by ID
 * @access  Private
 */
router.get('/:id', getMapping);

/**
 * @route   PUT /api/category-mappings/:id
 * @desc    Update a category mapping
 * @access  Private
 */
router.put('/:id', update);

/**
 * @route   DELETE /api/category-mappings/:id
 * @desc    Delete a category mapping
 * @access  Private
 */
router.delete('/:id', remove);

export default router;
