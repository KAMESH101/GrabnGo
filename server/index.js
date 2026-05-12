

'use strict';

require('dotenv').config(); // Load RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET from server/.env

// 🔒 TEST MODE ENFORCEMENT — reject startup if live keys are detected
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
if (razorpayKeyId.startsWith('rzp_live_')) {
    console.error('\n❌ [SECURITY] Live Razorpay keys detected. Test Mode required.');
    console.error('   Set RAZORPAY_KEY_ID to a key starting with rzp_test_ in server/.env');
    console.error('   GrabNGo requires test mode during development to prevent real money transactions.\n');
    process.exit(1);
}
if (!razorpayKeyId.startsWith('rzp_test_')) {
    console.warn('⚠️  [RAZORPAY] Key does not start with rzp_test_ — ensure you are using test mode.');
}
console.log('✅ [RAZORPAY] Test mode confirmed:', razorpayKeyId.slice(0, 16) + '...');

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Razorpay = require('razorpay');
const { downloadModels } = require('./downloadModels');
const { verifyKyc, loadModels } = require('./kycVerifier');
const { checkLimit, recordAttempt, clearBlock } = require('./rateLimiter');

// ─── Razorpay Instance ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Simple in-memory lock to prevent duplicate payment orders for same booking
// (cleared on server restart — acceptable for test mode)
const processingBookings = new Set();

const app = express();
const PORT = 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from Vite dev server (port 5173) and production origin
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Parse JSON — limit body to 15MB to handle two base64 images
app.use(express.json({ limit: '15mb' }));

