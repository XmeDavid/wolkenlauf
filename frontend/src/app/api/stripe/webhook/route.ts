import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '~/lib/stripe';
import { env } from '~/env.js';
import { db } from '~/server/db';
import { users, creditTransactions } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET || ''
    );
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
          
          // Update user's plan in database
          await db.update(users)
            .set({
              subscriptionPlan: planId,
              subscriptionStatus: 'active',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date(),
            })
            .where(eq(users.clerkId, userId));

          // Add monthly credits allocation
          const planCredits: Record<string, number> = {
            starter: 550,
            pro: 1200,
            business: 3200,
            enterprise: 6750,
          };
          const plan = planCredits[planId];

          if (plan) {
            await db.insert(creditTransactions).values({
              userId: userId,
              type: 'monthly_allocation',
              amount: plan.toString(),
              description: `Monthly allocation for ${planId} plan`,
              balanceBefore: "0.00", // Will be updated by trigger
              balanceAfter: "0.00",  // Will be updated by trigger
              metadata: {
                planId,
                subscriptionId: session.subscription,
              },
            });
          }

        } else if (type === 'credit-topup' && creditAmount) {
          // Handle credit top-up purchase
          const credits = parseInt(creditAmount);
          console.log(`Credit top-up completed for user ${userId}, ${credits} credits`);

          await db.insert(creditTransactions).values({
            userId: userId,
            type: 'purchase',
            amount: credits.toString(),
            description: `Credit top-up: ${credits} credits`,
            balanceBefore: "0.00", // Will be updated by trigger
            balanceAfter: "0.00",  // Will be updated by trigger
            metadata: {
              type: 'credit-topup',
              stripeSessionId: session.id,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
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
          
          await db.insert(creditTransactions).values({
            userId: userId,
            type: 'monthly_allocation',
            amount: plan.toString(),
            description: `Monthly allocation for ${planId} plan`,
            balanceBefore: "0.00", // Will be updated by trigger
            balanceAfter: "0.00",  // Will be updated by trigger
            metadata: {
              planId,
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
            },
          });
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