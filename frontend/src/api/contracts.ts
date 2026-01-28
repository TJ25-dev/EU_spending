import apiClient from './client';
import type {
  Contract,
  ContractFilters,
  PaginatedResponse,
  SummaryStats,
  CountryStats,
  CategoryStats,
  TopContractor,
  MapFeatureCollection,
  CountryMapData,
} from '../types';

/**
 * Fetch paginated contracts with optional filters
 */
export async function fetchContracts(
  filters?: ContractFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Contract>> {
  const params: Record<string, string | number> = {
    page,
    limit,
  };

  if (filters) {
    if (filters.country) params.country = filters.country;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.minAmount !== undefined) params.minAmount = filters.minAmount;
    if (filters.maxAmount !== undefined) params.maxAmount = filters.maxAmount;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
  }

  const response = await apiClient.get('/contracts', { params });
  // Backend returns { data: [...], pagination: {...} }
  return {
    data: response.data.data,
    total: response.data.pagination.totalItems,
    page: response.data.pagination.page,
    limit: response.data.pagination.limit,
    totalPages: response.data.pagination.totalPages,
  };
}

/**
 * Fetch a single contract by ID
 */
export async function fetchContractById(id: string): Promise<Contract> {
  const response = await apiClient.get(`/contracts/${id}`);
  return response.data.data;
}

/**
 * Fetch overall summary statistics
 */
export async function fetchSummaryStats(): Promise<SummaryStats> {
  const response = await apiClient.get('/stats/summary');
  const d = response.data.data;
  return {
    totalContracts: d.totalContracts,
    totalAmount: d.totalSpending,
    averageAmount: d.averageAmount,
    totalCountries: d.countriesCovered,
    totalContractors: 0,
    totalCategories: 0,
    dateRange: d.dateRange ? { earliest: d.dateRange.from, latest: d.dateRange.to } : undefined,
    monthlyTrend: d.monthlyTrend,
  };
}

/**
 * Fetch statistics aggregated by country
 */
export async function fetchCountryStats(): Promise<CountryStats[]> {
  const response = await apiClient.get('/stats/by-country');
  return (response.data.data || []).map((d: Record<string, unknown>) => ({
    countryCode: d.countryCode,
    countryName: d.country,
    totalAmount: d.totalAmount,
    contractCount: d.contractCount,
    averageAmount: d.averageAmount,
  }));
}

/**
 * Fetch statistics aggregated by category
 */
export async function fetchCategoryStats(): Promise<CategoryStats[]> {
  const response = await apiClient.get('/stats/by-category');
  return (response.data.data || []).map((d: Record<string, unknown>) => ({
    category: d.cpvDescription,
    totalAmount: d.totalAmount,
    contractCount: d.contractCount,
    averageAmount: d.averageAmount,
  }));
}

/**
 * Fetch top contractors ranked by total contract value
 */
export async function fetchTopContractors(limit: number = 10): Promise<TopContractor[]> {
  const response = await apiClient.get('/stats/top-contractors', {
    params: { limit },
  });
  return (response.data.data || []).map((d: Record<string, unknown>) => ({
    contractorName: d.contractorName,
    totalAmount: d.totalAmount,
    contractCount: d.contractCount,
    countries: d.countriesActive || [],
  }));
}

/**
 * Fetch GeoJSON map data for contract locations
 */
export async function fetchMapData(filters?: ContractFilters): Promise<MapFeatureCollection> {
  const params: Record<string, string | number> = {};

  if (filters) {
    if (filters.country) params.country = filters.country;
    if (filters.minAmount !== undefined) params.minAmount = filters.minAmount;
    if (filters.maxAmount !== undefined) params.maxAmount = filters.maxAmount;
    if (filters.category) params.category = filters.category;
  }

  const response = await apiClient.get('/map-data', { params });
  return response.data;
}

/**
 * Fetch country-level map data for choropleth visualization
 */
export async function fetchCountryMapData(): Promise<CountryMapData[]> {
  const response = await apiClient.get('/map-data/countries');
  return (response.data.data || []).map((d: Record<string, unknown>) => ({
    countryCode: d.countryCode,
    countryName: d.country,
    totalAmount: d.totalAmount,
    contractCount: d.contractCount,
    center: [d.lat, d.lng] as [number, number],
  }));
}
