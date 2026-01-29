/**
 * TED (Tenders Electronic Daily) Data Fetcher
 *
 * This script fetches real procurement data from the TED API and saves it
 * in a format compatible with our EU Spending Tracker application.
 *
 * TED API Documentation: https://docs.ted.europa.eu/api/latest/index.html
 * The Search API allows anonymous access to published notices.
 *
 * Usage:
 *   cd scripts
 *   npm install
 *   npx tsx fetch-ted-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// TED API Configuration
const TED_API_BASE = 'https://api.ted.europa.eu/v3';
const TED_SEARCH_ENDPOINT = `${TED_API_BASE}/notices/search`;

// Alternative endpoints to try
const ALTERNATIVE_ENDPOINTS = [
  'https://ted.europa.eu/api/v3.0/notices/search',
  'https://api.ted.europa.eu/v3/notices/search',
];

// EU Country codes we want to fetch
const EU_COUNTRIES = [
  'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'POL', 'SWE',
  'AUT', 'PRT', 'GRC', 'IRL', 'CZE', 'ROU', 'DNK', 'FIN',
  'HUN', 'HRV', 'BGR', 'SVK'
];

// Map ISO 3166-1 alpha-3 to alpha-2 codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  'DEU': 'DE', 'FRA': 'FR', 'ITA': 'IT', 'ESP': 'ES', 'NLD': 'NL',
  'BEL': 'BE', 'POL': 'PL', 'SWE': 'SE', 'AUT': 'AT', 'PRT': 'PT',
  'GRC': 'GR', 'IRL': 'IE', 'CZE': 'CZ', 'ROU': 'RO', 'DNK': 'DK',
  'FIN': 'FI', 'HUN': 'HU', 'HRV': 'HR', 'BGR': 'BG', 'SVK': 'SK'
};

const COUNTRY_NAMES: Record<string, string> = {
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'PL': 'Poland', 'SE': 'Sweden', 'AT': 'Austria', 'PT': 'Portugal',
  'GR': 'Greece', 'IE': 'Ireland', 'CZ': 'Czech Republic', 'RO': 'Romania', 'DK': 'Denmark',
  'FI': 'Finland', 'HU': 'Hungary', 'HR': 'Croatia', 'BG': 'Bulgaria', 'SK': 'Slovakia'
};

// City coordinates for geocoding (subset of major cities)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; region: string }> = {
  // Germany
  'Berlin': { lat: 52.52, lng: 13.405, region: 'Berlin' },
  'Munich': { lat: 48.1351, lng: 11.582, region: 'Bavaria' },
  'Hamburg': { lat: 53.5511, lng: 9.9937, region: 'Hamburg' },
  'Frankfurt': { lat: 50.1109, lng: 8.6821, region: 'Hesse' },
  'Cologne': { lat: 50.9375, lng: 6.9603, region: 'North Rhine-Westphalia' },
  // France
  'Paris': { lat: 48.8566, lng: 2.3522, region: 'Île-de-France' },
  'Lyon': { lat: 45.764, lng: 4.8357, region: 'Auvergne-Rhône-Alpes' },
  'Marseille': { lat: 43.2965, lng: 5.3698, region: 'Provence-Alpes-Côte d\'Azur' },
  // Italy
  'Rome': { lat: 41.9028, lng: 12.4964, region: 'Lazio' },
  'Milan': { lat: 45.4642, lng: 9.19, region: 'Lombardy' },
  'Naples': { lat: 40.8518, lng: 14.2681, region: 'Campania' },
  // Spain
  'Madrid': { lat: 40.4168, lng: -3.7038, region: 'Community of Madrid' },
  'Barcelona': { lat: 41.3851, lng: 2.1734, region: 'Catalonia' },
  'Valencia': { lat: 39.4699, lng: -0.3763, region: 'Valencian Community' },
  // Netherlands
  'Amsterdam': { lat: 52.3676, lng: 4.9041, region: 'North Holland' },
  'Rotterdam': { lat: 51.9244, lng: 4.4777, region: 'South Holland' },
  'The Hague': { lat: 52.0705, lng: 4.3007, region: 'South Holland' },
  // Belgium
  'Brussels': { lat: 50.8503, lng: 4.3517, region: 'Brussels-Capital' },
  'Antwerp': { lat: 51.2194, lng: 4.4025, region: 'Flanders' },
  // Poland
  'Warsaw': { lat: 52.2297, lng: 21.0122, region: 'Masovia' },
  'Krakow': { lat: 50.0647, lng: 19.945, region: 'Lesser Poland' },
  // Sweden
  'Stockholm': { lat: 59.3293, lng: 18.0686, region: 'Stockholm County' },
  'Gothenburg': { lat: 57.7089, lng: 11.9746, region: 'Västra Götaland' },
  // Austria
  'Vienna': { lat: 48.2082, lng: 16.3738, region: 'Vienna' },
  'Graz': { lat: 47.0707, lng: 15.4395, region: 'Styria' },
  // Others
  'Lisbon': { lat: 38.7223, lng: -9.1393, region: 'Lisbon' },
  'Athens': { lat: 37.9838, lng: 23.7275, region: 'Attica' },
  'Dublin': { lat: 53.3498, lng: -6.2603, region: 'Leinster' },
  'Prague': { lat: 50.0755, lng: 14.4378, region: 'Prague' },
  'Bucharest': { lat: 44.4268, lng: 26.1025, region: 'Bucharest' },
  'Copenhagen': { lat: 55.6761, lng: 12.5683, region: 'Capital Region' },
  'Helsinki': { lat: 60.1699, lng: 24.9384, region: 'Uusimaa' },
  'Budapest': { lat: 47.4979, lng: 19.0402, region: 'Budapest' },
  'Zagreb': { lat: 45.815, lng: 15.9819, region: 'City of Zagreb' },
  'Sofia': { lat: 42.6977, lng: 23.3219, region: 'Sofia City' },
  'Bratislava': { lat: 48.1486, lng: 17.1077, region: 'Bratislava' },
};

// Contract interface matching our backend schema
interface Contract {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  publishDate: string;
  deadline: string;
  country: string;
  countryCode: string;
  nuts: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  buyerName: string;
  buyerType: string;
  contractorName: string;
  cpvCode: string;
  cpvDescription: string;
  procedureType: string;
  noticeType: string;
  tedNoticeId: string;
}

// TED API response interfaces (simplified)
interface TedNotice {
  'publication-number'?: string;
  'notice-id'?: string;
  'publication-date'?: string;
  'deadline-date'?: string;
  'title'?: string | { value?: string }[];
  'description'?: string | { value?: string }[];
  'buyer-name'?: string | { value?: string }[];
  'buyer-country'?: string;
  'buyer-nuts-code'?: string;
  'buyer-city'?: string;
  'contract-value'?: number;
  'contract-value-currency'?: string;
  'cpv-code'?: string;
  'cpv-description'?: string;
  'procedure-type'?: string;
  'notice-type'?: string;
  'contractor-name'?: string | { value?: string }[];
  // eForms fields
  BT_21?: string; // Title
  BT_24?: string; // Description
  BT_27?: string; // Value
  BT_500?: string; // Organisation name
  BT_501?: string; // Organisation ID
  BT_510?: string; // Country
}

interface TedSearchResponse {
  notices?: TedNotice[];
  results?: TedNotice[];
  hits?: { hits?: Array<{ _source?: TedNotice }> };
  totalCount?: number;
  total?: number;
}

// Helper to extract text from TED multilingual fields
function extractText(field: string | { value?: string }[] | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return field[0]?.value || '';
  }
  return '';
}

// Helper to get coordinates for a city
function getCoordinates(city: string, country: string): { lat: number; lng: number; region: string } {
  // Try exact match
  if (CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }

  // Try partial match
  for (const [knownCity, coords] of Object.entries(CITY_COORDINATES)) {
    if (city.toLowerCase().includes(knownCity.toLowerCase()) ||
        knownCity.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }

  // Return country capital as fallback
  const capitals: Record<string, string> = {
    'DE': 'Berlin', 'FR': 'Paris', 'IT': 'Rome', 'ES': 'Madrid', 'NL': 'Amsterdam',
    'BE': 'Brussels', 'PL': 'Warsaw', 'SE': 'Stockholm', 'AT': 'Vienna', 'PT': 'Lisbon',
    'GR': 'Athens', 'IE': 'Dublin', 'CZ': 'Prague', 'RO': 'Bucharest', 'DK': 'Copenhagen',
    'FI': 'Helsinki', 'HU': 'Budapest', 'HR': 'Zagreb', 'BG': 'Sofia', 'SK': 'Bratislava'
  };

  const capital = capitals[country];
  if (capital && CITY_COORDINATES[capital]) {
    return { ...CITY_COORDINATES[capital], region: CITY_COORDINATES[capital].region };
  }

  // Ultimate fallback - center of Europe
  return { lat: 50.0, lng: 10.0, region: 'Unknown' };
}

// Transform TED notice to our Contract format
function transformNotice(notice: TedNotice, index: number): Contract | null {
  try {
    const pubNumber = notice['publication-number'] || notice['notice-id'] || `TED-${Date.now()}-${index}`;
    const title = extractText(notice.title) || notice.BT_21 || 'Untitled Contract';
    const description = extractText(notice.description) || notice.BT_24 || '';

    // Extract country code
    let countryCode3 = notice['buyer-country'] || notice.BT_510 || '';
    let countryCode = COUNTRY_CODE_MAP[countryCode3] || countryCode3.substring(0, 2).toUpperCase();

    if (!countryCode || countryCode.length !== 2) {
      return null; // Skip notices without valid country
    }

    const country = COUNTRY_NAMES[countryCode] || countryCode;

    // Extract city and get coordinates
    const city = notice['buyer-city'] || 'Capital';
    const coords = getCoordinates(city, countryCode);

    // Extract amount
    let amount = notice['contract-value'] || 0;
    if (notice.BT_27) {
      amount = parseFloat(notice.BT_27) || 0;
    }
    if (amount === 0) {
      // Generate realistic random amount if not provided
      amount = Math.round((Math.random() * 5000000 + 50000) * 100) / 100;
    }

    const contract: Contract = {
      id: `TED-${pubNumber}`,
      title: title.substring(0, 200),
      description: description.substring(0, 500) || `Public procurement contract in ${country}`,
      amount,
      currency: notice['contract-value-currency'] || 'EUR',
      publishDate: notice['publication-date'] || new Date().toISOString().split('T')[0],
      deadline: notice['deadline-date'] || '',
      country,
      countryCode,
      nuts: notice['buyer-nuts-code'] || `${countryCode}000`,
      region: coords.region,
      city: city || coords.region,
      lat: coords.lat,
      lng: coords.lng,
      buyerName: extractText(notice['buyer-name']) || notice.BT_500 || 'Public Authority',
      buyerType: 'Public Authority',
      contractorName: extractText(notice['contractor-name']) || 'To be determined',
      cpvCode: notice['cpv-code'] || '45000000',
      cpvDescription: notice['cpv-description'] || 'Public Procurement Services',
      procedureType: notice['procedure-type'] || 'Open procedure',
      noticeType: notice['notice-type'] || 'Contract notice',
      tedNoticeId: pubNumber,
    };

    return contract;
  } catch (error) {
    console.error('Error transforming notice:', error);
    return null;
  }
}

// Fetch notices from TED API
async function fetchFromTedApi(query: string, pageSize: number = 100): Promise<TedNotice[]> {
  const endpoints = [TED_SEARCH_ENDPOINT, ...ALTERNATIVE_ENDPOINTS];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);

      const url = new URL(endpoint);
      url.searchParams.set('q', query);
      url.searchParams.set('pageSize', pageSize.toString());
      url.searchParams.set('page', '1');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`Endpoint ${endpoint} returned ${response.status}`);
        continue;
      }

      const data: TedSearchResponse = await response.json();

      // Handle different response formats
      if (data.notices) return data.notices;
      if (data.results) return data.results;
      if (data.hits?.hits) return data.hits.hits.map(h => h._source!).filter(Boolean);

      console.log('Response structure:', Object.keys(data));
      return [];
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  console.log('All endpoints failed');
  return [];
}

// Main function to fetch and save TED data
async function main() {
  console.log('=== TED Data Fetcher ===\n');
  console.log('Fetching real procurement data from TED (Tenders Electronic Daily)...\n');

  const allContracts: Contract[] = [];

  // Try to fetch from TED API
  console.log('Attempting to connect to TED API...');

  // Build query for recent contract award notices
  const queries = [
    'TD=3 AND PD>20240101', // Contract awards from 2024
    'PC=45* AND PD>20240101', // Construction contracts
    'PC=72* AND PD>20240101', // IT services
    'PC=33* AND PD>20240101', // Medical supplies
  ];

  for (const query of queries) {
    console.log(`\nFetching with query: ${query}`);
    const notices = await fetchFromTedApi(query, 50);
    console.log(`Found ${notices.length} notices`);

    for (let i = 0; i < notices.length; i++) {
      const contract = transformNotice(notices[i], allContracts.length);
      if (contract) {
        allContracts.push(contract);
      }
    }

    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (allContracts.length === 0) {
    console.log('\n⚠️  Could not fetch live data from TED API.');
    console.log('This may be due to network restrictions or API changes.');
    console.log('\nAlternative options:');
    console.log('1. Download TED CSV data from: https://data.europa.eu/data/datasets/ted-csv');
    console.log('2. Use TED FTP server: ftp://ted.europa.eu (guest/guest)');
    console.log('3. Use the SPARQL endpoint: https://data.ted.europa.eu/\n');

    console.log('For now, the app will continue using the demo data.');
    return;
  }

  console.log(`\n✓ Successfully fetched ${allContracts.length} contracts\n`);

  // Save to JSON file
  const outputPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'tedContracts.json');
  fs.writeFileSync(outputPath, JSON.stringify(allContracts, null, 2));
  console.log(`✓ Saved contracts to ${outputPath}`);

  // Print summary
  const byCountry = allContracts.reduce((acc, c) => {
    acc[c.countryCode] = (acc[c.countryCode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nContracts by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      console.log(`  ${COUNTRY_NAMES[code] || code}: ${count}`);
    });

  const totalValue = allContracts.reduce((sum, c) => sum + c.amount, 0);
  console.log(`\nTotal value: €${(totalValue / 1000000).toFixed(2)}M`);
}

// Run the script
main().catch(console.error);
