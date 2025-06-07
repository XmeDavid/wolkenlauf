import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '~/lib/stripe';
import { env } from '~/env.js';
import { db } from '~/server/db';
import { users, creditTransactions } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { addCredits } from '~/server/db/queries/instances';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    if (env.STRIPE_WEBHOOK_SECRET) {
      // Verify webhook signature if secret is provided
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Skip verification for development (not recommended for production)
      console.warn('Webhook signature verification skipped - no secret provided');
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId, type, creditAmount } = session.metadata || {};

        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }

        if (type === 'subscription' && planId) {
          // Handle subscription purchase
          console.log(`Subscription completed for user ${userId}, plan ${planId}`);
          
          // First, ensure user exists in the users table
          const existingUser = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
          
          if (existingUser.length === 0) {
            // Create new user record
            await db.insert(users).values({
              clerkId: userId,
              subscriptionPlan: planId,
              subscriptionStatus: 'active',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            });
          } else {
            // Update existing user's plan
            await db.update(users)
              .set({
                subscriptionPlan: planId,
                subscriptionStatus: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                updatedAt: new Date(),
              })
              .where(eq(users.clerkId, userId));
          }

          // Add monthly credits allocation
          const planCredits: Record<string, number> = {
            starter: 550,
            pro: 1200,
            business: 3200,
            enterprise: 6750,
          };
          const plan = planCredits[planId];

          if (plan) {
            await addCredits(
              userId,
              plan,
              'allocation',
              `Monthly allocation for ${planId} plan`
            );
          }

        } else if (type === 'credit_topup' && creditAmount) {
          // Handle credit top-up purchase
          const credits = parseInt(creditAmount);
          console.log(`Credit top-up completed for user ${userId}, ${credits} credits`);

          await addCredits(
            userId,
            credits,
            'topup',
            `Credit top-up: ${credits} credits`
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (!invoice.subscription) {
          console.error('No subscription ID in invoice');
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { userId, planId } = subscription.metadata || {};

        if (!userId || !planId) {
          console.error('No userId or planId in subscription metadata');
          break;
        }

        // Add monthly credits for recurring subscription payment
        const monthlyPlanCredits: Record<string, number> = {
          starter: 550,
          pro: 1200,
          business: 3200,
          enterprise: 6750,
        };
        const plan = monthlyPlanCredits[planId];

        if (plan) {
          console.log(`Monthly payment succeeded for user ${userId}, adding ${plan} credits`);
          
          await addCredits(
            userId,
            plan,
            'allocation',
            `Monthly allocation for ${planId} plan`
          );
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const { userId } = subscription.metadata || {};

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        const status = subscription.status;
        console.log(`Subscription ${subscription.id} status changed to ${status} for user ${userId}`);

        // Update user's subscription status
        await db.update(users)
          .set({
            subscriptionStatus: status,
            subscriptionPlan: status === 'canceled' ? 'free' : undefined,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, userId));
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}