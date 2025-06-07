import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, PRICING_PLANS } from '~/lib/stripe';
import { env } from '~/env.js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, planId, credits } = body;

    let session;

    if (type === 'subscription' && planId) {
      // Subscription checkout
      const plan = PRICING_PLANS.find(p => p.id === planId);
      
      if (!plan || plan.id === 'free') {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      session = await stripe.checkout.sessions.create({
        customer_email: undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Wolkenlauf ${plan.name} Plan`,
                description: `${plan.credits} credits per month`,
                metadata: {
                  plan_id: plan.id,
                  credits: plan.credits.toString(),
                },
              },
              unit_amount: plan.price * 100, // Convert to cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://wolkenlauf.vercel.app'}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}&type=subscription&plan_name=${plan.name}`,
        cancel_url: `${env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://wolkenlauf.vercel.app'}/dashboard/subscription/canceled`,
        metadata: {
          userId,
          planId: plan.id,
          type: 'subscription',
        },
        subscription_data: {
          metadata: {
            userId,
            planId: plan.id,
          },
        },
      });
    } else if (type === 'credit_topup' && credits) {
      // Credit top-up checkout
      const amount = typeof credits === 'number' ? credits : parseInt(String(credits));
      
      if (isNaN(amount) || amount < 1 || amount > 10000) {
        return NextResponse.json({ error: 'Invalid credit amount. Must be between 1 and 10,000.' }, { status: 400 });
      }

      const totalPrice = amount * 0.01; // €0.01 per credit

      session = await stripe.checkout.sessions.create({
        customer_email: undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Wolkenlauf Credit Top-up',
                description: `${amount} credits for your account`,
                metadata: {
                  type: 'credit-topup',
                  credits: amount.toString(),
                },
              },
              unit_amount: Math.round(totalPrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://wolkenlauf.vercel.app'}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}&type=credit_topup&credits=${amount}`,
        cancel_url: `${env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://wolkenlauf.vercel.app'}/dashboard/subscription/canceled`,
        metadata: {
          userId,
          type: 'credit-topup',
          creditAmount: amount.toString(),
        },
      });
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}