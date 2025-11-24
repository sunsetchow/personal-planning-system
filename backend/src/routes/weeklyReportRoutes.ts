import { Router } from 'express';
import * as weeklyReportController from '../controllers/weeklyReportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get weekly report
router.get('/weekly', weeklyReportController.getWeeklyReport);

// Get available weeks
router.get('/available-weeks', weeklyReportController.getAvailableWeeksReport);

export default router;
