import { db } from "~/server/db";
import { instances, usageRecords, userCredits, creditTransactions } from "~/server/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

export type Instance = typeof instances.$inferSelect;
export type NewInstance = typeof instances.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type UserCredits = typeof userCredits.$inferSelect;
export type NewUserCredits = typeof userCredits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;

// Get all instances for a user (excluding soft deleted)
export async function getUserInstances(userId: string): Promise<Instance[]> {
  return await db
    .select()
    .from(instances)
    .where(eq(instances.userId, userId))
    .orderBy(desc(instances.createdAt));
}

// Get a specific instance (excluding soft deleted)
export async function getInstance(instanceId: string, userId: string): Promise<Instance | null> {
  const result = await db
    .select()
    .from(instances)
    .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

// Create a new instance
export async function createInstance(data: NewInstance): Promise<Instance> {
  const result = await db
    .insert(instances)
    .values(data)
    .returning();
  
  return result[0]!;
}

// Update instance status
export async function updateInstanceStatus(
  instanceId: string, 
  status: string, 
  updates?: Partial<Instance>
): Promise<void> {
  await db
    .update(instances)
    .set({
      status,
      updatedAt: new Date(),
      ...updates,
    })
    .where(eq(instances.id, instanceId));
}

// Terminate instance
export async function terminateInstance(instanceId: string, userId: string): Promise<void> {
  await db
    .update(instances)
    .set({
      status: "terminated",
      terminatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)));
}

// Soft delete instance (remove from UI but keep for billing)
export async function softDeleteInstance(instanceId: string, userId: string): Promise<void> {
  await db
    .update(instances)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)));
}

// Get running instances (for cleanup/monitoring, excluding soft deleted)
export async function getRunningInstances(): Promise<Instance[]> {
  return await db
    .select()
    .from(instances)
    .where(eq(instances.status, "running"));
}

// Usage Records functions

// Create usage record when instance starts
export async function createUsageRecord(data: NewUsageRecord): Promise<UsageRecord> {
  const result = await db
    .insert(usageRecords)
    .values(data)
    .returning();
  
  return result[0]!;
}

// End usage record when instance stops
export async function endUsageRecord(
  instanceId: string, 
  endTime: Date,
  durationMinutes: number,
  cloudCostUsd: number,
  creditsCharged: number
): Promise<void> {
  await db
    .update(usageRecords)
    .set({
      endTime,
      durationMinutes,
      cloudCostUsd: cloudCostUsd.toFixed(4),
      creditsCharged: creditsCharged.toFixed(2),
    })
    .where(and(
      eq(usageRecords.instanceId, instanceId),
      eq(usageRecords.endTime, null as any) // Find open usage record
    ));
}

// Get usage records for a user
export async function getUserUsageRecords(userId: string): Promise<UsageRecord[]> {
  return await db
    .select()
    .from(usageRecords)
    .where(eq(usageRecords.userId, userId))
    .orderBy(desc(usageRecords.startTime));
}

// Get total usage cost for a user (for billing)
export async function getUserTotalCost(userId: string, fromDate?: Date): Promise<number> {
  // This would be a more complex query in production
  // For now, we'll sum all usage records
  const records = await getUserUsageRecords(userId);
  return records.reduce((total, record) => total + (record.creditsCharged ? Number(record.creditsCharged) : 0), 0);
}

// ========== CREDITS SYSTEM FUNCTIONS ==========

// Get or create user credits record
export async function getUserCredits(userId: string): Promise<UserCredits> {
  const userCredit = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (userCredit.length === 0) {
    // Create new user with welcome bonus
    const newUserCredit = await db
      .insert(userCredits)
      .values({
        userId,
        currentBalance: "250.00", // 100 welcome bonus + 150 monthly
        monthlyAllocation: 150,
        lastAllocationDate: new Date(),
        totalEarned: "250.00",
      })
      .returning();

    // Log welcome bonus transaction
    await logCreditTransaction(
      userId,
      "bonus",
      250,
      "Welcome bonus (100) + first month allocation (150)",
      undefined,
      "0.00",
      "250.00"
    );

    return newUserCredit[0]!;
  }

  return userCredit[0]!;
}

