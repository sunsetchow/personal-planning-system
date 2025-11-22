import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import objectiveRoutes from './routes/objectiveRoutes';
import keyResultRoutes from './routes/keyResultRoutes';
import journalTemplateRoutes from './routes/journalTemplateRoutes';
import journalEntryRoutes from './routes/journalEntryRoutes';
import aiRoutes from './routes/aiRoutes';

/**
 * Creates and configures the Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware (for debugging)
  app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });

  // Rate limiting
  app.use(rateLimitMiddleware);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/objectives', objectiveRoutes);
  app.use('/api/key-results', keyResultRoutes);
  app.use('/api/journal-templates', journalTemplateRoutes);
  app.use('/api/journal-entries', journalEntryRoutes);
  app.use('/api/ai', aiRoutes);
  // app.use('/api/dashboard', dashboardRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};
