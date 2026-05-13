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

  const { bookingId, remainingAmount, bookingStatus } = req.body || {};

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ error: 'bookingId is required' });
  }
  if (!remainingAmount || typeof remainingAmount !== 'number' || remainingAmount < 1) {
    return res.status(400).json({ error: 'remainingAmount must be a positive number' });
  }
  if (bookingStatus !== 'active') {
    return res.status(403).json({ error: 'Remaining payment only allowed after rental starts' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(remainingAmount * 100),
      currency: 'INR',
      receipt: `rem_${bookingId}`,
      notes: { bookingId, purpose: 'remaining_rental_payment' },
    });
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('[API] create-remaining-order failed:', err.message);
    return res.status(500).json({ error: 'Failed to create remaining payment order.' });
  }
}
