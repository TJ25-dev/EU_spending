import { readFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Contract {
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

const jsonPath = join(__dirname, 'tedContracts.json');

// Mutable contracts array that can be reloaded
let _contracts: Contract[] = [];

/**
 * Load contracts from the JSON file
 */
function loadContracts(): Contract[] {
  if (!existsSync(jsonPath)) {
    console.warn('No tedContracts.json found - starting with empty dataset');
    return [];
  }

  try {
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);
    console.log(`Loaded ${data.length} TED contracts`);
    return data;
  } catch (error) {
    console.error('Failed to load contracts:', error);
    return [];
  }
}

/**
 * Reload contracts from disk
 * Called after sync completes
 */
export function reloadContracts(): void {
  _contracts = loadContracts();
}

/**
 * Get the current contracts array
 * Using a getter allows us to reload data without breaking imports
 */
export const contracts: Contract[] = new Proxy([] as Contract[], {
  get(target, prop) {
    // Proxy all array operations to the mutable _contracts array
    const value = (_contracts as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_contracts);
    }
    return value;
  },
  set(target, prop, value) {
    (_contracts as any)[prop] = value;
    return true;
  },
});

// Initial load
_contracts = loadContracts();

// Watch for file changes and auto-reload
if (existsSync(jsonPath)) {
  watchFile(jsonPath, { interval: 5000 }, () => {
    console.log('Detected changes in tedContracts.json, reloading...');
    reloadContracts();
  });
}
