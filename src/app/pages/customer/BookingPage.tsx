import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { Calendar, IndianRupee, Shield, Clock, User, MapPin, Loader2, Calendar as CalendarIcon, ShieldCheck, CreditCard } from 'lucide-react';
import { getProductById } from '../../services/database';
import { Product, Booking, BookingStatus, PaymentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../context/BookingContext';
import { toast } from 'sonner';
import { Navbar } from '../../components/shared/Navbar';
import { TimePicker } from '../../components/shared/TimePicker';
import { initializeRazorpayPayment, openRazorpayCheckout } from '../../services/razorpay';
import { sendBookingConfirmation, sendOwnerApprovalNotification } from '../../services/notifications';
import { format } from 'date-fns';
import { getUserById } from '../../services/database';

export const BookingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        console.log('🔍 [BOOKING PAGE] Fetching product:', id);
        const fetchedProduct = await getProductById(id);
        
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          console.log('✅ [BOOKING PAGE] Product loaded:', fetchedProduct.title);
        } else {
          console.warn('⚠️ [BOOKING PAGE] Product not found');
        }
      } catch (error) {
        console.error('❌ [BOOKING PAGE] Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Product not found</p>
          <Button onClick={() => navigate('/customer/home')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Calculate duration in days
  const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calculate pricing
  const subtotal = days > 0 ? days * product.pricePerDay : 0;
  const gst = Math.floor(subtotal * 0.18); // 18% GST
  const total = subtotal + gst;

  const handleProceedToPayment = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (days <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Initialize Razorpay payment
      toast.info('Initializing payment...');
      
      const bookingId = `BKG${Date.now()}`;
      const paymentDetails = await initializeRazorpayPayment(
        total,
        bookingId,
        user.name, // In real app, get from auth context
        user.email,
        user.phone
      );

      toast.success('Payment gateway ready');

      // Step 2: Open Razorpay checkout (Demo mode)
      openRazorpayCheckout(
        paymentDetails,
        async (response) => {
          // Payment successful
          toast.success('Payment successful!');
          
          console.log('💳 [PAYMENT SUCCESS] Creating booking record');
          
          // Step 3: Create booking record in database
          const newBooking: Omit<Booking, 'id'> = {
            productId: product.id,
            productTitle: product.title,
            productImage: product.images[0],
            customerId: user!.id,
            customerName: user!.name,
            customerPhone: user!.phone,
            customerEmail: user!.email,
            customerVerifiedLocation: user!.verifiedLocation,
            ownerId: product.ownerId,
            startDate: startDate!,
            endDate: endDate!,
            startTime,
            endTime,
            totalAmount: total,
            deposit: product.deposit,
            gst,
            subtotal,
            status: 'pending' as BookingStatus, // Requires owner approval
            paymentStatus: 'success' as PaymentStatus,
            paymentId: response.razorpay_payment_id,
            pickupVerified: false,
          };

          try {
            const createdBooking = await createBooking(newBooking);
            console.log('✅ [BOOKING CREATED] ID:', createdBooking.id);
            
            // Step 4: Send confirmation notifications
            toast.info('Sending booking confirmation...');
            
            await sendBookingConfirmation(
              user!.name,
              user!.phone,
              user!.email || '',
              createdBooking.id,
              product.title,
              format(startDate!, 'dd MMM yyyy') + ' at ' + startTime,
              format(endDate!, 'dd MMM yyyy') + ' at ' + endTime,
              total
            );

            toast.success('✅ Booking confirmed! Confirmation sent via SMS & Email');
            
            // Step 5: Send owner notification
            try {
              const owner = await getUserById(product.ownerId);
              if (owner) {
                await sendOwnerApprovalNotification(
                  owner.phone,
                  owner.email || '',
                  createdBooking.id,
                  product.title,
                  user!.name
                );
                console.log('✅ [NOTIFICATION] Owner notification sent to:', owner.email);
              }
            } catch (ownerNotifError) {
              console.error('⚠️ [NOTIFICATION] Failed to send owner notification:', ownerNotifError);
              // Don't fail the booking if owner notification fails
            }
            
            toast.info('⏳ Waiting for owner approval...');
            
            // Navigate to booking details page
            setTimeout(() => {
              navigate(`/customer/booking-details/${createdBooking.id}`);
            }, 2000);
          } catch (bookingError) {
            console.error('❌ [BOOKING CREATION ERROR]:', bookingError);
            toast.error('Payment succeeded but booking creation failed. Please contact support.');
          }
        },
        (error) => {
          // Payment failed
          toast.error('Payment failed. Please try again.');
          setIsProcessing(false);
        }
      );

      setIsProcessing(false);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        <h1 className="text-3xl mb-6">Complete Your Booking</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Dates & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent 
                          mode="single" 
                          selected={startDate} 
                          onSelect={setStartDate} 
                          initialFocus 
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <TimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={setStartTime}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent 
                          mode="single" 
                          selected={endDate} 
                          onSelect={setEndDate} 
                          initialFocus 
                          disabled={(date) => date < (startDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <TimePicker
                      label="End Time"
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </div>
                </div>

                {days > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <Clock className="w-4 h-4" />
                    <span>
                      Total duration: <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                      {' '}({format(startDate!, 'MMM dd')} {startTime} → {format(endDate!, 'MMM dd')} {endTime})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pickup Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Location:</strong> {product.pickupLocality}</p>
                  <p><strong>Address:</strong> {product.pickupAddress}</p>
                  <p className="text-sm text-gray-600">{product.pickupInstructions}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm line-clamp-2">{product.title}</h3>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>₹{product.pricePerDay} × {days} day{days !== 1 ? 's' : ''}</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST (18%)</span>
                    <span>₹{gst}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span>Subtotal</span>
                    <span className="text-lg">₹{total}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-green-50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span>Security Deposit</span>
                    </div>
                    <span className="text-green-600">₹{product.deposit}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Refundable after return inspection
                  </p>
                </div>

                <Button
                  onClick={handleProceedToPayment}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                  disabled={!startDate || !endDate || days <= 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay ₹{total} via Razorpay
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 p-3 rounded text-xs space-y-1">
                  <p className="text-blue-900">
                    <strong>Payment Process:</strong>
                  </p>
                  <p className="text-blue-700">
                    1. Razorpay secure payment (Demo mode)<br />
                    2. SMS & Email confirmation sent<br />
                    3. Owner approval required<br />
                    4. Pickup verification with photo
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};