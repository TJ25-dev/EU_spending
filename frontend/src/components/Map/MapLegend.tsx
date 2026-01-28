import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4 max-w-[200px]">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Legend
      </h4>

      {/* Circle size legend */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Contract Count</p>
        <div className="flex items-end gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className="rounded-full bg-blue-400 opacity-70"
              style={{ width: 12, height: 12 }}
            />
            <span className="text-[10px] text-gray-400">Fewer</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="rounded-full bg-blue-400 opacity-70"
              style={{ width: 20, height: 20 }}
            />
            <span className="text-[10px] text-gray-400">More</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="rounded-full bg-blue-400 opacity-70"
              style={{ width: 30, height: 30 }}
            />
            <span className="text-[10px] text-gray-400">Most</span>
          </div>
        </div>
      </div>

      {/* Color gradient legend */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Total Spending</p>
        <div
          className="h-3 rounded-full w-full"
          style={{
            background: 'linear-gradient(to right, #93c5fd, #3b82f6, #1e3a5f)',
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">Lower</span>
          <span className="text-[10px] text-gray-400">Higher</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
