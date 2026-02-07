import React, { useEffect, useState } from 'react';
import { Building2, TrendingUp, Search } from 'lucide-react';
import { fetchTopContractors } from '../api/contracts';
import LoadingSpinner from '../components/LoadingSpinner';
import type { TopContractor, TopContractorsSummary } from '../types';

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  FR: '\u{1F1EB}\u{1F1F7}', DE: '\u{1F1E9}\u{1F1EA}', PL: '\u{1F1F5}\u{1F1F1}',
  IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}', SE: '\u{1F1F8}\u{1F1EA}', AT: '\u{1F1E6}\u{1F1F9}',
  DK: '\u{1F1E9}\u{1F1F0}', FI: '\u{1F1EB}\u{1F1EE}', PT: '\u{1F1F5}\u{1F1F9}',
  IE: '\u{1F1EE}\u{1F1EA}', CZ: '\u{1F1E8}\u{1F1FF}', RO: '\u{1F1F7}\u{1F1F4}',
  GR: '\u{1F1EC}\u{1F1F7}', HU: '\u{1F1ED}\u{1F1FA}', BG: '\u{1F1E7}\u{1F1EC}',
  HR: '\u{1F1ED}\u{1F1F7}', SK: '\u{1F1F8}\u{1F1F0}', SI: '\u{1F1F8}\u{1F1EE}',
  LT: '\u{1F1F1}\u{1F1F9}', LV: '\u{1F1F1}\u{1F1FB}', EE: '\u{1F1EA}\u{1F1EA}',
  CY: '\u{1F1E8}\u{1F1FE}', MT: '\u{1F1F2}\u{1F1F9}', LU: '\u{1F1F1}\u{1F1FA}',
  NO: '\u{1F1F3}\u{1F1F4}', IS: '\u{1F1EE}\u{1F1F8}', LI: '\u{1F1F1}\u{1F1EE}',
  CH: '\u{1F1E8}\u{1F1ED}', GB: '\u{1F1EC}\u{1F1E7}', UK: '\u{1F1EC}\u{1F1E7}',
};

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `\u20AC${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `\u20AC${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `\u20AC${(amount / 1_000).toFixed(0)}K`;
  }
  return `\u20AC${amount.toLocaleString()}`;
}

