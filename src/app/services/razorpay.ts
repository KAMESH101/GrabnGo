import { PaymentDetails } from '../types';

// Demo Razorpay configuration (Test Mode)
const RAZORPAY_KEY_ID = 'rzp_test_DEMO_KEY_123456';
const RAZORPAY_KEY_SECRET = 'DEMO_SECRET_KEY_987654';

/**
 * Initialize Razorpay payment in test/demo mode
 * In production, this would create an actual Razorpay order
 */
export const initializeRazorpayPayment = async (
  amount: number,
  bookingId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Promise<PaymentDetails> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate demo order ID
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const razorpayOrderId = `order_demo_${bookingId}`;

  console.log('[DEMO MODE] Razorpay Payment Initialized:', {
    razorpay_key: RAZORPAY_KEY_ID,
    amount: amount * 100, // Razorpay works in paise
    currency: 'INR',
    order_id: razorpayOrderId,
    customer: { name: customerName, email: customerEmail, phone: customerPhone }
  });

  return {
    orderId,
    amount,
    currency: 'INR',
    status: 'pending',
    razorpayOrderId,
  };
};

/**
 * Process Razorpay payment (Demo mode - auto success)
 * In production, this would verify the payment signature
 */
export const processRazorpayPayment = async (
  paymentDetails: PaymentDetails
): Promise<{ success: boolean; paymentId: string; signature: string }> => {
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const paymentId = `pay_demo_${Date.now()}`;
  const signature = `sig_demo_${Math.random().toString(36).substring(7)}`;

  console.log('[DEMO MODE] Razorpay Payment Processed:', {
    payment_id: paymentId,
    order_id: paymentDetails.razorpayOrderId,
    signature,
    amount: paymentDetails.amount,
    status: 'success'
  });

  return {
    success: true,
    paymentId,
    signature,
  };
};

/**
 * Verify Razorpay payment signature (Demo mode)
 * In production, this would verify using HMAC SHA256
 */
export const verifyRazorpaySignature = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  // Simulate verification
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('[DEMO MODE] Razorpay Signature Verified:', {
    order_id: orderId,
    payment_id: paymentId,
    signature,
    verified: true
  });

  return true;
};

/**
 * Refund payment (Demo mode)
 * In production, this would initiate actual refund via Razorpay API
 */
export const refundRazorpayPayment = async (
  paymentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; refundId: string }> => {
  // Simulate refund processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  const refundId = `rfnd_demo_${Date.now()}`;

  console.log('[DEMO MODE] Razorpay Refund Initiated:', {
    payment_id: paymentId,
    refund_id: refundId,
    amount,
    reason,
    status: 'processed'
  });

  return {
    success: true,
    refundId,
  };
};

/**
 * Open Razorpay checkout (Demo mode)
 * In production, this would open actual Razorpay modal
 */
export const openRazorpayCheckout = (
  paymentDetails: PaymentDetails,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  console.log('[DEMO MODE] Opening Razorpay Checkout Modal');
  console.log('Payment Details:', paymentDetails);
  
  // Simulate user completing payment after 2 seconds
  setTimeout(() => {
    const mockResponse = {
      razorpay_order_id: paymentDetails.razorpayOrderId,
      razorpay_payment_id: `pay_demo_${Date.now()}`,
      razorpay_signature: `sig_demo_${Math.random().toString(36).substring(7)}`,
    };
    
    console.log('[DEMO MODE] Payment successful:', mockResponse);
    onSuccess(mockResponse);
  }, 2000);
};
