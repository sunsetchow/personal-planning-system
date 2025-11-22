import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createEntrySchema, updateEntrySchema } from '../utils/journalValidation';
import {
  getUserEntries,
  getEntriesByDateRange,
  getEntryById,
  getEntryByDate,
  createEntry,
  updateEntry,
  deleteEntry,
  getEntryStats,
} from '../services/journalEntryService';

/**
 * Journal Entry controller
 * Handles HTTP requests for entry endpoints
 */

/**
 * Get all entries for the current user
 * GET /api/journal-entries
 */
export const listEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let entries;
    if (startDate && endDate) {
      entries = await getEntriesByDateRange(
        req.user.userId,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      entries = await getUserEntries(req.user.userId, limit);
    }

    res.status(200).json({
      success: true,
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get entry for a specific date
 * GET /api/journal-entries/date/:date
 */
export const getByDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await getEntryByDate(req.user.userId, new Date(req.params.date));

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single entry by ID
 * GET /api/journal-entries/:id
 */
export const getEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await getEntryById(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get entry statistics
 * GET /api/journal-entries/stats
 */
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const stats = await getEntryStats(req.user.userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new entry
 * POST /api/journal-entries
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
    const validatedData = createEntrySchema.parse(req.body);

    // Create entry
    const entry = await createEntry(req.user.userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an entry
 * PUT /api/journal-entries/:id
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
    const validatedData = updateEntrySchema.parse(req.body);

    // Update entry
    const entry = await updateEntry(req.params.id, req.user.userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Journal entry updated successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an entry
 * DELETE /api/journal-entries/:id
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

    await deleteEntry(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
