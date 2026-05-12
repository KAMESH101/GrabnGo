/// <reference types="vite/client" />
import { PaymentDetails } from '../types';


// ─── Constants ────────────────────────────────────────────────────────────────

// Public key — safe to include in frontend bundle (test mode only)
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

// 🔒 Frontend test-mode guard — warn loudly if live key is somehow set
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
  console.error('❌ [SECURITY] Live Razorpay key detected in frontend! Test mode required.');
  throw new Error('GrabNGo requires rzp_test_ key. Set VITE_RAZORPAY_KEY_ID in .env to a test key.');
}

const ADVANCE_PERCENTAGE = 0.20; // 20% advance
const MINIMUM_ADVANCE_AMOUNT = 100; // ₹100 minimum

// ─── Amount helpers ───────────────────────────────────────────────────────────

/**
 * Calculate advance booking amount (20% of total, min ₹100)
 * Customer pays this after owner approval.
 */
export const calculateAdvanceAmount = (totalAmount: number): number => {
  const advance = Math.ceil(totalAmount * ADVANCE_PERCENTAGE);
  return Math.max(advance, MINIMUM_ADVANCE_AMOUNT);
};

/**
 * Calculate remaining amount paid directly to owner after rental.
 */
export const calculateRemainingAmount = (totalAmount: number): number => {
  return totalAmount - calculateAdvanceAmount(totalAmount);
};

// ─── Create Razorpay Order (via backend) ─────────────────────────────────────

/**
 * Step 1: Call backend to create a real Razorpay order.
 * Backend validates that booking is in 'approved' state before creating order.
 *
 * @returns PaymentDetails with real Razorpay orderId
 */
export const initializeRazorpayPayment = async (
  amount: number,
  bookingId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  bookingStatus: string = 'approved'
): Promise<PaymentDetails> => {
  console.log('[RAZORPAY] Calling backend to create order for booking:', bookingId);

  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId,
      advanceAmount: amount,
      bookingStatus,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || errData.message || 'Failed to create payment order';
    console.error('[RAZORPAY] Order creation failed:', msg);
    throw new Error(msg);
  }

  const order = await response.json();

  console.log('[RAZORPAY] ✅ Order created:', order.orderId);

  return {
    orderId: order.orderId,       // internal ref
    amount,                        // original rupee amount (not paise)
    currency: order.currency,
    status: 'pending',
    razorpayOrderId: order.orderId, // real Razorpay order ID (order_xxxx)
  };
};

// ─── Open Razorpay Checkout (Real SDK) ───────────────────────────────────────

/**
 * Step 2: Open the real Razorpay checkout modal.
 * Supports UPI, Debit Card, Credit Card automatically.
 *
 * @param onSuccess - called with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @param onFailure - called with error object
 */
export const openRazorpayCheckout = (
  paymentDetails: PaymentDetails,
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void,
  onFailure: (error: any) => void,
  prefill?: { name?: string; email?: string; contact?: string }
) => {
  // Type-safe access to globally loaded Razorpay SDK (from index.html CDN script)
  const RazorpayConstructor = (window as any).Razorpay;

  if (!RazorpayConstructor) {
    console.error('[RAZORPAY] SDK not loaded. Is the CDN script in index.html?');
    onFailure(new Error('Razorpay SDK not available. Please refresh the page.'));
    return;
  }

  if (!RAZORPAY_KEY_ID) {
    console.error('[RAZORPAY] VITE_RAZORPAY_KEY_ID is not set in .env');
    onFailure(new Error('Payment configuration error. Please contact support.'));
    return;
  }

  const amountInPaise = Math.round(paymentDetails.amount * 100);

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: paymentDetails.currency || 'INR',
    name: 'GrabnGo',
    description: 'Advance Rental Payment (Test Mode)',
    image: '/logo.png', // shown in checkout modal (optional)
    order_id: paymentDetails.razorpayOrderId,

    handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
      console.log('[RAZORPAY] ✅ Payment successful:', response.razorpay_payment_id);
      onSuccess(response);
    },

    prefill: {
      name: prefill?.name || '',
      email: prefill?.email || '',
      contact: prefill?.contact || '',
      vpa: 'success@razorpay', // pre-fills UPI ID field (test mode)
    },

    // Card and Netbanking only
    method: {
      upi: false,
      card: true,
      netbanking: true,
      wallet: false,
    },

    theme: {
      color: '#4F46E5', // Indigo — matches GrabnGo brand
    },

    // Hide unwanted methods only
    config: {
      display: {
        hide: [
          { method: 'wallet' },
          { method: 'emi' },
          { method: 'paylater' },
        ],
      },
    },

    modal: {
      ondismiss: () => {
        console.log('[RAZORPAY] Checkout modal dismissed by user');
        onFailure(new Error('Payment cancelled by user'));
      },
    },
  };

  console.log('[RAZORPAY] Opening checkout modal, order:', paymentDetails.razorpayOrderId);
  const rzp = new RazorpayConstructor(options);
  rzp.on('payment.failed', (response: any) => {
    console.error('[RAZORPAY] ❌ Payment failed:', response.error);
    onFailure(response.error);
  });
  rzp.open();
};

