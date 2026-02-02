/**
 * TED Data Sync Service
 * Fetches contract award notices from TED API and stores them in PostgreSQL
 */

import prisma from '../lib/prisma.js';
import { tedApiClient, TedApiClient, TedNoticeResult } from './tedApiClient.js';

// Noteworthy thresholds for X posting
const NOTEWORTHY_THRESHOLD = 10_000_000; // Contracts over 10M EUR
const NOTEWORTHY_CATEGORIES = ['35', '33', '72', '45']; // Security, Medical, IT, Construction

// Country coordinates for geo-mapping
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
};

// CPV code descriptions
const cpvDescriptions: Record<string, { description: string; category: string }> = {
  '03': { description: 'Agricultural products', category: 'Agriculture' },
  '09': { description: 'Energy products', category: 'Energy' },
  '14': { description: 'Mining products', category: 'Mining' },
  '15': { description: 'Food products', category: 'Food & Beverages' },
  '18': { description: 'Clothing and textiles', category: 'Textiles' },
  '22': { description: 'Printed matter', category: 'Office Supplies' },
  '24': { description: 'Chemical products', category: 'Chemicals' },
  '30': { description: 'Office equipment', category: 'Office Supplies' },
  '31': { description: 'Electrical machinery', category: 'Industrial Equipment' },
  '32': { description: 'Radio and TV equipment', category: 'Electronics' },
  '33': { description: 'Medical equipment', category: 'Medical Supplies' },
  '34': { description: 'Transport equipment', category: 'Transport' },
  '35': { description: 'Security equipment', category: 'Security' },
  '37': { description: 'Musical and sports goods', category: 'Recreation' },
  '38': { description: 'Laboratory equipment', category: 'Research Equipment' },
  '39': { description: 'Furniture and equipment', category: 'Furniture & Equipment' },
  '42': { description: 'Industrial machinery', category: 'Industrial Equipment' },
  '43': { description: 'Mining machinery', category: 'Industrial Equipment' },
  '44': { description: 'Construction materials', category: 'Construction' },
  '45': { description: 'Construction work', category: 'Construction' },
  '48': { description: 'Software packages', category: 'IT Services' },
  '50': { description: 'Repair and maintenance', category: 'Maintenance' },
  '55': { description: 'Hotel and restaurant', category: 'Hospitality' },
  '60': { description: 'Transport services', category: 'Transport' },
  '63': { description: 'Supporting transport', category: 'Transport' },
  '64': { description: 'Postal and telecom', category: 'Communications' },
  '65': { description: 'Public utilities', category: 'Utilities' },
  '66': { description: 'Financial services', category: 'Financial Services' },
  '70': { description: 'Real estate services', category: 'Real Estate' },
  '71': { description: 'Engineering services', category: 'Engineering' },
  '72': { description: 'IT services', category: 'IT Services' },
  '73': { description: 'R&D services', category: 'Research Equipment' },
  '75': { description: 'Public administration', category: 'Public Administration' },
  '76': { description: 'Oil and gas services', category: 'Energy' },
  '77': { description: 'Agricultural services', category: 'Agriculture' },
  '79': { description: 'Business services', category: 'Consulting' },
  '80': { description: 'Education services', category: 'Education' },
  '85': { description: 'Health services', category: 'Health Services' },
  '90': { description: 'Environmental services', category: 'Environment' },
  '92': { description: 'Recreational services', category: 'Recreation' },
  '98': { description: 'Other services', category: 'Other Services' },
};

// Fields to request from TED API v3
const TED_FIELDS = [
  'publication-number',
  'publication-date',
  'notice-title',
  'buyer-name',
  'buyer-country',
  'buyer-city',
  'winner-name',
  'winner-country',
  'total-value',
  'total-value-cur',
  'procedure-type',
  'classification-cpv',
  'notice-type',
  'description-lot',
  'contract-conclusion-date',
  'result-lot-identifier',
  'winner-selection-status',
  'framework-agreement-lot',
];

// Exchange rates to EUR
const EXCHANGE_RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  PLN: 0.23,
  SEK: 0.087,
  DKK: 0.134,
  CZK: 0.04,
  HUF: 0.0025,
  RON: 0.2,
  BGN: 0.51,
  HRK: 0.133,
  GBP: 1.17,
  CHF: 1.06,
  NOK: 0.085,
  ISK: 0.0067,
};

interface ContractData {
  id: string;
  tedNoticeId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  publishDate: Date;
  deadline: Date | null;
  country: string;
  countryCode: string;
  nuts: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  buyerName: string;
  buyerType: string | null;
  contractorName: string | null;
  cpvCode: string | null;
  cpvDescription: string | null;
  procedureType: string | null;
  noticeType: string | null;
  isNoteworthy: boolean;
  noteworthyReason: string | null;
}

