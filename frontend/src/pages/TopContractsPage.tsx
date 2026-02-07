import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { fetchTopContracts } from '../api/contracts';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Contract } from '../types';

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  FR: '\u{1F1EB}\u{1F1F7}',
  DE: '\u{1F1E9}\u{1F1EA}',
  PL: '\u{1F1F5}\u{1F1F1}',
  IT: '\u{1F1EE}\u{1F1F9}',
  ES: '\u{1F1EA}\u{1F1F8}',
  NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}',
  SE: '\u{1F1F8}\u{1F1EA}',
  AT: '\u{1F1E6}\u{1F1F9}',
  DK: '\u{1F1E9}\u{1F1F0}',
  FI: '\u{1F1EB}\u{1F1EE}',
  PT: '\u{1F1F5}\u{1F1F9}',
  IE: '\u{1F1EE}\u{1F1EA}',
  CZ: '\u{1F1E8}\u{1F1FF}',
  RO: '\u{1F1F7}\u{1F1F4}',
  GR: '\u{1F1EC}\u{1F1F7}',
  HU: '\u{1F1ED}\u{1F1FA}',
  BG: '\u{1F1E7}\u{1F1EC}',
  HR: '\u{1F1ED}\u{1F1F7}',
  SK: '\u{1F1F8}\u{1F1F0}',
  SI: '\u{1F1F8}\u{1F1EE}',
  LT: '\u{1F1F1}\u{1F1F9}',
  LV: '\u{1F1F1}\u{1F1FB}',
  EE: '\u{1F1EA}\u{1F1EA}',
  CY: '\u{1F1E8}\u{1F1FE}',
  MT: '\u{1F1F2}\u{1F1F9}',
  LU: '\u{1F1F1}\u{1F1FA}',
  NO: '\u{1F1F3}\u{1F1F4}',
  IS: '\u{1F1EE}\u{1F1F8}',
  LI: '\u{1F1F1}\u{1F1EE}',
  CH: '\u{1F1E8}\u{1F1ED}',
  GB: '\u{1F1EC}\u{1F1E7}',
  UK: '\u{1F1EC}\u{1F1E7}',
};

function formatLargeAmount(amount: number): string {
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

function getValueTier(value: number): 'gold' | 'silver' | 'bronze' | 'standard' {
  if (value >= 100_000_000) return 'gold';
  if (value >= 50_000_000) return 'silver';
  if (value >= 25_000_000) return 'bronze';
  return 'standard';
}

const tierStyles = {
  gold: {
    border: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    accent: 'bg-amber-400',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
  silver: {
    border: 'border-gray-400',
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    accent: 'bg-gray-400',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-700',
  },
  bronze: {
    border: 'border-orange-400',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    accent: 'bg-orange-400',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
  },
  standard: {
    border: 'border-gray-200',
    bg: 'bg-white',
    accent: 'bg-eu-blue',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600',
  },
};

interface ContractCardProps {
  contract: Contract;
  featured?: boolean;
  onClick: () => void;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract, featured = false, onClick }) => {
  const tier = getValueTier(contract.amount);
  const styles = tierStyles[tier];
  const flag = countryFlags[contract.countryCode] || '';

  return (
    <div
      onClick={onClick}
      className={`
        ${styles.bg} ${styles.border} border-2 rounded-xl overflow-hidden
        cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1
        ${featured ? 'p-6' : 'p-4'}
      `}
    >
      {/* Tier accent bar */}
      <div className={`${styles.accent} h-1 -mx-6 -mt-6 mb-4`} style={{ marginLeft: featured ? '-1.5rem' : '-1rem', marginRight: featured ? '-1.5rem' : '-1rem', marginTop: featured ? '-1.5rem' : '-1rem' }} />

      {/* Header: Value + Flag */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-4xl ${featured ? 'sm:text-5xl' : 'sm:text-3xl'} font-bold ${styles.text}`}>
            {formatLargeAmount(contract.amount)}
          </span>
          <span className="ml-2 text-2xl">{flag}</span>
        </div>
        {tier !== 'standard' && (
          <span className={`${styles.badge} text-xs font-semibold px-2 py-1 rounded-full uppercase`}>
            {tier}
          </span>
        )}
      </div>

      {/* Buyer & Winner */}
      <div className="space-y-1 mb-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{contract.buyerName}</p>
        {contract.contractorName && (
          <p className="text-sm text-gray-600">
            Winner: <span className="font-medium text-gray-800">{contract.contractorName}</span>
          </p>
        )}
      </div>

      {/* Title/Description */}
      <p className={`text-gray-600 mb-3 ${featured ? 'text-base' : 'text-sm'} line-clamp-2`}>
        {contract.title}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {contract.cpvDescription && (
          <span className="bg-eu-pale-blue text-eu-blue text-xs font-medium px-2 py-1 rounded line-clamp-1">
            {contract.cpvDescription.length > 30 ? contract.cpvDescription.slice(0, 27) + '...' : contract.cpvDescription}
          </span>
        )}
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
          {contract.country}
        </span>
      </div>

      {/* Context comparison for very large contracts */}
      {contract.amount >= 100_000_000 && (
        <p className="mt-3 text-xs text-gray-500 italic">
          That's ~{'\u20AC'}{(contract.amount / 450_000_000).toFixed(2)} per EU citizen
        </p>
      )}
    </div>
  );
};

const TopContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchTopContracts(15);
        setContracts(result.data);
        setTotalValue(result.totalValue);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load top contracts');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading top contracts..." size="lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg font-medium">Failed to load data</p>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  const featuredContracts = contracts.slice(0, 3);
  const mediumContracts = contracts.slice(3, 10);
  const smallerContracts = contracts.slice(10, 15);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Trophy className="w-4 h-4" />
          <span>Top Contracts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Biggest Public Contracts
        </h1>
        <p className="text-xl text-gray-600">
          <span className="font-bold text-eu-blue">{formatLargeAmount(totalValue)}</span> awarded in these contracts alone
        </p>
        <p className="text-sm text-gray-500 mt-2">
          That's {'\u20AC'}{(totalValue / 450_000_000).toFixed(2)} per EU citizen
        </p>
      </div>

      {/* Featured Contracts (Top 3) */}
      {featuredContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold">1-3</span>
            Featured Contracts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                featured
                onClick={() => navigate(`/contracts/${contract.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Medium Contracts (4-10) */}
      {mediumContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">4-10</span>
            Major Contracts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediumContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onClick={() => navigate(`/contracts/${contract.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Smaller Contracts (11-15) */}
      {smallerContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-eu-blue rounded-full flex items-center justify-center text-white text-xs font-bold">11+</span>
            Notable Contracts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smallerContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onClick={() => navigate(`/contracts/${contract.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <a
          href="/contracts"
          className="inline-flex items-center gap-2 bg-eu-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-eu-dark-blue transition-colors"
        >
          Explore All Contracts
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default TopContractsPage;
