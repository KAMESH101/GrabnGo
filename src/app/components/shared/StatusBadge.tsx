import React from 'react';
import { Badge } from '../ui/badge';
import { BookingStatus, PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Define variants for all possible statuses
  const variants: Record<string, { variant: any; label: string }> = {
    // Booking statuses
    pending: { variant: 'secondary', label: 'Pending' },
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

  const { variant, label } = statusConfig;

  return <Badge variant={variant}>{label}</Badge>;
};
