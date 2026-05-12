import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Booking } from '../../types';
import { Navbar } from '../../components/shared/Navbar';
import { LeafletMap } from '../../components/shared/LeafletMap';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { CustomerLocationDisplayLeaflet } from '../../components/owner/CustomerLocationDisplayLeaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { format } from 'date-fns';
import { updateBooking } from '../../services/database';
import { deleteCustomerPhotoFromS3, createPhotoAuditLog } from '../../services/storage';
import { sendRentalCompletionNotification } from '../../services/notifications';
import { refundRazorpayPayment } from '../../services/razorpay';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Package,
  Camera,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Loader2,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Loader,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';

export const BookingDetails: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { getBookingById, ownerListings } = useOwnerData(user?.id || '');

  // Component state
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Get listing details for the booking
  const listing = booking ? ownerListings.find(l => l.id === booking.productId) : undefined;

  // Load booking data
  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('📖 [BOOKING DETAILS] Loading booking:', bookingId);
        const fetchedBooking = await getBookingById(bookingId);

        if (!fetchedBooking) {
          setError('Booking not found');
          setBooking(null);
        } else {
          setBooking(fetchedBooking);
          console.log('✅ [BOOKING DETAILS] Booking loaded successfully');
        }
      } catch (err) {
        console.error('❌ [BOOKING DETAILS] Error loading booking:', err);
        setError('Failed to load booking');
        setBooking(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
    // getBookingById is now stable (memoized with useCallback), so we only depend on bookingId
  }, [bookingId, getBookingById]);

  // UI State - Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  // UI State - Not found
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/owner/bookings')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Booking Not Found</h3>
              <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/owner/bookings')}>
                Go to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Narrow type: booking is guaranteed non-null from here on
  if (!booking) return null;

  // ── Owner action: Confirm cash payment ──────────────────────────────────────
  const handleConfirmCashPayment = async () => {
    if (!booking) return;
    const confirmed = window.confirm(
      `Confirm that the customer has paid ₹${booking.remainingAmount ?? ''} in cash to you?\n\nThis will unlock the "Complete & Delete Photo" button.`
    );
    if (!confirmed) return;
    setProcessingAction(true);
    try {
      await updateBooking(booking.id, {
        remainingPaymentStatus: 'paid_cash',
        paymentStatus: 'success', // mark overall payment as success for Payment Status card & reports
      });
      createPhotoAuditLog(
        booking.id,
        'payment_success',
        user?.id || 'owner',
        `Cash payment of ₹${booking.remainingAmount} confirmed received by owner (from detail page).`
      );
      toast.success(`✅ Cash payment of ₹${booking.remainingAmount} confirmed!`);
      toast.info('You can now complete the rental and delete the photo.');
      // Reload booking
      const updated = await getBookingById(booking.id);
      if (updated) setBooking(updated);
    } catch (err) {
      console.error('Failed to confirm cash payment:', err);
      toast.error('Failed to update payment status. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Owner action: Complete rental & delete photo ─────────────────────────────
  const handleCompleteRental = async () => {
    if (!booking) return;
    const isPaid =
      booking.remainingPaymentStatus === 'paid_online' ||
      booking.remainingPaymentStatus === 'paid_cash' ||
      booking.remainingPaymentStatus === 'paid_to_owner';
    if (booking.advancePaid && !isPaid) {
      toast.error('Please confirm the remaining payment before completing the rental.');
      return;
    }
    setProcessingAction(true);
    try {
      // Delete customer photo from S3
      if (booking.pickupPhotoS3Key) {
        toast.info('🗑️ Deleting customer photo from secure storage...');
        const auditLog = await deleteCustomerPhotoFromS3(booking.pickupPhotoS3Key, booking.id);
        toast.success('✅ Customer photo deleted (privacy compliance)');
        console.log('Audit log created:', auditLog);
      }
      // Mark booking as completed
      await updateBooking(booking.id, {
        status: 'completed',
        completedAt: new Date(),
        returnTime: new Date(),
        pickupPhotoUrl: undefined,
        pickupPhotoS3Key: undefined,
      });
      // Refund deposit (no-op in test mode)
      await refundRazorpayPayment(
        booking.paymentId || 'demo_payment',
        booking.deposit ?? 0,
        'Security deposit refund on rental completion'
      );
      // Notify customer
      await sendRentalCompletionNotification(
        booking.customerPhone,
        booking.customerEmail || 'customer@example.com',
        booking.id,
        booking.productTitle,
        booking.deposit ?? 0
      );
      createPhotoAuditLog(
        booking.id,
        'rental_completed',
        user?.id || 'owner',
        `Rental completed from detail page. Photo deleted, deposit refund initiated.`
      );
      toast.success('🎉 Rental completed successfully!');
      toast.success('📧 Completion notification sent to customer');
      // Reload
      const updated = await getBookingById(booking.id);
      if (updated) setBooking(updated);
    } catch (err) {
      console.error('Failed to complete rental:', err);
      toast.error('Failed to complete rental. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/owner/bookings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">Booking Details</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span>Booking ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {booking.id?.toUpperCase() || 'N/A'}
                </code>
              </div>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Information
                </CardTitle>
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
                    {listing && (
                      <>
                        <Badge variant="outline" className="mb-2">
                          {listing.category}
                        </Badge>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Price/Day:</span> ₹{listing.pricePerDay}
                          </div>
                          {listing.pricePerHour && (
                            <div>
                              <span className="font-medium">Price/Hour:</span> ₹{listing.pricePerHour}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-medium">{booking.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{booking.customerPhone}</p>
                    </div>
                  </div>
                  {booking.customerEmail && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{booking.customerEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Verified Location - Trust Factor for Owners */}
            {booking.customerVerifiedLocation && (
              <CustomerLocationDisplayLeaflet
                customerLocation={booking.customerVerifiedLocation}
                productLat={listing?.pickupLat}
                productLng={listing?.pickupLng}
                productAddress={listing?.pickupAddress}
              />
            )}

            {/* Rental Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Rental Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date & Time</p>
                    {booking.startDate && booking.startDate instanceof Date && !isNaN(booking.startDate.getTime()) ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{format(booking.startDate, 'dd MMM yyyy')}</span>
                        </div>
                        {booking.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{booking.startTime}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">Invalid date</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date & Time</p>
                    {booking.endDate && booking.endDate instanceof Date && !isNaN(booking.endDate.getTime()) ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{format(booking.endDate, 'dd MMM yyyy')}</span>
                        </div>
                        {booking.endTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{booking.endTime}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">Invalid date</p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Actual Pickup/Return Times */}
                {(booking.pickupTime || booking.returnTime) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {booking.pickupTime && booking.pickupTime instanceof Date && !isNaN(booking.pickupTime.getTime()) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Actual Pickup Time</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {format(booking.pickupTime, 'dd MMM yyyy, hh:mm a')}
                          </span>
                        </div>
                      </div>
                    )}
                    {booking.returnTime && booking.returnTime instanceof Date && !isNaN(booking.returnTime.getTime()) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Actual Return Time</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {format(booking.returnTime, 'dd MMM yyyy, hh:mm a')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Location */}
            {listing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Pickup Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="font-medium mb-1">{listing.pickupAddress}</p>
                      <Badge variant="outline">{listing.pickupLocality}</Badge>
                    </div>
                    {listing.pickupInstructions && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pickup Instructions</p>
                        <p className="text-sm bg-blue-50 border border-blue-200 rounded p-3">
                          {listing.pickupInstructions}
                        </p>
                      </div>
                    )}
                    {/* Map Preview - Based on Address Geocoding */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Map Location (from address)</p>
                      <div className="rounded-lg overflow-hidden border">
                        <LeafletMap
                          lat={listing.pickupLat}
                          lng={listing.pickupLng}
                          title={listing.title}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {listing.pickupLat.toFixed(5)}, {listing.pickupLng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo Verification */}
            {booking.pickupVerified && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photo Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Camera className="w-5 h-5" />
                      <span className="font-medium">Pickup Verified ✓</span>
                    </div>
                    {booking.pickupPhotoS3Key && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <p className="text-blue-800 mb-1">
                          <strong>Storage Key:</strong> {booking.pickupPhotoS3Key}
                        </p>
                        <p className="text-blue-600">
                          Photo will be automatically deleted after rental completion (privacy compliance)
                        </p>
                      </div>
                    )}
                    {booking.pickupTime && booking.pickupTime instanceof Date && !isNaN(booking.pickupTime.getTime()) && (
                      <div className="text-sm text-gray-600">
                        <strong>Verified at:</strong> {format(booking.pickupTime, 'dd MMM yyyy, hh:mm a')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{booking.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{booking.gst}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-xl font-medium text-green-600">₹{booking.totalAmount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Security Deposit</span>
                  <span className="text-lg font-medium text-blue-600">₹{booking.deposit}</span>
                </div>

                {/* Advance / Remaining Breakdown */}
                {booking.advancePaid && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Advance Paid
                      </span>
                      <span className="font-medium text-green-700">₹{booking.advanceAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-700">Remaining (from customer)</span>
                      <span className="font-medium text-orange-700">₹{booking.remainingAmount}</span>
                    </div>
                    {booking.remainingPaymentStatus && (() => {
                      const rps = booking.remainingPaymentStatus;
                      const isPaid = rps === 'paid_online' || rps === 'paid_cash' || rps === 'paid_to_owner';
                      const label = rps === 'paid_online'
                        ? '✓ Received (Online)'
                        : (rps === 'paid_cash' || rps === 'paid_to_owner')
                        ? '✓ Received (Cash)'
                        : 'Pending';
                      return (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Final Payment</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {label}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Advance Payment */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Advance Payment</span>
                  {booking.advancePaid ? (
                    <Badge variant="default" className="bg-green-600 text-white text-xs">✔ PAID</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">PENDING</Badge>
                  )}
                </div>

                {/* Final / Remaining Payment */}
                {booking.remainingPaymentStatus && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Final Payment</span>
                    {booking.remainingPaymentStatus === 'paid_online' ? (
                      <Badge variant="default" className="bg-blue-600 text-white text-xs">✔ PAID ONLINE</Badge>
                    ) : (booking.remainingPaymentStatus === 'paid_cash' || booking.remainingPaymentStatus === 'paid_to_owner') ? (
                      <Badge variant="default" className="bg-green-600 text-white text-xs">✔ CASH RECEIVED</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">PENDING</Badge>
                    )}
                  </div>
                )}

                {/* Overall Status */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Overall Status</span>
                  <Badge
                    variant={booking.paymentStatus === 'success' ? 'default' : 'secondary'}
                    className={`text-sm ${booking.paymentStatus === 'success' ? 'bg-green-600 text-white' : ''}`}
                  >
                    {booking.paymentStatus === 'success' ? '✔ SUCCESS' : (booking.paymentStatus?.toUpperCase() || 'PENDING')}
                  </Badge>
                </div>

                {booking.advanceTransactionId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Advance Txn ID</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {booking.advanceTransactionId}
                    </code>
                  </div>
                )}
                {booking.remainingTransactionId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Final Txn ID (Online)</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {booking.remainingTransactionId}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remaining Payment & Completion Actions (for active bookings) */}
            {booking.status === 'active' && booking.pickupVerified && booking.advancePaid && (() => {
              const rps = booking.remainingPaymentStatus;
              const isPaidOnline = rps === 'paid_online';
              const isPaidCash = rps === 'paid_cash' || rps === 'paid_to_owner';
              const isPaid = isPaidOnline || isPaidCash;

              if (!isPaid) {
                // STATE 1 — Remaining payment pending, customer hasn't paid yet
                return (
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
                        <IndianRupee className="w-5 h-5" />
                        Remaining Payment Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-orange-800">
                        Customer must pay <strong>₹{booking.remainingAmount}</strong> before you can complete the rental.
                      </p>
                      <p className="text-xs text-orange-700">
                        If the customer paid <strong>online via Razorpay</strong>, it auto-confirms — no action needed from you.<br />
                        If the customer is <strong>paying cash</strong>, click below to confirm receipt.
                      </p>
                      <Button
                        onClick={handleConfirmCashPayment}
                        disabled={processingAction}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {processingAction ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : (
                          <><Banknote className="w-4 h-4 mr-2" /> Confirm Cash Payment (₹{booking.remainingAmount})</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              // STATE 2 — Paid online | STATE 3 — Paid cash → show Complete Rental button
              return (
                <Card className="border-2 border-indigo-200 bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-900 text-base">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      Payment Received
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isPaidOnline ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      {isPaidOnline ? `✔ Remaining Paid Online (₹${booking.remainingAmount})` : `✔ Cash Payment Confirmed (₹${booking.remainingAmount})`}
                    </div>
                    <Button
                      onClick={handleCompleteRental}
                      disabled={processingAction}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                      size="lg"
                    >
                      {processingAction ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Completing...</>
                      ) : (
                        <><CheckCircle className="w-5 h-5 mr-2" /> Complete Rental &amp; Delete Photo</>
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      This will mark the rental as completed and permanently delete the customer photo.
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Booking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {booking.createdAt && booking.createdAt instanceof Date && !isNaN(booking.createdAt.getTime()) && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-gray-600 mb-1">Booking Created</p>
                      <p className="font-medium text-blue-700">
                        {format(booking.createdAt, 'EEEE, dd MMM yyyy')}
                      </p>
                      <p className="text-sm text-blue-600">
                        {format(booking.createdAt, 'hh:mm a')}
                      </p>
                    </div>
                  )}
                  {booking.approvedAt && booking.approvedAt instanceof Date && !isNaN(booking.approvedAt.getTime()) && (
                    <div>
                      <p className="text-gray-600">Approved at</p>
                      <p className="font-medium">{format(booking.approvedAt, 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  )}
                  {booking.completedAt && booking.completedAt instanceof Date && !isNaN(booking.completedAt.getTime()) && (
                    <div>
                      <p className="text-gray-600">Completed at</p>
                      <p className="font-medium">{format(booking.completedAt, 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  )}
                  {booking.rejectionReason && (
                    <div>
                      <p className="text-gray-600">Rejection Reason</p>
                      <p className="font-medium text-red-600">{booking.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Primary Action - Confirm Pickup (For confirmed bookings awaiting pickup) */}
            {booking.status === 'confirmed' && !booking.pickupVerified && (
              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <ShieldCheck className="w-5 h-5" />
                    Ready for Pickup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-white border-indigo-200">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <AlertDescription className="text-sm">
                      Customer photo verification is required at pickup for security purposes.
                      The photo will be stored temporarily and automatically deleted after rental completion.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => navigate(`/owner/verify/${booking.id}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Confirm Pickup & Verify Customer
                  </Button>

                  <p className="text-xs text-center text-gray-600">
                    Camera will only activate after you start the verification process
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