import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Globe, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EuropeMap from '../components/Map/EuropeMap';
import { fetchSummaryStats, fetchCountryStats, fetchCategoryStats, fetchCountryMapData, fetchContracts } from '../api/contracts';
import { formatCompactCurrency, formatCurrency, formatNumber, formatDate } from '../utils/format';
import type { SummaryStats, CountryStats, CategoryStats, CountryMapData, Contract } from '../types';

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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [summaryData, countries, categories, mapData, contractsRes] = await Promise.all([
          fetchSummaryStats(),
          fetchCountryStats(),
          fetchCategoryStats(),
          fetchCountryMapData(),
          fetchContracts(undefined, 1, 10),
        ]);
        setSummary(summaryData);
        setCountryStats(countries);
        setCategoryStats(categories);
        setCountryMapData(mapData);
        setRecentContracts(contractsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="space-y-6 animate-fade-in">
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
            <h2 className="card-header">Procurement Spending Across Europe</h2>
            <EuropeMap
              countryData={countryMapData}
              onCountryClick={(code) => setSelectedCountry(code === selectedCountry ? undefined : code)}
              selectedCountry={selectedCountry}
            />
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
