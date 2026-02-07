import React from 'react';
import { Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  context?: string;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, context, tooltip }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
            {tooltip && (
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="whitespace-pre-line leading-relaxed">{tooltip}</div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
          {context && (
            <p className="mt-1 text-xs text-gray-500">{context}</p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 text-eu-blue opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
