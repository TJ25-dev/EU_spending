import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchContracts } from '../api/contracts';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import type { Contract, ContractFilters, PaginatedResponse } from '../types';

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' }, { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' }, { code: 'SK', name: 'Slovakia' },
  { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' },
];

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState<PaginatedResponse<Contract> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  const buildFilters = useCallback((): ContractFilters => {
    const f: ContractFilters = {};
    if (country) f.country = country;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (minAmount) f.minAmount = Number(minAmount);
    if (maxAmount) f.maxAmount = Number(maxAmount);
    if (search) f.search = search;
    return f;
  }, [country, dateFrom, dateTo, minAmount, maxAmount, search]);

  const loadContracts = useCallback(async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContracts(buildFilters(), p, 20);
      setResult(data);

      // Update URL params
      const params = new URLSearchParams();
      if (country) params.set('country', country);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (search) params.set('search', search);
      if (p > 1) params.set('page', String(p));
      setSearchParams(params, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [buildFilters, country, dateFrom, dateTo, minAmount, maxAmount, search, setSearchParams]);

  useEffect(() => {
    loadContracts(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    setPage(1);
    loadContracts(1);
  };

  const handleClearFilters = () => {
    setCountry('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSearch('');
    setPage(1);
    // Load with empty filters
    setTimeout(() => loadContracts(1), 0);
  };

  const hasActiveFilters = country || dateFrom || dateTo || minAmount || maxAmount || search;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and search EU public procurement contracts
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card !p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts, buyers, contractors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-eu-pale-blue border-eu-blue' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-eu-blue" />
            )}
          </button>
          <button onClick={handleApplyFilters} className="btn-primary">
            Search
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
              >
                <option value="">All Countries</option>
                {EU_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Amount (EUR)</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Amount (EUR)</label>
              <input
                type="number"
                placeholder="No limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="input-field"
              />
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-5">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {result && (
        <p className="text-sm text-gray-500">
          Showing {result.data.length} of {formatNumber(result.total)} contracts
          {hasActiveFilters && ' (filtered)'}
        </p>
      )}

      {/* Loading / Error / Results */}
      {loading ? (
        <LoadingSpinner message="Loading contracts..." />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 text-lg">No contracts found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          {/* Contract Table */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Country</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Buyer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Contractor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((contract) => (
                    <tr
                      key={contract.id}
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className="hover:bg-eu-pale-blue cursor-pointer transition-colors duration-100"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[300px]">
                          {contract.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 md:hidden">
                          {contract.country}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {contract.country}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(contract.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell truncate max-w-[200px]">
                        {contract.buyerName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell truncate max-w-[200px]">
                        {contract.contractorName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                        {contract.publishDate ? formatDate(contract.publishDate) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {result.page} of {result.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="btn-secondary !px-3 !py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, result.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(page - 2, result.totalPages - 4));
                  const p = startPage + i;
                  if (p > result.totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-eu-blue text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(result.totalPages, page + 1))}
                  disabled={page >= result.totalPages}
                  className="btn-secondary !px-3 !py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractsPage;
