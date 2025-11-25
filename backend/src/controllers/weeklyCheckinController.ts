import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { WeeklyCheckinOrchestrator } from '../services/weeklyCheckin/checkinOrchestrator';
import { OKRUpdateSuggester } from '../services/weeklyCheckin/okrUpdateSuggester';
import { ReportStorage } from '../services/reports/reportStorage';

/**
 * Weekly Check-in controller
 * Handles HTTP requests for weekly check-in endpoints
 */

const orchestrator = new WeeklyCheckinOrchestrator();
const okrUpdateSuggester = new OKRUpdateSuggester();
const reportStorage = new ReportStorage();

/**
 * Execute weekly check-in
 * POST /api/weekly-checkin
 */
export const executeCheckin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { weekStart } = req.body;

    // Default to current week if not specified
    const startDate = weekStart
      ? startOfWeek(new Date(weekStart), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

    const result = await orchestrator.executeCheckin({
      userId: req.user.userId,
      weekStart: startDate,
      weekEnd: endDate,
    });

    res.status(200).json({
      success: true,
      data: { checkin: result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly check-in status
 * GET /api/weekly-checkin/status
 */
export const getCheckinStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const weekStart = req.query.weekStart
      ? startOfWeek(new Date(req.query.weekStart as string), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // Check if user has completed check-in for this week
    // For now, we'll check if they have journal entries
    const entries = await import('../config/database').then(db =>
      db.default.journalEntry.count({
        where: {
          userId: req.user!.userId,
          entryDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      })
    );

    const status = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      journalEntriesCount: entries,
      completionRate: Math.round((entries / 7) * 100),
      isComplete: entries >= 5, // At least 5 entries for complete week
    };

    res.status(200).json({
      success: true,
      data: { status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download weekly report as markdown
 * GET /api/weekly-checkin/report/markdown
 */
export const downloadMarkdownReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { weekStart } = req.query;

    // Default to current week if not specified
    const startDate = weekStart
      ? startOfWeek(new Date(weekStart as string), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

    // Execute check-in to get report
    const result = await orchestrator.executeCheckin({
      userId: req.user.userId,
      weekStart: startDate,
      weekEnd: endDate,
    });

    if (!result.markdownReport) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
      });
      return;
    }

    // Set headers for file download
    const filename = `weekly-report-${format(startDate, 'yyyy-MM-dd')}.md`;
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.markdownReport);
  } catch (error) {
    next(error);
  }
};

/**
 * Apply confirmed OKR updates
 * POST /api/weekly-checkin/apply-updates
 */
export const applyOKRUpdates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { confirmedSuggestions } = req.body;

    if (!Array.isArray(confirmedSuggestions)) {
      res.status(400).json({
        success: false,
        message: 'confirmedSuggestions must be an array',
      });
      return;
    }

    // Mark all as confirmed and apply
    const confirmed = confirmedSuggestions.map(s => ({
      ...s,
      userConfirmed: true,
    }));

    await okrUpdateSuggester.applyConfirmedUpdates(confirmed);

    res.status(200).json({
      success: true,
      message: `${confirmed.length} OKR updates applied successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download weekly journal
 * GET /api/weekly-checkin/report/journal
 */
export const downloadWeeklyJournal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { weekStart } = req.query;

    // Default to current week if not specified
    const startDate = weekStart
      ? startOfWeek(new Date(weekStart as string), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

    // Execute check-in to get report
    const result = await orchestrator.executeCheckin({
      userId: req.user.userId,
      weekStart: startDate,
      weekEnd: endDate,
    });

    if (!result.weeklyJournal) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate journal',
      });
      return;
    }

    // Set headers for file download
    const filename = `weekly-journal-${format(startDate, 'yyyy-MM-dd')}.md`;
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.weeklyJournal);
  } catch (error) {
    next(error);
  }
};

/**
 * Download newsletter
 * GET /api/weekly-checkin/report/newsletter
 */
export const downloadNewsletter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { weekStart } = req.query;

    // Default to current week if not specified
    const startDate = weekStart
      ? startOfWeek(new Date(weekStart as string), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

    // Execute check-in to get report
    const result = await orchestrator.executeCheckin({
      userId: req.user.userId,
      weekStart: startDate,
      weekEnd: endDate,
    });

    if (!result.newsletter) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate newsletter',
      });
      return;
    }

    // Set headers for file download
    const filename = `weekly-newsletter-${format(startDate, 'yyyy-MM-dd')}.html`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.newsletter);
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly check-in history
 * GET /api/weekly-checkin/history
 */
export const getCheckinHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const history = await reportStorage.getCheckinHistory(req.user.userId, limit);

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly check-in by ID
 * GET /api/weekly-checkin/:id
 */
export const getCheckinById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const checkinId = req.params.id;

    const checkin = await reportStorage.getCheckinById(checkinId);

    if (!checkin) {
      res.status(404).json({
        success: false,
        message: 'Check-in not found',
      });
      return;
    }

    // Verify user owns this checkin
    if (checkin.userId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { checkin },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly check-in statistics
 * GET /api/weekly-checkin/stats
 */
export const getCheckinStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const stats = await reportStorage.getCheckinStats(req.user.userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
