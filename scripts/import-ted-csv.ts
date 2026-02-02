import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CPV code descriptions (simplified mapping)
const cpvDescriptions: Record<string, { description: string; category: string }> = {
  '85': { description: 'Health and social work services', category: 'Health Services' },
  '34': { description: 'Transport equipment', category: 'Transport' },
  '38': { description: 'Laboratory and precision equipment', category: 'Research Equipment' },
  '45': { description: 'Construction work', category: 'Construction' },
  '72': { description: 'IT services', category: 'IT Services' },
  '33': { description: 'Medical equipment and pharmaceuticals', category: 'Medical Supplies' },
  '60': { description: 'Transport services', category: 'Transport' },
  '79': { description: 'Business services', category: 'Consulting' },
  '90': { description: 'Environmental services', category: 'Environment' },
  '71': { description: 'Engineering services', category: 'Engineering' },
  '50': { description: 'Repair and maintenance services', category: 'Maintenance' },
  '48': { description: 'Software packages', category: 'IT Services' },
  '30': { description: 'Office equipment', category: 'Office Supplies' },
  '39': { description: 'Furniture and equipment', category: 'Furniture & Equipment' },
  '09': { description: 'Energy products', category: 'Energy' },
  '55': { description: 'Hotel and restaurant services', category: 'Hospitality' },
  '80': { description: 'Education services', category: 'Education' },
  '66': { description: 'Financial services', category: 'Financial Services' },
  '73': { description: 'R&D services', category: 'Research Equipment' },
  '42': { description: 'Industrial machinery', category: 'Industrial Equipment' },
  '44': { description: 'Construction materials', category: 'Construction' },
  '22': { description: 'Printed matter', category: 'Office Supplies' },
  '15': { description: 'Food products', category: 'Food & Beverages' },
  '03': { description: 'Agricultural products', category: 'Agriculture' },
  '18': { description: 'Clothing and textiles', category: 'Textiles' },
  '35': { description: 'Security equipment', category: 'Security' },
  '31': { description: 'Electrical machinery', category: 'Industrial Equipment' },
  '32': { description: 'Radio and television equipment', category: 'Electronics' },
  '37': { description: 'Musical instruments and sports goods', category: 'Recreation' },
  '24': { description: 'Chemical products', category: 'Chemicals' },
  '14': { description: 'Mining products', category: 'Mining' },
  '19': { description: 'Leather products', category: 'Textiles' },
  '16': { description: 'Agricultural machinery', category: 'Agriculture' },
  '43': { description: 'Mining machinery', category: 'Industrial Equipment' },
  '63': { description: 'Supporting transport services', category: 'Transport' },
  '64': { description: 'Postal and telecommunications', category: 'Communications' },
  '65': { description: 'Public utilities', category: 'Utilities' },
  '70': { description: 'Real estate services', category: 'Real Estate' },
  '75': { description: 'Public administration services', category: 'Public Administration' },
  '76': { description: 'Oil and gas services', category: 'Energy' },
  '77': { description: 'Agricultural and forestry services', category: 'Agriculture' },
  '92': { description: 'Recreational and cultural services', category: 'Recreation' },
  '98': { description: 'Other community services', category: 'Other Services' },
};

