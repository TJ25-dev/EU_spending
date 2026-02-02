import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/index.js';

const router = Router();

interface ContractQueryParams {
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  category?: string;
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * GET /api/contracts
 * List contracts with filtering, sorting, and pagination
 */
router.get('/', async (req: Request<{}, {}, {}, ContractQueryParams>, res: Response) => {
  try {
    const where: Prisma.ContractWhereInput = {};

    // Filter by country (supports comma-separated list)
    if (req.query.country) {
      const countries = req.query.country.split(',').map((c) => c.trim().toUpperCase());
      where.OR = [
        { countryCode: { in: countries } },
        {
          country: {
            in: countries.map((c) => c.charAt(0) + c.slice(1).toLowerCase()),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filter by date range
    if (req.query.dateFrom || req.query.dateTo) {
      where.publishDate = {};
      if (req.query.dateFrom) {
        where.publishDate.gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        where.publishDate.lte = new Date(req.query.dateTo);
      }
    }

    // Filter by amount range
    if (req.query.minAmount || req.query.maxAmount) {
      where.amount = {};
      if (req.query.minAmount) {
        const minAmount = parseFloat(req.query.minAmount);
        if (!isNaN(minAmount)) {
          where.amount.gte = minAmount;
        }
      }
      if (req.query.maxAmount) {
        const maxAmount = parseFloat(req.query.maxAmount);
        if (!isNaN(maxAmount)) {
          where.amount.lte = maxAmount;
        }
      }
    }

    // Filter by CPV category
    if (req.query.category) {
      const category = req.query.category.toLowerCase();
      where.OR = [
        { cpvDescription: { contains: category, mode: 'insensitive' } },
        { cpvCode: { startsWith: category } },
      ];
    }

    // Full-text search across title, description, buyerName, contractorName, city
    if (req.query.search) {
      const search = req.query.search;
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { buyerName: { contains: search, mode: 'insensitive' } },
            { contractorName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || 'publishDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.ContractOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'amount':
        orderBy.amount = sortOrder;
        break;
      case 'publishDate':
        orderBy.publishDate = sortOrder;
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      case 'country':
        orderBy.country = sortOrder;
        break;
      default:
        orderBy.publishDate = sortOrder;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [contracts, totalItems] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // Transform dates to ISO strings for JSON response
    const data = contracts.map((c) => ({
      ...c,
      publishDate: c.publishDate.toISOString().split('T')[0],
      deadline: c.deadline?.toISOString().split('T')[0] || null,
    }));

    res.json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/contracts/:id
 * Get a single contract by ID
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    // Transform dates for JSON response
    const data = {
      ...contract,
      publishDate: contract.publishDate.toISOString().split('T')[0],
      deadline: contract.deadline?.toISOString().split('T')[0] || null,
    };

    res.json({ data });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
