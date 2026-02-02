/**
 * TED API Client
 * Handles communication with the TED (Tenders Electronic Daily) Search API v3
 *
 * API Documentation: https://docs.ted.europa.eu/api/latest/search.html
 * No authentication required for reading published notices
 */

export interface TedSearchRequest {
  query: string; // Expert query syntax
  fields: string[];
  scope?: 'ALL' | 'ACTIVE' | 'HISTORICAL';
  page?: number;
  limit?: number;
  paginationMode?: 'PAGE_NUMBER' | 'ITERATION';
  iterationNextToken?: string;
  checkQuerySyntax?: boolean;
}

// TED API v3 uses eForms field names
export interface TedNoticeResult {
  'publication-number': string;
  'publication-date': string; // YYYYMMDD
  'notice-title'?: Record<string, string>; // Multilingual: { "ENG": "title", "DEU": "titel" }
  'buyer-name'?: Record<string, string[]>;
  'buyer-country'?: string[];
  'winner-name'?: Record<string, string[]>;
  'winner-country'?: string[];
  'total-value'?: number;
  'total-value-cur'?: string;
  'procedure-type'?: string[];
  'classification-cpv'?: string[];
  'notice-type'?: string[];
  'place-of-performance-nuts'?: string[];
  'buyer-city'?: Record<string, string[]>;
  'description-lot'?: Record<string, string[]>; // Multilingual lot description
  [key: string]: unknown;
}

export interface TedSearchResponse {
  total: number;
  notices: TedNoticeResult[]; // v3 uses 'notices' not 'results'
  iterationNextToken?: string;
}

const TED_API_BASE = 'https://api.ted.europa.eu/v3';

export class TedApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = TED_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search notices using the TED Search API v3
   * Includes retry logic for rate limiting (429 errors)
   */
  async search(request: TedSearchRequest, retryCount = 0): Promise<TedSearchResponse> {
    const url = `${this.baseUrl}/notices/search`;
    const maxRetries = 3;

    const body = {
      query: request.query,
      fields: request.fields,
      scope: request.scope || 'ALL',
      page: request.page || 1,
      limit: Math.min(request.limit || 100, 100), // v3 max is 100
      paginationMode: request.paginationMode || 'PAGE_NUMBER',
      ...(request.iterationNextToken && { iterationNextToken: request.iterationNextToken }),
      ...(request.checkQuerySyntax !== undefined && { checkQuerySyntax: request.checkQuerySyntax }),
    };

    console.log(`TED API request (page ${body.page}):`, body.query.substring(0, 50) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle rate limiting with exponential backoff
    if (response.status === 429 && retryCount < maxRetries) {
      const waitTime = Math.pow(2, retryCount + 1) * 5000; // 10s, 20s, 40s
      console.log(`Rate limited (429), waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.search(request, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TED API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      total?: number;
      notices?: TedNoticeResult[];
      iterationNextToken?: string;
    };

    // Normalize response - v3 uses 'notices' array
    return {
      total: data.total || 0,
      notices: data.notices || [],
      iterationNextToken: data.iterationNextToken,
    };
  }

  /**
   * Iterate through all results using page-based pagination
   */
  async *iterateAll(
    query: string,
    fields: string[],
    options: { scope?: 'ALL' | 'ACTIVE' | 'HISTORICAL'; limit?: number; maxPages?: number } = {}
  ): AsyncGenerator<TedNoticeResult[], void, unknown> {
    let pageNum = 1;
    const limit = options.limit || 100;
    const maxPages = options.maxPages || 100; // Safety limit
    let hasMore = true;

    while (hasMore && pageNum <= maxPages) {
      const response = await this.search({
        query,
        fields,
        scope: options.scope || 'ALL',
        page: pageNum,
        limit,
        paginationMode: 'PAGE_NUMBER',
      });

      if (response.notices && response.notices.length > 0) {
        yield response.notices;

        // Check if there might be more pages
        // If we got fewer results than the limit, we've reached the end
        hasMore = response.notices.length === limit;
      } else {
        hasMore = false;
      }

      pageNum++;

      // Delay to avoid rate limiting (429 errors) - 1 second between requests
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Simple paginated search (no iteration)
   */
  async searchPaginated(
    query: string,
    fields: string[],
    page: number = 1,
    limit: number = 100
  ): Promise<TedSearchResponse> {
    return this.search({
      query,
      fields,
      scope: 'ALL',
      page,
      limit,
      paginationMode: 'PAGE_NUMBER',
    });
  }

  /**
   * Build a date range query for TED API v3 expert search syntax
   * Format: publication-date >= YYYYMMDD AND publication-date <= YYYYMMDD
   */
  static buildDateRangeQuery(from: Date, to: Date): string {
    const fromStr = formatTedDate(from);
    const toStr = formatTedDate(to);
    return `publication-date >= ${fromStr} AND publication-date <= ${toStr}`;
  }

  /**
   * Build a query for contract award notices (CAN) only
   * In TED v3, notice-type field uses strings like "can-standard" for Contract Award Notices
   */
  static buildContractAwardQuery(from: Date, to: Date): string {
    const dateQuery = this.buildDateRangeQuery(from, to);
    // Filter for Contract Award Notices - use exact match
    return `${dateQuery} AND notice-type = can-standard`;
  }
}

function formatTedDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export const tedApiClient = new TedApiClient();
