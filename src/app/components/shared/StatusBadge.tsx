import React from 'react';
import { Badge } from '../ui/badge';
import { BookingStatus, PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Define variants for all possible statuses
  const variants: Record<string, { variant: any; label: string; className?: string }> = {
    // Booking statuses
    requested: { variant: 'outline', label: 'Requested', className: 'border-amber-400 bg-amber-50 text-amber-700' },
    pending: { variant: 'secondary', label: 'Pending' },
    approved: { variant: 'outline', label: 'Approved — Pay Advance', className: 'border-blue-400 bg-blue-50 text-blue-700' },
    confirmed: { variant: 'default', label: 'Confirmed' },
    active: { variant: 'default', label: 'Active' },
    completed: { variant: 'outline', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    rejected: { variant: 'destructive', label: 'Rejected' },
    
    // Payment statuses
    processing: { variant: 'secondary', label: 'Processing' },
    success: { variant: 'default', label: 'Success' },
    failed: { variant: 'destructive', label: 'Failed' },
    refunded: { variant: 'outline', label: 'Refunded' },
  };

  // Get variant and label, with fallback for unknown statuses
  const statusConfig = variants[status] || { 
    variant: 'secondary', 
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown' 
  };

  const { variant, label, className } = statusConfig;

  return <Badge variant={variant} className={className}>{label}</Badge>;
};
