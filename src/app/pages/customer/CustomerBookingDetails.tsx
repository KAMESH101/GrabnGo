import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../../components/shared/Navbar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LeafletMap } from '../../components/shared/LeafletMap';
import { BookingDirectionsMap } from '../../components/BookingDirectionsMap';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useBookings } from '../../context/BookingContext';
import { Booking, User } from '../../types';
import { getUserById, updateBooking } from '../../services/database';
import { initializeRazorpayPayment, openRazorpayCheckout, calculateAdvanceAmount, calculateRemainingAmount, verifyRazorpaySignature, initializeRemainingPayment, openRemainingRazorpayCheckout } from '../../services/razorpay';
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
  Shield,
  Navigation,
  ExternalLink,
  Loader2,
  Banknote,
  IndianRupee
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
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);
  const [isPayingRemaining, setIsPayingRemaining] = useState(false);

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

  // ── PAY ADVANCE (triggered after owner approval) ─────────────────────────────
  const handlePayAdvance = async () => {
    if (!booking) return;

    setIsPayingAdvance(true);

    try {
      const advanceAmount = booking.advanceAmount ?? calculateAdvanceAmount(booking.totalAmount);
      const remainingAmount = booking.remainingAmount ?? calculateRemainingAmount(booking.totalAmount);

      toast.info('Initializing advance payment...');

      const paymentDetails = await initializeRazorpayPayment(
        advanceAmount,
        booking.id,
        booking.customerName,
        booking.customerEmail || '',
        booking.customerPhone,
        booking.status
      );

      toast.success('Payment gateway ready');

      openRazorpayCheckout(
        paymentDetails,
        async (response) => {
          try {
            toast.info('Verifying payment...');
            const verification = await verifyRazorpaySignature(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (!verification.success) {
              toast.error('Payment verification failed. Please contact support.');
              setIsPayingAdvance(false);
              return;
            }
            toast.success('✅ Payment verified!');
            await updateBooking(booking.id, {
              status: 'confirmed',
              advancePaid: true,
              advanceAmount,
              advanceTransactionId: response.razorpay_payment_id,
              paymentId: response.razorpay_payment_id,
              paymentMethod: 'razorpay',
              remainingAmount,
              approvedAt: new Date(),
            });
            toast.success('🎉 Booking confirmed! Advance paid.');
            toast.info(`Remaining ₹${remainingAmount} to be paid directly to owner after rental.`);
            await loadBookingDetails();
          } catch (verifyError: any) {
            console.error('❌ Payment verification error:', verifyError);
            toast.error(verifyError.message || 'Payment verification failed.');
          } finally {
            setIsPayingAdvance(false);
          }
        },
        (error) => {
          const msg = typeof error === 'string' ? error : error?.description || 'Payment cancelled or failed.';
          if (!msg.toLowerCase().includes('cancel')) toast.error(msg);
          setIsPayingAdvance(false);
        },
        { name: booking.customerName, email: booking.customerEmail || '', contact: booking.customerPhone }
      );
    } catch (error: any) {
      console.error('Advance payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setIsPayingAdvance(false);
    }
  };

  // ── PAY REMAINING via Razorpay (after rental starts) ───────────────────────
  const handlePayRemaining = async () => {
    if (!booking) return;
    if (booking.status !== 'active') {
      toast.error('Remaining payment is only available after rental starts.');
      return;
    }
    setIsPayingRemaining(true);
    try {
      const remainingAmount = booking.remainingAmount ?? calculateRemainingAmount(booking.totalAmount);
      toast.info('Initializing remaining payment...');
      const paymentDetails = await initializeRemainingPayment(remainingAmount, booking.id, booking.status);
      toast.success('Payment gateway ready');
      openRemainingRazorpayCheckout(
        paymentDetails,
        async (response) => {
          try {
            toast.info('Verifying remaining payment...');
            const verification = await verifyRazorpaySignature(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (!verification.success) {
              toast.error('Payment verification failed. Please contact support.');
              setIsPayingRemaining(false);
              return;
            }
            toast.success('✅ Remaining payment verified!');
            await updateBooking(booking.id, {
              remainingPaymentStatus: 'paid_online',
              remainingTransactionId: response.razorpay_payment_id,
              paymentStatus: 'success',
            });
            toast.success('🎉 Remaining rental payment completed online!');
            await loadBookingDetails();
          } catch (verifyError: any) {
            console.error('❌ Remaining payment verification error:', verifyError);
            toast.error(verifyError.message || 'Payment verification failed.');
          } finally {
            setIsPayingRemaining(false);
          }
        },
        (error) => {
          const msg = typeof error === 'string' ? error : error?.description || 'Payment cancelled or failed.';
          if (!msg.toLowerCase().includes('cancel')) toast.error(msg);
          setIsPayingRemaining(false);
        },
        { name: booking.customerName, email: booking.customerEmail || '', contact: booking.customerPhone }
      );
    } catch (error: any) {
      console.error('Remaining payment error:', error);
      toast.error(error.message || 'Failed to process remaining payment. Please try again.');
      setIsPayingRemaining(false);
    }
  };


  // ── PAY CASH to owner (inform owner — they confirm on their side) ─────────
  const handlePayCash = async () => {
    if (!booking) return;
    toast.info(
      `Please hand ₹${booking.remainingAmount ?? ''} cash directly to the owner. The owner will confirm receipt on their dashboard.`,
      { duration: 6000 }
    );
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

  const canCancel = booking.status === 'requested' || booking.status === 'approved' || booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/dashboard')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Bookings
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl mb-2">Booking Details</h1>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Status Alerts */}
        {booking.status === 'requested' && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Booking request sent.</strong> Waiting for owner approval. No payment has been taken yet.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'approved' && (
          <div className="mb-6 space-y-3">
            {/* Pay Advance Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 space-y-3">
                <p>
                  <strong>🎉 Owner approved your booking!</strong> Pay the advance amount to confirm your rental.
                </p>
                <Button
                  onClick={handlePayAdvance}
                  disabled={isPayingAdvance}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                >
                  {isPayingAdvance ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing Payment...</>
                  ) : (
                    <><CreditCard className="w-4 h-4 mr-2" />Pay Advance ₹{booking.advanceAmount ?? calculateAdvanceAmount(booking.totalAmount)}</>
                  )}
                </Button>
              </AlertDescription>
            </Alert>

            {/* Test Payment Guide — visible to recruiters */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                🧪 Test Mode — Payment Credentials
              </p>
              <p className="text-xs text-amber-600 mb-3">
                This is a Razorpay test environment. No real money is processed. Use the credentials below to explore the full payment flow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                {/* Netbanking */}
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="font-semibold text-green-700 mb-1">✅ Netbanking <span className="text-xs font-normal text-green-600">(No OTP)</span></p>
                  <p className="text-gray-600 text-xs">Select any bank</p>
                  <p className="text-gray-600 text-xs">Click <strong>"Success"</strong> on next page</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-700 mb-1">💳 Debit / Credit Card</p>
                  <p className="text-gray-600 text-xs font-mono">5267 3181 8797 5449</p>
                  <p className="text-gray-600 text-xs">Expiry: <strong>12/26</strong> · CVV: <strong>123</strong></p>
                  <p className="text-gray-600 text-xs">OTP (if asked): <strong>1234</strong></p>
                </div>

              </div>
            </div>
          </div>
        )}

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
              Your booking has been confirmed! Advance paid. Please arrive at the pickup location on time.
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

        {/* ── ACTIVE RENTAL: Remaining Payment Block ─────────────────────── */}
        {booking.status === 'active' && booking.advancePaid && (() => {
          const rps = booking.remainingPaymentStatus;
          const isPaidOnline = rps === 'paid_online';
          const isPaidCash = rps === 'paid_cash' || rps === 'paid_to_owner';

          if (isPaidOnline) {
            return (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>✔ Remaining Paid Online</strong> — ₹{booking.remainingAmount} paid via Razorpay. The owner will complete the rental shortly.
                </AlertDescription>
              </Alert>
            );
          }

          if (isPaidCash) {
            return (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✔ Cash Payment Confirmed by Owner</strong> — ₹{booking.remainingAmount} confirmed. The owner will complete the rental shortly.
                </AlertDescription>
              </Alert>
            );
          }

          // Remaining payment still pending — show action buttons
          return (
            <Alert className="mb-6 bg-orange-50 border-orange-200">
              <IndianRupee className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 space-y-3">
                <p>
                  <strong>Remaining Amount Due: ₹{booking.remainingAmount ?? calculateRemainingAmount(booking.totalAmount)}</strong>
                  <span className="block text-sm mt-1">Your rental is active. Please pay the remaining balance to the owner.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handlePayRemaining}
                    disabled={isPayingRemaining}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isPayingRemaining ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay Online (₹{booking.remainingAmount ?? calculateRemainingAmount(booking.totalAmount)})</>
                    )}
                  </button>
                  <button
                    onClick={handlePayCash}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                  >
                    <Banknote className="w-4 h-4" />
                    Pay Cash to Owner
                  </button>
                </div>
                <p className="text-xs text-orange-600">
                  <strong>Pay Online</strong> → Auto-verified instantly. &nbsp;|
                  &nbsp;<strong>Pay Cash</strong> → Hand cash to owner; they confirm on their dashboard.
                </p>
              </AlertDescription>
            </Alert>
          );
        })()}

        {booking.status === 'completed' && booking.remainingPaymentStatus === 'pending' && (
          <Alert className="mb-6 bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Final Payment Due:</strong> Please pay <strong>₹{booking.remainingAmount}</strong> directly to the owner to complete your rental.
              {owner && <span> Contact {owner.name} at {owner.phone}.</span>}
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'completed' && (booking.remainingPaymentStatus === 'paid_to_owner' || booking.remainingPaymentStatus === 'paid_online' || booking.remainingPaymentStatus === 'paid_cash') && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Rental complete! Final payment has been made.
              {booking.remainingPaymentStatus === 'paid_online' && ' (Paid online via Razorpay)'}
              {(booking.remainingPaymentStatus === 'paid_cash' || booking.remainingPaymentStatus === 'paid_to_owner') && ' (Paid cash to owner)'}
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
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={booking.productImage}
                      alt={booking.productTitle}
                      className="w-full h-full object-contain"
                    />
                  </div>
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

            {/* ━━ Navigate to Pickup ━ only shown when confirmed + coords exist */}
            {booking.status === 'confirmed' && booking.pickupLat && booking.pickupLng && (
              <NavigateToPickupCard
                pickupLat={booking.pickupLat}
                pickupLng={booking.pickupLng}
                pickupAddress={booking.pickupAddress}
              />
            )}

            {/* Directions Map — only visible after owner confirms */}
            <Card>
              <CardHeader>
                <CardTitle>Directions to Pickup</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                <BookingDirectionsMap booking={booking} />
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
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total Rental Amount</span>
                  <span className="font-semibold text-indigo-600 text-xl">₹{booking.totalAmount}</span>
                </div>

                {/* Advance Payment Breakdown */}
                {booking.advancePaid && (
                  <>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Advance Paid
                        </span>
                        <span className="font-medium text-green-700">₹{booking.advanceAmount}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-orange-700">Remaining to Owner</span>
                        <span className="font-medium text-orange-700">₹{booking.remainingAmount}</span>
                      </div>
                      {booking.remainingPaymentStatus && (() => {
                        const rps = booking.remainingPaymentStatus;
                        const label =
                          rps === 'paid_online' ? '✔ Paid Online'
                          : rps === 'paid_cash' || rps === 'paid_to_owner' ? '✔ Cash Confirmed'
                          : 'Pending';
                        const cls =
                          rps === 'paid_online' ? 'bg-blue-100 text-blue-700'
                          : rps === 'paid_cash' || rps === 'paid_to_owner' ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700';
                        return (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600">Final Payment Status</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${cls}`}>{label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {booking.paymentStatus && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Advance Payment Status</span>
                    </div>
                    <StatusBadge status={booking.advancePaid ? 'success' : (booking.paymentStatus || 'pending')} />
                  </div>
                )}

                {booking.advanceTransactionId && (
                  <div className="text-xs text-gray-500">
                    Advance Transaction ID: {booking.advanceTransactionId}
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

// ─── Navigate to Pickup Card ───────────────────────────────────────────────────
// Customer-facing equivalent of the owner page's "Get Directions" button.
// Opens OpenStreetMap directions from the customer's live GPS position to
// the owner's pickup point.   ✅ Leaflet/OSM only  ❌ No Google Maps
// ──────────────────────────────────────────────────────────────────────────────

interface NavigateToPickupCardProps {
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
}

const NavigateToPickupCard: React.FC<NavigateToPickupCardProps> = ({
  pickupLat,
  pickupLng,
  pickupAddress,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  const handleNavigate = () => {
    setLoading(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      // No geolocation — open OSM centred on the pickup point so customer can still use it
      const fallbackUrl = `https://www.openstreetmap.org/?mlat=${pickupLat}&mlon=${pickupLng}#map=16/${pickupLat}/${pickupLng}`;
      window.open(fallbackUrl, '_blank');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: fromLat, longitude: fromLng } = pos.coords;
        // OSM directions: from customer's live location → owner pickup
        const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${fromLat}%2C${fromLng}%3B${pickupLat}%2C${pickupLng}`;
        window.open(url, '_blank');
        setLoading(false);
      },
      (err) => {
        // If denied/unavailable — still open OSM with just the destination
        console.warn('[NAVIGATE] Geolocation error:', err.code, err.message);
        if (err.code === 1) {
          setGeoError('Location permission denied. Opening destination on map instead.');
        } else {
          setGeoError('Could not get your location. Opening destination on map instead.');
        }
        const fallbackUrl = `https://www.openstreetmap.org/?mlat=${pickupLat}&mlon=${pickupLng}#map=16/${pickupLat}/${pickupLng}`;
        window.open(fallbackUrl, '_blank');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Navigation className="w-5 h-5" />
          Navigate to Pickup Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Address display */}
        {pickupAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-indigo-900 font-medium">{pickupAddress}</p>
          </div>
        )}

        {/* Error note */}
        {geoError && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {geoError}
          </p>
        )}

        {/* Main CTA button */}
        <Button
          onClick={handleNavigate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting your location…
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions to Pickup
              <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
            </>
          )}
        </Button>

        <p className="text-xs text-indigo-600 text-center">
          Opens OpenStreetMap with turn-by-turn driving directions
        </p>
      </CardContent>
    </Card>
  );
};