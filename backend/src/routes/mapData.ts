import { Router, Request, Response } from 'express';
import { mockContracts } from '../data/mockContracts.js';
import { getCountryName, countryCoordinates } from '../data/countryCoordinates.js';

const router = Router();

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * GET /api/map-data
 * Return GeoJSON FeatureCollection with contract locations as points
 * Query params: country, minAmount, maxAmount, category
 */
router.get('/', (req: Request<{}, {}, {}, {
  country?: string;
  minAmount?: string;
  maxAmount?: string;
  category?: string;
}>, res: Response) => {
  try {
    let filtered = [...mockContracts];

    // Apply filters
    if (req.query.country) {
      const countries = req.query.country.split(',').map(c => c.trim().toUpperCase());
      filtered = filtered.filter(c =>
        countries.includes(c.countryCode.toUpperCase())
      );
    }

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

    if (req.query.category) {
      const category = req.query.category.toLowerCase();
      filtered = filtered.filter(c =>
        c.cpvDescription.toLowerCase().includes(category)
      );
    }

    const featureCollection: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: filtered.map(contract => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [contract.lng, contract.lat], // GeoJSON uses [lng, lat]
        },
        properties: {
          id: contract.id,
          title: contract.title,
          amount: contract.amount,
          currency: contract.currency,
          country: contract.country,
          countryCode: contract.countryCode,
          city: contract.city,
          region: contract.region,
          buyerName: contract.buyerName,
          contractorName: contract.contractorName,
          cpvCode: contract.cpvCode,
          cpvDescription: contract.cpvDescription,
          publishDate: contract.publishDate,
          procedureType: contract.procedureType,
          tedNoticeId: contract.tedNoticeId,
        },
      })),
    };

    res.json(featureCollection);
  } catch (error) {
    console.error('Error generating map data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/map-data/countries
 * Return summary per country for choropleth map coloring
 */
router.get('/countries', (_req: Request, res: Response) => {
  try {
    const countryMap = new Map<
      string,
      {
        countryCode: string;
        country: string;
        totalAmount: number;
        contractCount: number;
        lat: number;
        lng: number;
      }
    >();

    for (const contract of mockContracts) {
      const existing = countryMap.get(contract.countryCode);
      if (existing) {
        existing.totalAmount += contract.amount;
        existing.contractCount += 1;
      } else {
        const countryInfo = countryCoordinates.find(c => c.code === contract.countryCode);
        countryMap.set(contract.countryCode, {
          countryCode: contract.countryCode,
          country: getCountryName(contract.countryCode),
          totalAmount: contract.amount,
          contractCount: 1,
          lat: countryInfo?.lat || 0,
          lng: countryInfo?.lng || 0,
        });
      }
    }

    const countrySummary = Array.from(countryMap.values())
      .map(entry => ({
        countryCode: entry.countryCode,
        country: entry.country,
        totalAmount: Math.round(entry.totalAmount * 100) / 100,
        contractCount: entry.contractCount,
        averageAmount: Math.round((entry.totalAmount / entry.contractCount) * 100) / 100,
        lat: entry.lat,
        lng: entry.lng,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({ data: countrySummary });
  } catch (error) {
    console.error('Error generating country map data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
