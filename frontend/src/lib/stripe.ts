import Stripe from 'stripe';
import { env } from '~/env.js';

// Server-side Stripe instance - only use on server
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

// Re-export pricing constants for server-side use
export { PRICING_PLANS, CREDIT_TOPUP } from './pricing';