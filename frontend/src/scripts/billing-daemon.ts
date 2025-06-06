#!/usr/bin/env bun

/**
 * Billing Daemon - Continuous VM billing service
 * 
 * This script runs continuously in the background to:
 * 1. Monitor running VMs every minute
 * 2. Deduct credits based on usage
 * 3. Terminate VMs when users exceed overdraft limit
 * 4. Log all billing activities
 */

import { env } from "~/env";

const BILLING_INTERVAL = 60 * 1000; // 1 minute in milliseconds
const API_BASE_URL = "http://localhost:3000";
const BILLING_API_KEY = env.BILLING_SERVICE_API_KEY || "billing-service-key";

interface BillingResult {
  success: boolean;
  timestamp: string;
  billedInstances: number;
  results: Array<{
    instanceId: string;
    userId: string;
    action: string;
    creditsDeducted?: number;
    newBalance?: number;
    error?: string;
  }>;
}

async function runBillingCycle(): Promise<void> {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Starting billing cycle...`);

    const response = await fetch(`${API_BASE_URL}/api/billing/service`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BILLING_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billing API error: ${response.status} - ${errorText}`);
    }

    const result: BillingResult = await response.json();
    
    console.log(`✅ [${result.timestamp}] Billing cycle completed:`);
    console.log(`   📊 Instances processed: ${result.billedInstances}`);
    
    // Log results summary
    const actionCounts = result.results.reduce((acc, r) => {
      acc[r.action] = (acc[r.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`   ${getActionEmoji(action)} ${action}: ${count}`);
    });

    // Log any errors
    const errors = result.results.filter(r => r.action === 'error');
    if (errors.length > 0) {
      console.log(`   ❌ Errors encountered:`);
      errors.forEach(error => {
        console.log(`     - Instance ${error.instanceId}: ${error.error}`);
      });
    }

    // Log any terminations
    const terminations = result.results.filter(r => r.action === 'terminated');
    if (terminations.length > 0) {
      console.log(`   🛑 VMs terminated for overdraft:`);
      terminations.forEach(term => {
        console.log(`     - Instance ${term.instanceId} (User: ${term.userId})`);
      });
    }

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Billing cycle failed:`, error);
  }
}

function getActionEmoji(action: string): string {
  const emojis: Record<string, string> = {
    'billed': '💳',
    'terminated': '🛑',
    'error': '❌',
    'skipped': '⏭️',
  };
  return emojis[action] || '❓';
}

async function startBillingDaemon(): Promise<void> {
  console.log(`🚀 Starting Wolkenlauf Billing Daemon`);
  console.log(`   💰 Billing interval: ${BILLING_INTERVAL / 1000} seconds`);
  console.log(`   🌐 API endpoint: ${API_BASE_URL}/api/billing/service`);
  console.log(`   🔐 Using API key: ${BILLING_API_KEY.substring(0, 8)}...`);
  console.log(`   📅 Started at: ${new Date().toISOString()}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Run initial billing cycle
  await runBillingCycle();

  // Schedule recurring billing cycles
  setInterval(() => {
    void runBillingCycle();
  }, BILLING_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n🛑 [${new Date().toISOString()}] Billing daemon shutting down...`);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`\n🛑 [${new Date().toISOString()}] Billing daemon terminated`);
    process.exit(0);
  });

  // Keep the process alive
  console.log(`✅ Billing daemon is running. Press Ctrl+C to stop.`);
}

// Start the daemon
// if (import.meta.main) {
//   void startBillingDaemon();
// }

export { startBillingDaemon, runBillingCycle };