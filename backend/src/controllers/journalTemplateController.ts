import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createTemplateSchema, updateTemplateSchema } from '../utils/journalValidation';
import {
  getUserTemplates,
  getTemplateById,
  getActiveTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../services/journalTemplateService';

/**
 * Journal Template controller
 * Handles HTTP requests for template endpoints
 */

/**
 * Get all templates for the current user
 * GET /api/journal-templates
 */
export const listTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const templates = await getUserTemplates(req.user.userId);

    res.status(200).json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active template
 * GET /api/journal-templates/active
 */
export const getActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const template = await getActiveTemplate(req.user.userId);

    res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single template by ID
 * GET /api/journal-templates/:id
 */
export const getTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const template = await getTemplateById(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new template
 * POST /api/journal-templates
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

    // Validate request body
    const validatedData = createTemplateSchema.parse(req.body);

    // Create template
    const template = await createTemplate(req.user.userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a template
 * PUT /api/journal-templates/:id
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

    // Validate request body
    const validatedData = updateTemplateSchema.parse(req.body);

    // Update template
    const template = await updateTemplate(req.params.id, req.user.userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a template
 * DELETE /api/journal-templates/:id
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

    await deleteTemplate(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
