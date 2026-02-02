import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cron from 'node-cron';

import contractsRouter from './routes/contracts.js';
import statsRouter from './routes/stats.js';
import mapDataRouter from './routes/mapData.js';
import syncRouter from './routes/sync.js';
import xPostingRouter from './routes/xPosting.js';
import { syncService } from './services/syncService.js';
import { xPostingService } from './services/xPostingService.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '4', 10);

// Security headers
app.use(helmet());

// CORS configuration - allow dev servers, production, and Vercel previews
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://euspends.org',
  'https://www.euspends.org',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Response compression
app.use(compression());

// Request logging
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const syncState = await syncService.getSyncState();
    const isRunning = await syncService.isSyncing();
    const xStats = await xPostingService.getQueueStats();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      sync: {
        isRunning,
        lastSync: syncState?.lastSyncAt?.toISOString() || null,
        lastSyncContracts: syncState?.lastSyncCount || 0,
        scheduledInterval: `${SYNC_INTERVAL_HOURS} hours`,
      },
      xPosting: {
        configured: xPostingService.isConfigured(),
        queue: xStats,
      },
    });
  } catch (error) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      sync: { error: 'Unable to fetch sync state' },
    });
  }
});

// Route modules
app.use('/api/contracts', contractsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/map-data', mapDataRouter);
app.use('/api/sync', syncRouter);
app.use('/api/x', xPostingRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint does not exist.`,
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// Schedule incremental sync every N hours (default: 4)
const syncSchedule = `0 */${SYNC_INTERVAL_HOURS} * * *`;
cron.schedule(syncSchedule, async () => {
  console.log(`[Scheduled Sync] Starting incremental sync at ${new Date().toISOString()}`);

  try {
    const result = await syncService.syncIncremental((count) => {
      console.log(`[Scheduled Sync] Progress: ${count} notices processed`);
    });

    if (result.success) {
      console.log(`[Scheduled Sync] Completed: ${result.newContracts} new contracts`);
    } else {
      console.error(`[Scheduled Sync] Failed: ${result.error}`);
    }
  } catch (error) {
    console.error('[Scheduled Sync] Error:', error);
  }
});

// Schedule X posting every hour (process up to 3 posts per hour to stay under rate limits)
// Free tier: ~1,500 posts/month = ~2 posts/hour
cron.schedule('0 * * * *', async () => {
  if (!xPostingService.isConfigured()) {
    return;
  }

  console.log(`[Scheduled X Post] Processing queue at ${new Date().toISOString()}`);

  try {
    const result = await xPostingService.processQueue(3);
    console.log(`[Scheduled X Post] Done: ${result.posted} posted, ${result.failed} failed`);
  } catch (error) {
    console.error('[Scheduled X Post] Error:', error);
  }
});

console.log(`Scheduled sync: Every ${SYNC_INTERVAL_HOURS} hours (cron: ${syncSchedule})`);
console.log(`Scheduled X posting: Hourly (max 3 posts/hour)`);
console.log(`X posting configured: ${xPostingService.isConfigured()}`);

// Start server
app.listen(PORT, () => {
  console.log(`EU Spending API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
