import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getDashboardStats,
  getMoodEnergyTrends,
  getOKRProgressTrends,
} from '../services/dashboardService';

/**
 * Dashboard Controller
 * Handles analytics and statistics endpoints
 */

/**
 * Get comprehensive dashboard statistics
 * GET /api/dashboard/stats
 */
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const stats = await getDashboardStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mood and energy trends
 * GET /api/dashboard/trends/mood-energy
 * Query params: days (default: 30)
 */
export const getMoodEnergyTrendsData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    const trends = await getMoodEnergyTrends(userId, days);
    res.json({ trends });
  } catch (error) {
    next(error);
  }
};

/**
 * Get OKR progress trends
 * GET /api/dashboard/trends/okr-progress
 */
export const getOKRProgressTrendsData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const trends = await getOKRProgressTrends(userId);
    res.json({ trends });
  } catch (error) {
    next(error);
  }
};
