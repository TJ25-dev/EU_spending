import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';

interface TopContract {
  id: string;
  value: number;
  country: string;
  countryCode: string;
  authority: string;
  winner: string;
  description: string;
  category: string;
  notableFlags: string[];
  date: string;
}

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
};

// Mock data for top contracts (sorted by value descending)
const topContracts: TopContract[] = [
  {
    id: 'top-1',
    value: 423_000_000,
    country: 'France',
    countryCode: 'FR',
    authority: 'French Ministry of Defence',
    winner: 'Thales Group',
    description: 'Cyber & secure communications systems',
    category: 'Defence & Security',
    notableFlags: ['Single bidder', 'Framework contract (4 years)'],
    date: '2026-01-15',
  },
  {
    id: 'top-2',
    value: 387_000_000,
    country: 'Germany',
    countryCode: 'DE',
    authority: 'Deutsche Bahn AG',
    winner: 'Siemens Mobility',
    description: 'High-speed rail maintenance & modernization',
    category: 'Transport',
    notableFlags: ['Framework contract (6 years)'],
    date: '2026-01-12',
  },
  {
    id: 'top-3',
    value: 256_000_000,
    country: 'Poland',
    countryCode: 'PL',
    authority: 'Ministry of Digital Affairs',
    winner: 'Asseco Poland',
    description: 'National digital infrastructure upgrade',
    category: 'IT & Digital',
    notableFlags: ['EU co-funded'],
    date: '2026-01-18',
  },
  {
    id: 'top-4',
    value: 189_000_000,
    country: 'Italy',
    countryCode: 'IT',
    authority: 'Autostrade per l\'Italia',
    winner: 'Salini Impregilo',
    description: 'Highway A14 extension & safety upgrades',
    category: 'Infrastructure',
    notableFlags: ['Multi-year project'],
    date: '2026-01-08',
  },
  {
    id: 'top-5',
    value: 145_000_000,
    country: 'Spain',
    countryCode: 'ES',
    authority: 'RENFE Operadora',
    winner: 'CAF & Talgo Consortium',
    description: 'High-speed train fleet acquisition',
    category: 'Transport',
    notableFlags: ['Joint venture'],
    date: '2026-01-20',
  },
  {
    id: 'top-6',
    value: 98_000_000,
    country: 'Netherlands',
    countryCode: 'NL',
    authority: 'Rijkswaterstaat',
    winner: 'BAM Infra',
    description: 'Flood defense system reinforcement',
    category: 'Infrastructure',
    notableFlags: ['Climate adaptation'],
    date: '2026-01-14',
  },
  {
    id: 'top-7',
    value: 87_000_000,
    country: 'Belgium',
    countryCode: 'BE',
    authority: 'Federal Public Health Service',
    winner: 'Pfizer Belgium',
    description: 'National vaccine stockpile replenishment',
    category: 'Healthcare',
    notableFlags: ['Emergency procedure'],
    date: '2026-01-22',
  },
  {
    id: 'top-8',
    value: 76_000_000,
    country: 'Sweden',
    countryCode: 'SE',
    authority: 'Swedish Transport Administration',
    winner: 'Skanska Sverige',
    description: 'Northern railway infrastructure expansion',
    category: 'Transport',
    notableFlags: ['Green procurement'],
    date: '2026-01-11',
  },
  {
    id: 'top-9',
    value: 64_000_000,
    country: 'Austria',
    countryCode: 'AT',
    authority: 'ASFINAG',
    winner: 'Strabag SE',
    description: 'Brenner corridor tunnel maintenance',
    category: 'Infrastructure',
    notableFlags: [],
    date: '2026-01-16',
  },
  {
    id: 'top-10',
    value: 52_000_000,
    country: 'Denmark',
    countryCode: 'DK',
    authority: 'Region Hovedstaden',
    winner: 'Novo Nordisk Engineering',
    description: 'Hospital modernization program',
    category: 'Healthcare',
    notableFlags: ['Multi-phase'],
    date: '2026-01-19',
  },
  {
    id: 'top-11',
    value: 41_000_000,
    country: 'Finland',
    countryCode: 'FI',
    authority: 'Finnish Defence Forces',
    winner: 'Patria Oyj',
    description: 'Military vehicle maintenance contract',
    category: 'Defence & Security',
    notableFlags: ['Framework contract'],
    date: '2026-01-09',
  },
  {
    id: 'top-12',
    value: 38_000_000,
    country: 'Portugal',
    countryCode: 'PT',
    authority: 'Infraestruturas de Portugal',
    winner: 'Mota-Engil',
    description: 'Porto metro line extension',
    category: 'Transport',
    notableFlags: ['EU co-funded'],
    date: '2026-01-21',
  },
  {
    id: 'top-13',
    value: 29_000_000,
    country: 'Ireland',
    countryCode: 'IE',
    authority: 'Health Service Executive',
    winner: 'Oracle Health',
    description: 'National health records digitization',
    category: 'IT & Digital',
    notableFlags: [],
    date: '2026-01-17',
  },
  {
    id: 'top-14',
    value: 24_000_000,
    country: 'Czech Republic',
    countryCode: 'CZ',
    authority: 'Ministry of Environment',
    winner: 'CEZ Group',
    description: 'Renewable energy grid integration',
    category: 'Energy',
    notableFlags: ['Green procurement'],
    date: '2026-01-13',
  },
  {
    id: 'top-15',
    value: 18_000_000,
    country: 'Romania',
    countryCode: 'RO',
    authority: 'Ministry of Education',
    winner: 'Orange Romania',
    description: 'Rural school connectivity program',
    category: 'IT & Digital',
    notableFlags: ['EU co-funded'],
    date: '2026-01-10',
  },
];

function formatLargeAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `\u20AC${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `\u20AC${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `\u20AC${(amount / 1_000).toFixed(0)}K`;
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
  contract: TopContract;
  featured?: boolean;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract, featured = false }) => {
  const navigate = useNavigate();
  const tier = getValueTier(contract.value);
  const styles = tierStyles[tier];
  const flag = countryFlags[contract.countryCode] || '';

  return (
    <div
      onClick={() => navigate(`/contracts/${contract.id}`)}
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
            {formatLargeAmount(contract.value)}
          </span>
          <span className="ml-2 text-2xl">{flag}</span>
        </div>
        {tier !== 'standard' && (
          <span className={`${styles.badge} text-xs font-semibold px-2 py-1 rounded-full uppercase`}>
            {tier}
          </span>
        )}
      </div>

      {/* Authority & Winner */}
      <div className="space-y-1 mb-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{contract.authority}</p>
        <p className="text-sm text-gray-600">
          Winner: <span className="font-medium text-gray-800">{contract.winner}</span>
        </p>
      </div>

      {/* Description */}
      <p className={`text-gray-600 mb-3 ${featured ? 'text-base' : 'text-sm'} line-clamp-2`}>
        {contract.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="bg-eu-pale-blue text-eu-blue text-xs font-medium px-2 py-1 rounded">
          {contract.category}
        </span>
        {contract.notableFlags.map((flag, i) => (
          <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            {flag}
          </span>
        ))}
      </div>

      {/* Context comparison for very large contracts */}
      {contract.value >= 100_000_000 && (
        <p className="mt-3 text-xs text-gray-500 italic">
          That's ~{'\u20AC'}{(contract.value / 450_000_000).toFixed(2)} per EU citizen
        </p>
      )}
    </div>
  );
};

const TopContractsPage: React.FC = () => {
  const totalValue = topContracts.reduce((sum, c) => sum + c.value, 0);
  const featuredContracts = topContracts.slice(0, 3);
  const mediumContracts = topContracts.slice(3, 10);
  const smallerContracts = topContracts.slice(10, 15);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Trophy className="w-4 h-4" />
          <span>Top Contracts This Month</span>
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
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold">1-3</span>
          Featured Contracts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} featured />
          ))}
        </div>
      </section>

      {/* Medium Contracts (4-10) */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">4-10</span>
          Major Contracts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mediumContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      </section>

      {/* Smaller Contracts (11-15) */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-eu-blue rounded-full flex items-center justify-center text-white text-xs font-bold">11+</span>
          Notable Contracts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {smallerContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      </section>

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