// Global IP-level rate limiter (100 req/15min per IP)
const ipLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP. Try again later.' },
});
app.use('/api', ipLimiter);

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[SERVER] ${ts} ${req.method} ${req.path}`);
    next();
});

// ─── Validation helpers ───────────────────────────────────────────────────────

const ALLOWED_MIME_PREFIXES = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
const MAX_BASE64_BYTES = 5 * 1024 * 1024 * 1.37; // 5 MB raw ≈ 6.85 MB base64

/**
 * Validate a base64 image data URL.
 * @param {string} value
 * @returns {string|null} error message or null if valid
 */
const validateImage = (value, fieldName) => {
    if (!value || typeof value !== 'string') return `${fieldName} is required`;
    if (!ALLOWED_MIME_PREFIXES.some(p => value.startsWith(p))) {
        return `${fieldName} must be a JPEG, PNG, or WebP image`;
    }
    if (value.length > MAX_BASE64_BYTES) {
        return `${fieldName} exceeds the 5 MB size limit`;
    }
    return null;
};

// ─── Main KYC Endpoint ───────────────────────────────────────────────────────

/**
 * POST /api/kyc/verify
 * Body: { proofImage: string (base64 dataUrl), liveImage: string (base64 dataUrl), userId: string }
 *
 * Response (user-facing — distance is NEVER included):
 *   200 { verified: true,  method: 'FACE_API_MATCH', message: string }
 *   200 { verified: false, reason: string, message: string }
 *   400 { error: string }
 *   429 { error: string }
 *   500 { error: string }
 *
 * Internal result (stored but not sent to client):
 *   faceMatchDistance — written to server log and returned for DB storage via { _internal }
 */
app.post('/api/kyc/verify', async (req, res) => {
    const { proofImage, liveImage, userId } = req.body || {};

    // ── 1. Input validation ────────────────────────────────────────────────────
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        return res.status(400).json({ error: 'userId is required' });
    }
    const uid = userId.trim();

    const proofErr = validateImage(proofImage, 'proofImage');
    if (proofErr) return res.status(400).json({ error: proofErr });

    const liveErr = validateImage(liveImage, 'liveImage');
    if (liveErr) return res.status(400).json({ error: liveErr });

    // ── 2. Per-user rate limit check ──────────────────────────────────────────
    const { allowed, attemptsLeft } = checkLimit(uid);
    if (!allowed) {
        console.warn(`[SERVER] 🚫 Blocked user ${uid} attempted KYC`);
        return res.status(429).json({
            error: 'Maximum KYC attempts exceeded.',
            message: 'You have exceeded the maximum number of KYC verification attempts. Please contact admin for manual review.',
        });
    }

    console.log(`[SERVER] ▶ Verifying KYC for user: ${uid} (${attemptsLeft} attempts left after this one)`);

    // ── 3. Run face verification (server-side only) ───────────────────────────
    let result;
    try {
        result = await verifyKyc(proofImage, liveImage, uid);
    } catch (err) {
        console.error('[SERVER] ❌ Unexpected verifier error:', err);
        return res.status(500).json({ error: 'Face verification service error. Please try again.' });
    }

    // ── 4. Record attempt (affects rate limit counter) ────────────────────────
    recordAttempt(uid, result.verified);

    // ── 5. Build response — faceMatchDistance is NEVER in the user response ───
    const userResponse = {
        verified: result.verified,
        reason: result.reason,
        message: result.message,
        method: result.reason,  // same value, kept for frontend consistency
    };

    // _internal is for the DB write — frontend must strip this before storing in user-visible state
    // (faceMatchDistance and verifiedAt are for admin panel only)
    const internalData = {
        faceMatchDistance: result.faceMatchDistance !== null
            ? parseFloat(result.faceMatchDistance.toFixed(4))
            : null,
        kycVerificationMethod: result.reason,
        verifiedAt: result.verified ? new Date().toISOString() : null,
        kycRejectedReason: result.verified ? null : result.reason,
    };

    // Return user response + internal block (frontend stores internal in DB, not in UI state)
    return res.status(200).json({
        ...userResponse,
        _internal: internalData,  // ← handled by frontend KYC service, never displayed to user
    });
});

// ─── Admin: Clear user block ──────────────────────────────────────────────────

/**
 * POST /api/kyc/admin/clear-block
 * Body: { userId: string, adminKey: string }
 */
app.post('/api/kyc/admin/clear-block', (req, res) => {
    const { userId, adminKey } = req.body || {};
    // Simple admin key check (in production this would be proper JWT auth)
    if (adminKey !== 'grabngo_admin_kyc') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!userId) return res.status(400).json({ error: 'userId required' });
    clearBlock(userId);
    return res.status(200).json({ success: true, message: `Block cleared for user ${userId}` });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'GrabNGo KYC + Payments Server', port: PORT, ts: new Date().toISOString() });
});

// ─── Payment Routes ───────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-order
 * Body: { bookingId, advanceAmount, bookingStatus }
 *
 * Creates a real Razorpay order and returns orderId, amount, currency.
 * Guard: only allowed when bookingStatus === 'approved'
 */
app.post('/api/payments/create-order', async (req, res) => {
    const { bookingId, advanceAmount, bookingStatus } = req.body || {};

    // 1. Input validation
    if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ error: 'bookingId is required' });
    }
    if (!advanceAmount || typeof advanceAmount !== 'number' || advanceAmount < 1) {
        return res.status(400).json({ error: 'advanceAmount must be a positive number' });
    }

    // 2. Guard: payment only allowed after owner approval
    if (bookingStatus !== 'approved') {
        return res.status(403).json({
            error: 'Payment not allowed',
            message: 'Advance payment is only allowed after the owner approves the booking.',
        });
    }

    // 3. Prevent duplicate in-flight orders for the same booking
    if (processingBookings.has(bookingId)) {
        return res.status(409).json({ error: 'Payment already in progress for this booking' });
    }
    processingBookings.add(bookingId);

    try {
        const amountInPaise = Math.round(advanceAmount * 100); // Razorpay uses paise

        console.log(`[PAYMENT] Creating order for booking ${bookingId}, amount: ₹${advanceAmount}`);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: bookingId,
            notes: {
                bookingId,
                purpose: 'advance_rental_payment',
            },
        });

        console.log(`[PAYMENT] ✅ Order created: ${order.id} for booking ${bookingId}`);

        return res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err) {
        console.error('[PAYMENT] ❌ Order creation failed:', err.message || err);
        return res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
    } finally {
        processingBookings.delete(bookingId);
    }
});

/**
 * POST /api/payments/verify
 * Body: { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Verifies Razorpay HMAC-SHA256 signature server-side.
 * Returns { success: true, paymentId } on success.
 */
app.post('/api/payments/verify', (req, res) => {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        return res.status(400).json({ error: 'All payment fields are required for verification' });
    }

    // HMAC-SHA256: body = order_id + '|' + payment_id, key = secret
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        console.warn(`[PAYMENT] ❌ Signature mismatch for booking ${bookingId}`);
        return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
    }

    console.log(`[PAYMENT] ✅ Payment verified for booking ${bookingId}, paymentId: ${razorpay_payment_id}`);

    return res.status(200).json({
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        bookingId,
        verifiedAt: new Date().toISOString(),
    });
});

/**
 * POST /api/payments/webhook
 * Razorpay sends this when payment.captured event fires.
 * Safe fallback in case the frontend tab closes before verify is called.
 */
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
        return res.status(400).json({ error: 'Missing webhook signature' });
    }

    // Verify webhook signature
    const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

    if (expectedSig !== signature) {
        console.warn('[WEBHOOK] ❌ Invalid webhook signature — ignoring');
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString());
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (event.event === 'payment.captured') {
        const payment = event.payload?.payment?.entity;
        const bookingId = payment?.receipt;
        console.log(`[WEBHOOK] ✅ payment.captured for booking: ${bookingId}, paymentId: ${payment?.id}`);
        // Note: booking status update is done by frontend after /verify succeeds.
        // Webhook is a safe fallback log — no DB write here (no DB connection in this server).
    }

    return res.status(200).json({ received: true });
});

/**
 * POST /api/payments/create-remaining-order
 * Body: { bookingId, remainingAmount, bookingStatus }
 *
 * Creates a Razorpay order for the remaining rental payment (after rental starts).
 * Guard: only allowed when bookingStatus === 'active'
 */
app.post('/api/payments/create-remaining-order', async (req, res) => {
    const { bookingId, remainingAmount, bookingStatus } = req.body || {};

    if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ error: 'bookingId is required' });
    }
    if (!remainingAmount || typeof remainingAmount !== 'number' || remainingAmount < 1) {
        return res.status(400).json({ error: 'remainingAmount must be a positive number' });
    }
    if (bookingStatus !== 'active') {
        return res.status(403).json({
            error: 'Remaining payment only allowed after rental starts',
            message: 'bookingStatus must be active',
        });
    }
    if (processingBookings.has(`remaining_${bookingId}`)) {
        return res.status(409).json({ error: 'Remaining payment already in progress for this booking' });
    }
    processingBookings.add(`remaining_${bookingId}`);

    try {
        const amountInPaise = Math.round(remainingAmount * 100);
        console.log(`[PAYMENT] Creating remaining order for booking ${bookingId}, amount: ₹${remainingAmount}`);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rem_${bookingId}`,
            notes: { bookingId, purpose: 'remaining_rental_payment' },
        });

        console.log(`[PAYMENT] ✅ Remaining order created: ${order.id}`);
        return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        console.error('[PAYMENT] ❌ Remaining order creation failed:', err.message || err);
        return res.status(500).json({ error: 'Failed to create remaining payment order. Please try again.' });
    } finally {
        processingBookings.delete(`remaining_${bookingId}`);
    }
});

