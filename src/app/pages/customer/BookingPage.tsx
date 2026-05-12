import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Label } from '../../components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { Calendar, IndianRupee, Clock, User, MapPin, Loader2, Calendar as CalendarIcon, CreditCard, Send } from 'lucide-react';
import { getProductById, getUserById } from '../../services/database';
import { Product, Booking, BookingStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../context/BookingContext';
import { toast } from 'sonner';
import { Navbar } from '../../components/shared/Navbar';
import { TimePicker } from '../../components/shared/TimePicker';
import { calculateAdvanceAmount, calculateRemainingAmount } from '../../services/razorpay';
import { sendOwnerApprovalNotification } from '../../services/notifications';
import { format } from 'date-fns';
import { KycModal } from '../../components/kyc/KycModal';
import { checkCustomerKycStatus } from '../../services/kyc';

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
  const [showKycModal, setShowKycModal] = useState(false);

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

  // Advance payment amounts (shown for transparency, charged only after approval)
  const advanceAmount = total > 0 ? calculateAdvanceAmount(total) : 0;
  const remainingAmount = total > 0 ? calculateRemainingAmount(total) : 0;

  // ── STEP 1: Customer sends booking REQUEST (no payment) ──────────────────────
  const handleSendBookingRequest = async () => {
    // KYC CHECK - Block if customer KYC not verified
    if (!user || !checkCustomerKycStatus(user)) {
      toast.error('Please complete Customer KYC to rent products');
      setShowKycModal(true);
      return;
    }

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
      console.log('📋 [BOOKING REQUEST] Creating booking request (no payment yet)');

      // Create booking record with status 'requested' — NO payment taken
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
        status: 'requested' as BookingStatus, // Awaiting owner approval — NO payment yet
        advancePaid: false,                   // Will be set true only after owner approves & customer pays
        advanceAmount,                        // Pre-calculated for display; charged after approval
        remainingAmount,
        remainingPaymentStatus: 'pending',
        pickupVerified: false,
        // Store pickup coordinates at booking time for directions map
        pickupLat: product.pickupLat,
        pickupLng: product.pickupLng,
        pickupAddress: product.pickupAddress,
      };

      const createdBooking = await createBooking(newBooking);
      console.log('✅ [BOOKING REQUEST] Created, ID:', createdBooking.id);

      // Notify owner about the new booking request
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
          console.log('✅ [NOTIFICATION] Owner notified about new booking request');
        }
      } catch (notifError) {
        console.error('⚠️ [NOTIFICATION] Failed to notify owner:', notifError);
        // Don't fail the booking if notification fails
      }

      toast.success('✅ Booking request sent! Waiting for owner approval.');
      toast.info('You will be notified once the owner reviews your request.');

      // Navigate to booking details page to track status
      setTimeout(() => {
        navigate(`/customer/booking-details/${createdBooking.id}`);
      }, 1500);
    } catch (error) {
      console.error('❌ [BOOKING REQUEST ERROR]:', error);
      toast.error('Failed to send booking request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <BackButton />

        <h1 className="text-3xl mb-6">Request a Booking</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Dates &amp; Time</CardTitle>
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
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
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
                  <div className="flex justify-between text-sm border-t pt-2 font-medium">
                    <span>Total Rental Amount</span>
                    <span>₹{total}</span>
                  </div>

                  {/* Advance Payment Breakdown (for transparency — paid after approval) */}
                  {days > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm bg-indigo-50 p-3 rounded border border-indigo-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium text-indigo-800">Advance Due After Approval (20%)</span>
                        </div>
                        <span className="font-bold text-indigo-700 text-base">₹{advanceAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-orange-50 p-3 rounded border border-orange-200">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-600" />
                          <span className="text-orange-800">Remaining to Owner (80%)</span>
                        </div>
                        <span className="font-medium text-orange-700">₹{remainingAmount}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleSendBookingRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                  disabled={!startDate || !endDate || days <= 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Booking Request
                    </>
                  )}
                </Button>

                {/* How it works */}
                <div className="bg-blue-50 p-3 rounded text-xs space-y-1">
                  <p className="text-blue-900">
                    <strong>How Booking Works:</strong>
                  </p>
                  <p className="text-blue-700">
                    1. Send booking request (FREE — no payment now)<br />
                    2. Owner reviews and approves your request<br />
                    3. Pay ₹{advanceAmount > 0 ? advanceAmount : '—'} advance to confirm<br />
                    4. Pickup verification with owner's camera<br />
                    5. Pay remaining ₹{remainingAmount > 0 ? remainingAmount : '—'} directly to owner after rental
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

      {/* KYC Modal */}
      <KycModal
        isOpen={showKycModal}
        role="customer"
        onClose={() => setShowKycModal(false)}
        onSuccess={() => {
          setShowKycModal(false);
          toast.success('KYC submitted! Waiting for admin approval.');
        }}
      />
    </div>
  );
};