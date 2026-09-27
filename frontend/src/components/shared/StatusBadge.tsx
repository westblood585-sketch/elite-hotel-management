import React from 'react';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'dot';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  // Reservation statuses
  'PendingPayment': { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'Confirmed': { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'CheckedIn': { label: 'Checked In', color: 'text-green-700', bgColor: 'bg-green-100' },
  'CheckedOut': { label: 'Checked Out', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  'Cancelled': { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  
  // Room statuses
  'available': { label: 'Available', color: 'text-green-700', bgColor: 'bg-green-100' },
  'occupied': { label: 'Occupied', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'reserved': { label: 'Reserved', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'maintenance': { label: 'Maintenance', color: 'text-red-700', bgColor: 'bg-red-100' },
  'cleaning': { label: 'Cleaning', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  
  // Housekeeping statuses
  'clean': { label: 'Clean', color: 'text-green-700', bgColor: 'bg-green-100' },
  'dirty': { label: 'Dirty', color: 'text-red-700', bgColor: 'bg-red-100' },
  'in-progress': { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'inspection': { label: 'Inspection', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  
  // Payment statuses
  'initiated': { label: 'Initiated', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'succeeded': { label: 'Succeeded', color: 'text-green-700', bgColor: 'bg-green-100' },
  'failed': { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100' },
  'refunded': { label: 'Refunded', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  
  // Billing statuses
  'pending': { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'paid': { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
  'overdue': { label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' },
  'disputed': { label: 'Disputed', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  
  // Service health
  'healthy': { label: 'Healthy', color: 'text-green-700', bgColor: 'bg-green-100' },
  'degraded': { label: 'Degraded', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'down': { label: 'Down', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'md',
}) => {
  const config = statusConfig[status] || { 
    label: status, 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100' 
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (variant === 'dot') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${config.bgColor}`}></span>
        <span className={`${sizeClasses[size]} font-medium ${config.color}`}>
          {config.label}
        </span>
      </span>
    );
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${config.color} ${config.bgColor} ${sizeClasses[size]}
    `}>
      {config.label}
    </span>
  );
};