// ─── Verify Payment Signature (via backend) ───────────────────────────────────

/**
 * Step 3: Verify payment with backend using HMAC-SHA256.
 * Secret key never touches the frontend.
 *
 * @returns true if verification succeeds
 */
export const verifyRazorpaySignature = async (
  bookingId: string,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ success: boolean; paymentId: string }> => {
  console.log('[RAZORPAY] Verifying payment signature for booking:', bookingId);

  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || 'Payment verification failed';
    console.error('[RAZORPAY] Verification failed:', msg);
    throw new Error(msg);
  }

  const result = await response.json();
  console.log('[RAZORPAY] ✅ Signature verified. PaymentId:', result.paymentId);

  return { success: result.success, paymentId: result.paymentId };
};

// ─── Remaining Payment: Create Order (via backend) ───────────────────────────

/**
 * Step 1 (Stage 2): Call backend to create a Razorpay order for the REMAINING amount.
 * Backend validates that bookingStatus === 'active' before creating order.
 *
 * @returns PaymentDetails with real Razorpay orderId
 */
export const initializeRemainingPayment = async (
  amount: number,
  bookingId: string,
  bookingStatus: string = 'active'
): Promise<PaymentDetails> => {
  console.log('[RAZORPAY] Calling backend to create REMAINING order for booking:', bookingId);

  const response = await fetch('/api/payments/create-remaining-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId,
      remainingAmount: amount,
      bookingStatus,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || errData.message || 'Failed to create remaining payment order';
    console.error('[RAZORPAY] Remaining order creation failed:', msg);
    throw new Error(msg);
  }

  const order = await response.json();

  console.log('[RAZORPAY] ✅ Remaining order created:', order.orderId);

  return {
    orderId: order.orderId,
    amount,
    currency: order.currency,
    status: 'pending',
    razorpayOrderId: order.orderId,
  };
};

// ─── Remaining Payment: Open Checkout ────────────────────────────────────────

/**
 * Step 2 (Stage 2): Open Razorpay checkout specifically for the remaining rental amount.
 * Uses a distinct description so customers/owners can identify this payment.
 */
export const openRemainingRazorpayCheckout = (
  paymentDetails: PaymentDetails,
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void,
  onFailure: (error: any) => void,
  prefill?: { name?: string; email?: string; contact?: string }
) => {
  const RazorpayConstructor = (window as any).Razorpay;

  if (!RazorpayConstructor) {
    console.error('[RAZORPAY] SDK not loaded. Is the CDN script in index.html?');
    onFailure(new Error('Razorpay SDK not available. Please refresh the page.'));
    return;
  }

  if (!RAZORPAY_KEY_ID) {
    console.error('[RAZORPAY] VITE_RAZORPAY_KEY_ID is not set in .env');
    onFailure(new Error('Payment configuration error. Please contact support.'));
    return;
  }

  const amountInPaise = Math.round(paymentDetails.amount * 100);

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: paymentDetails.currency || 'INR',
    name: 'GrabnGo',
    description: 'Remaining Rental Payment (Test Mode)',
    image: '/logo.png',
    order_id: paymentDetails.razorpayOrderId,

    handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
      console.log('[RAZORPAY] ✅ Remaining payment successful:', response.razorpay_payment_id);
      onSuccess(response);
    },

    prefill: {
      name: prefill?.name || '',
      email: prefill?.email || '',
      contact: prefill?.contact || '',
      vpa: 'success@razorpay', // pre-fills UPI ID field (test mode)
    },

    // Card, Netbanking, UPI only — no wallet / EMI / paylater
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: false,
    },

    theme: {
      color: '#4F46E5',
    },

    // Hide unwanted methods only
    config: {
      display: {
        hide: [
          { method: 'wallet' },
          { method: 'emi' },
          { method: 'paylater' },
        ],
      },
    },

    modal: {
      ondismiss: () => {
        console.log('[RAZORPAY] Remaining checkout modal dismissed by user');
        onFailure(new Error('Payment cancelled by user'));
      },
    },
  };

  console.log('[RAZORPAY] Opening REMAINING checkout modal, order:', paymentDetails.razorpayOrderId);
  const rzp = new RazorpayConstructor(options);
  rzp.on('payment.failed', (response: any) => {
    console.error('[RAZORPAY] ❌ Remaining payment failed:', response.error);
    onFailure(response.error);
  });
  rzp.open();
};

// ─── Refund (server-side — kept for completeness) ─────────────────────────────

/**
 * Refund is handled server-side via Razorpay API.
 * In this app, refunds are NOT triggered automatically because payment only
 * happens AFTER owner approval — no scenario where refund is needed immediately.
 */
export const refundRazorpayPayment = async (
  _paymentId: string,
  _amount: number,
  _reason: string
): Promise<{ success: boolean; refundId: string }> => {
  console.warn('[RAZORPAY] Refund requested — handle via Razorpay dashboard for test mode');
  // In production: call POST /api/payments/refund (not yet implemented as not needed)
  return { success: true, refundId: 'manual_refund_required' };
};
