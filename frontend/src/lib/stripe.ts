import Stripe from 'stripe';
import { env } from '~/env.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 150,
    interval: 'month',
    stripePriceId: null, // Free plan doesn't need Stripe
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    credits: 550,
    interval: 'month',
    stripePriceId: 'price_starter_monthly', // Will be created
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    credits: 1200,
    interval: 'month',
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'business',
    name: 'Business',
    price: 25,
    credits: 3200,
    interval: 'month',
    stripePriceId: 'price_business_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 50,
    credits: 6750,
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
  },
] as const;

export const CREDIT_TOPUP = {
  id: 'credit-topup',
  name: 'Credit Top-up',
  pricePerCredit: 0.01,
  minCredits: 1,
  maxCredits: 100,
  stripePriceId: 'price_credit_topup',
} as const;