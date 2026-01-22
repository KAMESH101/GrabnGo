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
  ShieldCheck
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
                  <img
                    src={booking.productImage}
                    alt={booking.productTitle}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
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
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <Badge 
                    variant={booking.paymentStatus === 'success' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {booking.paymentStatus?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
                {booking.paymentId && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {booking.paymentId}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>

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