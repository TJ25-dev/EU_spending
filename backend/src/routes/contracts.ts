import { Router, Request, Response } from 'express';
import { mockContracts, Contract } from '../data/mockContracts.js';

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
router.get('/', (req: Request<{}, {}, {}, ContractQueryParams>, res: Response) => {
  try {
    let filtered: Contract[] = [...mockContracts];

    // Filter by country (supports comma-separated list)
    if (req.query.country) {
      const countries = req.query.country.split(',').map(c => c.trim().toUpperCase());
      filtered = filtered.filter(c =>
        countries.includes(c.countryCode.toUpperCase()) ||
        countries.some(country => c.country.toUpperCase().includes(country))
      );
    }

    // Filter by date range
    if (req.query.dateFrom) {
      const dateFrom = new Date(req.query.dateFrom);
      filtered = filtered.filter(c => new Date(c.publishDate) >= dateFrom);
    }
    if (req.query.dateTo) {
      const dateTo = new Date(req.query.dateTo);
      filtered = filtered.filter(c => new Date(c.publishDate) <= dateTo);
    }

    // Filter by amount range
    if (req.query.minAmount) {
      const minAmount = parseFloat(req.query.minAmount);
      if (!isNaN(minAmount)) {
        filtered = filtered.filter(c => c.amount >= minAmount);
      }
    }
    if (req.query.maxAmount) {
      const maxAmount = parseFloat(req.query.maxAmount);
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter(c => c.amount <= maxAmount);
      }
    }

    // Filter by CPV category (matches cpvDescription or cpvCode)
    if (req.query.category) {
      const category = req.query.category.toLowerCase();
      filtered = filtered.filter(c =>
        c.cpvDescription.toLowerCase().includes(category) ||
        c.cpvCode.startsWith(category)
      );
    }

    // Full-text search across title, description, buyerName, contractorName
    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.buyerName.toLowerCase().includes(search) ||
        c.contractorName.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search)
      );
    }

    // Sorting
    const sortBy = req.query.sortBy || 'publishDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortBy) {
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'publishDate':
          aVal = a.publishDate;
          bVal = b.publishDate;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'country':
          aVal = a.country;
          bVal = b.country;
          break;
        default:
          aVal = a.publishDate;
          bVal = b.publishDate;
      }

      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    // Pagination
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedContracts = filtered.slice(startIndex, endIndex);

    res.json({
      data: paginatedContracts,
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
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const contract = mockContracts.find(c => c.id === req.params.id);

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    res.json({ data: contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
