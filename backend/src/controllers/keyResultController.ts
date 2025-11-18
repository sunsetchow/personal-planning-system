import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createKeyResultSchema,
  updateKeyResultSchema,
  updateProgressSchema,
} from '../utils/okrValidation';
import {
  getObjectiveKeyResults,
  getKeyResultById,
  createKeyResult,
  updateKeyResult,
  updateKeyResultProgress,
  deleteKeyResult,
  calculateProgress,
} from '../services/keyResultService';

/**
 * Key Result controller
 * Handles HTTP requests for key result endpoints
 */

/**
 * Get all key results for an objective
 * GET /api/objectives/:objectiveId/key-results
 */
export const listKeyResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const keyResults = await getObjectiveKeyResults(
      req.params.objectiveId,
      req.user.userId
    );

    // Add progress percentage to each key result
    const keyResultsWithProgress = keyResults.map((kr) => ({
      ...kr,
      progress: calculateProgress(Number(kr.currentValue), Number(kr.targetValue)),
    }));

    res.status(200).json({
      success: true,
      data: { keyResults: keyResultsWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single key result by ID
 * GET /api/key-results/:id
 */
export const getKeyResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const keyResult = await getKeyResultById(req.params.id, req.user.userId);
    const progress = calculateProgress(
      Number(keyResult.currentValue),
      Number(keyResult.targetValue)
    );

    res.status(200).json({
      success: true,
      data: { keyResult: { ...keyResult, progress } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new key result for an objective
 * POST /api/objectives/:objectiveId/key-results
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
    const validatedData = createKeyResultSchema.parse(req.body);

    // Create key result
    const keyResult = await createKeyResult(
      req.params.objectiveId,
      req.user.userId,
      validatedData
    );

    res.status(201).json({
      success: true,
      message: 'Key result created successfully',
      data: { keyResult },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a key result
 * PUT /api/key-results/:id
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
    const validatedData = updateKeyResultSchema.parse(req.body);

    // Update key result
    const keyResult = await updateKeyResult(req.params.id, req.user.userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Key result updated successfully',
      data: { keyResult },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update progress for a key result
 * PATCH /api/key-results/:id/progress
 */
export const updateProgress = async (
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
    const validatedData = updateProgressSchema.parse(req.body);

    // Update progress
    const keyResult = await updateKeyResultProgress(
      req.params.id,
      req.user.userId,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { keyResult },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a key result
 * DELETE /api/key-results/:id
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

    await deleteKeyResult(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Key result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
