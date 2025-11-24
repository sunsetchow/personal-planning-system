import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateWeeklyReport, getAvailableWeeks } from '../services/weeklyReportService';

/**
 * Weekly Report Controller
 * Handles HTTP requests for weekly reports
 */

/**
 * Get weekly report
 * GET /api/reports/weekly
 * Query params: weekOffset (optional, default 0)
 */
export const getWeeklyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const weekOffset = parseInt(req.query.weekOffset as string) || 0;

    const report = await generateWeeklyReport(userId, weekOffset);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available weeks for reports
 * GET /api/reports/available-weeks
 */
export const getAvailableWeeksReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const weeks = await getAvailableWeeks(userId);

    res.status(200).json({
      success: true,
      data: weeks,
    });
  } catch (error) {
    next(error);
  }
};
