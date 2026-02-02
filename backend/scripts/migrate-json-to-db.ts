import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create PostgreSQL pool with higher connection limit
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const adapter = new PrismaPg(pool);

interface JsonContract {
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

const NOTEWORTHY_THRESHOLD = 10_000_000; // Contracts over 10M EUR are noteworthy
const NOTEWORTHY_CATEGORIES = [
  '35', // Security, military
  '33', // Medical equipment
  '72', // IT services
  '45', // Construction
];

function isNoteworthy(contract: JsonContract): { isNoteworthy: boolean; reason: string | null } {
  const reasons: string[] = [];

  // Check amount threshold
  if (contract.amount >= NOTEWORTHY_THRESHOLD) {
    reasons.push(`High value: €${(contract.amount / 1_000_000).toFixed(1)}M`);
  }

  // Check if it's in a noteworthy category
  const cpvPrefix = contract.cpvCode?.substring(0, 2);
  if (cpvPrefix && NOTEWORTHY_CATEGORIES.includes(cpvPrefix)) {
    reasons.push(`Category: ${contract.cpvDescription?.split(' ')[0] || cpvPrefix}`);
  }

  return {
    isNoteworthy: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join('; ') : null,
  };
}

async function upsertContract(prisma: PrismaClient, c: JsonContract) {
  const noteworthy = isNoteworthy(c);

  return prisma.contract.upsert({
    where: { tedNoticeId: c.tedNoticeId },
    create: {
      id: c.id,
      tedNoticeId: c.tedNoticeId,
      title: c.title || 'Untitled',
      description: c.description || '',
      amount: c.amount || 0,
      currency: c.currency || 'EUR',
      publishDate: new Date(c.publishDate),
      deadline: c.deadline ? new Date(c.deadline) : null,
      country: c.country || 'Unknown',
      countryCode: c.countryCode || 'XX',
      nuts: c.nuts || null,
      region: c.region || null,
      city: c.city || null,
      lat: c.lat || null,
      lng: c.lng || null,
      buyerName: c.buyerName || 'Unknown',
      buyerType: c.buyerType || null,
      contractorName: c.contractorName || null,
      cpvCode: c.cpvCode || null,
      cpvDescription: c.cpvDescription || null,
      procedureType: c.procedureType || null,
      noticeType: c.noticeType || null,
      isNoteworthy: noteworthy.isNoteworthy,
      noteworthyReason: noteworthy.reason,
    },
    update: {
      title: c.title || 'Untitled',
      description: c.description || '',
      amount: c.amount || 0,
      currency: c.currency || 'EUR',
      publishDate: new Date(c.publishDate),
      deadline: c.deadline ? new Date(c.deadline) : null,
      country: c.country || 'Unknown',
      countryCode: c.countryCode || 'XX',
      nuts: c.nuts || null,
      region: c.region || null,
      city: c.city || null,
      lat: c.lat || null,
      lng: c.lng || null,
      buyerName: c.buyerName || 'Unknown',
      buyerType: c.buyerType || null,
      contractorName: c.contractorName || null,
      cpvCode: c.cpvCode || null,
      cpvDescription: c.cpvDescription || null,
      procedureType: c.procedureType || null,
      noticeType: c.noticeType || null,
      isNoteworthy: noteworthy.isNoteworthy,
      noteworthyReason: noteworthy.reason,
    },
  });
}

async function main() {
  const prisma = new PrismaClient({ adapter });

  console.log('Starting JSON to database migration...');

  // Read the JSON file
  const jsonPath = join(__dirname, '../src/data/tedContracts.json');
  console.log(`Reading contracts from ${jsonPath}...`);

  const jsonData = readFileSync(jsonPath, 'utf-8');
  const contracts: JsonContract[] = JSON.parse(jsonData);

  console.log(`Found ${contracts.length} contracts to migrate`);

  // Migrate in small concurrent batches (without transactions to avoid timeouts)
  const BATCH_SIZE = 25; // Small batches for concurrent processing
  let migrated = 0;
  let errors = 0;

  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE);

    // Process batch concurrently (but not in a transaction)
    const results = await Promise.allSettled(batch.map((c) => upsertContract(prisma, c)));

    for (const result of results) {
      if (result.status === 'fulfilled') {
        migrated++;
      } else {
        errors++;
        // Only log first few errors to avoid spam
        if (errors <= 5) {
          console.error('Error:', result.reason.message || result.reason);
        }
      }
    }

    // Progress update every 500 contracts
    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= contracts.length) {
      console.log(`Progress: ${migrated}/${contracts.length} contracts migrated (${errors} errors)`);
    }
  }

  // Initialize sync state
  await prisma.syncState.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      lastSyncAt: new Date(),
      lastSyncCount: migrated,
      isRunning: false,
    },
    update: {
      lastSyncAt: new Date(),
      lastSyncCount: migrated,
    },
  });

  console.log('\n--- Migration Complete ---');
  console.log(`Successfully migrated: ${migrated} contracts`);
  console.log(`Errors: ${errors} contracts`);

  // Count noteworthy contracts
  const noteworthyCount = await prisma.contract.count({
    where: { isNoteworthy: true },
  });
  console.log(`Noteworthy contracts: ${noteworthyCount}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
