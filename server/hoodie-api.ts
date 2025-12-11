import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY ?? '');

const router = express.Router();

router.post('/buy-hoodie', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: 'price_1ABC123', quantity: 1 }], // Hoodie price ID
      mode: 'payment',
      success_url: 'https://yourdomain/success',
      cancel_url: 'https://yourdomain/cancel',
    });
    res.json({ id: session.id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
