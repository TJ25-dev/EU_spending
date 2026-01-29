import React, { useMemo, useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import type { CountryMapData, MapFeature } from '../../types';
import type { CityMapData } from '../../api/contracts';
import MapLegend from './MapLegend';

// Generate a unique key for each map instance to prevent "already initialized" error
let mapInstanceId = 0;

interface EuropeMapProps {
  countryData: CountryMapData[];
  cityData?: CityMapData[];
  contracts?: MapFeature[];
  onCountryClick?: (countryCode: string) => void;
  onCityClick?: (cityName: string) => void;
  selectedCountry?: string;
}

/**
 * Format a numeric amount into a compact currency string.
 * e.g. 1_200_000 -> "EUR 1.2M"
 */
function formatCompactAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `\u20AC${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `\u20AC${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `\u20AC${(amount / 1_000).toFixed(1)}K`;
  }
  return `\u20AC${amount.toLocaleString()}`;
}

/**
 * Interpolate between two hex colours based on a 0-1 ratio.
 */
function interpolateColor(
  colorLow: string,
  colorHigh: string,
  ratio: number,
): string {
  const clamp = Math.max(0, Math.min(1, ratio));

  const parsePart = (hex: string, offset: number) =>
    parseInt(hex.slice(offset, offset + 2), 16);

  const rLow = parsePart(colorLow, 1);
  const gLow = parsePart(colorLow, 3);
  const bLow = parsePart(colorLow, 5);

  const rHigh = parsePart(colorHigh, 1);
  const gHigh = parsePart(colorHigh, 3);
  const bHigh = parsePart(colorHigh, 5);

  const r = Math.round(rLow + (rHigh - rLow) * clamp);
  const g = Math.round(gLow + (gHigh - gLow) * clamp);
  const b = Math.round(bLow + (bHigh - bLow) * clamp);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Map a contract count to a circle marker radius between 8 and 30.
 */
function countToRadius(
  count: number,
  minCount: number,
  maxCount: number,
): number {
  if (maxCount === minCount) return 16;
  const ratio = (count - minCount) / (maxCount - minCount);
  return 8 + ratio * 22; // range 8-30
}

/**
 * Helper component that programmatically flies the map to a selected country or resets.
 */
function FlyToSelected({
  countryData,
  cityData,
  selectedCountry,
}: {
  countryData: CountryMapData[];
  cityData?: CityMapData[];
  selectedCountry?: string;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (selectedCountry && cityData && cityData.length > 0) {
      // Zoom to fit all cities
      const lats = cityData.map(c => c.lat);
      const lngs = cityData.map(c => c.lng);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
        [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5],
      ];
      map.flyToBounds(bounds, { duration: 1, padding: [50, 50] });
    } else if (selectedCountry) {
      const match = countryData.find(
        (c) => c.countryCode === selectedCountry,
      );
      if (match?.center) {
        map.flyTo(match.center, 6, { duration: 1 });
      }
    } else {
      // Reset to Europe view
      map.flyTo([50, 10], 4, { duration: 1 });
    }
  }, [selectedCountry, countryData, cityData, map]);

  return null;
}

