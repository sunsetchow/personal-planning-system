import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createObjectiveSchema,
  updateObjectiveSchema,
} from '../utils/okrValidation';
import {
  getUserObjectives,
  getObjectiveById,
  createObjective,
  updateObjective,
  deleteObjective,
  calculateObjectiveProgress,
} from '../services/objectiveService';

/**
 * Objective controller
 * Handles HTTP requests for objective endpoints
 */

/**
 * Get all objectives for the current user
 * GET /api/objectives
 */
export const listObjectives = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const objectives = await getUserObjectives(req.user.userId);

    // Calculate progress for each objective
    const objectivesWithProgress = await Promise.all(
      objectives.map(async (obj) => ({
        ...obj,
        progress: await calculateObjectiveProgress(obj.id),
      }))
    );

    res.status(200).json({
      success: true,
      data: { objectives: objectivesWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single objective by ID
 * GET /api/objectives/:id
 */
export const getObjective = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const objective = await getObjectiveById(req.params.id, req.user.userId);
    const progress = await calculateObjectiveProgress(objective.id);

    res.status(200).json({
      success: true,
      data: { objective: { ...objective, progress } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new objective
 * POST /api/objectives
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
    const validatedData = createObjectiveSchema.parse(req.body);

    // Create objective
    const objective = await createObjective(req.user.userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Objective created successfully',
      data: { objective },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an objective
 * PUT /api/objectives/:id
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
    const validatedData = updateObjectiveSchema.parse(req.body);

    // Update objective
    const objective = await updateObjective(
      req.params.id,
      req.user.userId,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: 'Objective updated successfully',
      data: { objective },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an objective
 * DELETE /api/objectives/:id
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

    await deleteObjective(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Objective deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
