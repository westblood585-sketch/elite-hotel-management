import React from 'react';
import { AlertTriangle, AlertCircle, InfoIcon, CheckCircle } from 'lucide-react';

interface ErrorWidgetProps {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
  cachedData?: React.ReactNode;
  className?: string;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
  info: {
    icon: InfoIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
  },
};

export const ErrorWidget: React.FC<ErrorWidgetProps> = ({
  title,
  message,
  severity,
  action,
  cachedData,
  className = '',
}) => {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`
      border-2 rounded-lg p-6
      ${config.bgColor} ${config.borderColor}
      ${className}
    `}>
      <div className="flex items-start gap-4">
        <Icon className={`w-6 h-6 flex-shrink-0 ${config.iconColor}`} />
        
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${config.textColor}`}>
            {title}
          </h3>
          <p className={`text-sm mt-1 ${config.textColor}`}>
            {message}
          </p>

          {cachedData && (
            <div className="mt-4 p-4 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                📦 Cached Data (May be outdated)
              </p>
              {cachedData}
            </div>
          )}

          {action && (
            <button
              onClick={action.onClick}
              className={`
                mt-4 px-4 py-2 rounded font-medium
                transition-colors duration-200
                ${severity === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                ${severity === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
                ${severity === 'info' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                ${severity === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              `}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
