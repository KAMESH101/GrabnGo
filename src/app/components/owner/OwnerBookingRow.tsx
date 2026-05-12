// Reusable component for displaying owner bookings
// Data binding: {{booking.id}}, {{booking.customerName}}, {{booking.productTitle}}, etc.

import React from 'react';
import { useNavigate } from 'react-router';
import { Booking } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from '../shared/StatusBadge';
import { Calendar, User, Phone, Camera, CheckCircle, XCircle, Loader, IndianRupee, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OwnerBookingRowProps {
  booking: Booking;
  processingBooking: string | null;
  onAccept: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  onStartRental: (bookingId: string) => void;
  onCompleteRental: (bookingId: string) => void;
  onConfirmRemainingPayment: (bookingId: string) => void;
}

export const OwnerBookingRow: React.FC<OwnerBookingRowProps> = ({
  booking,
  processingBooking,
  onAccept,
  onReject,
  onStartRental,
  onCompleteRental,
  onConfirmRemainingPayment,
}) => {
  const remainingPaymentPending =
    booking.status === 'active' &&
    booking.pickupVerified &&
    booking.advancePaid &&
    booking.remainingPaymentStatus !== 'paid_to_owner';
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
          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={booking.productImage}
              alt={booking.productTitle}
              className="w-full h-full object-contain"
            />
          </div>
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
              {/* Show Approve / Reject for 'requested' bookings (no payment taken yet) */}
              {(booking.status === 'requested' || booking.status === 'pending') && (
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
                    Approve Request
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
                    Reject Request
                  </Button>
                </>
              )}

              {/* 'confirmed' = owner approved + advance paid — owner can start rental */}
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => onStartRental(booking.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={processingBooking === booking.id}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Start Rental &amp; Verify
                </Button>
              )}
              {booking.status === 'active' && booking.pickupVerified && (() => {
                const rps = booking.remainingPaymentStatus;
                const isPaidOnline = rps === 'paid_online';
                const isPaidCash   = rps === 'paid_cash' || rps === 'paid_to_owner';
                const isPaid       = isPaidOnline || isPaidCash;

                if (!isPaid) {
                  // STATE 1 — Remaining pending, waiting for customer to pay online or cash
                  return (
                    <>
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-800">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span>
                          Remaining <strong>₹{booking.remainingAmount ?? ''}</strong> not yet paid
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onConfirmRemainingPayment(booking.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={processingBooking === booking.id}
                      >
                        {processingBooking === booking.id ? (
                          <Loader className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <IndianRupee className="w-4 h-4 mr-1" />
                        )}
                        Confirm Cash Payment
                      </Button>
                    </>
                  );
                }

                // STATE 2 — Paid online / STATE 3 — Paid cash → show Complete button
                return (
                  <>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isPaidOnline
                        ? 'bg-blue-50 border border-blue-300 text-blue-700'
                        : 'bg-green-50 border border-green-300 text-green-700'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      {isPaidOnline ? 'Remaining Paid Online ✔' : 'Cash Payment Confirmed ✔'}
                    </span>
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
                  </>
                );
              })()}
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
              >
                View Details
              </Button>
            </div>

            {/* Payment & Photo Info */}
            {(booking.paymentStatus || booking.advancePaid) && (
              <div className="mt-3 pt-3 border-t flex gap-4 text-xs flex-wrap">
                {booking.paymentStatus && (
                  <span className="text-gray-600">
                    Payment: <span className="text-green-600">{booking.paymentStatus.toUpperCase()}</span>
                  </span>
                )}
                {booking.advancePaid && booking.advanceAmount != null && (
                  <span className="inline-flex items-center gap-1 bg-green-50 border border-green-300 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle className="w-3 h-3" /> Advance Paid: ₹{booking.advanceAmount}
                  </span>
                )}
                {!booking.advancePaid && booking.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-300 text-blue-700 px-2 py-0.5 rounded-full">
                    Advance Pending from customer
                  </span>
                )}
                {booking.remainingAmount != null && booking.advancePaid && (
                  <span className="text-gray-600">
                    Remaining:{' '}
                    <span className={booking.remainingPaymentStatus === 'paid_to_owner' ? 'text-green-600' : 'text-orange-600'}>
                      ₹{booking.remainingAmount}{' '}
                      {booking.remainingPaymentStatus === 'paid_to_owner' ? '✓ Paid to Owner' : '(Pending)'}
                    </span>
                  </span>
                )}
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