// Update user credit balance
export async function updateUserBalance(
  userId: string,
  newBalance: string,
  totalEarnedDelta?: number,
  totalSpentDelta?: number
): Promise<void> {
  // Get current values first if we need to update totals
  if (totalEarnedDelta || totalSpentDelta) {
    const currentCredits = await getUserCredits(userId);
    const newTotalEarned = totalEarnedDelta ? 
      (Number(currentCredits.totalEarned) + totalEarnedDelta).toFixed(2) : 
      currentCredits.totalEarned;
    const newTotalSpent = totalSpentDelta ? 
      (Number(currentCredits.totalSpent) + totalSpentDelta).toFixed(2) : 
      currentCredits.totalSpent;

    await db
      .update(userCredits)
      .set({
        currentBalance: newBalance,
        totalEarned: newTotalEarned,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));
  } else {
    await db
      .update(userCredits)
      .set({
        currentBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));
  }
}

// Log a credit transaction
export async function logCreditTransaction(
  userId: string,
  type: string,
  amount: number,
  description: string,
  relatedInstanceId?: string,
  balanceBefore?: string,
  balanceAfter?: string,
  relatedUsageId?: string
): Promise<CreditTransaction> {
  // If balances not provided, get current balance
  if (!balanceBefore || !balanceAfter) {
    const currentCredits = await getUserCredits(userId);
    balanceBefore = balanceBefore ?? currentCredits.currentBalance;
    balanceAfter = balanceAfter ?? (Number(currentCredits.currentBalance) + amount).toFixed(2);
  }

  const result = await db
    .insert(creditTransactions)
    .values({
      userId,
      type,
      amount: amount.toFixed(2),
      description,
      relatedInstanceId,
      relatedUsageId,
      balanceBefore,
      balanceAfter,
    })
    .returning();

  return result[0]!;
}

// Deduct credits for VM usage
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  relatedInstanceId?: string,
  relatedUsageId?: string
): Promise<{ success: boolean; newBalance: number; overdraft: boolean }> {
  const currentCredits = await getUserCredits(userId);
  const currentBalance = Number(currentCredits.currentBalance);
  const newBalance = currentBalance - amount;

  // Check if this would exceed overdraft limit
  if (newBalance < currentCredits.overdraftLimit) {
    return {
      success: false,
      newBalance: currentBalance,
      overdraft: true,
    };
  }

  // Update balance
  await updateUserBalance(userId, newBalance.toFixed(2), 0, amount);

  // Log transaction
  await logCreditTransaction(
    userId,
    "usage",
    -amount,
    description,
    relatedInstanceId,
    currentBalance.toFixed(2),
    newBalance.toFixed(2),
    relatedUsageId
  );

  return {
    success: true,
    newBalance,
    overdraft: newBalance < 0,
  };
}

// Add credits to user account
export async function addCredits(
  userId: string,
  amount: number,
  type: "allocation" | "bonus" | "topup" | "refund",
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  const currentCredits = await getUserCredits(userId);
  const currentBalance = Number(currentCredits.currentBalance);
  const newBalance = currentBalance + amount;

  // Update balance
  await updateUserBalance(userId, newBalance.toFixed(2), amount, 0);

  // Log transaction
  await logCreditTransaction(
    userId,
    type,
    amount,
    description,
    undefined,
    currentBalance.toFixed(2),
    newBalance.toFixed(2)
  );

  return {
    success: true,
    newBalance,
  };
}

// Get user credit transaction history
export async function getUserCreditTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

// Check if user needs monthly credit allocation
export async function checkMonthlyAllocation(userId: string): Promise<boolean> {
  const currentCredits = await getUserCredits(userId);
  
  if (!currentCredits.lastAllocationDate) {
    return true; // Never allocated before
  }

  const lastAllocation = new Date(currentCredits.lastAllocationDate);
  const now = new Date();
  
  // Check if a month has passed
  const monthsDiff = (now.getFullYear() - lastAllocation.getFullYear()) * 12 + 
                    (now.getMonth() - lastAllocation.getMonth());
  
  return monthsDiff >= 1;
}