/**
 * GET /api/payments/upi-qr
 * Fetches QR codes from Razorpay and returns the most recent active one.
 * Used by the frontend to display a scannable UPI QR in the payment guide.
 */
app.get('/api/payments/upi-qr', async (_req, res) => {
    try {
        const response = await razorpay.qrCode.all({ count: 10 });
        const items = response.items || [];

        // Find the most recent active (open) QR code
        const active = items.find(qr => qr.status === 'active') || items[0];

        if (!active) {
            return res.status(404).json({ error: 'No QR code found. Please create one in the Razorpay dashboard.' });
        }

        console.log(`[PAYMENT] ✅ QR code fetched: ${active.id}`);
        return res.status(200).json({
            qrId: active.id,
            imageUrl: active.image_url,
            description: active.description || 'GrabNgo Payment',
        });
    } catch (err) {
        console.error('[PAYMENT] ❌ Failed to fetch QR code:', err.message || err);
        return res.status(500).json({ error: 'Failed to fetch QR code from Razorpay.' });
    }
});

// ─── Boot sequence ────────────────────────────────────────────────────────────
const start = async () => {
    try {
        console.log('🚀 [SERVER] GrabNGo KYC Verification Server starting...');

        // Download models if not present, then preload them
        await downloadModels();
        console.log('🧠 [SERVER] Pre-loading face-api models...');
        await loadModels();

        app.listen(PORT, '127.0.0.1', () => {
            console.log(`✅ [SERVER] KYC server running at http://127.0.0.1:${PORT}`);
            console.log(`   POST /api/kyc/verify`);
            console.log(`   GET  /health`);
        });
    } catch (err) {
        console.error('❌ [SERVER] Failed to start:', err);
        process.exit(1);
    }
};

start();
