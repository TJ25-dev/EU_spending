/**
 * X Posting Routes
 * Endpoints for managing X/Twitter posting with OAuth 2.0
 */

import { Router, Request, Response } from 'express';
import { xPostingService } from '../services/xPostingService.js';

const router = Router();

// Store code verifier temporarily (in production, use Redis or session storage)
let pendingAuth: { codeVerifier: string; state: string } | null = null;

/**
 * GET /api/x/status
 * Get X posting service status and queue statistics
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const isConfigured = xPostingService.isConfigured();
    const hasCredentials = xPostingService.hasCredentials();
    const stats = await xPostingService.getQueueStats();

    res.json({
      data: {
        configured: isConfigured,
        hasCredentials,
        queue: stats,
      },
    });
  } catch (error) {
    console.error('Error getting X status:', error);
    res.status(500).json({ error: 'Failed to get X posting status' });
  }
});

/**
 * GET /api/x/auth
 * Start OAuth 2.0 authorization flow - redirects to X login
 */
router.get('/auth', (_req: Request, res: Response) => {
  try {
    const authData = xPostingService.generateAuthUrl();

    if (!authData) {
      res.status(503).json({
        error: 'X API credentials not configured',
        message: 'Set X_CLIENT_ID and X_CLIENT_SECRET environment variables'
      });
      return;
    }

    // Store code verifier for callback
    pendingAuth = {
      codeVerifier: authData.codeVerifier,
      state: authData.state,
    };

    // Redirect user to X authorization page
    res.redirect(authData.url);
  } catch (error) {
    console.error('Error starting X auth:', error);
    res.status(500).json({ error: 'Failed to start X authorization' });
  }
});

/**
 * GET /api/x/callback
 * OAuth 2.0 callback - exchanges code for tokens
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code) {
      res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>Authorization Failed</h1>
            <p>No authorization code received. User may have denied access.</p>
          </body>
        </html>
      `);
      return;
    }

    if (!pendingAuth) {
      res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>Authorization Failed</h1>
            <p>No pending authorization found. Please start the auth flow again at /api/x/auth</p>
          </body>
        </html>
      `);
      return;
    }

    // Verify state matches
    if (state !== pendingAuth.state) {
      res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>Authorization Failed</h1>
            <p>State mismatch - possible CSRF attack. Please try again.</p>
          </body>
        </html>
      `);
      return;
    }

    const success = await xPostingService.handleCallback(code, pendingAuth.codeVerifier);
    pendingAuth = null; // Clear pending auth

    if (success) {
      res.send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #1DA1F2;">✓ Authorization Successful!</h1>
            <p>X posting is now enabled for EU Spends.</p>
            <p>You can close this window.</p>
            <p style="margin-top: 40px; color: #666;">
              The app will now automatically post noteworthy EU procurement contracts.
            </p>
          </body>
        </html>
      `);
    } else {
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>Authorization Failed</h1>
            <p>Failed to exchange authorization code for tokens. Check server logs.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error in X callback:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1>Authorization Failed</h1>
          <p>An unexpected error occurred. Check server logs.</p>
        </body>
      </html>
    `);
  }
});

/**
 * POST /api/x/process-queue
 * Manually trigger queue processing
 * Body: { maxPosts?: number }
 */
router.post('/process-queue', async (req: Request, res: Response) => {
  try {
    if (!xPostingService.isConfigured()) {
      res.status(503).json({ error: 'X API credentials not configured' });
      return;
    }

    const { maxPosts } = req.body as { maxPosts?: number };
    const limit = Math.min(maxPosts || 5, 20); // Max 20 at a time

    res.json({ message: `Processing queue (max ${limit} posts)` });

    // Process in background
    const result = await xPostingService.processQueue(limit);
    console.log(`[X Route] Queue processed:`, result);

  } catch (error) {
    console.error('Error processing X queue:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process queue' });
    }
  }
});

/**
 * POST /api/x/post/:contractId
 * Manually post a specific contract to X
 */
router.post('/post/:contractId', async (req: Request<{ contractId: string }>, res: Response) => {
  try {
    if (!xPostingService.isConfigured()) {
      res.status(503).json({ error: 'X API credentials not configured' });
      return;
    }

    const result = await xPostingService.postContract(req.params.contractId);

    if (result.success) {
      res.json({
        message: 'Contract posted to X',
        tweetId: result.tweetId,
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error posting to X:', error);
    res.status(500).json({ error: 'Failed to post to X' });
  }
});

/**
 * POST /api/x/queue/:contractId
 * Add a contract to the posting queue
 */
router.post('/queue/:contractId', async (req: Request<{ contractId: string }>, res: Response) => {
  try {
    const added = await xPostingService.queueContract(req.params.contractId);

    if (added) {
      res.json({ message: 'Contract added to queue' });
    } else {
      res.status(400).json({ error: 'Contract already in queue' });
    }
  } catch (error) {
    console.error('Error queueing contract:', error);
    res.status(500).json({ error: 'Failed to queue contract' });
  }
});

export default router;
