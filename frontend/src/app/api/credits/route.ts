import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getUserCredits, 
  getUserCreditTransactions, 
  getUserUsageRecords,
  allocateMonthlyCredits,
  calculateUserUsage
} from "~/server/db/queries/instances";

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

      // Get current credits, transactions, and calculate usage from time-based billing
      const [credits, transactions, userUsage] = await Promise.all([
        getUserCredits(userId),
        getUserCreditTransactions(userId, 20),
        calculateUserUsage(userId)
      ]);

      // Next allocation date (first day of next month)
      const now = new Date();
      const nextAllocationDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return NextResponse.json({
        credits: {
          currentBalance: Number(credits.currentBalance),
          monthlyAllocation: credits.monthlyAllocation,
          totalEarned: Number(credits.totalEarned),
          totalSpent: Number(credits.totalSpent), // Use totalSpent from database
          overdraftLimit: credits.overdraftLimit,
          nextAllocationDate: nextAllocationDate.toISOString(),
          lastAllocationDate: credits.lastAllocationDate,
        },
        usage: {
          thisMonth: userUsage.thisMonth,
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
          currentBalance: 125,
          monthlyAllocation: 150,
          totalEarned: 250,
          totalSpent: 125,
          overdraftLimit: -100,
          nextAllocationDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          lastAllocationDate: new Date().toISOString(),
        },
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