/**
 * Sync Routes
 * Endpoints for managing TED data synchronization
 */

import { Router, Request, Response } from 'express';
import { syncService } from '../services/syncService.js';

const router = Router();

/**
 * GET /api/sync/status
 * Get current sync status and last sync information
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const state = await syncService.getSyncState();
    const isRunning = await syncService.isSyncing();

    res.json({
      data: {
        isRunning,
        lastSync: state
          ? {
              date: state.lastSyncAt?.toISOString().split('T')[0],
              timestamp: state.lastSyncAt?.toISOString(),
              contractCount: state.lastSyncCount,
              durationSeconds: state.lastSyncDuration,
              error: state.error,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /api/sync/full
 * Trigger a full sync for a date range
 * Body: { fromDate?: string, toDate?: string, days?: number }
 */
router.post('/full', async (req: Request, res: Response) => {
  try {
    if (await syncService.isSyncing()) {
      res.status(409).json({ error: 'Sync already in progress' });
      return;
    }

    const { fromDate, toDate, days } = req.body as {
      fromDate?: string;
      toDate?: string;
      days?: number;
    };

    // Calculate date range
    let from: Date;
    let to: Date;

    if (days) {
      to = new Date();
      from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    } else {
      to = toDate ? new Date(toDate) : new Date();
      from = fromDate ? new Date(fromDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    // Start sync in background
    res.json({
      message: 'Sync started',
      dateRange: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
    });

    // Run sync asynchronously
    const result = await syncService.syncDateRange(from, to, (count) => {
      console.log(`Sync progress: ${count} notices processed`);
    });

    if (result.success) {
      console.log(`Sync completed: ${result.newContracts} new contracts`);
    } else {
      console.error(`Sync failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error starting sync:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start sync' });
    }
  }
});

/**
 * POST /api/sync/incremental
 * Sync only new notices since last sync
 */
router.post('/incremental', async (req: Request, res: Response) => {
  try {
    if (await syncService.isSyncing()) {
      res.status(409).json({ error: 'Sync already in progress' });
      return;
    }

    res.json({ message: 'Incremental sync started' });

    const result = await syncService.syncIncremental((count) => {
      console.log(`Incremental sync progress: ${count} notices processed`);
    });

    if (result.success) {
      console.log(`Incremental sync completed: ${result.newContracts} new contracts`);
    } else {
      console.error(`Incremental sync failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error starting incremental sync:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start incremental sync' });
    }
  }
});

export default router;
