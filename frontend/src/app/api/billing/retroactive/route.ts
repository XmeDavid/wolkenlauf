import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { instances, creditTransactions } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { calculateInstanceCost, deductCredits } from "~/server/db/queries/instances";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all terminated instances for this user that might not have been billed
    const userInstances = await db
      .select()
      .from(instances)
      .where(and(
        eq(instances.userId, userId),
        eq(instances.status, "terminated"),
        isNull(instances.deletedAt)
      ));

    const results = [];
    let totalCreditsBilled = 0;

    for (const instance of userInstances) {
      try {
        // Check if this instance already has usage transactions
        const existingTransactions = await db
          .select()
          .from(creditTransactions)
          .where(and(
            eq(creditTransactions.userId, userId),
            eq(creditTransactions.type, "usage"),
            eq(creditTransactions.relatedInstanceId, instance.id)
          ));

        if (existingTransactions.length > 0) {
          console.log(`⏭️ Skipping instance ${instance.id} - already billed`);
          results.push({
            instanceId: instance.id,
            instanceName: instance.name,
            status: "already_billed",
            credits: 0
          });
          continue;
        }

        // Calculate cost for this instance
        const cost = calculateInstanceCost(instance);
        
        if (cost.creditsCharged > 0 && instance.launchedAt) {
          console.log(`💰 Retroactive billing for VM ${instance.id}: ${cost.creditsCharged.toFixed(2)} credits`);
          
          const billingResult = await deductCredits(
            userId,
            cost.creditsCharged,
            `Retroactive billing: ${instance.name} (${instance.provider} ${instance.instanceType}) - ${cost.runtimeHours.toFixed(2)}h`,
            instance.id
          );
          
          if (billingResult.success) {
            totalCreditsBilled += cost.creditsCharged;
            results.push({
              instanceId: instance.id,
              instanceName: instance.name,
              status: "billed",
              credits: cost.creditsCharged,
              runtime: cost.runtimeHours,
              launchedAt: instance.launchedAt,
              terminatedAt: instance.terminatedAt,
              newBalance: billingResult.newBalance
            });
            console.log(`✅ Successfully billed ${cost.creditsCharged.toFixed(2)} credits for ${instance.name}`);
          } else {
            results.push({
              instanceId: instance.id,
              instanceName: instance.name,
              status: "billing_failed",
              credits: 0,
              error: billingResult.overdraft ? "Overdraft limit exceeded" : "Unknown error"
            });
            console.error(`❌ Failed to bill ${instance.name}: ${billingResult.overdraft ? 'Overdraft' : 'Unknown error'}`);
          }
        } else {
          results.push({
            instanceId: instance.id,
            instanceName: instance.name,
            status: "no_charge",
            credits: 0,
            reason: !instance.launchedAt ? "Never launched" : "Zero runtime"
          });
          console.log(`ℹ️ No charge for ${instance.name}: ${!instance.launchedAt ? 'Never launched' : 'Zero runtime'}`);
        }
      } catch (error) {
        console.error(`❌ Error processing instance ${instance.id}:`, error);
        results.push({
          instanceId: instance.id,
          instanceName: instance.name,
          status: "error",
          credits: 0,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      message: "Retroactive billing completed",
      totalInstancesProcessed: userInstances.length,
      totalCreditsBilled,
      results
    });

  } catch (error) {
    console.error("Failed to process retroactive billing:", error);
    return NextResponse.json(
      { error: "Failed to process retroactive billing" },
      { status: 500 }
    );
  }
}