import React from 'react';
import { ExternalLink, Database, Shield, Globe, BookOpen, HelpCircle } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">About the Data</h1>
        <p className="text-gray-500 mt-2">
          Understanding EU public procurement data and how this tool works
        </p>
      </div>

      {/* What is TED */}
      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-eu-blue" />
          <h2 className="text-xl font-semibold text-gray-900">What is TED?</h2>
        </div>
        <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
          <p>
            <strong>TED (Tenders Electronic Daily)</strong> is the online version of the
            &ldquo;Supplement to the Official Journal&rdquo; of the European Union, dedicated
            to European public procurement.
          </p>
          <p>
            TED publishes around 746,000 procurement notices per year, including
            249,000 calls for tenders worth approximately &euro;545 billion. These
            contracts cover public works, supplies, and services from all EU member
            states and beyond.
          </p>
          <p>
            The data is freely accessible as part of the EU&rsquo;s commitment to
            transparency and open data. By law, public contracts above certain
            financial thresholds must be published on TED.
          </p>
        </div>
      </section>

      {/* What is Public Procurement */}
      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-eu-blue" />
          <h2 className="text-xl font-semibold text-gray-900">What is Public Procurement?</h2>
        </div>
        <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
          <p>
            Public procurement is the process by which government authorities and
            public entities purchase goods, services, and works from private
            companies. It represents a significant portion of government spending
            &mdash; typically 10-15% of GDP in EU member states.
          </p>
          <p>
            Examples include building hospitals and roads, purchasing medical
            equipment, hiring IT consultants, or contracting waste management
            services. Transparent procurement helps prevent corruption and ensures
            taxpayer money is spent effectively.
          </p>
        </div>
      </section>

      {/* How to Use */}
      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-eu-blue" />
          <h2 className="text-xl font-semibold text-gray-900">How to Use This Tool</h2>
        </div>
        <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Dashboard:</strong> Get an overview of procurement spending
              across EU countries. The interactive map shows relative spending by
              country &mdash; click on a bubble to see details.
            </li>
            <li>
              <strong>Contracts:</strong> Browse and search individual procurement
              contracts. Use filters to narrow by country, date range, or contract
              value. Click any contract to see full details.
            </li>
            <li>
              <strong>Charts:</strong> The dashboard includes charts showing spending
              breakdowns by country and procurement category, helping identify
              patterns and trends.
            </li>
          </ul>
        </div>
      </section>

      {/* Data Methodology */}
      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-eu-blue" />
          <h2 className="text-xl font-semibold text-gray-900">Data Source & Methodology</h2>
        </div>
        <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
          <p>
            The data displayed on this platform is sourced from the
            <strong> TED (Tenders Electronic Daily)</strong> database, maintained by
            the Publications Office of the European Union.
          </p>
          <p>
            Contract values are shown in Euros (&euro;). Where the original contract
            was in a different currency, amounts have been converted using the
            exchange rate at the time of publication.
          </p>
          <p>
            Geographic locations are determined from the NUTS (Nomenclature of
            Territorial Units for Statistics) codes provided in the original
            procurement notices, supplemented by geocoding of city names where
            necessary.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="card border-l-4 border-l-yellow-400">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900">Limitations & Caveats</h2>
        </div>
        <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Only contracts above EU financial thresholds are required to be
              published on TED. Many smaller contracts are not included.
            </li>
            <li>
              Data completeness varies by country and time period. Some fields
              may be missing or inconsistently formatted.
            </li>
            <li>
              Contract values shown are initial estimates. Final amounts after
              amendments may differ.
            </li>
            <li>
              This platform provides a curated subset of TED data. For the
              complete dataset, refer to the official TED website.
            </li>
          </ul>
        </div>
      </section>

      {/* Links */}
      <section className="card bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Official Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'TED Official Website', url: 'https://ted.europa.eu' },
            { label: 'TED API Documentation', url: 'https://docs.ted.europa.eu/api/latest/index.html' },
            { label: 'EU Open Data Portal', url: 'https://data.europa.eu' },
            { label: 'OP-TED on GitHub', url: 'https://github.com/OP-TED' },
          ].map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200 hover:border-eu-light-blue hover:bg-eu-pale-blue transition-colors text-sm font-medium text-gray-700 hover:text-eu-blue"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* Last updated */}
      <div className="text-center text-xs text-gray-400 pb-4">
        Data last updated: January 2025 &middot; This is a demonstration using sample data
      </div>
    </div>
  );
};

export default AboutPage;
