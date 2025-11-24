import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getWeeklyTimeReport,
  getCategoryTimeAllocation,
  getFocusQualityDistribution,
  compareWeeks,
} from '../services/timeAnalyticsService';

/**
 * Time Analytics controller
 * Handles HTTP requests for time analytics endpoints
 */

/**
 * Get weekly time report
 * GET /api/time-analytics/weekly
 */
export const getWeeklyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const weekStartDate = req.query.weekStart
      ? new Date(req.query.weekStart as string)
      : undefined;

    const report = await getWeeklyTimeReport(req.user.userId, weekStartDate);

    res.status(200).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category time allocation
 * GET /api/time-analytics/category-allocation
 */
export const getCategoryAllocation = async (
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

    const allocation = await getCategoryTimeAllocation(
      req.user.userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: { allocation },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get focus quality distribution
 * GET /api/time-analytics/focus-quality
 */
export const getFocusDistribution = async (
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

    const distribution = await getFocusQualityDistribution(
      req.user.userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: { distribution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare weeks
 * GET /api/time-analytics/compare-weeks
 */
export const getWeekComparison = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const currentWeekStart = req.query.weekStart
      ? new Date(req.query.weekStart as string)
      : new Date();

    const comparison = await compareWeeks(req.user.userId, currentWeekStart);

    res.status(200).json({
      success: true,
      data: { comparison },
    });
  } catch (error) {
    next(error);
  }
};
