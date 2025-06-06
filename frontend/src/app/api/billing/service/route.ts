import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { instances, usageRecords } from "~/server/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { env } from "~/env";
import {
  getUserCredits,
  deductCredits,
  getOverdraftUsers
} from "~/server/db/queries/instances";

// Billing service endpoint for continuous credit deduction
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Simple API key authentication for the billing service
    if (authHeader !== `Bearer ${env.BILLING_SERVICE_API_KEY || 'billing-service-key'}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Running billing service cycle...");

    // Get all running instances (not terminated)
    const runningInstances = await db
      .select()
      .from(instances)
      .where(
        and(
          eq(instances.status, "running"),
          isNull(instances.terminatedAt)
        )
      );

    console.log(`💰 Found ${runningInstances.length} running instances to bill`);

    const billingResults = [];
    const currentTime = new Date();

    for (const instance of runningInstances) {
      try {
        // Get user's current credit balance
        const userCredits = await getUserCredits(instance.userId);
        
        // Calculate hourly rate for this instance
        const hourlyRate = await calculateInstanceHourlyRate(instance.provider, instance.instanceType, instance.useSpotInstance ?? false);
        
        if (hourlyRate === 0) {
          console.warn(`⚠️ No billing rate found for ${instance.provider} ${instance.instanceType}`);
          continue;
        }

        // Calculate credits to deduct (convert $ to cents, apply 50% markup, convert to minutes)
        const creditsPerHour = (hourlyRate * 100) * 1.5; // Convert $ to cents, then 50% markup
        const creditsPerMinute = creditsPerHour / 60; // Convert to per minute
        const creditsToDeduct = Math.ceil(creditsPerMinute); // Round up to next whole credit

        // Check if user would go beyond overdraft limit
        const newBalance = parseFloat(userCredits.currentBalance) - creditsToDeduct;
        const wouldExceedOverdraft = newBalance < userCredits.overdraftLimit;

        if (wouldExceedOverdraft) {
          console.log(`🚨 User ${instance.userId} would exceed overdraft limit. Terminating VM ${instance.id}`);
          
          // Terminate the VM
          await terminateVmForOverdraft(instance);
          
          billingResults.push({
            instanceId: instance.id,
            userId: instance.userId,
            action: "terminated",
            reason: "overdraft_limit_exceeded",
            balance: userCredits.currentBalance,
            overdraftLimit: userCredits.overdraftLimit
          });
          
          continue;
        }

        // Deduct credits for this billing cycle
        const deductionResult = await deductCredits(
          instance.userId,
          creditsToDeduct,
          `VM runtime - ${instance.name} (${instance.provider} ${instance.instanceType})`,
          instance.id
        );

        if (deductionResult.success) {
          // Update usage records
          await updateUsageRecord(instance.id, creditsToDeduct, hourlyRate / 100); // Convert back to USD for tracking

          billingResults.push({
            instanceId: instance.id,
            userId: instance.userId,
            action: "billed",
            creditsDeducted: creditsToDeduct,
            newBalance: deductionResult.newBalance,
            hourlyRate,
            isOverdraft: deductionResult.overdraft
          });

          console.log(`💳 Billed ${creditsToDeduct} credits for VM ${instance.name} (User: ${instance.userId})`);
        } else {
          console.error(`❌ Failed to deduct credits for VM ${instance.id}`);
        }

      } catch (error) {
        console.error(`❌ Error billing instance ${instance.id}:`, error);
        billingResults.push({
          instanceId: instance.id,
          userId: instance.userId,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: currentTime.toISOString(),
      billedInstances: runningInstances.length,
      results: billingResults
    });

  } catch (error) {
    console.error("❌ Billing service error:", error);
    return NextResponse.json(
      { error: "Billing service failed" },
      { status: 500 }
    );
  }
}

// Calculate hourly rate for instance type
async function calculateInstanceHourlyRate(provider: string, instanceType: string, useSpotInstance = false): Promise<number> {
  // Hetzner rates
  const hetznerRates: Record<string, number> = {
    "cpx11": 0.005,
    "cpx21": 0.008,
    "cpx31": 0.015,
    "cx22": 0.006,
    "cx32": 0.012,
    "cx42": 0.024,
    "cx52": 0.048,
  };

  // AWS rates (on-demand)
  const awsRates: Record<string, { onDemand: number; spot?: number }> = {
    "t3.micro": { onDemand: 0.0104 },
    "t3.small": { onDemand: 0.0208 },
    "t3.medium": { onDemand: 0.0416 },
    "t3.large": { onDemand: 0.0832 },
    "t3.xlarge": { onDemand: 0.1664 },
    "g4dn.xlarge": { onDemand: 0.526, spot: 0.15 },
    "g4dn.2xlarge": { onDemand: 0.752, spot: 0.22 },
    "p3.2xlarge": { onDemand: 3.06, spot: 1.0 },
    "p3.8xlarge": { onDemand: 12.24, spot: 4.0 },
    "p4d.24xlarge": { onDemand: 32.77, spot: 10.0 },
  };

  if (provider === "hetzner") {
    return hetznerRates[instanceType] || 0;
  }

  if (provider === "aws") {
    const rates = awsRates[instanceType];
    if (!rates) return 0;
    
    return useSpotInstance && rates.spot ? rates.spot : rates.onDemand;
  }

  return 0;
}

// Terminate VM due to overdraft
async function terminateVmForOverdraft(instance: any) {
  try {
    console.log(`🛑 Terminating VM ${instance.id} due to overdraft`);
    
    // Call Go backend to terminate the VM
    const deleteResponse = await fetch(`${env.VM_PROVISIONER_URL}/vm/${instance.instanceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (deleteResponse.ok) {
      // Update database to mark as terminated
      await db
        .update(instances)
        .set({
          status: "terminated",
          terminatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(instances.id, instance.id));

      // End the usage record
      await db
        .update(usageRecords)
        .set({
          endTime: new Date(),
        })
        .where(
          and(
            eq(usageRecords.instanceId, instance.id),
            isNull(usageRecords.endTime)
          )
        );

      console.log(`✅ Successfully terminated VM ${instance.id} for overdraft`);
    } else {
      const errorText = await deleteResponse.text();
      console.error(`❌ Failed to terminate VM ${instance.id}: ${errorText}`);
    }

  } catch (error) {
    console.error(`❌ Error terminating VM ${instance.id} for overdraft:`, error);
  }
}

// Update usage record with current billing
async function updateUsageRecord(instanceId: string, creditsCharged: number, cloudCostUsd: number) {
  try {
    // Find the active usage record for this instance
    const activeRecords = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.instanceId, instanceId),
          isNull(usageRecords.endTime)
        )
      );

    if (activeRecords.length > 0) {
      const record = activeRecords[0]!;
      
      // Update the existing record with accumulated charges
      await db
        .update(usageRecords)
        .set({
          creditsCharged: ((Number(record.creditsCharged) || 0) + creditsCharged).toFixed(2),
          cloudCostUsd: ((Number(record.cloudCostUsd) || 0) + cloudCostUsd).toFixed(4),
        })
        .where(eq(usageRecords.id, record.id));
    }
  } catch (error) {
    console.error(`❌ Error updating usage record for instance ${instanceId}:`, error);
  }
}