import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bookingId, advanceAmount, bookingStatus } = req.body || {};

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ error: 'bookingId is required' });
  }
  if (!advanceAmount || typeof advanceAmount !== 'number' || advanceAmount < 1) {
    return res.status(400).json({ error: 'advanceAmount must be a positive number' });
  }
  if (bookingStatus !== 'approved') {
    return res.status(403).json({ error: 'Advance payment only allowed after owner approval' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(advanceAmount * 100),
      currency: 'INR',
      receipt: bookingId,
      notes: { bookingId, purpose: 'advance_rental_payment' },
    });
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('[API] create-order failed:', err.message);
    return res.status(500).json({ error: 'Failed to create payment order.' });
  }
}
