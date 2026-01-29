import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2, Calendar, Tag, FileText, Briefcase, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchContractById } from '../api/contracts';
import { formatCurrency, formatDate } from '../utils/format';
import type { Contract } from '../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchContractById(id!);
        setContract(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading contract details..." />;
  if (error || !contract) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg font-medium">
          {error || 'Contract not found'}
        </p>
        <button onClick={() => navigate('/contracts')} className="btn-primary mt-4">
          Back to Contracts
        </button>
      </div>
    );
  }

  const hasCoordinates = contract.lat && contract.lng;

  const infoSections = [
    {
      title: 'Financial Details',
      icon: <Briefcase className="w-5 h-5" />,
      items: [
        { label: 'Contract Value', value: formatCurrency(contract.amount) },
        { label: 'Currency', value: contract.currency },
        { label: 'Procedure Type', value: contract.procedureType || '-' },
      ],
    },
    {
      title: 'Dates',
      icon: <Calendar className="w-5 h-5" />,
      items: [
        { label: 'Publication Date', value: contract.publishDate ? formatDate(contract.publishDate) : '-' },
        { label: 'Deadline', value: contract.deadline ? formatDate(contract.deadline) : '-' },
      ].filter(item => item.value !== '-'),
    },
    {
      title: 'Location',
      icon: <MapPin className="w-5 h-5" />,
      items: [
        { label: 'Country', value: contract.country },
        { label: 'Country Code', value: contract.countryCode },
        { label: 'NUTS Code', value: contract.nuts || '-' },
        { label: 'Region', value: contract.region || '-' },
        { label: 'City', value: contract.city || '-' },
      ].filter(item => item.value && item.value !== '-'),
    },
    {
      title: 'Parties',
      icon: <Building2 className="w-5 h-5" />,
      items: [
        { label: 'Buyer', value: contract.buyerName || '-' },
        { label: 'Buyer Type', value: contract.buyerType || '-' },
        { label: 'Contractor', value: contract.contractorName || '-' },
      ].filter(item => item.value !== '-'),
    },
    {
      title: 'Classification',
      icon: <Tag className="w-5 h-5" />,
      items: [
        { label: 'CPV Code', value: contract.cpvCode || '-' },
        { label: 'CPV Description', value: contract.cpvDescription || '-' },
        { label: 'Notice Type', value: contract.noticeType || '-' },
        { label: 'TED Notice ID', value: contract.tedNoticeId || '-' },
      ].filter(item => item.value !== '-'),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-eu-blue transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-eu-pale-blue text-eu-blue">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            {contract.tedNoticeId && (
              <p className="text-sm text-gray-500 mt-1">
                TED Notice: {contract.tedNoticeId}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contract value highlight */}
      <div className="card bg-gradient-to-r from-eu-blue to-eu-dark-blue text-white !border-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-200">Contract Value</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(contract.amount)}</p>
            <p className="text-sm text-blue-200 mt-2">
              {contract.country} &middot; {contract.cpvDescription || 'Public Procurement'}
            </p>
          </div>
          {contract.tedNoticeId && (
            <a
              href={`https://ted.europa.eu/en/notice/-/${contract.tedNoticeId.replace('/', '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on TED
            </a>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info sections */}
        <div className="lg:col-span-2 space-y-4">
          {contract.description && (
            <div className="card">
              <h2 className="card-header">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{contract.description}</p>
            </div>
          )}

          {infoSections.map((section) => (
            <div key={section.title} className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-eu-blue">{section.icon}</span>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {section.items.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium text-gray-500">{item.label}</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Map sidebar */}
        <div>
          {hasCoordinates && (
            <div className="card sticky top-24">
              <h2 className="card-header">Location</h2>
              <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={[contract.lat, contract.lng]}
                  zoom={8}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                  style={{ height: '300px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CircleMarker
                    center={[contract.lat, contract.lng]}
                    radius={8}
                    pathOptions={{
                      fillColor: '#003399',
                      color: '#ffffff',
                      weight: 2,
                      fillOpacity: 0.8,
                    }}
                  >
                    <Popup>
                      <strong>{contract.title}</strong><br />
                      {contract.city || contract.country}
                    </Popup>
                  </CircleMarker>
                </MapContainer>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {contract.city}{contract.city ? ', ' : ''}{contract.country}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
