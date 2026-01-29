import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Globe, FileText, TrendingUp, ArrowLeft, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EuropeMap from '../components/Map/EuropeMap';
import { fetchSummaryStats, fetchCountryStats, fetchCategoryStats, fetchCountryMapData, fetchContracts, fetchCityMapData, CityMapData, DashboardFilters } from '../api/contracts';
import { formatCompactCurrency, formatCurrency, formatNumber, formatDate } from '../utils/format';
import type { SummaryStats, CountryStats, CategoryStats, CountryMapData, Contract } from '../types';

// Country names for the filter dropdown
const COUNTRY_NAMES: Record<string, string> = {
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'PL': 'Poland', 'SE': 'Sweden', 'AT': 'Austria', 'PT': 'Portugal',
  'GR': 'Greece', 'IE': 'Ireland', 'CZ': 'Czech Republic', 'RO': 'Romania', 'DK': 'Denmark',
  'FI': 'Finland', 'HU': 'Hungary', 'HR': 'Croatia', 'BG': 'Bulgaria', 'SK': 'Slovakia',
  'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia', 'LU': 'Luxembourg',
};

const CHART_COLORS = [
  '#003399', '#1e56a0', '#3b82f6', '#60a5fa', '#93c5fd',
  '#155e75', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9',
  '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe',
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [countryMapData, setCountryMapData] = useState<CountryMapData[]>([]);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [cityData, setCityData] = useState<CityMapData[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const loadData = useCallback(async (currentFilters: DashboardFilters) => {
    try {
      setLoading(true);
      const [summaryData, countries, categories, mapData, contractsRes] = await Promise.all([
        fetchSummaryStats(currentFilters),
        fetchCountryStats(currentFilters),
        fetchCategoryStats(currentFilters),
        fetchCountryMapData(),
        fetchContracts(currentFilters.country ? { country: currentFilters.country } : undefined, 1, 10),
      ]);
      setSummary(summaryData);
      setCountryStats(countries);
      setCategoryStats(categories);
      setCountryMapData(mapData);
      setRecentContracts(contractsRes.data);

      // Set available filter options from first load (unfiltered)
      if (!currentFilters.country && !currentFilters.year) {
        setAvailableCountries(summaryData.countryList || []);
        setAvailableYears(summaryData.availableYears || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [loadData, filters]);

  // Fetch city data when a country is selected
  useEffect(() => {
    if (!selectedCountry) {
      setCityData([]);
      return;
    }
    async function loadCityData() {
      try {
        setLoadingCities(true);
        const cities = await fetchCityMapData(selectedCountry!);
        setCityData(cities);
      } catch (err) {
        console.error('Failed to load city data:', err);
        setCityData([]);
      } finally {
        setLoadingCities(false);
      }
    }
    loadCityData();
  }, [selectedCountry]);

  const handleCountryClick = (code: string) => {
    if (code === selectedCountry) {
      // Clicking same country again deselects
      setSelectedCountry(undefined);
    } else {
      setSelectedCountry(code);
    }
  };

  const handleBackToEurope = () => {
    setSelectedCountry(undefined);
  };

  const selectedCountryName = countryMapData.find(c => c.countryCode === selectedCountry)?.countryName;

  if (loading) return <LoadingSpinner message="Loading procurement data..." size="lg" />;
  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-600 text-lg font-medium">Failed to load data</p>
      <p className="text-gray-500 mt-2">{error}</p>
    </div>
  );

  const topCountries = countryStats.slice(0, 10).map(c => ({
    name: c.countryName,
    amount: c.totalAmount,
    count: c.contractCount,
  }));

  const topCategories = categoryStats.slice(0, 8).map((c, i) => ({
    name: c.category.length > 25 ? c.category.slice(0, 22) + '...' : c.category,
    value: c.totalAmount,
    count: c.contractCount,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const hasActiveFilters = filters.country || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Data period and filters header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {summary?.dateRange?.earliest && summary?.dateRange?.latest && (
            <p className="text-xs text-gray-500">
              Data period: {formatDate(summary.dateRange.earliest)} — {formatDate(summary.dateRange.latest)}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-eu-blue transition-colors"
        >
          <Filter className="w-4 h-4" />
          Advanced filters
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-eu-blue text-white rounded-full">
              {[filters.country, filters.year].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Country filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-eu-blue focus:border-eu-blue"
              >
                <option value="">All countries</option>
                {availableCountries.map(code => (
                  <option key={code} value={code}>
                    {COUNTRY_NAMES[code] || code}
                  </option>
                ))}
              </select>
            </div>

            {/* Year filter */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-eu-blue focus:border-eu-blue"
              >
                <option value="">All years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Clear button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="mt-3 text-xs text-gray-500">
              Showing statistics filtered by: {[
                filters.country && (COUNTRY_NAMES[filters.country] || filters.country),
                filters.year
              ].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contracts"
          value={formatNumber(summary?.totalContracts || 0)}
          subtitle="Across all EU countries"
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Total Spending"
          value={formatCompactCurrency(summary?.totalAmount || 0)}
          subtitle="Public procurement value"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Countries"
          value={String(summary?.totalCountries || 0)}
          subtitle="EU member states represented"
          icon={<Globe className="w-6 h-6" />}
        />
        <StatCard
          title="Avg. Contract"
          value={formatCompactCurrency(summary?.averageAmount || 0)}
          subtitle="Average contract value"
          icon={<BarChart3 className="w-6 h-6" />}
        />
      </div>

      {/* Map and Country Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedCountry && (
                  <button
                    onClick={handleBackToEurope}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-eu-blue transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCountry
                    ? `Cities in ${selectedCountryName}`
                    : 'Procurement Spending Across Europe'}
                </h2>
              </div>
              {selectedCountry && (
                <span className="text-xs text-gray-500">
                  Click a city to see contracts
                </span>
              )}
            </div>
            {loadingCities ? (
              <div className="h-[500px] flex items-center justify-center">
                <LoadingSpinner message={`Loading cities in ${selectedCountryName}...`} />
              </div>
            ) : (
              <EuropeMap
                countryData={countryMapData}
                cityData={selectedCountry ? cityData : undefined}
                onCountryClick={handleCountryClick}
                onCityClick={(cityName) => navigate(`/contracts?country=${selectedCountry}&search=${encodeURIComponent(cityName)}`)}
                selectedCountry={selectedCountry}
              />
            )}
          </div>
        </div>

        {/* Country Bar Chart */}
        <div className="card">
          <h2 className="card-header">Top Countries by Spending</h2>
          <div className="h-[460px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCountries} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatCompactCurrency(v)}
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  fontSize={11}
                  tick={{ fill: '#374151' }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total Spending']}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="amount" fill="#003399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Pie Chart and Recent Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="card">
          <h2 className="card-header">Spending by Category</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCompactCurrency(value)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Contracts</h2>
            <button
              onClick={() => navigate('/contracts')}
              className="text-sm text-eu-blue hover:text-eu-dark-blue font-medium"
            >
              View all &rarr;
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[340px]">
            {recentContracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="p-3 rounded-lg border border-gray-100 hover:border-eu-light-blue hover:bg-eu-pale-blue cursor-pointer transition-colors duration-150"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{contract.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{contract.buyerName || contract.country}</p>
                  </div>
                  <p className="text-sm font-semibold text-eu-blue whitespace-nowrap">
                    {formatCompactCurrency(contract.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span>{contract.country}</span>
                  <span>{contract.publishDate ? formatDate(contract.publishDate) : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
