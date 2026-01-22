import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../../components/shared/Navbar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LeafletMap } from '../../components/shared/LeafletMap';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useBookings } from '../../context/BookingContext';
import { Booking, User } from '../../types';
import { getUserById } from '../../services/database';
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  User as UserIcon, 
  Phone, 
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const CustomerBookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { getBookingById, cancelBooking } = useBookings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    if (!bookingId) {
      toast.error('Invalid booking ID');
      navigate('/customer/dashboard');
      return;
    }

    setIsLoading(true);
    console.log('📖 [BOOKING DETAILS] Loading booking:', bookingId);

    try {
      const fetchedBooking = await getBookingById(bookingId);
      
      if (!fetchedBooking) {
        toast.error('Booking not found');
        navigate('/customer/dashboard');
        return;
      }

      setBooking(fetchedBooking);
      console.log('✅ [BOOKING DETAILS] Booking loaded successfully');
      
      // Fetch owner information
      if (fetchedBooking.ownerId) {
        console.log('👤 [BOOKING DETAILS] Fetching owner info for:', fetchedBooking.ownerId);
        const ownerInfo = await getUserById(fetchedBooking.ownerId);
        if (ownerInfo) {
          setOwner(ownerInfo);
          console.log('✅ [BOOKING DETAILS] Owner info loaded:', {
            name: ownerInfo.name,
            phone: ownerInfo.phone,
            email: ownerInfo.email
          });
        }
      }
    } catch (error) {
      console.error('❌ [BOOKING DETAILS] Error loading booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsCanceling(true);
    try {
      await cancelBooking(booking.id);
      toast.success('Booking cancelled successfully');
      
      // Refresh booking details
      await loadBookingDetails();
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Booking not found. Please check your bookings list.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/customer/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton
            onClick={() => navigate('/customer/dashboard')}
            className="mb-4"
          >
            Back to My Bookings
          </BackButton>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl mb-2">Booking Details</h1>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Status Alert */}
        {booking.status === 'pending' && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your booking is pending owner approval. You will be notified once the owner responds.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'confirmed' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your booking has been confirmed! Please arrive at the pickup location on time.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'cancelled' && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This booking has been cancelled.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'rejected' && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This booking was rejected by the owner.
              {booking.rejectionReason && <p className="mt-1">Reason: {booking.rejectionReason}</p>}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={booking.productImage}
                    alt={booking.productTitle}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl mb-2">{booking.productTitle}</h3>
                    <p className="text-gray-600 mb-2">Product ID: {booking.productId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Period */}
            <Card>
              <CardHeader>
                <CardTitle>Rental Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-medium">{format(booking.startDate, 'dd MMM yyyy')}</p>
                        {booking.startTime && (
                          <p className="text-sm text-gray-600">{booking.startTime}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-medium">{format(booking.endDate, 'dd MMM yyyy')}</p>
                        {booking.endTime && (
                          <p className="text-sm text-gray-600">{booking.endTime}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {booking.pickupTime && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Actual Pickup Time</p>
                    <p className="font-medium">{format(booking.pickupTime, 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                )}

                {booking.returnTime && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Actual Return Time</p>
                    <p className="font-medium">{format(booking.returnTime, 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Details */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Owner ID</p>
                    <p className="font-medium">{booking.ownerId}</p>
                  </div>
                </div>
                {owner && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Owner Name</p>
                      <p className="font-medium">{owner.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Location (if verified) */}
            {booking.customerVerifiedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Verified Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium">{booking.customerVerifiedLocation.locality}</p>
                      <p className="text-sm text-gray-600">{booking.customerVerifiedLocation.displayAddress}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Verified on {format(booking.customerVerifiedLocation.verifiedAt, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <LeafletMap
                    lat={booking.customerVerifiedLocation.lat}
                    lng={booking.customerVerifiedLocation.lng}
                    title="Your Location"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{booking.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{booking.gst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit</span>
                  <span className="font-medium">₹{booking.deposit}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-semibold text-indigo-600 text-xl">₹{booking.totalAmount}</span>
                </div>

                {booking.paymentStatus && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Payment Status</span>
                    </div>
                    <StatusBadge status={booking.paymentStatus} />
                  </div>
                )}

                {booking.paymentId && (
                  <div className="text-xs text-gray-500">
                    Payment ID: {booking.paymentId}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Verification */}
            {booking.pickupVerified && booking.pickupPhotoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Pickup Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Verified</span>
                  </div>
                  <img
                    src={booking.pickupPhotoUrl}
                    alt="Pickup verification"
                    className="w-full rounded-lg"
                  />
                  {booking.pickupTime && (
                    <p className="text-sm text-gray-600 mt-2">
                      Verified on {format(booking.pickupTime, 'dd MMM yyyy, hh:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Owner */}
            {owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Owner</p>
                      <p className="font-medium">{owner.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <a
                        href={`tel:${owner.phone}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {owner.phone}
                      </a>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      window.location.href = `tel:${owner.phone}`;
                      toast.success(`Calling ${owner.name}...`);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Owner
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {canCancel && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={isCanceling}
                  >
                    {isCanceling ? 'Canceling...' : 'Cancel Booking'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    * Cancellation may be subject to terms and conditions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};