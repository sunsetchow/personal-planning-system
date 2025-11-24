import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUserCategoryMappings,
  getCategoryMappingById,
  getCategoryMappingByName,
  createCategoryMapping,
  updateCategoryMapping,
  deleteCategoryMapping,
  mapCategoryToOkr,
  getMappingsByOkrCategory,
} from '../services/categoryMapperService';

/**
 * Category Mapping controller
 * Handles HTTP requests for category mapping endpoints
 */

/**
 * Get all category mappings for the current user
 * GET /api/category-mappings
 */
export const listMappings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const activeOnly = req.query.activeOnly === 'true';
    const mappings = await getUserCategoryMappings(req.user.userId, activeOnly);

    res.status(200).json({
      success: true,
      data: { mappings },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single category mapping by ID
 * GET /api/category-mappings/:id
 */
export const getMapping = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const mapping = await getCategoryMappingById(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { mapping },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category mapping by name
 * GET /api/category-mappings/name/:name
 */
export const getMappingByName = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const mapping = await getCategoryMappingByName(req.user.userId, req.params.name);

    res.status(200).json({
      success: true,
      data: { mapping },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Map a category to OKR
 * POST /api/category-mappings/map
 */
export const mapCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { categoryName } = req.body;

    if (!categoryName) {
      res.status(400).json({
        success: false,
        message: 'categoryName is required',
      });
      return;
    }

    const result = await mapCategoryToOkr(req.user.userId, categoryName);

    res.status(200).json({
      success: true,
      data: { result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mappings by OKR category
 * GET /api/category-mappings/okr/:category
 */
export const getMappingsByOkr = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const mappings = await getMappingsByOkrCategory(req.user.userId, req.params.category);

    res.status(200).json({
      success: true,
      data: { mappings },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category mapping
 * POST /api/category-mappings
 */
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const mapping = await createCategoryMapping(req.user.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Category mapping created successfully',
      data: { mapping },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category mapping
 * PUT /api/category-mappings/:id
 */
export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const mapping = await updateCategoryMapping(req.params.id, req.user.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Category mapping updated successfully',
      data: { mapping },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category mapping
 * DELETE /api/category-mappings/:id
 */
export const remove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await deleteCategoryMapping(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Category mapping deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
