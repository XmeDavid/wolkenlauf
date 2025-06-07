import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '~/lib/stripe';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { addCredits } from '~/server/db/queries/instances';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify the session belongs to this user
    if (session.metadata?.userId !== userId) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { type, planId, creditAmount } = session.metadata || {};
    
    console.log('Processing payment for session:', {
      sessionId,
      userId,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
      type,
      planId,
      creditAmount
    });

    if (type === 'subscription' && planId) {
      // Handle subscription purchase
      console.log(`Processing subscription for user ${userId}, plan ${planId}`);
      
      // Check if user already exists
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

      return NextResponse.json({ 
        success: true, 
        message: `Successfully upgraded to ${planId} plan`,
        credits: plan
      });

    } else if (type === 'credit_topup' && creditAmount) {
      // Handle credit top-up purchase
      const credits = parseInt(creditAmount);
      console.log(`Processing credit top-up for user ${userId}, ${credits} credits`);

      try {
        await addCredits(
          userId,
          credits,
          'topup',
          `Credit top-up: ${credits} credits`
        );
        console.log(`✅ Successfully added ${credits} credits to user ${userId} via manual processing`);

        return NextResponse.json({ 
          success: true, 
          message: `Successfully added ${credits} credits`,
          credits: credits
        });
      } catch (error) {
        console.error(`❌ Failed to add credits to user ${userId}:`, error);
        return NextResponse.json({ 
          error: 'Failed to add credits',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }

    } else {
      console.log('No matching payment type found:', {
        type,
        planId,
        creditAmount,
        availableKeys: Object.keys(session.metadata || {})
      });
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}