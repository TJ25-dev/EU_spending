/**
 * X (Twitter) Posting Service
 * Posts noteworthy EU procurement contracts to X using OAuth 2.0
 */

import { TwitterApi } from 'twitter-api-v2';
import prisma from '../lib/prisma.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKEN_FILE = join(__dirname, '../../.x-tokens.json');

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// OAuth 2.0 client for authorization
function getOAuth2Client(): TwitterApi | null {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new TwitterApi({ clientId, clientSecret });
}

// Load stored tokens
function loadTokens(): StoredTokens | null {
  if (!existsSync(TOKEN_FILE)) {
    return null;
  }
  try {
    const data = readFileSync(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Save tokens
function saveTokens(tokens: StoredTokens): void {
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

// Get authenticated client for posting
async function getAuthenticatedClient(): Promise<TwitterApi | null> {
  const tokens = loadTokens();
  if (!tokens) {
    console.warn('[X Service] No tokens stored - run authorization first');
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  if (Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
    // Refresh the token
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      return null;
    }

    try {
      const { accessToken, refreshToken, expiresIn } = await oauth2Client.refreshOAuth2Token(tokens.refreshToken);

      const newTokens: StoredTokens = {
        accessToken,
        refreshToken: refreshToken || tokens.refreshToken,
        expiresAt: Date.now() + (expiresIn || 7200) * 1000,
      };
      saveTokens(newTokens);

      return new TwitterApi(accessToken);
    } catch (error) {
      console.error('[X Service] Failed to refresh token:', error);
      return null;
    }
  }

  return new TwitterApi(tokens.accessToken);
}

/**
 * Format a contract into a tweet
 */
function formatTweet(contract: {
  title: string;
  amount: number;
  country: string;
  buyerName: string;
  contractorName: string | null;
  cpvDescription: string | null;
  tedNoticeId: string;
}): string {
  const amount = formatAmount(contract.amount);
  const flag = getCountryFlag(contract.country);

  const maxTitleLen = 100;
  const title = contract.title.length > maxTitleLen
    ? contract.title.substring(0, maxTitleLen - 3) + '...'
    : contract.title;

  const lines: string[] = [];
  lines.push(`${flag} ${contract.country}: ${amount} contract`);
  lines.push('');
  lines.push(`📋 ${title}`);

  const buyer = contract.buyerName.length > 50
    ? contract.buyerName.substring(0, 47) + '...'
    : contract.buyerName;
  lines.push(`🏛️ ${buyer}`);

  if (contract.contractorName && contract.contractorName !== 'Not disclosed') {
    const contractor = contract.contractorName.length > 50
      ? contract.contractorName.substring(0, 47) + '...'
      : contract.contractorName;
    lines.push(`🏢 ${contractor}`);
  }

  if (contract.cpvDescription) {
    lines.push(`📁 ${contract.cpvDescription}`);
  }

  lines.push('');
  lines.push(`🔗 ted.europa.eu/notice/${contract.tedNoticeId}`);
  lines.push('');
  lines.push('#EUProcurement #PublicSpending');

  let tweet = lines.join('\n');

  if (tweet.length > 280) {
    tweet = [
      `${flag} ${contract.country}: ${amount} contract`,
      '',
      `📋 ${title}`,
      '',
      `🔗 ted.europa.eu/notice/${contract.tedNoticeId}`,
      '',
      '#EUProcurement',
    ].join('\n');
  }

  return tweet;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `€${(amount / 1_000_000_000).toFixed(1)}B`;
  } else if (amount >= 1_000_000) {
    return `€${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `€${(amount / 1_000).toFixed(0)}K`;
  }
  return `€${amount.toFixed(0)}`;
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
    'Austria': '🇦🇹', 'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'Ireland': '🇮🇪',
    'Czech Republic': '🇨🇿', 'Romania': '🇷🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
    'Hungary': '🇭🇺', 'Croatia': '🇭🇷', 'Bulgaria': '🇧🇬', 'Slovakia': '🇸🇰',
    'Lithuania': '🇱🇹', 'Slovenia': '🇸🇮', 'Latvia': '🇱🇻', 'Estonia': '🇪🇪',
    'Cyprus': '🇨🇾', 'Luxembourg': '🇱🇺', 'Malta': '🇲🇹', 'Norway': '🇳🇴',
    'Iceland': '🇮🇸', 'Liechtenstein': '🇱🇮', 'Switzerland': '🇨🇭', 'United Kingdom': '🇬🇧',
  };
  return flags[country] || '🇪🇺';
}

export class XPostingService {
  private callbackUrl = process.env.X_CALLBACK_URL || 'http://localhost:3001/api/x/callback';

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(): { url: string; codeVerifier: string; state: string } | null {
    const client = getOAuth2Client();
    if (!client) {
      return null;
    }

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(this.callbackUrl, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

    return { url, codeVerifier, state };
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string, codeVerifier: string): Promise<boolean> {
    const client = getOAuth2Client();
    if (!client) {
      return false;
    }

    try {
      const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: this.callbackUrl,
      });

      if (!refreshToken) {
        console.error('[X Service] No refresh token received - make sure offline.access scope is enabled');
        return false;
      }

      const tokens: StoredTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (expiresIn || 7200) * 1000,
      };
      saveTokens(tokens);

      console.log('[X Service] OAuth 2.0 tokens saved successfully');
      return true;
    } catch (error) {
      console.error('[X Service] OAuth callback failed:', error);
      return false;
    }
  }

  /**
   * Post a single tweet about a contract
   */
  async postContract(contractId: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    const client = await getAuthenticatedClient();
    if (!client) {
      return { success: false, error: 'X API not authenticated - run /api/x/auth first' };
    }

    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return { success: false, error: 'Contract not found' };
      }

      if (contract.postedToX) {
        return { success: false, error: 'Contract already posted' };
      }

      const tweetText = formatTweet({
        title: contract.title,
        amount: contract.amount,
        country: contract.country,
        buyerName: contract.buyerName,
        contractorName: contract.contractorName,
        cpvDescription: contract.cpvDescription,
        tedNoticeId: contract.tedNoticeId,
      });

      const tweet = await client.v2.tweet(tweetText);

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          postedToX: true,
          postedToXAt: new Date(),
          xPostId: tweet.data.id,
        },
      });

      console.log(`[X Service] Posted tweet for contract ${contractId}: ${tweet.data.id}`);
      return { success: true, tweetId: tweet.data.id };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[X Service] Failed to post contract ${contractId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process the posting queue
   */
  async processQueue(maxPosts: number = 5): Promise<{ posted: number; failed: number; skipped: number }> {
    const client = await getAuthenticatedClient();
    if (!client) {
      console.warn('[X Service] Skipping queue - not authenticated');
      return { posted: 0, failed: 0, skipped: 0 };
    }

    let posted = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const pendingPosts = await prisma.xPostQueue.findMany({
        where: {
          status: 'pending',
          attempts: { lt: 3 },
        },
        orderBy: { createdAt: 'asc' },
        take: maxPosts,
      });

      for (const queueItem of pendingPosts) {
        const contract = await prisma.contract.findUnique({
          where: { id: queueItem.contractId },
        });

        if (!contract || contract.postedToX) {
          await prisma.xPostQueue.update({
            where: { id: queueItem.id },
            data: { status: 'posted' },
          });
          skipped++;
          continue;
        }

        const result = await this.postContract(queueItem.contractId);

        if (result.success) {
          await prisma.xPostQueue.update({
            where: { id: queueItem.id },
            data: {
              status: 'posted',
              xPostId: result.tweetId,
              lastAttemptAt: new Date(),
            },
          });
          posted++;
        } else {
          await prisma.xPostQueue.update({
            where: { id: queueItem.id },
            data: {
              status: queueItem.attempts + 1 >= 3 ? 'failed' : 'pending',
              attempts: queueItem.attempts + 1,
              error: result.error,
              lastAttemptAt: new Date(),
            },
          });
          failed++;
        }

        // Rate limit: wait 2 seconds between posts
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error('[X Service] Queue processing error:', error);
    }

    console.log(`[X Service] Queue processed: ${posted} posted, ${failed} failed, ${skipped} skipped`);
    return { posted, failed, skipped };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [pending, posted, failed] = await Promise.all([
      prisma.xPostQueue.count({ where: { status: 'pending' } }),
      prisma.xPostQueue.count({ where: { status: 'posted' } }),
      prisma.xPostQueue.count({ where: { status: 'failed' } }),
    ]);

    const noteworthyNotPosted = await prisma.contract.count({
      where: {
        isNoteworthy: true,
        postedToX: false,
      },
    });

    return { pending, posted, failed, noteworthyNotPosted };
  }

  /**
   * Queue a contract for posting
   */
  async queueContract(contractId: string): Promise<boolean> {
    try {
      await prisma.xPostQueue.create({
        data: {
          contractId,
          status: 'pending',
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if X posting is configured and authenticated
   */
  isConfigured(): boolean {
    return getOAuth2Client() !== null && loadTokens() !== null;
  }

  /**
   * Check if OAuth 2.0 client credentials are set
   */
  hasCredentials(): boolean {
    return getOAuth2Client() !== null;
  }
}

export const xPostingService = new XPostingService();
