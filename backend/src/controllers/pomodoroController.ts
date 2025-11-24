import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FocusQuality } from '@prisma/client';
import {
  getUserSessions,
  getSessionsByDateRange,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionStats,
  SessionFilters,
} from '../services/pomodoroService';

/**
 * Pomodoro Session controller
 * Handles HTTP requests for time session endpoints
 */

/**
 * Get all sessions for the current user
 * GET /api/time-sessions
 */
export const listSessions = async (
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
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const okrCategory = req.query.okrCategory as string;
    const objectiveId = req.query.objectiveId as string;
    const focusQuality = req.query.focusQuality as FocusQuality;

    const filters: SessionFilters = {
      startDate,
      endDate,
      okrCategory,
      objectiveId,
      focusQuality,
    };

    const sessions = await getUserSessions(req.user.userId, filters, limit);

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions for a specific date range
 * GET /api/time-sessions/range
 */
export const getByDateRange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
      return;
    }

    const sessions = await getSessionsByDateRange(
      req.user.userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single session by ID
 * GET /api/time-sessions/:id
 */
export const getSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const session = await getSessionById(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new time session
 * POST /api/time-sessions
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

    const session = await createSession(req.user.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Time session created successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a time session
 * PUT /api/time-sessions/:id
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

    const session = await updateSession(req.params.id, req.user.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Time session updated successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a time session
 * DELETE /api/time-sessions/:id
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

    await deleteSession(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Time session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session statistics
 * GET /api/time-sessions/stats
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

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await getSessionStats(req.user.userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
