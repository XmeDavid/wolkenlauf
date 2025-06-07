import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription info from database
    const user = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    
    if (user.length === 0) {
      // User doesn't exist yet, return default free plan
      return NextResponse.json({
        currentPlan: "free",
        subscriptionStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });
    }

    const userData = user[0]!;
    
    return NextResponse.json({
      currentPlan: userData.subscriptionPlan,
      subscriptionStatus: userData.subscriptionStatus,
      stripeCustomerId: userData.stripeCustomerId,
      stripeSubscriptionId: userData.stripeSubscriptionId,
    });

  } catch (error) {
    console.error("Failed to fetch user subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}