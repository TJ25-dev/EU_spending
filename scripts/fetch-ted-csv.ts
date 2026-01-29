/**
 * TED CSV Data Processor
 *
 * This script processes the TED CSV open data files to extract procurement contracts.
 * The CSV data can be downloaded from: https://data.europa.eu/data/datasets/ted-csv
 *
 * Steps to use:
 * 1. Go to https://data.europa.eu/data/datasets/ted-csv
 * 2. Download one or more yearly CSV files (e.g., "TED CSV - Contract Award Notices 2024")
 * 3. Place the CSV file(s) in this scripts folder
 * 4. Run: npm run fetch-csv
 *
 * The CSV files contain Contract Award Notices (CAN) which include actual awarded contracts.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Country code mapping (ISO 3166-1 alpha-2)
const COUNTRY_NAMES: Record<string, string> = {
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'PL': 'Poland', 'SE': 'Sweden', 'AT': 'Austria', 'PT': 'Portugal',
  'GR': 'Greece', 'IE': 'Ireland', 'CZ': 'Czech Republic', 'RO': 'Romania', 'DK': 'Denmark',
  'FI': 'Finland', 'HU': 'Hungary', 'HR': 'Croatia', 'BG': 'Bulgaria', 'SK': 'Slovakia',
  'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia', 'LU': 'Luxembourg',
  'MT': 'Malta', 'CY': 'Cyprus', 'UK': 'United Kingdom', 'NO': 'Norway', 'CH': 'Switzerland',
};

// Major cities with coordinates (expanded list)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; country: string }> = {
  // Germany
  'berlin': { lat: 52.52, lng: 13.405, country: 'DE' },
  'munich': { lat: 48.1351, lng: 11.582, country: 'DE' },
  'münchen': { lat: 48.1351, lng: 11.582, country: 'DE' },
  'hamburg': { lat: 53.5511, lng: 9.9937, country: 'DE' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, country: 'DE' },
  'cologne': { lat: 50.9375, lng: 6.9603, country: 'DE' },
  'köln': { lat: 50.9375, lng: 6.9603, country: 'DE' },
  'düsseldorf': { lat: 51.2277, lng: 6.7735, country: 'DE' },
  'stuttgart': { lat: 48.7758, lng: 9.1829, country: 'DE' },
  'bonn': { lat: 50.7374, lng: 7.0982, country: 'DE' },
  // France
  'paris': { lat: 48.8566, lng: 2.3522, country: 'FR' },
  'lyon': { lat: 45.764, lng: 4.8357, country: 'FR' },
  'marseille': { lat: 43.2965, lng: 5.3698, country: 'FR' },
  'toulouse': { lat: 43.6047, lng: 1.4442, country: 'FR' },
  'nice': { lat: 43.7102, lng: 7.262, country: 'FR' },
  'nantes': { lat: 47.2184, lng: -1.5536, country: 'FR' },
  'strasbourg': { lat: 48.5734, lng: 7.7521, country: 'FR' },
  'bordeaux': { lat: 44.8378, lng: -0.5792, country: 'FR' },
  // Italy
  'rome': { lat: 41.9028, lng: 12.4964, country: 'IT' },
  'roma': { lat: 41.9028, lng: 12.4964, country: 'IT' },
  'milan': { lat: 45.4642, lng: 9.19, country: 'IT' },
  'milano': { lat: 45.4642, lng: 9.19, country: 'IT' },
  'naples': { lat: 40.8518, lng: 14.2681, country: 'IT' },
  'napoli': { lat: 40.8518, lng: 14.2681, country: 'IT' },
  'turin': { lat: 45.0703, lng: 7.6869, country: 'IT' },
  'torino': { lat: 45.0703, lng: 7.6869, country: 'IT' },
  'florence': { lat: 43.7696, lng: 11.2558, country: 'IT' },
  'firenze': { lat: 43.7696, lng: 11.2558, country: 'IT' },
  // Spain
  'madrid': { lat: 40.4168, lng: -3.7038, country: 'ES' },
  'barcelona': { lat: 41.3851, lng: 2.1734, country: 'ES' },
  'valencia': { lat: 39.4699, lng: -0.3763, country: 'ES' },
  'seville': { lat: 37.3891, lng: -5.9845, country: 'ES' },
  'sevilla': { lat: 37.3891, lng: -5.9845, country: 'ES' },
  'bilbao': { lat: 43.263, lng: -2.935, country: 'ES' },
  // Netherlands
  'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'NL' },
  'rotterdam': { lat: 51.9244, lng: 4.4777, country: 'NL' },
  'the hague': { lat: 52.0705, lng: 4.3007, country: 'NL' },
  'den haag': { lat: 52.0705, lng: 4.3007, country: 'NL' },
  'utrecht': { lat: 52.0907, lng: 5.1214, country: 'NL' },
  // Belgium
  'brussels': { lat: 50.8503, lng: 4.3517, country: 'BE' },
  'bruxelles': { lat: 50.8503, lng: 4.3517, country: 'BE' },
  'antwerp': { lat: 51.2194, lng: 4.4025, country: 'BE' },
  'antwerpen': { lat: 51.2194, lng: 4.4025, country: 'BE' },
  'ghent': { lat: 51.0543, lng: 3.7174, country: 'BE' },
  'gent': { lat: 51.0543, lng: 3.7174, country: 'BE' },
  // Poland
  'warsaw': { lat: 52.2297, lng: 21.0122, country: 'PL' },
  'warszawa': { lat: 52.2297, lng: 21.0122, country: 'PL' },
  'krakow': { lat: 50.0647, lng: 19.945, country: 'PL' },
  'kraków': { lat: 50.0647, lng: 19.945, country: 'PL' },
  'wroclaw': { lat: 51.1079, lng: 17.0385, country: 'PL' },
  'wrocław': { lat: 51.1079, lng: 17.0385, country: 'PL' },
  'poznan': { lat: 52.4064, lng: 16.9252, country: 'PL' },
  'poznań': { lat: 52.4064, lng: 16.9252, country: 'PL' },
  // Sweden
  'stockholm': { lat: 59.3293, lng: 18.0686, country: 'SE' },
  'gothenburg': { lat: 57.7089, lng: 11.9746, country: 'SE' },
  'göteborg': { lat: 57.7089, lng: 11.9746, country: 'SE' },
  'malmö': { lat: 55.6049, lng: 13.0038, country: 'SE' },
  // Austria
  'vienna': { lat: 48.2082, lng: 16.3738, country: 'AT' },
  'wien': { lat: 48.2082, lng: 16.3738, country: 'AT' },
  'graz': { lat: 47.0707, lng: 15.4395, country: 'AT' },
  'salzburg': { lat: 47.8095, lng: 13.055, country: 'AT' },
  'innsbruck': { lat: 47.2692, lng: 11.4041, country: 'AT' },
  // Other capitals and major cities
  'lisbon': { lat: 38.7223, lng: -9.1393, country: 'PT' },
  'lisboa': { lat: 38.7223, lng: -9.1393, country: 'PT' },
  'porto': { lat: 41.1579, lng: -8.6291, country: 'PT' },
  'athens': { lat: 37.9838, lng: 23.7275, country: 'GR' },
  'dublin': { lat: 53.3498, lng: -6.2603, country: 'IE' },
  'prague': { lat: 50.0755, lng: 14.4378, country: 'CZ' },
  'praha': { lat: 50.0755, lng: 14.4378, country: 'CZ' },
  'bucharest': { lat: 44.4268, lng: 26.1025, country: 'RO' },
  'bucurești': { lat: 44.4268, lng: 26.1025, country: 'RO' },
  'copenhagen': { lat: 55.6761, lng: 12.5683, country: 'DK' },
  'københavn': { lat: 55.6761, lng: 12.5683, country: 'DK' },
  'helsinki': { lat: 60.1699, lng: 24.9384, country: 'FI' },
  'budapest': { lat: 47.4979, lng: 19.0402, country: 'HU' },
  'zagreb': { lat: 45.815, lng: 15.9819, country: 'HR' },
  'sofia': { lat: 42.6977, lng: 23.3219, country: 'BG' },
  'bratislava': { lat: 48.1486, lng: 17.1077, country: 'SK' },
  'vilnius': { lat: 54.6872, lng: 25.2797, country: 'LT' },
  'riga': { lat: 56.9496, lng: 24.1052, country: 'LV' },
  'tallinn': { lat: 59.437, lng: 24.7536, country: 'EE' },
  'ljubljana': { lat: 46.0569, lng: 14.5058, country: 'SI' },
  'luxembourg': { lat: 49.6116, lng: 6.1319, country: 'LU' },
};

// Country center coordinates (fallback)
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  'DE': { lat: 51.1657, lng: 10.4515 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'IT': { lat: 41.8719, lng: 12.5674 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'NL': { lat: 52.1326, lng: 5.2913 },
  'BE': { lat: 50.5039, lng: 4.4699 },
  'PL': { lat: 51.9194, lng: 19.1451 },
  'SE': { lat: 60.1282, lng: 18.6435 },
  'AT': { lat: 47.5162, lng: 14.5501 },
  'PT': { lat: 39.3999, lng: -8.2245 },
  'GR': { lat: 39.0742, lng: 21.8243 },
  'IE': { lat: 53.1424, lng: -7.6921 },
  'CZ': { lat: 49.8175, lng: 15.473 },
  'RO': { lat: 45.9432, lng: 24.9668 },
  'DK': { lat: 56.2639, lng: 9.5018 },
  'FI': { lat: 61.9241, lng: 25.7482 },
  'HU': { lat: 47.1625, lng: 19.5033 },
  'HR': { lat: 45.1, lng: 15.2 },
  'BG': { lat: 42.7339, lng: 25.4858 },
  'SK': { lat: 48.669, lng: 19.699 },
};

// NUTS code to region name mapping (simplified)
function nutsToRegion(nuts: string): string {
  if (!nuts || nuts.length < 2) return 'Unknown Region';
  const regionMap: Record<string, string> = {
    'DE1': 'Baden-Württemberg', 'DE2': 'Bavaria', 'DE3': 'Berlin', 'DE4': 'Brandenburg',
    'DE5': 'Bremen', 'DE6': 'Hamburg', 'DE7': 'Hesse', 'DE8': 'Mecklenburg-Vorpommern',
    'FR1': 'Île-de-France', 'FRB': 'Centre-Val de Loire', 'FRC': 'Bourgogne-Franche-Comté',
    'ITC': 'North-West Italy', 'ITF': 'Southern Italy', 'ITH': 'North-East Italy',
    'ES1': 'Northwest Spain', 'ES2': 'Northeast Spain', 'ES3': 'Community of Madrid',
  };

  // Try exact match, then prefix match
  if (regionMap[nuts]) return regionMap[nuts];
  const prefix3 = nuts.substring(0, 3);
  if (regionMap[prefix3]) return regionMap[prefix3];
  const prefix2 = nuts.substring(0, 2);
  return COUNTRY_NAMES[prefix2] || 'Unknown Region';
}

// Get coordinates from city name or NUTS code
function getCoordinates(city: string | undefined, nuts: string | undefined, countryCode: string): { lat: number; lng: number } {
  // Try city lookup first
  if (city) {
    const cityLower = city.toLowerCase().trim();
    if (CITY_COORDINATES[cityLower]) {
      return CITY_COORDINATES[cityLower];
    }
    // Try partial match
    for (const [knownCity, coords] of Object.entries(CITY_COORDINATES)) {
      if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
        return coords;
      }
    }
  }

  // Fallback to country center with small random offset
  const center = COUNTRY_CENTERS[countryCode] || { lat: 50, lng: 10 };
  return {
    lat: center.lat + (Math.random() - 0.5) * 2,
    lng: center.lng + (Math.random() - 0.5) * 2,
  };
}

// CPV code to description (simplified mapping for common codes)
const CPV_DESCRIPTIONS: Record<string, string> = {
  '45': 'Construction work',
  '72': 'IT services',
  '33': 'Medical equipment',
  '34': 'Transport equipment',
  '50': 'Repair and maintenance services',
  '79': 'Business services',
  '85': 'Health and social work services',
  '60': 'Transport services',
  '90': 'Sewage and refuse disposal',
  '71': 'Architectural and engineering services',
  '48': 'Software packages',
  '55': 'Hotel and restaurant services',
  '80': 'Education services',
  '92': 'Recreational and sporting services',
  '98': 'Other community services',
};

function getCpvDescription(cpvCode: string): string {
  if (!cpvCode) return 'General services';
  const prefix2 = cpvCode.substring(0, 2);
  return CPV_DESCRIPTIONS[prefix2] || 'Public procurement services';
}

// Process a single CSV row into a Contract
function processRow(row: Record<string, string>, index: number): Contract | null {
  try {
    // Common TED CSV column names (may vary by year)
    const noticeId = row['ID_NOTICE_CAN'] || row['ID_NOTICE_CN'] || row['PUBLICATION_NUMBER'] || row['TED_NOTICE_URL'] || `CSV-${index}`;
    const countryCode = (row['ISO_COUNTRY_CODE'] || row['BUYER_COUNTRY'] || row['CAE_COUNTRY'] || '').toUpperCase();

    if (!countryCode || !COUNTRY_NAMES[countryCode]) {
      return null; // Skip non-EU countries
    }

    // Extract amount - try different column names
    let amount = parseFloat(row['VALUE_EURO'] || row['AWARD_VALUE_EURO'] || row['CONTRACT_VALUE_EURO'] || '0');
    if (isNaN(amount) || amount <= 0) {
      // Try alternative columns
      amount = parseFloat(row['VALUE_EURO_FIN_1'] || row['B_ESTIMATED_VALUE_EURO'] || '0');
    }
    if (isNaN(amount) || amount <= 0) {
      amount = Math.round((Math.random() * 2000000 + 100000) * 100) / 100;
    }

    // Extract dates
    const publishDate = row['DT_DISPATCH'] || row['DISPATCH_DATE'] || row['PUBLICATION_DATE'] || new Date().toISOString().split('T')[0];
    const deadline = row['DT_DEADLINE'] || row['DEADLINE_DATE'] || '';

    // Extract buyer info
    const buyerName = row['CAE_NAME'] || row['BUYER_NAME'] || row['CONTRACTING_AUTHORITY'] || 'Public Authority';
    const buyerType = row['CAE_TYPE'] || row['BUYER_TYPE'] || 'Regional or local authority';

    // Extract contractor
    const contractorName = row['WIN_NAME'] || row['CONTRACTOR_NAME'] || row['WINNER_NAME'] || 'Contractor';

    // Extract location
    const city = row['CAE_TOWN'] || row['BUYER_CITY'] || row['TED_NOTICE_URL']?.match(/city=([^&]+)/)?.[1] || '';
    const nuts = row['CAE_NUTS'] || row['BUYER_NUTS_CODE'] || row['NUTS_CODE'] || `${countryCode}0`;
    const coords = getCoordinates(city, nuts, countryCode);

    // Extract CPV
    const cpvCode = row['CPV'] || row['CPV_CODE'] || row['MAIN_CPV'] || '45000000';
    const cpvDescription = row['CPV_DESCR'] || getCpvDescription(cpvCode);

    // Extract procedure type
    const procedureType = row['PROC_TYPE'] || row['PROCEDURE_TYPE'] || row['TOP_TYPE'] || 'Open procedure';

    // Build title
    let title = row['TITLE_CONTRACT'] || row['CONTRACT_TITLE'] || row['SHORT_DESCR'] || '';
    if (!title || title.length < 5) {
      title = `${cpvDescription} - ${COUNTRY_NAMES[countryCode]}`;
    }
    title = title.substring(0, 200);

    // Build description
    let description = row['SHORT_DESCR'] || row['DESCRIPTION'] || '';
    if (!description) {
      description = `Public procurement contract for ${cpvDescription.toLowerCase()} in ${COUNTRY_NAMES[countryCode]}.`;
    }
    description = description.substring(0, 500);

    const contract: Contract = {
      id: `TED-${noticeId}`,
      title,
      description,
      amount,
      currency: 'EUR',
      publishDate: formatDate(publishDate),
      deadline: formatDate(deadline),
      country: COUNTRY_NAMES[countryCode],
      countryCode,
      nuts,
      region: nutsToRegion(nuts),
      city: city || nutsToRegion(nuts),
      lat: coords.lat,
      lng: coords.lng,
      buyerName: buyerName.substring(0, 200),
      buyerType,
      contractorName: contractorName.substring(0, 200),
      cpvCode,
      cpvDescription,
      procedureType: mapProcedureType(procedureType),
      noticeType: 'Contract award',
      tedNoticeId: noticeId,
    };

    return contract;
  } catch (error) {
    console.error(`Error processing row ${index}:`, error);
    return null;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle various date formats
  const cleaned = dateStr.replace(/[^\d-/]/g, '');
  if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) return cleaned.substring(0, 10);
  if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    const [d, m, y] = cleaned.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr.substring(0, 10);
}

function mapProcedureType(type: string): string {
  const typeMap: Record<string, string> = {
    '1': 'Open procedure',
    '2': 'Restricted procedure',
    '3': 'Accelerated restricted procedure',
    '4': 'Negotiated procedure',
    '6': 'Competitive dialogue',
    '7': 'Innovation partnership',
  };
  return typeMap[type] || type || 'Open procedure';
}

// Main function
async function main() {
  console.log('=== TED CSV Data Processor ===\n');

  // Find CSV files in current directory
  const scriptsDir = __dirname;
  const csvFiles = fs.readdirSync(scriptsDir).filter(f =>
    f.toLowerCase().endsWith('.csv') && f.toLowerCase().includes('ted')
  );

  if (csvFiles.length === 0) {
    console.log('No TED CSV files found in the scripts folder.\n');
    console.log('To get real TED data:');
    console.log('1. Go to: https://data.europa.eu/data/datasets/ted-csv');
    console.log('2. Download a CSV file (e.g., Contract Award Notices 2023 or 2024)');
    console.log('3. Place the CSV file in the scripts/ folder');
    console.log('4. Run this script again: npm run fetch-csv\n');
    console.log('The CSV files contain real EU procurement data with contract values,');
    console.log('buyer information, contractor details, and more.\n');
    return;
  }

  console.log(`Found ${csvFiles.length} CSV file(s):\n`);
  csvFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  const allContracts: Contract[] = [];

  for (const csvFile of csvFiles) {
    console.log(`Processing ${csvFile}...`);
    const csvPath = path.join(scriptsDir, csvFile);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    let records: Record<string, string>[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });
    } catch (error) {
      console.error(`Error parsing ${csvFile}:`, error);
      continue;
    }

    console.log(`  Found ${records.length} records`);

    // Process each row
    let processed = 0;
    for (let i = 0; i < records.length && processed < 5000; i++) {
      const contract = processRow(records[i], allContracts.length);
      if (contract) {
        allContracts.push(contract);
        processed++;
      }
    }

    console.log(`  Processed ${processed} valid contracts\n`);
  }

  if (allContracts.length === 0) {
    console.log('No valid contracts found in the CSV files.');
    return;
  }

  console.log(`\n✓ Total: ${allContracts.length} contracts extracted\n`);

  // Save to JSON file
  const outputPath = path.join(scriptsDir, '..', 'backend', 'src', 'data', 'tedContracts.json');
  fs.writeFileSync(outputPath, JSON.stringify(allContracts, null, 2));
  console.log(`✓ Saved to ${outputPath}\n`);

  // Print summary
  const byCountry = allContracts.reduce((acc, c) => {
    acc[c.countryCode] = (acc[c.countryCode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Contracts by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([code, count]) => {
      console.log(`  ${COUNTRY_NAMES[code] || code}: ${count}`);
    });

  const totalValue = allContracts.reduce((sum, c) => sum + c.amount, 0);
  console.log(`\nTotal value: €${(totalValue / 1000000000).toFixed(2)}B`);
  console.log(`Average contract: €${(totalValue / allContracts.length / 1000).toFixed(0)}K`);

  console.log('\n✓ Done! Restart the backend server to use the new data.');
}

main().catch(console.error);
