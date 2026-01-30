/**
 * TED CSV Data Processor
 * Processes TED CSV open data files to extract procurement contracts.
 * Download CSV from: https://data.europa.eu/data/datasets/ted-csv
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Contract {
  id: string; title: string; description: string; amount: number; currency: string;
  publishDate: string; deadline: string; country: string; countryCode: string;
  nuts: string; region: string; city: string; lat: number; lng: number;
  buyerName: string; buyerType: string; contractorName: string;
  cpvCode: string; cpvDescription: string; procedureType: string;
  noticeType: string; tedNoticeId: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'PL': 'Poland', 'SE': 'Sweden', 'AT': 'Austria', 'PT': 'Portugal',
  'GR': 'Greece', 'IE': 'Ireland', 'CZ': 'Czech Republic', 'RO': 'Romania', 'DK': 'Denmark',
  'FI': 'Finland', 'HU': 'Hungary', 'HR': 'Croatia', 'BG': 'Bulgaria', 'SK': 'Slovakia',
  'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia', 'LU': 'Luxembourg',
  'MT': 'Malta', 'CY': 'Cyprus',
};

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  'DE': { lat: 51.1657, lng: 10.4515 }, 'FR': { lat: 46.2276, lng: 2.2137 },
  'IT': { lat: 41.8719, lng: 12.5674 }, 'ES': { lat: 40.4637, lng: -3.7492 },
  'NL': { lat: 52.1326, lng: 5.2913 }, 'BE': { lat: 50.5039, lng: 4.4699 },
  'PL': { lat: 51.9194, lng: 19.1451 }, 'SE': { lat: 60.1282, lng: 18.6435 },
  'AT': { lat: 47.5162, lng: 14.5501 }, 'PT': { lat: 39.3999, lng: -8.2245 },
  'GR': { lat: 39.0742, lng: 21.8243 }, 'IE': { lat: 53.1424, lng: -7.6921 },
  'CZ': { lat: 49.8175, lng: 15.473 }, 'RO': { lat: 45.9432, lng: 24.9668 },
  'DK': { lat: 56.2639, lng: 9.5018 }, 'FI': { lat: 61.9241, lng: 25.7482 },
  'HU': { lat: 47.1625, lng: 19.5033 }, 'HR': { lat: 45.1, lng: 15.2 },
  'BG': { lat: 42.7339, lng: 25.4858 }, 'SK': { lat: 48.669, lng: 19.699 },
  'LT': { lat: 55.1694, lng: 23.8813 }, 'LV': { lat: 56.8796, lng: 24.6032 },
  'EE': { lat: 58.5953, lng: 25.0136 }, 'SI': { lat: 46.1512, lng: 14.9955 },
  'LU': { lat: 49.8153, lng: 6.1296 }, 'MT': { lat: 35.9375, lng: 14.3754 },
  'CY': { lat: 35.1264, lng: 33.4299 },
};

// CPV code to category mapping (first 2 digits)
const CPV_CATEGORIES: Record<string, string> = {
  '03': 'Agricultural products', '09': 'Petroleum & energy', '14': 'Mining products',
  '15': 'Food & beverages', '16': 'Agricultural machinery', '18': 'Clothing & footwear',
  '19': 'Leather products', '22': 'Printed matter', '24': 'Chemical products',
  '30': 'Office equipment', '31': 'Electrical machinery', '32': 'Radio & TV equipment',
  '33': 'Medical equipment', '34': 'Transport equipment', '35': 'Security equipment',
  '37': 'Musical instruments', '38': 'Laboratory equipment', '39': 'Furniture',
  '41': 'Collected water', '42': 'Industrial machinery', '43': 'Mining machinery',
  '44': 'Construction structures', '45': 'Construction work', '48': 'Software packages',
  '50': 'Repair services', '51': 'Installation services', '55': 'Hotel services',
  '60': 'Transport services', '63': 'Travel services', '64': 'Postal services',
  '65': 'Public utilities', '66': 'Financial services', '70': 'Real estate',
  '71': 'Architecture & engineering', '72': 'IT services', '73': 'R&D services',
  '75': 'Public administration', '76': 'Oil & gas services', '77': 'Agricultural services',
  '79': 'Business services', '80': 'Education services', '85': 'Health services',
  '90': 'Environmental services', '92': 'Recreation services', '98': 'Other services',
};

const PROCEDURE_TYPES: Record<string, string> = {
  '1': 'Open procedure', '2': 'Restricted procedure', '3': 'Accelerated restricted',
  '4': 'Negotiated with competition', '6': 'Competitive dialogue', '8': 'Negotiated without competition',
  'A': 'Open procedure', 'B': 'Restricted procedure', 'C': 'Negotiated procedure',
};

async function main() {
  console.log('=== TED CSV Data Processor ===\n');

  const csvFile = fs.readdirSync(__dirname).find(f => f.endsWith('.csv'));
  if (!csvFile) { console.log('No CSV file found!'); return; }

  // Count total lines first
  console.log(`Found: ${csvFile}`);
  console.log('Counting total records...');
  let totalLines = 0;
  const countStream = createReadStream(path.join(__dirname, csvFile));
  for await (const chunk of countStream) { totalLines += chunk.toString().split('\n').length; }
  console.log(`Total rows in file: ~${totalLines.toLocaleString()}\n`);

  const contracts: Contract[] = [];
  const MAX_CONTRACTS = 15000; // Reasonable limit for browser performance
  const seenIds = new Set<string>();
  let rowCount = 0;
  let skippedNoValue = 0;
  let skippedDuplicate = 0;
  let skippedNoCountry = 0;

  console.log(`Processing (max ${MAX_CONTRACTS.toLocaleString()} contracts)...\n`);

  const parser = createReadStream(path.join(__dirname, csvFile))
    .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true }));

  for await (const row of parser) {
    rowCount++;
    if (contracts.length >= MAX_CONTRACTS) break;

    // Get country
    const countryCode = (row['ISO_COUNTRY_CODE'] || '').toUpperCase();
    if (!COUNTRY_NAMES[countryCode]) { skippedNoCountry++; continue; }

    // Get amount - skip if no real value
    let amount = parseFloat(row['VALUE_EURO'] || '0');
    if (isNaN(amount) || amount <= 0) {
      amount = parseFloat(row['VALUE_EURO_FIN_1'] || '0');
    }
    if (isNaN(amount) || amount <= 1000) { skippedNoValue++; continue; } // Skip tiny/missing amounts

    // Skip duplicates
    const noticeId = row['ID_NOTICE_CAN'] || `row-${rowCount}`;
    if (seenIds.has(noticeId)) { skippedDuplicate++; continue; }
    seenIds.add(noticeId);

    // Get CPV and map to category
    const cpvCode = (row['CPV'] || '45000000').toString();
    const cpvPrefix = cpvCode.substring(0, 2);
    const cpvDescription = CPV_CATEGORIES[cpvPrefix] || 'Other services';

    // Get procedure type
    const procType = row['TOP_TYPE'] || '1';
    const procedureType = PROCEDURE_TYPES[procType] || 'Open procedure';

    // Build title from available data
    const buyerName = (row['CAE_NAME'] || 'Public Authority').substring(0, 150);
    const city = row['CAE_TOWN'] || '';
    const contractType = row['TYPE_OF_CONTRACT'] || '';
    let title = `${cpvDescription}`;
    if (city) title += ` - ${city}`;
    if (contractType) title += ` (${contractType})`;
    title = title.substring(0, 200);

    // Coordinates
    const center = COUNTRY_CENTERS[countryCode] || { lat: 50, lng: 10 };

    contracts.push({
      id: `TED-${noticeId}`,
      title,
      description: `${cpvDescription} contract awarded by ${buyerName} in ${COUNTRY_NAMES[countryCode]}.`,
      amount,
      currency: 'EUR',
      publishDate: row['DT_DISPATCH'] || '2023-01-01',
      deadline: '',
      country: COUNTRY_NAMES[countryCode],
      countryCode,
      nuts: row['TAL_LOCATION_NUTS'] || row['CAE_NUTS'] || countryCode,
      region: COUNTRY_NAMES[countryCode],
      city: city || COUNTRY_NAMES[countryCode],
      lat: center.lat + (Math.random() - 0.5) * 3,
      lng: center.lng + (Math.random() - 0.5) * 3,
      buyerName,
      buyerType: row['CAE_TYPE'] || 'Public body',
      contractorName: (row['WIN_NAME'] || 'Contractor').substring(0, 150),
      cpvCode,
      cpvDescription,
      procedureType,
      noticeType: 'Contract award',
      tedNoticeId: noticeId,
    });

    if (contracts.length % 2000 === 0) {
      console.log(`  Extracted ${contracts.length.toLocaleString()} contracts...`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${rowCount.toLocaleString()} rows`);
  console.log(`Extracted: ${contracts.length.toLocaleString()} contracts`);
  console.log(`Skipped - no value: ${skippedNoValue.toLocaleString()}`);
  console.log(`Skipped - duplicate: ${skippedDuplicate.toLocaleString()}`);
  console.log(`Skipped - non-EU: ${skippedNoCountry.toLocaleString()}`);

  const outputPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'tedContracts.json');
  fs.writeFileSync(outputPath, JSON.stringify(contracts, null, 2));
  console.log(`\n✓ Saved to ${outputPath}`);

  const total = contracts.reduce((s, c) => s + c.amount, 0);
  console.log(`\nTotal value: €${(total / 1e9).toFixed(2)}B`);
  console.log(`Average: €${(total / contracts.length / 1000).toFixed(0)}K`);

  // Show breakdown by country
  const byCountry: Record<string, number> = {};
  contracts.forEach(c => { byCountry[c.country] = (byCountry[c.country] || 0) + 1; });
  console.log(`\nTop countries:`);
  Object.entries(byCountry).sort((a,b) => b[1]-a[1]).slice(0,10)
    .forEach(([c, n]) => console.log(`  ${c}: ${n.toLocaleString()}`));
}

main().catch(console.error);
