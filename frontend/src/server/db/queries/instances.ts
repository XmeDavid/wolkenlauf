import { db } from "~/server/db";
import { instances, usageRecords } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export type Instance = typeof instances.$inferSelect;
export type NewInstance = typeof instances.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;

// Get all instances for a user
export async function getUserInstances(userId: string): Promise<Instance[]> {
  return await db
    .select()
    .from(instances)
    .where(eq(instances.userId, userId))
    .orderBy(desc(instances.createdAt));
}

// Get a specific instance
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

// Get running instances (for cleanup/monitoring)
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
  costUsd: number
): Promise<void> {
  await db
    .update(usageRecords)
    .set({
      endTime,
      durationMinutes,
      costUsd,
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
  return records.reduce((total, record) => total + (record.costUsd || 0), 0);
}