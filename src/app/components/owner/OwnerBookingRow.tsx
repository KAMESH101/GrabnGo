// Reusable component for displaying owner bookings
// Data binding: {{booking.id}}, {{booking.customerName}}, {{booking.productTitle}}, etc.

import React from 'react';
import { useNavigate } from 'react-router';
import { Booking } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from '../shared/StatusBadge';
import { Calendar, User, Phone, Camera, CheckCircle, XCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OwnerBookingRowProps {
  booking: Booking;
  processingBooking: string | null;
  onAccept: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  onStartRental: (bookingId: string) => void;
  onCompleteRental: (bookingId: string) => void;
}

export const OwnerBookingRow: React.FC<OwnerBookingRowProps> = ({
  booking,
  processingBooking,
  onAccept,
  onReject,
  onStartRental,
  onCompleteRental,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    console.log('🔍 [OWNER BOOKING ROW] View Details clicked for booking:', {
      id: booking.id,
      productTitle: booking.productTitle,
      customerId: booking.customerId,
      ownerId: booking.ownerId,
      hasId: !!booking.id,
      bookingObject: booking
    });
    
    if (!booking.id) {
      console.error('❌ [OWNER BOOKING ROW] Invalid booking ID - Booking object:', booking);
      toast.error('Cannot view details: Booking ID is missing');
      return;
    }
    
    console.log('✅ [OWNER BOOKING ROW] Navigating to:', `/owner/booking/${booking.id}`);
    navigate(`/owner/booking/${booking.id}`);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <img
            src={booking.productImage}
            alt={booking.productTitle}
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-xl mb-1">{booking.productTitle}</h3>
                <StatusBadge status={booking.status} />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="text-sm font-mono">{booking.id?.toUpperCase() || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p>{booking.customerName}</p>
                  <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-sm">
                    {format(booking.startDate, 'dd MMM')} - {format(booking.endDate, 'dd MMM yyyy')}
                  </p>
                  {booking.startTime && booking.endTime && (
                    <p className="text-xs text-gray-500">
                      {booking.startTime} - {booking.endTime}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-green-600">₹{booking.totalAmount}</p>
                  <p className="text-xs text-gray-500">
                    Deposit: ₹{booking.deposit}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Camera className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Pickup Verified</p>
                  <p className={booking.pickupVerified ? 'text-green-600' : 'text-gray-500'}>
                    {booking.pickupVerified ? 'Yes ✓' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Created Timestamp */}
            {booking.createdAt && booking.createdAt instanceof Date && !isNaN(booking.createdAt.getTime()) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Booked on:</span>
                  <span className="font-medium text-blue-700">
                    {format(booking.createdAt, 'EEEE, dd MMM yyyy')} at {format(booking.createdAt, 'hh:mm a')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {booking.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => onAccept(booking.id)} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={processingBooking === booking.id}
                  >
                    {processingBooking === booking.id ? (
                      <Loader className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Approve & Notify
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => onReject(booking.id)}
                    disabled={processingBooking === booking.id}
                  >
                    {processingBooking === booking.id ? (
                      <Loader className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    Reject & Refund
                  </Button>
                </>
              )}
              {booking.status === 'active' && booking.pickupVerified && (
                <Button 
                  size="sm" 
                  onClick={() => onCompleteRental(booking.id)} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={processingBooking === booking.id}
                >
                  {processingBooking === booking.id ? (
                    <Loader className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Complete & Delete Photo
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleViewDetails}
              >
                View Details
              </Button>
            </div>

            {/* Payment & Photo Info */}
            {booking.paymentStatus && (
              <div className="mt-3 pt-3 border-t flex gap-4 text-xs">
                <span className="text-gray-600">
                  Payment: <span className="text-green-600">{booking.paymentStatus.toUpperCase()}</span>
                </span>
                {booking.pickupPhotoS3Key && (
                  <span className="text-gray-600">
                    Photo: <span className="text-blue-600">Stored (auto-delete on completion)</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};