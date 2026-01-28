#!/usr/bin/env npx tsx
/**
 * TED API Sample Data Fetcher
 *
 * Fetches sample procurement records from the TED (Tenders Electronic Daily) API.
 * The TED API provides access to European public procurement data.
 *
 * API Documentation: https://docs.ted.europa.eu/api/latest/index.html
 * TED Search API base: https://api.ted.europa.eu/v3
 *
 * Usage:
 *   npx tsx scripts/fetch-ted-sample.ts
 *
 * Output:
 *   scripts/output/ted-sample-data.json - Raw API response
 *   scripts/output/ted-parsed-contracts.json - Parsed contract records
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, 'output');

// TED API endpoints
const TED_SEARCH_API = 'https://api.ted.europa.eu/v3/notices/search';
const TED_NOTICE_API = 'https://api.ted.europa.eu/v3/notices';

interface TedSearchParams {
  query: string;
  page?: number;
  limit?: number;
  scope?: string;
  fields?: string[];
}

interface ParsedContract {
  tedNoticeId: string;
  title: string;
  description: string;
  buyerName: string;
  buyerCountry: string;
  contractorName: string;
  amount: number | null;
  currency: string;
  publishDate: string;
  deadline: string | null;
  cpvCode: string;
  cpvDescription: string;
  nutsCode: string;
  procedureType: string;
  noticeType: string;
  documentUrl: string;
}

async function searchTedNotices(params: TedSearchParams): Promise<unknown> {
  const { query, page = 1, limit = 10 } = params;

  const url = new URL(TED_SEARCH_API);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  console.log(`Fetching from TED API: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TED API error (${response.status}): ${errorText}`);

      // If the v3 API fails, try the expert search endpoint
      if (response.status === 404 || response.status === 400) {
        return await tryExpertSearch(query, page, limit);
      }

      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Network error fetching from TED API:', error);
    return await tryExpertSearch(query, page, limit);
  }
}

async function tryExpertSearch(query: string, page: number, limit: number): Promise<unknown> {
  // Try alternative TED API endpoint format
  const expertUrl = 'https://ted.europa.eu/api/v3.0/notices/search';
  const params = new URLSearchParams({
    q: query,
    pageNum: String(page),
    pageSize: String(limit),
  });

  console.log(`Trying alternative endpoint: ${expertUrl}?${params}`);

  try {
    const response = await fetch(`${expertUrl}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`Alternative endpoint also failed (${response.status})`);

      // Try the public search API
      return await tryPublicSearch(query, limit);
    }

    return await response.json();
  } catch (error) {
    console.error('Alternative endpoint network error:', error);
    return await tryPublicSearch(query, limit);
  }
}

async function tryPublicSearch(query: string, limit: number): Promise<unknown> {
  // Last resort: try the public TED search
  const publicUrl = 'https://ted.europa.eu/api/latest/notices/search';
  console.log(`Trying public search endpoint: ${publicUrl}`);

  try {
    const body = {
      query: query,
      page: 1,
      limit: limit,
      sortField: 'publication-date',
      sortOrder: 'desc',
    };

    const response = await fetch(publicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Public search failed (${response.status}): ${text.slice(0, 500)}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Public search network error:', error);
    return null;
  }
}

function parseContract(notice: Record<string, unknown>): ParsedContract {
  // TED API notice structure varies by version; extract what we can
  const fields = notice as Record<string, unknown>;

  return {
    tedNoticeId: String(fields['notice-id'] || fields.id || fields.noticeId || ''),
    title: String(fields.title || fields['title-text'] || ''),
    description: String(fields.description || fields['short-description'] || ''),
    buyerName: String(fields['buyer-name'] || fields.buyerName || fields['contracting-authority'] || ''),
    buyerCountry: String(fields['buyer-country'] || fields.country || ''),
    contractorName: String(fields['contractor-name'] || fields.contractorName || ''),
    amount: typeof fields.amount === 'number' ? fields.amount :
            typeof fields['estimated-value'] === 'number' ? fields['estimated-value'] :
            null,
    currency: String(fields.currency || 'EUR'),
    publishDate: String(fields['publication-date'] || fields.publishDate || ''),
    deadline: fields.deadline ? String(fields.deadline) : null,
    cpvCode: String(fields['cpv-code'] || fields.cpvCode || ''),
    cpvDescription: String(fields['cpv-description'] || fields.cpvDescription || ''),
    nutsCode: String(fields['nuts-code'] || fields.nutsCode || ''),
    procedureType: String(fields['procedure-type'] || fields.procedureType || ''),
    noticeType: String(fields['notice-type'] || fields.noticeType || ''),
    documentUrl: String(fields['document-url'] || fields.url || ''),
  };
}

async function main(): Promise<void> {
  console.log('=== TED API Sample Data Fetcher ===\n');
  console.log('This script attempts to fetch procurement data from the TED API.');
  console.log('API Documentation: https://docs.ted.europa.eu/api/latest/index.html\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Search queries targeting different countries
  const queries = [
    'TD=[Contract notice] AND CY=[DE]',  // Germany
    'TD=[Contract notice] AND CY=[FR]',  // France
    'TD=[Contract notice] AND CY=[IT]',  // Italy
  ];

  const allResults: unknown[] = [];
  const allParsed: ParsedContract[] = [];

  for (const query of queries) {
    console.log(`\n--- Searching: ${query} ---`);
    const result = await searchTedNotices({ query, limit: 10 });

    if (result) {
      allResults.push(result);

      // Try to parse results
      const data = result as Record<string, unknown>;
      const notices = (data.results || data.notices || data.data || []) as Record<string, unknown>[];

      if (Array.isArray(notices)) {
        console.log(`Found ${notices.length} notices`);
        for (const notice of notices) {
          allParsed.push(parseContract(notice));
        }
      } else {
        console.log('Response structure:', Object.keys(data).join(', '));
      }
    } else {
      console.log('No results (API may require authentication or different query format)');
    }
  }

  // Save raw results
  const rawOutputPath = join(OUTPUT_DIR, 'ted-sample-data.json');
  writeFileSync(rawOutputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nRaw data saved to: ${rawOutputPath}`);

  // Save parsed results
  const parsedOutputPath = join(OUTPUT_DIR, 'ted-parsed-contracts.json');
  writeFileSync(parsedOutputPath, JSON.stringify(allParsed, null, 2));
  console.log(`Parsed contracts saved to: ${parsedOutputPath}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total API calls: ${queries.length}`);
  console.log(`Total raw responses: ${allResults.length}`);
  console.log(`Total parsed contracts: ${allParsed.length}`);

  if (allParsed.length === 0) {
    console.log('\n--- TED API Access Notes ---');
    console.log('The TED API may require:');
    console.log('1. Registration at https://ted.europa.eu for API access');
    console.log('2. An API key or OAuth2 authentication');
    console.log('3. Using the eForms SDK for newer notice formats');
    console.log('4. Accessing bulk data downloads instead of the REST API');
    console.log('\nFor development, the application uses realistic mock data that');
    console.log('mirrors the actual TED data structure. The mock data is generated');
    console.log('in backend/src/data/mockContracts.ts');
    console.log('\nAlternative data sources:');
    console.log('- TED CSV bulk downloads: https://data.europa.eu/data/datasets/ted-csv');
    console.log('- SPARQL endpoint: https://data.europa.eu/sparql');
    console.log('- OpenTED project: https://opented.org');
  }
}

main().catch(console.error);
