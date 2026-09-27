import React from 'react';
import { type LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    startIcon?: LucideIcon;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  icon: Icon = FolderOpen,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 ${className}`}>
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-gray-400 w-8 h-8" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {action.startIcon && <action.startIcon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