// Country coordinates
const countryCoordinates: Record<string, { name: string; lat: number; lng: number }> = {
  DE: { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  FR: { name: 'France', lat: 46.2276, lng: 2.2137 },
  IT: { name: 'Italy', lat: 41.8719, lng: 12.5674 },
  ES: { name: 'Spain', lat: 40.4637, lng: -3.7492 },
  NL: { name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
  BE: { name: 'Belgium', lat: 50.5039, lng: 4.4699 },
  PL: { name: 'Poland', lat: 51.9194, lng: 19.1451 },
  SE: { name: 'Sweden', lat: 60.1282, lng: 18.6435 },
  AT: { name: 'Austria', lat: 47.5162, lng: 14.5501 },
  PT: { name: 'Portugal', lat: 39.3999, lng: -8.2245 },
  GR: { name: 'Greece', lat: 39.0742, lng: 21.8243 },
  IE: { name: 'Ireland', lat: 53.1424, lng: -7.6921 },
  CZ: { name: 'Czech Republic', lat: 49.8175, lng: 15.473 },
  RO: { name: 'Romania', lat: 45.9432, lng: 24.9668 },
  DK: { name: 'Denmark', lat: 56.2639, lng: 9.5018 },
  FI: { name: 'Finland', lat: 61.9241, lng: 25.7482 },
  HU: { name: 'Hungary', lat: 47.1625, lng: 19.5033 },
  HR: { name: 'Croatia', lat: 45.1, lng: 15.2 },
  BG: { name: 'Bulgaria', lat: 42.7339, lng: 25.4858 },
  SK: { name: 'Slovakia', lat: 48.669, lng: 19.699 },
  LT: { name: 'Lithuania', lat: 55.1694, lng: 23.8813 },
  SI: { name: 'Slovenia', lat: 46.1512, lng: 14.9955 },
  LV: { name: 'Latvia', lat: 56.8796, lng: 24.6032 },
  EE: { name: 'Estonia', lat: 58.5953, lng: 25.0136 },
  CY: { name: 'Cyprus', lat: 35.1264, lng: 33.4299 },
  LU: { name: 'Luxembourg', lat: 49.8153, lng: 6.1296 },
  MT: { name: 'Malta', lat: 35.9375, lng: 14.3754 },
  NO: { name: 'Norway', lat: 60.472, lng: 8.4689 },
  IS: { name: 'Iceland', lat: 64.9631, lng: -19.0208 },
  LI: { name: 'Liechtenstein', lat: 47.166, lng: 9.5554 },
  CH: { name: 'Switzerland', lat: 46.8182, lng: 8.2275 },
  UK: { name: 'United Kingdom', lat: 55.3781, lng: -3.436 },
  MK: { name: 'North Macedonia', lat: 41.5124, lng: 21.4035 },
  RS: { name: 'Serbia', lat: 44.0165, lng: 21.0059 },
  ME: { name: 'Montenegro', lat: 42.7087, lng: 19.3744 },
  AL: { name: 'Albania', lat: 41.1533, lng: 20.1683 },
  BA: { name: 'Bosnia and Herzegovina', lat: 43.9159, lng: 17.6791 },
  XK: { name: 'Kosovo', lat: 42.6026, lng: 20.903 },
};

// Buyer type mapping
const caeTypeMap: Record<string, string> = {
  '1': 'Ministry or federal authority',
  '3': 'Regional or local authority',
  '4': 'Body governed by public law',
  '5': 'EU institution/agency',
  '6': 'Body governed by public law',
  '8': 'Other',
  N: 'Not specified',
};

// Contract type mapping
const contractTypeMap: Record<string, string> = {
  S: 'Services',
  U: 'Supplies',
  W: 'Works',
};

// Procedure type mapping
const procedureTypeMap: Record<string, string> = {
  OPE: 'Open procedure',
  RES: 'Restricted procedure',
  NEG: 'Negotiated procedure',
  NIC: 'Negotiated without call for competition',
  COD: 'Competitive dialogue',
  INP: 'Innovation partnership',
  AWP: 'Award without prior publication',
  '': 'Not specified',
};

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

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  // Format: DD/MM/YY or DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getCpvInfo(cpvCode: string): { description: string; category: string } {
  if (!cpvCode) return { description: 'Not specified', category: 'Other' };
  const prefix = cpvCode.substring(0, 2);
  return cpvDescriptions[prefix] || { description: 'Other services', category: 'Other' };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Seeded random for consistent results
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

async function importCSV() {
  const csvPath = path.join(__dirname, 'export_CAN_2023.csv');
  const outputPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'tedContracts.json');

  console.log('Reading CSV file with streaming...');

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const contracts: Contract[] = [];
  const seenIds = new Set<string>();

  // Target: ~5000 contracts for good variety
  const targetCount = 5000;
  // Sample rate: keep approximately 1 in N lines
  const sampleRate = 200; // ~1M lines / 200 = ~5000 contracts

  let lineNum = 0;
  let header: string[] = [];
  let colIndex: Record<string, number> = {};
  let processedCount = 0;
  let skippedCount = 0;

  for await (const line of rl) {
    lineNum++;

    // Parse header on first line
    if (lineNum === 1) {
      header = parseCSVLine(line);
      header.forEach((col, idx) => {
        colIndex[col] = idx;
      });
      console.log(`Found ${header.length} columns`);
      continue;
    }

    // Sample lines to get manageable dataset
    if (lineNum % sampleRate !== 0) continue;

    if (contracts.length >= targetCount) break;

    if (!line.trim()) continue;

    try {
      const fields = parseCSVLine(line);

      const noticeId = fields[colIndex['ID_NOTICE_CAN']] || '';
      const tedUrl = fields[colIndex['TED_NOTICE_URL']] || '';
      const countryCode = fields[colIndex['ISO_COUNTRY_CODE']] || '';
      const valueEuro = parseFloat(fields[colIndex['AWARD_VALUE_EURO']] || fields[colIndex['VALUE_EURO']] || '0');
      const cpvCode = fields[colIndex['CPV']] || '';
      const buyerName = fields[colIndex['CAE_NAME']] || '';
      const buyerCity = fields[colIndex['CAE_TOWN']] || '';
      const caeType = fields[colIndex['CAE_TYPE']] || '';
      const winnerName = fields[colIndex['WIN_NAME']] || '';
      const title = fields[colIndex['TITLE']] || '';
      const dtDispatch = fields[colIndex['DT_DISPATCH']] || '';
      const dtAward = fields[colIndex['DT_AWARD']] || '';
      const nutsCode = fields[colIndex['TAL_LOCATION_NUTS']] || '';
      const topType = fields[colIndex['TOP_TYPE']] || '';
      const contractType = fields[colIndex['TYPE_OF_CONTRACT']] || '';

      // Skip if missing essential data
      if (!countryCode || valueEuro <= 0 || !buyerName) {
        skippedCount++;
        continue;
      }

      // Skip if country not in our mapping
      const countryInfo = countryCoordinates[countryCode];
      if (!countryInfo) {
        skippedCount++;
        continue;
      }

      // Generate unique ID
      const id = `TED-2023-${noticeId}`;
      if (seenIds.has(id)) {
        skippedCount++;
        continue;
      }
      seenIds.add(id);

      const cpvInfo = getCpvInfo(cpvCode);

      // Add some randomness to coordinates to spread markers
      const latOffset = (seededRandom() - 0.5) * 2;
      const lngOffset = (seededRandom() - 0.5) * 2;

      const contract: Contract = {
        id,
        title: title || `${contractTypeMap[contractType] || 'Contract'} - ${buyerName}`,
        description: `${cpvInfo.description} contract awarded by ${buyerName} in ${buyerCity || countryInfo.name}.`,
        amount: Math.round(valueEuro * 100) / 100,
        currency: 'EUR',
        publishDate: parseDate(dtDispatch),
        deadline: parseDate(dtAward),
        country: countryInfo.name,
        countryCode,
        nuts: nutsCode,
        region: nutsCode ? nutsCode.substring(0, 3) : countryCode,
        city: buyerCity || countryInfo.name,
        lat: Math.round((countryInfo.lat + latOffset) * 10000) / 10000,
        lng: Math.round((countryInfo.lng + lngOffset) * 10000) / 10000,
        buyerName,
        buyerType: caeTypeMap[caeType] || 'Not specified',
        contractorName: winnerName || 'Not disclosed',
        cpvCode,
        cpvDescription: cpvInfo.description,
        procedureType: procedureTypeMap[topType] || 'Not specified',
        noticeType: 'Contract award notice',
        tedNoticeId: tedUrl ? `https://${tedUrl}` : `TED-${noticeId}`,
      };

      contracts.push(contract);
      processedCount++;

      if (processedCount % 500 === 0) {
        console.log(`Processed ${processedCount} contracts (at line ${lineNum})...`);
      }
    } catch (err) {
      skippedCount++;
    }
  }

  console.log(`\nProcessed ${lineNum} lines total`);
  console.log(`\nImport complete:`);
  console.log(`  - Contracts imported: ${contracts.length}`);
  console.log(`  - Lines skipped: ${skippedCount}`);

  // Calculate stats
  const totalValue = contracts.reduce((sum, c) => sum + c.amount, 0);
  const countryStats: Record<string, { count: number; value: number }> = {};
  contracts.forEach((c) => {
    if (!countryStats[c.countryCode]) {
      countryStats[c.countryCode] = { count: 0, value: 0 };
    }
    countryStats[c.countryCode].count++;
    countryStats[c.countryCode].value += c.amount;
  });

  console.log(`\nData summary:`);
  console.log(`  - Total value: €${(totalValue / 1e9).toFixed(2)} billion`);
  console.log(`  - Countries: ${Object.keys(countryStats).length}`);
  console.log(`  - Top countries by count:`);
  Object.entries(countryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, stats]) => {
      console.log(`    ${code}: ${stats.count} contracts, €${(stats.value / 1e6).toFixed(1)}M`);
    });

  // Write output
  console.log(`\nWriting to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(contracts, null, 2));
  console.log('Done!');
}

importCSV().catch(console.error);
