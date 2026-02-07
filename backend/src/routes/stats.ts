import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getCountryName } from '../data/countryCoordinates.js';

const router = Router();

/**
 * GET /api/stats/summary
 * Overall summary statistics
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    // Get aggregate stats
    const [aggregates, countryCount, dateRange, contracts] = await Promise.all([
      prisma.contract.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.contract.groupBy({
        by: ['countryCode'],
      }),
      prisma.contract.aggregate({
        _min: { publishDate: true },
        _max: { publishDate: true },
      }),
      prisma.contract.findMany({
        select: {
          amount: true,
          procedureType: true,
          publishDate: true,
        },
      }),
    ]);

    const totalContracts = aggregates._count;
    const totalSpending = aggregates._sum.amount || 0;
    const averageAmount = aggregates._avg.amount || 0;

    // Amount distribution
    const amountRanges = {
      under100k: contracts.filter((c) => c.amount < 100000).length,
      '100kTo500k': contracts.filter((c) => c.amount >= 100000 && c.amount < 500000).length,
      '500kTo1m': contracts.filter((c) => c.amount >= 500000 && c.amount < 1000000).length,
      '1mTo5m': contracts.filter((c) => c.amount >= 1000000 && c.amount < 5000000).length,
      '5mTo15m': contracts.filter((c) => c.amount >= 5000000 && c.amount < 15000000).length,
      over15m: contracts.filter((c) => c.amount >= 15000000).length,
    };

    // Procedure type breakdown
    const procedureTypes: Record<string, number> = {};
    for (const c of contracts) {
      if (c.procedureType) {
        procedureTypes[c.procedureType] = (procedureTypes[c.procedureType] || 0) + 1;
      }
    }

    // Monthly spending trend
    const monthlySpending: Record<string, { month: string; total: number; count: number }> = {};
    for (const c of contracts) {
      const month = c.publishDate.toISOString().substring(0, 7); // YYYY-MM
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
        countriesCovered: countryCount.length,
        countryList: countryCount.map((c) => c.countryCode).sort(),
        dateRange: {
          from: dateRange._min.publishDate?.toISOString().split('T')[0],
          to: dateRange._max.publishDate?.toISOString().split('T')[0],
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
 */
router.get('/by-country', async (_req: Request, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      select: {
        countryCode: true,
        amount: true,
        cpvDescription: true,
      },
    });

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
        if (contract.cpvDescription) {
          existing.categories.add(contract.cpvDescription);
        }
      } else {
        countryMap.set(contract.countryCode, {
          countryCode: contract.countryCode,
          country: getCountryName(contract.countryCode),
          totalAmount: contract.amount,
          contractCount: 1,
          minAmount: contract.amount,
          maxAmount: contract.amount,
          categories: new Set(contract.cpvDescription ? [contract.cpvDescription] : []),
        });
      }
    }

    const byCountry = Array.from(countryMap.values())
      .map((entry) => ({
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
 */
router.get('/by-category', async (_req: Request, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      select: {
        cpvCode: true,
        cpvDescription: true,
        amount: true,
        countryCode: true,
      },
    });

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
      if (!contract.cpvCode) continue;

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
          cpvDescription: contract.cpvDescription || 'Other',
          totalAmount: contract.amount,
          contractCount: 1,
          countries: new Set([contract.countryCode]),
        });
      }
    }

    const byCategory = Array.from(categoryMap.values())
      .map((entry) => ({
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
 * Top contractors by total contract value with market share and summary stats
 */
router.get('/top-contractors', async (req: Request<{}, {}, {}, { limit?: string }>, res: Response) => {
  try {
    const topN = Math.min(100, Math.max(1, parseInt(req.query.limit || '30', 10)));

    const contracts = await prisma.contract.findMany({
      select: {
        contractorName: true,
        amount: true,
        countryCode: true,
        cpvDescription: true,
      },
    });

    // Track overall totals
    let overallTotalAmount = 0;
    let overallContractCount = 0;

    // Track per-contractor data with country counts
    const contractorMap = new Map<
      string,
      {
        contractorName: string;
        totalAmount: number;
        contractCount: number;
        countryCounts: Map<string, number>;
        categories: Set<string>;
      }
    >();

    for (const contract of contracts) {
      overallTotalAmount += contract.amount;
      overallContractCount += 1;

      const name = contract.contractorName || 'Not disclosed';
      const existing = contractorMap.get(name);
      if (existing) {
        existing.totalAmount += contract.amount;
        existing.contractCount += 1;
        existing.countryCounts.set(
          contract.countryCode,
          (existing.countryCounts.get(contract.countryCode) || 0) + 1
        );
        if (contract.cpvDescription) {
          existing.categories.add(contract.cpvDescription);
        }
      } else {
        const countryCounts = new Map<string, number>();
        countryCounts.set(contract.countryCode, 1);
        contractorMap.set(name, {
          contractorName: name,
          totalAmount: contract.amount,
          contractCount: 1,
          countryCounts,
          categories: new Set(contract.cpvDescription ? [contract.cpvDescription] : []),
        });
      }
    }

    // Sort and slice to get top contractors
    const sortedContractors = Array.from(contractorMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, topN);

    // Calculate summary stats
    const top10 = sortedContractors.slice(0, 10);
    const top10TotalAmount = top10.reduce((sum, c) => sum + c.totalAmount, 0);
    const top10ContractCount = top10.reduce((sum, c) => sum + c.contractCount, 0);

    const topNTotalAmount = sortedContractors.reduce((sum, c) => sum + c.totalAmount, 0);
    const topNContractCount = sortedContractors.reduce((sum, c) => sum + c.contractCount, 0);

    // Format contractors with rank and market share
    const topContractors = sortedContractors.map((entry, index) => {
      // Get top 3 countries by contract count
      const topCountries = Array.from(entry.countryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code, count]) => ({
          code,
          name: getCountryName(code),
          count,
        }));

      // Get top 3 categories
      const topCategories = Array.from(entry.categories).slice(0, 3);

      return {
        rank: index + 1,
        contractorName: entry.contractorName,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        contractCount: entry.contractCount,
        averageAmount: Math.round((entry.totalAmount / entry.contractCount) * 100) / 100,
        marketShare: Math.round((entry.totalAmount / overallTotalAmount) * 10000) / 100,
        topCountries,
        topCategories,
        countriesActive: entry.countryCounts.size,
      };
    });

    res.json({
      data: topContractors,
      summary: {
        overallTotalAmount: Math.round(overallTotalAmount * 100) / 100,
        overallContractCount,
        top10TotalAmount: Math.round(top10TotalAmount * 100) / 100,
        top10Percentage: Math.round((top10TotalAmount / overallTotalAmount) * 10000) / 100,
        top10ContractCount,
        topNTotalAmount: Math.round(topNTotalAmount * 100) / 100,
        topNPercentage: Math.round((topNTotalAmount / overallTotalAmount) * 10000) / 100,
        topNContractCount,
      },
    });
  } catch (error) {
    console.error('Error computing contractor stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
