import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

const iconBgClasses = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  purple: 'bg-purple-100',
  gray: 'bg-gray-100',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = 'blue',
  onClick,
  loading = false,
  subtitle,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4" />;
      case 'neutral':
        return <MinusIcon className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-6
        transition-all duration-200 hover:shadow-md
        ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </h3>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
            <div className={colorClasses[color]}>{icon}</div>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-1">
          <span className={`
            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${getTrendColor()}
          `}>
            {getTrendIcon()}
            {trend.percentage}%
          </span>
          {trend.label && (
            <span className="text-xs text-gray-500 ml-1">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
