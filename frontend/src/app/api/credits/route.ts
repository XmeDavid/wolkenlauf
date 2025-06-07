import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getUserCredits, 
  getUserCreditTransactions, 
  getUserUsageRecords,
  allocateMonthlyCredits,
  calculateUserUsage
} from "~/server/db/queries/instances";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get real data from database, fall back to mock if not available
    try {
      // Check if user needs monthly allocation
      const monthlyAllocation = await allocateMonthlyCredits(userId);

      // Get user's subscription plan for correct allocation amount
      const userRecord = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
      const userPlan = userRecord.length > 0 ? userRecord[0]!.subscriptionPlan : 'free';

      // Get plan-specific monthly allocation
      const planAllocations: Record<string, number> = {
        free: 150,
        starter: 550,
        pro: 1200,
        business: 3200,
        enterprise: 6750,
      };
      const planMonthlyAllocation = planAllocations[userPlan] || 150;

      // Get current credits, transactions, and calculate usage from time-based billing
      const [credits, transactions, userUsage] = await Promise.all([
        getUserCredits(userId),
        getUserCreditTransactions(userId, 20),
        calculateUserUsage(userId)
      ]);

      // Calculate this month's spending from credit transactions (usage/subscription payments)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthSpentFromTransactions = transactions
        .filter(t => t.type === 'usage' && new Date(t.createdAt) >= startOfMonth)
        .reduce((total, t) => total + Math.abs(Number(t.amount)), 0);
      
      // For VMs that haven't been billed yet, include their calculated costs in this month's usage
      const unbilledThisMonth = userUsage.thisMonth;
      const thisMonthSpent = thisMonthSpentFromTransactions + unbilledThisMonth;

      // Next allocation date (first day of next month)
      const nextAllocationDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Calculate live balance that reflects real-time VM usage
      const storedBalance = Number(credits.currentBalance);
      const liveBalance = storedBalance - userUsage.total;

      return NextResponse.json({
        credits: {
          currentBalance: liveBalance, // Live balance reflecting VM usage
          storedBalance, // Original DB balance for reference
          monthlyAllocation: planMonthlyAllocation, // Use plan-specific allocation
          totalEarned: Number(credits.totalEarned),
          totalSpent: Math.max(Number(credits.totalSpent), userUsage.total), // Include calculated VM costs if higher than DB value
          overdraftLimit: credits.overdraftLimit,
          nextAllocationDate: nextAllocationDate.toISOString(),
          lastAllocationDate: credits.lastAllocationDate,
        },
        userPlan,
        usage: {
          thisMonth: thisMonthSpent, // Use actual credit transactions instead of VM calculation
          total: userUsage.total,
          runningVMs: userUsage.runningVMs,
        },
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          balanceBefore: Number(t.balanceBefore),
          balanceAfter: Number(t.balanceAfter),
          createdAt: t.createdAt,
        })),
        monthlyAllocation,
      });
    } catch (dbError) {
      console.warn("Database not available, using mock data:", dbError);
      
      // Fallback to mock data if database is not ready  
      const mockCreditsData = {
        credits: {
          currentBalance: 125, // Live balance (250 - 125 usage)
          storedBalance: 250,  // Original stored balance
          monthlyAllocation: 150,
          totalEarned: 250,
          totalSpent: 125,
          overdraftLimit: -100,
          nextAllocationDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          lastAllocationDate: new Date().toISOString(),
        },
        userPlan: 'free',
        usage: {
          thisMonth: 35,
          total: 125,
          runningVMs: 2,
        },
        transactions: [
          {
            id: "mock-1",
            type: "monthly_allocation",
            amount: 150,
            description: "Monthly credit allocation",
            balanceBefore: 100,
            balanceAfter: 250,
            createdAt: new Date().toISOString(),
          },
          {
            id: "mock-2",
            type: "bonus",
            amount: 100,
            description: "Welcome bonus",
            balanceBefore: 0,
            balanceAfter: 100,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "mock-3",
            type: "usage",
            amount: -25,
            description: "VM usage - t3.micro (AWS)",
            balanceBefore: 250,
            balanceAfter: 225,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        monthlyAllocation: {
          allocated: true,
          amount: 150,
        },
      };

      return NextResponse.json(mockCreditsData);
    }

  } catch (error) {
    console.error("Failed to fetch credits data:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits data" },
      { status: 500 }
    );
  }
}