// Contract entity matching backend schema
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

// Filters for querying contracts
export interface ContractFilters {
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  search?: string;
}

// Country-level aggregated statistics
export interface CountryStats {
  countryCode: string;
  countryName: string;
  totalAmount: number;
  contractCount: number;
  averageAmount: number;
}

// Category-level aggregated statistics
export interface CategoryStats {
  category: string;
  totalAmount: number;
  contractCount: number;
  averageAmount: number;
  percentage?: number;
}

// Overall summary statistics
export interface SummaryStats {
  totalContracts: number;
  totalAmount: number;
  averageAmount: number;
  totalCountries: number;
  totalContractors: number;
  totalCategories: number;
  dateRange?: {
    earliest: string;
    latest: string;
  };
  monthlyTrend?: { month: string; total: number; count: number }[];
}

// GeoJSON feature for map display
export interface MapFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    country: string;
    countryName?: string;
    category?: string;
    contractorName: string;
    awardDate?: string;
  };
}

// GeoJSON FeatureCollection for map data
export interface MapFeatureCollection {
  type: 'FeatureCollection';
  features: MapFeature[];
}

// Country map data (for choropleth)
export interface CountryMapData {
  countryCode: string;
  countryName: string;
  totalAmount: number;
  contractCount: number;
  center?: [number, number]; // [latitude, longitude]
}

// Top contractor entry
export interface TopContractor {
  contractorName: string;
  totalAmount: number;
  contractCount: number;
  countries: string[];
}

// Paginated API response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API error response
export interface ApiError {
  message: string;
  statusCode: number;
  details?: string;
}