const EuropeMap: React.FC<EuropeMapProps> = ({
  countryData,
  cityData,
  contracts,
  onCountryClick,
  onCityClick,
  selectedCountry,
}) => {
  // Use a unique key to prevent "Map container is already initialized" error
  const [mapKey] = useState(() => `map-${++mapInstanceId}`);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pre-compute ranges for sizing / colouring (countries)
  const { minCount, maxCount, minAmount, maxAmount } = useMemo(() => {
    if (countryData.length === 0) {
      return { minCount: 0, maxCount: 1, minAmount: 0, maxAmount: 1 };
    }
    const counts = countryData.map((c) => c.contractCount);
    const amounts = countryData.map((c) => c.totalAmount);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
    };
  }, [countryData]);

  // Pre-compute ranges for sizing / colouring (cities)
  const cityRanges = useMemo(() => {
    if (!cityData || cityData.length === 0) {
      return { minCount: 0, maxCount: 1, minAmount: 0, maxAmount: 1 };
    }
    const counts = cityData.map((c) => c.contractCount);
    const amounts = cityData.map((c) => c.totalAmount);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
    };
  }, [cityData]);

  const showCityView = selectedCountry && cityData && cityData.length > 0;

  const COLOR_LOW = '#93c5fd';
  const COLOR_HIGH = '#1e3a5f';

  // Don't render map until client-side to avoid hydration issues
  if (!isClient) {
    return (
      <div className="relative w-full min-h-[500px] h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[500px] h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        key={mapKey}
        center={[50, 10]}
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ minHeight: '500px', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToSelected
          countryData={countryData}
          cityData={cityData}
          selectedCountry={selectedCountry}
        />

        {/* City markers (when drilled down) */}
        {showCityView && cityData!.map((city) => {
          const radius = countToRadius(
            city.contractCount,
            cityRanges.minCount,
            cityRanges.maxCount,
          );
          const amountRatio =
            cityRanges.maxAmount === cityRanges.minAmount
              ? 0.5
              : (city.totalAmount - cityRanges.minAmount) / (cityRanges.maxAmount - cityRanges.minAmount);
          const fillColor = interpolateColor('#fcd34d', '#b45309', amountRatio);

          return (
            <CircleMarker
              key={`${city.city}-${city.region}`}
              center={[city.lat, city.lng]}
              radius={radius}
              pathOptions={{
                fillColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
              }}
              eventHandlers={{
                click: () => onCityClick?.(city.city),
              }}
            >
              <Popup>
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-gray-900 text-base mb-1">
                    {city.city}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{city.region}</p>
                  <p className="text-gray-600">
                    Contracts:{' '}
                    <span className="font-medium text-gray-900">
                      {city.contractCount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Total spending:{' '}
                    <span className="font-medium text-gray-900">
                      {formatCompactAmount(city.totalAmount)}
                    </span>
                  </p>
                  <p className="text-xs text-eu-blue mt-2 cursor-pointer hover:underline">
                    Click to view contracts
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Country aggregate markers (when not drilled down) */}
        {!showCityView && countryData.map((country) => {
          if (!country.center) return null;

          const radius = countToRadius(
            country.contractCount,
            minCount,
            maxCount,
          );
          const amountRatio =
            maxAmount === minAmount
              ? 0.5
              : (country.totalAmount - minAmount) / (maxAmount - minAmount);
          const fillColor = interpolateColor(COLOR_LOW, COLOR_HIGH, amountRatio);
          const isSelected = selectedCountry === country.countryCode;

          return (
            <CircleMarker
              key={country.countryCode}
              center={country.center}
              radius={radius}
              pathOptions={{
                fillColor,
                color: isSelected ? '#f59e0b' : '#ffffff',
                weight: isSelected ? 3 : 1.5,
                opacity: 1,
                fillOpacity: 0.75,
              }}
              eventHandlers={{
                click: () => onCountryClick?.(country.countryCode),
              }}
            >
              <Popup>
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-gray-900 text-base mb-1">
                    {country.countryName}
                  </p>
                  <p className="text-gray-600">
                    Contracts:{' '}
                    <span className="font-medium text-gray-900">
                      {country.contractCount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Total spending:{' '}
                    <span className="font-medium text-gray-900">
                      {formatCompactAmount(country.totalAmount)}
                    </span>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Individual contract point markers */}
        {contracts?.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          return (
            <CircleMarker
              key={feature.properties.id}
              center={[lat, lng]}
              radius={4}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#ffffff',
                weight: 1,
                opacity: 0.9,
                fillOpacity: 0.7,
              }}
            >
              <Popup>
                <div className="text-sm leading-relaxed max-w-[220px]">
                  <p className="font-semibold text-gray-900 mb-1">
                    {feature.properties.title}
                  </p>
                  <p className="text-gray-600">
                    Amount:{' '}
                    <span className="font-medium text-gray-900">
                      {formatCompactAmount(feature.properties.amount)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Contractor:{' '}
                    <span className="font-medium text-gray-900">
                      {feature.properties.contractorName}
                    </span>
                  </p>
                  {feature.properties.category && (
                    <p className="text-gray-600">
                      Category:{' '}
                      <span className="font-medium text-gray-900">
                        {feature.properties.category}
                      </span>
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <MapLegend />
    </div>
  );
};

export default EuropeMap;
