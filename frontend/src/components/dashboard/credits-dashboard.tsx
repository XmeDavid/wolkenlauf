"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface CreditsData {
  credits: {
    currentBalance: number;
    storedBalance?: number;
    monthlyAllocation: number;
    totalEarned: number;
    totalSpent: number;
    overdraftLimit: number;
    nextAllocationDate: string;
    lastAllocationDate?: string;
  };
  userPlan: string;
  usage: {
    thisMonth: number;
    total: number;
    runningVMs: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
  }>;
  monthlyAllocation: {
    allocated: boolean;
    amount: number;
  };
}

async function fetchCreditsData(): Promise<CreditsData> {
  const response = await fetch('/api/credits');
  if (!response.ok) {
    throw new Error('Failed to fetch credits data');
  }
  return response.json() as Promise<CreditsData>;
}

function formatDate(dateString: string) {
  if (typeof window === 'undefined') {
    // Server-side: use consistent ISO formatting to avoid hydration mismatch
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  // Client-side: use locale formatting
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(dateString: string) {
  if (typeof window === 'undefined') {
    // Server-side: use consistent ISO formatting to avoid hydration mismatch
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').split('.')[0];
  }
  // Client-side: use locale formatting
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CreditsDashboard() {
  const { data: creditsData, isLoading, error, refetch } = useQuery({
    queryKey: ['credits'],
    queryFn: fetchCreditsData,
    refetchInterval: 30000, // Refresh every 30 seconds for live balance updates
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">Failed to load credits data</p>
          <Button onClick={() => void refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!creditsData) return null;

  const { credits, usage, transactions, userPlan } = creditsData;
  const balanceColor = credits.currentBalance < 0 ? 'text-red-600' : 
                      credits.currentBalance < 50 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="space-y-6">
      {/* Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CardDescription className="text-xs text-gray-500">Live balance reflecting VM usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceColor}`}>
              {credits.currentBalance.toFixed(0)} credits
            </div>
            {credits.currentBalance < 0 && (
              <Badge variant="destructive" className="mt-2">
                Overdraft: {Math.abs(credits.currentBalance)} credits used
              </Badge>
            )}
            {credits.storedBalance && credits.storedBalance !== credits.currentBalance && (
              <p className="text-xs text-gray-500 mt-1">
                Database balance: {credits.storedBalance.toFixed(0)} credits
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month's Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.thisMonth.toFixed(0)} credits
            </div>
            {usage.runningVMs > 0 && (
              <Badge variant="outline" className="mt-2">
                {usage.runningVMs} VM{usage.runningVMs !== 1 ? 's' : ''} running
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{credits.monthlyAllocation} credits
            </div>
            <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
              on {formatDate(credits.nextAllocationDate)}
            </p>
            <Badge variant="secondary" className="mt-2">
              {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>
            Your credit usage and account statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{credits.totalEarned.toFixed(0)}</div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{credits.totalSpent.toFixed(0)}</div>
              <div className="text-xs text-gray-500">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{usage.runningVMs}</div>
              <div className="text-xs text-gray-500">Running VMs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{Math.abs(credits.overdraftLimit)}</div>
              <div className="text-xs text-gray-500">Overdraft Limit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Pricing</CardTitle>
          <CardDescription>
            Current pricing for VM instances (credits per hour)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AWS Pricing */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-blue-600">AWS Instances</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>t3.micro</span>
                  <span className="font-mono">1.56 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>t3.small</span>
                  <span className="font-mono">3.12 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>t3.medium</span>
                  <span className="font-mono">6.24 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>g4dn.xlarge (GPU)</span>
                  <span className="font-mono">78.9 credits/hr</span>
                </div>
              </div>
            </div>
            
            {/* Hetzner Pricing */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-orange-600">Hetzner Cloud</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>cpx11 (2 vCPU, 4GB)</span>
                  <span className="font-mono">0.75 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>cpx21 (3 vCPU, 8GB)</span>
                  <span className="font-mono">1.20 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>cx22 (2 vCPU, 8GB)</span>
                  <span className="font-mono">0.90 credits/hr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>cx42 (8 vCPU, 32GB)</span>
                  <span className="font-mono">3.60 credits/hr</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Spot instances available for select AWS types.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest credit transactions and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={transaction.amount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {transaction.type}
                      </Badge>
                      <span className="text-sm">{transaction.description}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                      {formatDateTime(transaction.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Balance: {transaction.balanceAfter.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}