import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Navbar } from '../../components/shared/Navbar';
import { OwnerBookingRow } from '../../components/owner/OwnerBookingRow';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Calendar, User, Phone, Camera, CheckCircle, XCircle, Loader, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { sendBookingApprovedNotification, sendRentalCompletionNotification, sendBookingRejectionNotification } from '../../services/notifications';
import { deleteCustomerPhotoFromS3, createPhotoAuditLog } from '../../services/storage';
import { refundRazorpayPayment } from '../../services/razorpay';
import { updateBooking } from '../../services/database';

export const BookingManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data source: Bookings Collection
  // Filters: ownerId = loggedInOwner.id
  const { ownerBookings, isLoading, refreshData } = useOwnerData(user?.id || '');
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  // Auto-refresh when component mounts to ensure fresh data
  React.useEffect(() => {
    console.log('🔄 [BOOKING MANAGEMENT] Component mounted, refreshing data...');
    refreshData();
  }, []);

  const handleRefresh = () => {
    toast.info('Refreshing bookings...');
    refreshData();
    toast.success('Bookings refreshed!');
  };

  const handleAccept = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    
    try {
      toast.info('Approving booking...');
      
      const booking = ownerBookings.find(b => b.id === bookingId);
      if (booking) {
        // Step 1: Update booking status to 'confirmed'
        await updateBooking(bookingId, {
          status: 'confirmed',
          approvedAt: new Date(),
        });
        
        console.log('✅ [BOOKING MANAGEMENT] Booking status updated to confirmed');
        
        // Step 2: Send approval notification to customer
        await sendBookingApprovedNotification(
          booking.customerPhone,
          booking.customerEmail || 'customer@example.com',
          booking.id,
          booking.productTitle,
          format(booking.startDate, 'dd MMM yyyy')
        );
        
        // Step 3: Create audit log
        createPhotoAuditLog(
          bookingId,
          'booking_approved',
          user?.id || 'owner',
          `Booking approved by owner. Customer notified.`
        );
        
        toast.success('✅ Booking approved!');
        toast.success('📧 Approval notification sent to customer');
        
        // Step 4: Refresh data to show updated status
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to approve booking:', error);
      toast.error('Failed to approve booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    
    try {
      toast.info('Rejecting booking...');
      
      const booking = ownerBookings.find(b => b.id === bookingId);
      if (booking) {
        // Step 1: Update booking status to 'rejected'
        await updateBooking(bookingId, {
          status: 'rejected',
          rejectionReason: 'Rejected by owner',
        });
        
        console.log('✅ [BOOKING MANAGEMENT] Booking status updated to rejected');
        
        // Step 2: Initiate refund
        if (booking.paymentId) {
          await refundRazorpayPayment(
            booking.paymentId,
            booking.totalAmount,
            'Booking rejected by owner'
          );
        }
        
        // Step 3: Send rejection notification to customer
        await sendBookingRejectionNotification(
          booking.customerPhone,
          booking.customerEmail || 'customer@example.com',
          booking.id,
          booking.productTitle,
          'Owner is unavailable for the requested dates'
        );
        
        // Step 4: Create audit log
        createPhotoAuditLog(
          bookingId,
          'booking_rejected',
          user?.id || 'owner',
          `Booking rejected by owner. Customer notified and refund initiated.`
        );
        
        toast.success('Booking rejected');
        toast.info('💰 Refund initiated to customer');
        toast.success('📧 Rejection notification sent to customer');
        
        // Step 5: Refresh data to show updated status
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
      toast.error('Failed to reject booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleStartRental = (bookingId: string) => {
    navigate(`/owner/verify/${bookingId}`);
  };

  const handleCompleteRental = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    
    try {
      toast.info('Completing rental...');
      
      const booking = ownerBookings.find(b => b.id === bookingId);
      if (booking) {
        // Step 1: Auto-delete customer photo from S3
        if (booking.pickupPhotoS3Key) {
          toast.info('🗑️ Deleting customer photo from secure storage...');
          
          const auditLog = await deleteCustomerPhotoFromS3(
            booking.pickupPhotoS3Key,
            booking.id
          );
          
          toast.success('✅ Customer photo deleted (privacy compliance)');
          console.log('Audit log created:', auditLog);
        }
        
        // Step 2: Update booking status to 'completed'
        await updateBooking(bookingId, {
          status: 'completed',
          completedAt: new Date(),
          returnTime: new Date(),
          pickupPhotoUrl: undefined, // Remove photo URL
          pickupPhotoS3Key: undefined, // Remove S3 key
        });
        
        console.log('✅ [BOOKING MANAGEMENT] Booking status updated to completed');
        
        // Step 3: Process deposit refund
        toast.info('💰 Processing security deposit refund...');
        
        await refundRazorpayPayment(
          booking.paymentId || 'demo_payment',
          booking.deposit,
          'Security deposit refund on rental completion'
        );
        
        // Step 4: Send completion notification
        await sendRentalCompletionNotification(
          booking.customerPhone,
          booking.customerEmail || 'customer@example.com',
          booking.id,
          booking.productTitle,
          booking.deposit
        );
        
        // Step 5: Create audit log
        createPhotoAuditLog(
          bookingId,
          'rental_completed',
          user?.id || 'owner',
          `Rental completed by owner. Customer photo deleted, deposit refund initiated, customer notified.`
        );
        
        toast.success('🎉 Rental completed successfully!');
        toast.success('📧 Completion notification sent to customer');
        toast.info('Deposit will be refunded in 3-5 business days');
        
        // Step 6: Refresh data to show updated status
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to complete rental:', error);
      toast.error('Failed to complete rental');
    } finally {
      setProcessingBooking(null);
    }
  };

  // UI State - Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl mb-2">Booking Management</h1>
            <p className="text-gray-600">Total: {ownerBookings.length} bookings</p>
          </div>
          <Button onClick={handleRefresh} className="bg-blue-500 text-white">
            Refresh Bookings
          </Button>
        </div>

        {/* UI State - No bookings */}
        {ownerBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Bookings Yet</h3>
              <p className="text-gray-600">Bookings for your listings will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ownerBookings.map((booking, index) => (
              <OwnerBookingRow
                key={booking.id || `booking-${index}`}
                booking={booking}
                processingBooking={processingBooking}
                onAccept={handleAccept}
                onReject={handleReject}
                onStartRental={handleStartRental}
                onCompleteRental={handleCompleteRental}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};