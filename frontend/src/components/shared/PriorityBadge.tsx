import React from 'react';

export interface PriorityBadgeProps {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  normal: {
    label: 'Normal',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  high: {
    label: 'High',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showLabel = true,
  animate = false,
}) => {
  const config = priorityConfig[priority];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full border
      ${config.color} ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}
      ${animate && priority === 'urgent' ? 'animate-pulse' : ''}
    `}>
      {/* Priority dot indicator */}
      <span className={`w-2 h-2 rounded-full ${config.bgColor} ${config.borderColor} border-2`}></span>
      
      {showLabel && config.label}
    </span>
  );
};
