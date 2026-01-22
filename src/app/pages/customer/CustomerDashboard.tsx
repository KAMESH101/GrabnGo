import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/shared/Navbar';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useBookings } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, CreditCard, Loader, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../../components/ui/alert';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, isLoading, cancelBooking: cancelBookingService, refreshBookings } = useBookings();
  const [isCanceling, setIsCanceling] = useState<string | null>(null);

  // Refresh bookings on mount
  useEffect(() => {
    console.log('🔄 [CUSTOMER DASHBOARD] Refreshing bookings on mount');
    refreshBookings();
  }, []);

  // Debug: Log bookings when they change
  useEffect(() => {
    console.log('📊 [CUSTOMER DASHBOARD] Bookings updated:', {
      count: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        productTitle: b.productTitle,
        status: b.status,
        hasValidId: !!b.id
      }))
    });
    
    // Help users if bookings are missing
    if (user && bookings.length === 0) {
      console.warn('⚠️ [CUSTOMER DASHBOARD] No bookings found!');
      console.log('💡 [CUSTOMER DASHBOARD] If you are testing with arun@customer.com:');
      console.log('   - Visit /test-accounts page');
      console.log('   - Click "Reset Bookings with Sample Data" button');
      console.log('   - Or click "Reset Database with Sample Bookings"');
    }
  }, [bookings, user]);

  // Filter bookings by status
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'active'
  );
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected');

  const handleCancelBooking = async (bookingId: string) => {
    setIsCanceling(bookingId);
    try {
      await cancelBookingService(bookingId);
      toast.success('Booking cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setIsCanceling(null);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    console.log('🔍 [CUSTOMER DASHBOARD] View Details clicked for booking:', bookingId);
    
    if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
      console.error('❌ [CUSTOMER DASHBOARD] Invalid booking ID:', bookingId);
      toast.error('Invalid booking ID. Please try again or contact support.');
      return;
    }
    
    console.log('✅ [CUSTOMER DASHBOARD] Navigating to:', `/customer/booking-details/${bookingId}`);
    navigate(`/customer/booking-details/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl mb-6">My Bookings</h1>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader className="w-10 h-10 text-gray-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading bookings...</p>
                  </CardContent>
                </Card>
              ) : upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No upcoming bookings</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking, index) => (
                  <Card key={booking.id || `upcoming-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={booking.productImage}
                          alt={booking.productTitle}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <h3 className="text-xl">{booking.productTitle}</h3>
                            <StatusBadge status={booking.status} />
                          </div>

                          {/* Status-specific alerts */}
                          {booking.status === 'pending' && (
                            <Alert className="mb-3 bg-amber-50 border-amber-200">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-800 text-sm">
                                ⏳ Awaiting owner approval. You'll be notified once the owner reviews your request.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {booking.status === 'confirmed' && !booking.pickupVerified && (
                            <Alert className="mb-3 bg-green-50 border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800 text-sm">
                                ✅ Approved by owner! Please visit the pickup location to collect the item.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {booking.status === 'active' && booking.pickupVerified && (
                            <Alert className="mb-3 bg-blue-50 border-blue-200">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800 text-sm">
                                🚀 Rental is active. Enjoy your rental!
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Duration</p>
                                <p>
                                  {booking.startDate && booking.startDate instanceof Date && !isNaN(booking.startDate.getTime()) 
                                    ? format(booking.startDate, 'dd MMM') 
                                    : 'Invalid'} - {booking.endDate && booking.endDate instanceof Date && !isNaN(booking.endDate.getTime()) 
                                    ? format(booking.endDate, 'dd MMM yyyy') 
                                    : 'Invalid'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p>₹{booking.totalAmount}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <p className="text-sm">{booking.id?.toUpperCase() || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(booking.id)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={isCanceling === booking.id}
                            >
                              {isCanceling === booking.id ? 'Canceling...' : 'Cancel Booking'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader className="w-10 h-10 text-gray-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading bookings...</p>
                  </CardContent>
                </Card>
              ) : pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No past bookings</p>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((booking, index) => (
                  <Card key={booking.id || `past-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={booking.productImage}
                          alt={booking.productTitle}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <h3 className="text-xl">{booking.productTitle}</h3>
                            <StatusBadge status={booking.status} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Duration</p>
                                <p>
                                  {booking.startDate && booking.startDate instanceof Date && !isNaN(booking.startDate.getTime()) 
                                    ? format(booking.startDate, 'dd MMM') 
                                    : 'Invalid'} - {booking.endDate && booking.endDate instanceof Date && !isNaN(booking.endDate.getTime()) 
                                    ? format(booking.endDate, 'dd MMM yyyy') 
                                    : 'Invalid'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p>₹{booking.totalAmount}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <p className="text-sm">{booking.id?.toUpperCase() || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(booking.id)}
                            >
                              View Details
                            </Button>
                            {booking.status === 'completed' && (
                              <Button size="sm">Leave Review</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};