function getRankStyle(rank: number): { bg: string; text: string; badge: string } {
  if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', text: 'text-amber-700', badge: 'bg-amber-400 text-white' };
  if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-50 to-slate-100', text: 'text-gray-700', badge: 'bg-gray-400 text-white' };
  if (rank === 3) return { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', text: 'text-orange-700', badge: 'bg-orange-400 text-white' };
  if (rank <= 10) return { bg: 'bg-white', text: 'text-eu-blue', badge: 'bg-eu-blue text-white' };
  return { bg: 'bg-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-700' };
}

const TopContractorsPage: React.FC = () => {
  const [contractors, setContractors] = useState<TopContractor[]>([]);
  const [summary, setSummary] = useState<TopContractorsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalAmount' | 'contractCount' | 'averageAmount' | 'marketShare'>('totalAmount');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchTopContractors(50);
        setContractors(result.data);
        setSummary(result.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading top contractors..." size="lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg font-medium">Failed to load data</p>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  // Filter by search term
  const filteredContractors = contractors.filter((c) =>
    c.contractorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort contractors
  const sortedContractors = [...filteredContractors].sort((a, b) => {
    switch (sortBy) {
      case 'contractCount':
        return b.contractCount - a.contractCount;
      case 'averageAmount':
        return b.averageAmount - a.averageAmount;
      case 'marketShare':
        return b.marketShare - a.marketShare;
      default:
        return b.totalAmount - a.totalAmount;
    }
  });

  // Re-assign ranks after sorting/filtering
  const displayContractors = sortedContractors.map((c, i) => ({
    ...c,
    displayRank: sortBy === 'totalAmount' && !searchTerm ? c.rank : i + 1,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-eu-pale-blue text-eu-blue px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Building2 className="w-4 h-4" />
          <span>Top Contractors</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Who Wins EU Contracts?
        </h1>
        <p className="text-lg text-gray-600">
          Companies receiving the most public procurement funding
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="bg-gradient-to-r from-eu-blue to-eu-dark-blue rounded-lg p-6 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">{formatAmount(summary.top10TotalAmount)}</p>
              <p className="text-blue-200 text-sm mt-1">Top 10 contractors total</p>
              <p className="text-blue-100 text-xs">{summary.top10Percentage}% of all spending</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{summary.top10ContractCount.toLocaleString()}</p>
              <p className="text-blue-200 text-sm mt-1">Contracts to top 10</p>
              <p className="text-blue-100 text-xs">
                {Math.round((summary.top10ContractCount / summary.overallContractCount) * 100)}% of all contracts
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatAmount(summary.overallTotalAmount)}</p>
              <p className="text-blue-200 text-sm mt-1">Total procurement value</p>
              <p className="text-blue-100 text-xs">{summary.overallContractCount.toLocaleString()} contracts</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eu-blue focus:border-eu-blue"
          />
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <div className="flex gap-1">
            {[
              { key: 'totalAmount', label: 'Total Value' },
              { key: 'contractCount', label: '# Contracts' },
              { key: 'averageAmount', label: 'Avg Size' },
              { key: 'marketShare', label: 'Market Share' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as typeof sortBy)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === option.key
                    ? 'bg-eu-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contractors List */}
      <div className="space-y-3">
        {displayContractors.map((contractor) => {
          const style = getRankStyle(contractor.displayRank);
          const isPodium = contractor.displayRank <= 3 && sortBy === 'totalAmount' && !searchTerm;

          return (
            <div
              key={contractor.contractorName}
              className={`${style.bg} border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow ${
                isPodium ? 'border-2' : ''
              } ${contractor.displayRank === 1 && isPodium ? 'border-amber-400' : ''} ${
                contractor.displayRank === 2 && isPodium ? 'border-gray-400' : ''
              } ${contractor.displayRank === 3 && isPodium ? 'border-orange-400' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Rank Badge */}
                <div className={`${style.badge} w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                  {contractor.displayRank <= 3 && isPodium ? (
                    contractor.displayRank === 1 ? '\u{1F947}' : contractor.displayRank === 2 ? '\u{1F948}' : '\u{1F949}'
                  ) : (
                    `#${contractor.displayRank}`
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className={`text-lg font-bold ${style.text} truncate`}>
                        {contractor.contractorName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                        <span>{contractor.contractCount} contracts</span>
                        <span>Avg: {formatAmount(contractor.averageAmount)}</span>
                        <span>{contractor.countriesActive} countries</span>
                      </div>
                    </div>

                    {/* Total Value */}
                    <div className="text-right">
                      <p className={`text-2xl sm:text-3xl font-bold ${style.text}`}>
                        {formatAmount(contractor.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {contractor.marketShare}% market share
                      </p>
                    </div>
                  </div>

                  {/* Countries & Categories */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {/* Top Countries */}
                    {contractor.topCountries.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Top markets:</span>
                        <div className="flex gap-1">
                          {contractor.topCountries.map((country) => (
                            <span
                              key={country.code}
                              className="text-lg"
                              title={`${country.name}: ${country.count} contracts`}
                            >
                              {countryFlags[country.code] || country.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Categories */}
                    {contractor.topCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contractor.topCategories.slice(0, 2).map((category, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                          >
                            {category.length > 25 ? category.slice(0, 22) + '...' : category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayContractors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No contractors found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Market Concentration Notice */}
      {summary && !searchTerm && sortBy === 'totalAmount' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Market Concentration</p>
            <p className="text-sm text-amber-700 mt-1">
              The top 10 contractors receive {summary.top10Percentage}% of all EU procurement spending.
              This indicates {summary.top10Percentage > 50 ? 'significant' : 'moderate'} market concentration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContractorsPage;
