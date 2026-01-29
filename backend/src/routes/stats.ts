import { Router, Request, Response } from 'express';
import { mockContracts, Contract } from '../data/mockContracts.js';
import { getCountryName } from '../data/countryCoordinates.js';

const router = Router();

// Helper function to filter contracts based on query params
function filterContracts(
  contracts: Contract[],
  filters: { country?: string; year?: string; category?: string }
): Contract[] {
  let filtered = contracts;

  const countryFilter = filters.country;
  if (countryFilter) {
    filtered = filtered.filter(c => c.countryCode === countryFilter.toUpperCase());
  }

  const yearFilter = filters.year;
  if (yearFilter) {
    filtered = filtered.filter(c => c.publishDate.startsWith(yearFilter));
  }

  const categoryFilter = filters.category;
  if (categoryFilter) {
    filtered = filtered.filter(c =>
      c.cpvCode.startsWith(categoryFilter) ||
      c.cpvDescription.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }

  return filtered;
}

/**
 * GET /api/stats/summary
 * Overall summary statistics
 * Query params: country, year, category
 */
router.get('/summary', (req: Request<{}, {}, {}, { country?: string; year?: string; category?: string }>, res: Response) => {
  try {
    const contracts = filterContracts(mockContracts, req.query);
    const totalContracts = contracts.length;
    const totalSpending = contracts.reduce((sum, c) => sum + c.amount, 0);
    const countries = new Set(contracts.map(c => c.countryCode));
    const dates = contracts.map(c => c.publishDate).filter(Boolean).sort();
    const averageAmount = totalContracts > 0 ? totalSpending / totalContracts : 0;

    // Get available years from all contracts (for filter dropdown)
    const allYears = [...new Set(mockContracts.map(c => c.publishDate?.substring(0, 4)).filter(Boolean))].sort();

    // Amount distribution
    const amountRanges = {
      under100k: contracts.filter(c => c.amount < 100000).length,
      '100kTo500k': contracts.filter(c => c.amount >= 100000 && c.amount < 500000).length,
      '500kTo1m': contracts.filter(c => c.amount >= 500000 && c.amount < 1000000).length,
      '1mTo5m': contracts.filter(c => c.amount >= 1000000 && c.amount < 5000000).length,
      '5mTo15m': contracts.filter(c => c.amount >= 5000000 && c.amount < 15000000).length,
      over15m: contracts.filter(c => c.amount >= 15000000).length,
    };

    // Procedure type breakdown
    const procedureTypes: Record<string, number> = {};
    for (const c of contracts) {
      procedureTypes[c.procedureType] = (procedureTypes[c.procedureType] || 0) + 1;
    }

    // Monthly spending trend
    const monthlySpending: Record<string, { month: string; total: number; count: number }> = {};
    for (const c of contracts) {
      const month = c.publishDate.substring(0, 7); // YYYY-MM
      if (!monthlySpending[month]) {
        monthlySpending[month] = { month, total: 0, count: 0 };
      }
      monthlySpending[month].total += c.amount;
      monthlySpending[month].count += 1;
    }
    const monthlyTrend = Object.values(monthlySpending).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    res.json({
      data: {
        totalContracts,
        totalSpending: Math.round(totalSpending * 100) / 100,
        averageAmount: Math.round(averageAmount * 100) / 100,
        countriesCovered: countries.size,
        countryList: Array.from(countries).sort(),
        availableYears: allYears,
        dateRange: {
          from: dates[0] || '',
          to: dates[dates.length - 1] || '',
        },
        amountDistribution: amountRanges,
        procedureTypes,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Error computing summary stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/by-country
 * Aggregated spending by country
 * Query params: year, category
 */
router.get('/by-country', (req: Request<{}, {}, {}, { year?: string; category?: string }>, res: Response) => {
  try {
    const contracts = filterContracts(mockContracts, req.query);
    const countryMap = new Map<
      string,
      {
        countryCode: string;
        country: string;
        totalAmount: number;
        contractCount: number;
        minAmount: number;
        maxAmount: number;
        categories: Set<string>;
      }
    >();

    for (const contract of contracts) {
      const existing = countryMap.get(contract.countryCode);
      if (existing) {
        existing.totalAmount += contract.amount;
        existing.contractCount += 1;
        existing.minAmount = Math.min(existing.minAmount, contract.amount);
        existing.maxAmount = Math.max(existing.maxAmount, contract.amount);
        existing.categories.add(contract.cpvDescription);
      } else {
        countryMap.set(contract.countryCode, {
          countryCode: contract.countryCode,
          country: getCountryName(contract.countryCode),
          totalAmount: contract.amount,
          contractCount: 1,
          minAmount: contract.amount,
          maxAmount: contract.amount,
          categories: new Set([contract.cpvDescription]),
        });
      }
    }

    const byCountry = Array.from(countryMap.values())
      .map(entry => ({
        countryCode: entry.countryCode,
        country: entry.country,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        contractCount: entry.contractCount,
        averageAmount: Math.round((entry.totalAmount / entry.contractCount) * 100) / 100,
        minAmount: Math.round(entry.minAmount * 100) / 100,
        maxAmount: Math.round(entry.maxAmount * 100) / 100,
        uniqueCategories: entry.categories.size,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({ data: byCountry });
  } catch (error) {
    console.error('Error computing country stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/by-category
 * Spending by CPV category
 * Query params: country, year
 */
router.get('/by-category', (req: Request<{}, {}, {}, { country?: string; year?: string }>, res: Response) => {
  try {
    const contracts = filterContracts(mockContracts, req.query);
    const categoryMap = new Map<
      string,
      {
        cpvCode: string;
        cpvDescription: string;
        totalAmount: number;
        contractCount: number;
        countries: Set<string>;
      }
    >();

    for (const contract of contracts) {
      // Group by top-level CPV category (first 2 digits)
      const topLevelCode = contract.cpvCode.substring(0, 2) + '000000';
      const existing = categoryMap.get(topLevelCode);

      if (existing) {
        existing.totalAmount += contract.amount;
        existing.contractCount += 1;
        existing.countries.add(contract.countryCode);
      } else {
        categoryMap.set(topLevelCode, {
          cpvCode: topLevelCode,
          cpvDescription: contract.cpvDescription,
          totalAmount: contract.amount,
          contractCount: 1,
          countries: new Set([contract.countryCode]),
        });
      }
    }

    const byCategory = Array.from(categoryMap.values())
      .map(entry => ({
        cpvCode: entry.cpvCode,
        cpvDescription: entry.cpvDescription,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        contractCount: entry.contractCount,
        averageAmount: Math.round((entry.totalAmount / entry.contractCount) * 100) / 100,
        countriesInvolved: entry.countries.size,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({ data: byCategory });
  } catch (error) {
    console.error('Error computing category stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/top-contractors
 * Top contractors by total contract value
 */
router.get('/top-contractors', (req: Request<{}, {}, {}, { limit?: string }>, res: Response) => {
  try {
    const topN = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

    const contractorMap = new Map<
      string,
      {
        contractorName: string;
        totalAmount: number;
        contractCount: number;
        countries: Set<string>;
        categories: Set<string>;
      }
    >();

    for (const contract of mockContracts) {
      const existing = contractorMap.get(contract.contractorName);
      if (existing) {
        existing.totalAmount += contract.amount;
        existing.contractCount += 1;
        existing.countries.add(contract.countryCode);
        existing.categories.add(contract.cpvDescription);
      } else {
        contractorMap.set(contract.contractorName, {
          contractorName: contract.contractorName,
          totalAmount: contract.amount,
          contractCount: 1,
          countries: new Set([contract.countryCode]),
          categories: new Set([contract.cpvDescription]),
        });
      }
    }

    const topContractors = Array.from(contractorMap.values())
      .map(entry => ({
        contractorName: entry.contractorName,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        contractCount: entry.contractCount,
        averageAmount: Math.round((entry.totalAmount / entry.contractCount) * 100) / 100,
        countriesActive: Array.from(entry.countries).sort(),
        categoryCount: entry.categories.size,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, topN);

    res.json({ data: topContractors });
  } catch (error) {
    console.error('Error computing contractor stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