export class SyncService {
  /**
   * Get the current sync state from database
   */
  async getSyncState() {
    return prisma.syncState.findUnique({
      where: { id: 'default' },
    });
  }

  /**
   * Check if sync is currently running
   */
  async isSyncing(): Promise<boolean> {
    const state = await this.getSyncState();
    return state?.isRunning || false;
  }

  /**
   * Perform incremental sync - fetch new notices since last sync
   */
  async syncIncremental(
    onProgress?: (count: number, total: number) => void
  ): Promise<{ success: boolean; newContracts: number; error?: string }> {
    const state = await this.getSyncState();

    // Default to last 7 days if no previous sync
    const fromDate = state?.lastSyncAt
      ? new Date(state.lastSyncAt.getTime() - 24 * 60 * 60 * 1000) // 1 day overlap for safety
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = new Date();

    return this.syncDateRange(fromDate, toDate, onProgress);
  }

  /**
   * Perform a full sync from a date range
   */
  async syncDateRange(
    fromDate: Date,
    toDate: Date,
    onProgress?: (count: number, total: number) => void
  ): Promise<{ success: boolean; newContracts: number; error?: string }> {
    // Check if already syncing
    if (await this.isSyncing()) {
      return { success: false, newContracts: 0, error: 'Sync already in progress' };
    }

    const startTime = Date.now();

    // Mark sync as running
    await prisma.syncState.upsert({
      where: { id: 'default' },
      create: { id: 'default', isRunning: true, startedAt: new Date() },
      update: { isRunning: true, startedAt: new Date(), error: null },
    });

    try {
      console.log(`Starting TED sync from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

      const query = TedApiClient.buildContractAwardQuery(fromDate, toDate);
      console.log(`Query: ${query}`);

      let processedCount = 0;
      let newContracts = 0;
      let noteworthyContracts: ContractData[] = [];

      // Use iteration mode for unlimited results
      for await (const batch of tedApiClient.iterateAll(query, TED_FIELDS, { limit: 100 })) {
        const contractsData = batch
          .flatMap((result) => this.transformToContracts(result))
          .filter((contract) => contract.amount > 0);

        // Upsert contracts to database
        for (const contract of contractsData) {
          try {
            const existing = await prisma.contract.findUnique({
              where: { tedNoticeId: contract.tedNoticeId },
            });

            if (!existing) {
              await prisma.contract.create({ data: contract });
              newContracts++;

              // Track noteworthy contracts for X posting queue
              if (contract.isNoteworthy) {
                noteworthyContracts.push(contract);
              }
            } else {
              // Update existing contract
              await prisma.contract.update({
                where: { tedNoticeId: contract.tedNoticeId },
                data: contract,
              });
            }
          } catch (error) {
            console.warn(`Failed to upsert contract ${contract.id}:`, error);
          }
        }

        processedCount += batch.length;

        if (onProgress) {
          onProgress(processedCount, -1);
        }

        console.log(`Processed ${processedCount} notices, ${newContracts} new contracts`);
      }

      // Queue noteworthy contracts for X posting
      for (const contract of noteworthyContracts) {
        try {
          await prisma.xPostQueue.create({
            data: {
              contractId: contract.id,
              status: 'pending',
            },
          });
        } catch (error) {
          // Ignore duplicate queue entries
        }
      }

      const syncDuration = (Date.now() - startTime) / 1000;

      // Update sync state
      await prisma.syncState.update({
        where: { id: 'default' },
        data: {
          lastSyncAt: new Date(),
          lastSyncCount: newContracts,
          lastSyncDuration: syncDuration,
          isRunning: false,
          error: null,
        },
      });

      console.log(`Sync complete: ${newContracts} new contracts in ${syncDuration.toFixed(1)}s`);
      console.log(`${noteworthyContracts.length} noteworthy contracts queued for X posting`);

      return { success: true, newContracts };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sync failed:', errorMessage);

      // Update sync state with error
      await prisma.syncState.update({
        where: { id: 'default' },
        data: {
          isRunning: false,
          error: errorMessage,
        },
      });

      return { success: false, newContracts: 0, error: errorMessage };
    }
  }

  /**
   * Determine if a contract is noteworthy (for X posting)
   */
  private isNoteworthy(amount: number, cpvCode: string | null): { isNoteworthy: boolean; reason: string | null } {
    const reasons: string[] = [];

    if (amount >= NOTEWORTHY_THRESHOLD) {
      reasons.push(`High value: €${(amount / 1_000_000).toFixed(1)}M`);
    }

    const cpvPrefix = cpvCode?.substring(0, 2);
    if (cpvPrefix && NOTEWORTHY_CATEGORIES.includes(cpvPrefix)) {
      const cpvInfo = cpvDescriptions[cpvPrefix];
      reasons.push(`Category: ${cpvInfo?.description || cpvPrefix}`);
    }

    return {
      isNoteworthy: reasons.length > 0,
      reason: reasons.length > 0 ? reasons.join('; ') : null,
    };
  }

  private extractMultilingualText(
    field: Record<string, string | string[]> | undefined,
    fallback: string = ''
  ): string {
    if (!field) return fallback;
    const value = field['ENG'] || field['eng'] || Object.values(field)[0];
    if (Array.isArray(value)) {
      return value[0] || fallback;
    }
    return String(value || fallback);
  }

  private extractFirstArrayValue(field: string[] | undefined, fallback: string = ''): string {
    if (!field || !Array.isArray(field) || field.length === 0) return fallback;
    return String(field[0]);
  }

  private cleanTitle(rawTitle: string): string {
    const parts = rawTitle.split(' – ');
    if (parts.length >= 3) {
      return parts.slice(2).join(' – ').trim();
    } else if (parts.length === 2) {
      return parts[1].trim();
    }
    return rawTitle.trim();
  }

  private convertToEur(amount: number, currency: string): number {
    const rate = EXCHANGE_RATES_TO_EUR[currency.toUpperCase()];
    if (rate) {
      return Math.round(amount * rate * 100) / 100;
    }
    return amount;
  }

  private transformToContracts(result: TedNoticeResult): ContractData[] {
    try {
      const winnerStatuses = result['winner-selection-status'] as string[] | undefined;
      const hasWinnerSelected = winnerStatuses?.some((status) => status === 'selec-w');

      if (!hasWinnerSelected) {
        return [];
      }

      const frameworkTypes = result['framework-agreement-lot'] as string[] | undefined;
      const isFrameworkAgreement = frameworkTypes?.some((type) => type !== 'none');

      if (isFrameworkAgreement) {
        return [];
      }

      const totalValue = typeof result['total-value'] === 'number' ? result['total-value'] : 0;
      if (totalValue <= 0) {
        return [];
      }

      const buyerCountryRaw = this.extractFirstArrayValue(result['buyer-country']);
      const countryCode = this.convertCountryCode(buyerCountryRaw);
      const countryInfo = countryCoordinates[countryCode];

      if (!countryInfo) {
        return [];
      }

      const cpvCode = this.extractFirstArrayValue(result['classification-cpv'], '');
      const cpvPrefix = cpvCode.substring(0, 2);
      const cpvInfo = cpvDescriptions[cpvPrefix] || { description: 'Other', category: 'Other' };

      const pdStr = String(result['publication-date'] || '');
      const publicationDateStr = pdStr.split('+')[0].split('T')[0];
      const publicationDate = new Date(publicationDateStr);

      // Validate date
      if (isNaN(publicationDate.getTime())) {
        return [];
      }

      const rawTitle = this.extractMultilingualText(
        result['notice-title'] as Record<string, string>,
        `Contract in ${countryInfo.name}`
      );
      const title = this.cleanTitle(rawTitle);

      const lotDescription = this.extractMultilingualText(
        result['description-lot'] as Record<string, string[]>,
        ''
      );
      const description = lotDescription || `${cpvInfo.description} contract in ${countryInfo.name}`;

      const buyerName = this.extractMultilingualText(
        result['buyer-name'] as Record<string, string[]>,
        'Public Authority'
      );

      const city = this.extractMultilingualText(
        result['buyer-city'] as Record<string, string[]>,
        countryInfo.name
      );

      const procedureType = this.extractFirstArrayValue(result['procedure-type'], 'Open procedure');
      const noticeType = this.extractFirstArrayValue(result['notice-type'], 'Contract award notice');
      const conclusionDates = result['contract-conclusion-date'] as string[] | undefined;
      const lotIdentifiers = result['result-lot-identifier'] as string[] | undefined;
      const winnerNames = this.extractAllWinnerNames(result['winner-name'] as Record<string, string[]> | undefined);

      const numAwards = conclusionDates?.length || lotIdentifiers?.length || 1;
      const shouldSplit = numAwards > 1 && (conclusionDates?.length === numAwards || lotIdentifiers?.length === numAwards);

      if (!shouldSplit) {
        const rawAmount = typeof result['total-value'] === 'number' ? result['total-value'] : 0;
        const originalCurrency = this.extractFirstArrayValue(result['total-value-cur'] as string[] | undefined, 'EUR');
        const amount = this.convertToEur(rawAmount, originalCurrency);

        const contractorName = winnerNames[0] || 'Not disclosed';
        const contractDateStr = conclusionDates?.[0]?.split('+')[0]?.split('T')[0];
        const contractDate = contractDateStr ? new Date(contractDateStr) : publicationDate;

        const latOffset = (Math.random() - 0.5) * 0.6;
        const lngOffset = (Math.random() - 0.5) * 0.6;

        const noteworthy = this.isNoteworthy(amount, cpvCode);

        return [{
          id: `TED-${result['publication-number']}`,
          tedNoticeId: String(result['publication-number']),
          title,
          description,
          amount,
          currency: 'EUR',
          publishDate: isNaN(contractDate.getTime()) ? publicationDate : contractDate,
          deadline: publicationDate,
          country: countryInfo.name,
          countryCode,
          nuts: countryCode,
          region: countryCode,
          city,
          lat: Math.round((countryInfo.lat + latOffset) * 10000) / 10000,
          lng: Math.round((countryInfo.lng + lngOffset) * 10000) / 10000,
          buyerName,
          buyerType: 'Public authority',
          contractorName,
          cpvCode,
          cpvDescription: cpvInfo.description,
          procedureType,
          noticeType,
          isNoteworthy: noteworthy.isNoteworthy,
          noteworthyReason: noteworthy.reason,
        }];
      }

      // Multiple awards per notice
      const contracts: ContractData[] = [];
      const totalCurrency = this.extractFirstArrayValue(result['total-value-cur'] as string[] | undefined, 'EUR');
      const valuePerAward = totalValue / numAwards;

      for (let i = 0; i < numAwards; i++) {
        const lotId = lotIdentifiers?.[i] || `AWARD-${i + 1}`;
        const conclusionDateStr = conclusionDates?.[i]?.split('+')[0]?.split('T')[0];
        const conclusionDate = conclusionDateStr ? new Date(conclusionDateStr) : publicationDate;
        const winnerName = winnerNames[i] || winnerNames[0] || 'Not disclosed';

        const amount = this.convertToEur(valuePerAward, totalCurrency);

        const latOffset = (Math.random() - 0.5) * 0.6;
        const lngOffset = (Math.random() - 0.5) * 0.6;

        const noteworthy = this.isNoteworthy(amount, cpvCode);

        contracts.push({
          id: `TED-${result['publication-number']}-${lotId}`,
          tedNoticeId: `${result['publication-number']}-${lotId}`,
          title: `${title} (${lotId})`,
          description,
          amount,
          currency: 'EUR',
          publishDate: isNaN(conclusionDate.getTime()) ? publicationDate : conclusionDate,
          deadline: publicationDate,
          country: countryInfo.name,
          countryCode,
          nuts: countryCode,
          region: countryCode,
          city,
          lat: Math.round((countryInfo.lat + latOffset) * 10000) / 10000,
          lng: Math.round((countryInfo.lng + lngOffset) * 10000) / 10000,
          buyerName,
          buyerType: 'Public authority',
          contractorName: winnerName,
          cpvCode,
          cpvDescription: cpvInfo.description,
          procedureType,
          noticeType,
          isNoteworthy: noteworthy.isNoteworthy,
          noteworthyReason: noteworthy.reason,
        });
      }

      return contracts;
    } catch (error) {
      console.warn('Failed to transform notice:', result['publication-number'], error);
      return [];
    }
  }

  private extractAllWinnerNames(field: Record<string, string[]> | undefined): string[] {
    if (!field) return [];
    const values = field['ENG'] || field['eng'] || Object.values(field)[0];
    if (Array.isArray(values)) {
      return values.map((v) => String(v).trim()).filter((v) => v);
    }
    return [];
  }

  private convertCountryCode(iso3: string): string {
    const iso3to2: Record<string, string> = {
      DEU: 'DE', FRA: 'FR', ITA: 'IT', ESP: 'ES', NLD: 'NL', BEL: 'BE',
      POL: 'PL', SWE: 'SE', AUT: 'AT', PRT: 'PT', GRC: 'GR', IRL: 'IE',
      CZE: 'CZ', ROU: 'RO', DNK: 'DK', FIN: 'FI', HUN: 'HU', HRV: 'HR',
      BGR: 'BG', SVK: 'SK', LTU: 'LT', SVN: 'SI', LVA: 'LV', EST: 'EE',
      CYP: 'CY', LUX: 'LU', MLT: 'MT', NOR: 'NO', ISL: 'IS', LIE: 'LI',
      CHE: 'CH', GBR: 'UK',
    };
    return iso3to2[iso3.toUpperCase()] || iso3.substring(0, 2).toUpperCase();
  }
}

export const syncService = new SyncService();