// Allocate monthly credits to user
export async function allocateMonthlyCredits(userId: string): Promise<{ allocated: boolean; amount: number }> {
  const needsAllocation = await checkMonthlyAllocation(userId);
  
  if (!needsAllocation) {
    return { allocated: false, amount: 0 };
  }

  const currentCredits = await getUserCredits(userId);
  const allocationAmount = currentCredits.monthlyAllocation;

  // Add monthly credits
  await addCredits(userId, allocationAmount, "allocation", `Monthly credit allocation (${allocationAmount} credits)`);

  // Update last allocation date
  await db
    .update(userCredits)
    .set({ lastAllocationDate: new Date() })
    .where(eq(userCredits.userId, userId));

  return { allocated: true, amount: allocationAmount };
}

// Get users with overdraft violations (balance < overdraft limit)
export async function getOverdraftUsers(): Promise<UserCredits[]> {
  return await db
    .select()
    .from(userCredits)
    .where(sql`${userCredits.currentBalance}::numeric < ${userCredits.overdraftLimit}`);
}

// ========== TIME-BASED BILLING CALCULATION ==========

// Calculate hourly rate for instance type
function getInstanceHourlyRate(provider: string, instanceType: string, useSpotInstance = false): number {
  // Hetzner rates
  const hetznerRates: Record<string, number> = {
    "cpx11": 0.005, "cpx21": 0.008, "cpx31": 0.015,
    "cx22": 0.006, "cx32": 0.012, "cx42": 0.024, "cx52": 0.048,
  };

  // AWS rates (on-demand and spot)
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

// Calculate total cost for an instance based on runtime
export function calculateInstanceCost(instance: Instance): { runtimeHours: number; cloudCostUsd: number; creditsCharged: number } {
  const startTime = instance.launchedAt || instance.createdAt;
  const endTime = instance.terminatedAt || new Date(); // Use current time if still running
  
  const runtimeMs = endTime.getTime() - startTime.getTime();
  const runtimeHours = runtimeMs / (1000 * 60 * 60); // Convert to hours
  
  const hourlyRateUsd = getInstanceHourlyRate(instance.provider, instance.instanceType, instance.useSpotInstance ?? false);
  const cloudCostUsd = runtimeHours * hourlyRateUsd;
  
  // Apply 50% markup and convert to credits (1 credit = 1 cent)
  const creditsCharged = cloudCostUsd * 100 * 1.5;
  
  return {
    runtimeHours,
    cloudCostUsd,
    creditsCharged,
  };
}

// Calculate user's total usage from all instances (including soft deleted for billing)
export async function calculateUserUsage(userId: string, fromDate?: Date): Promise<{
  thisMonth: number;
  total: number;
  runningVMs: number;
  instances: Array<Instance & { cost: ReturnType<typeof calculateInstanceCost> }>;
}> {
  // Get ALL instances (including soft deleted for accurate billing)
  const allInstances = await db
    .select()
    .from(instances)
    .where(eq(instances.userId, userId))
    .orderBy(desc(instances.createdAt));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const instancesWithCosts = allInstances.map(instance => ({
    ...instance,
    cost: calculateInstanceCost(instance)
  }));

  // Calculate this month's usage (from instances created this month)
  const thisMonthUsage = instancesWithCosts
    .filter(i => new Date(i.createdAt) >= startOfMonth)
    .reduce((total, i) => total + i.cost.creditsCharged, 0);

  // Calculate total usage
  const totalUsage = instancesWithCosts
    .reduce((total, i) => total + i.cost.creditsCharged, 0);

  // Count running VMs (excluding soft deleted)
  const runningVMs = instancesWithCosts
    .filter(i => i.status === "running")
    .length;

  return {
    thisMonth: thisMonthUsage,
    total: totalUsage,
    runningVMs,
    instances: instancesWithCosts,
  };
}