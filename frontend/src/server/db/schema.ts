import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  foreignKey,
  uuid,
  decimal,
  jsonb
} from "drizzle-orm/pg-core";

// Create a table prefix function
export const createTable = pgTableCreator((name) => `wolkenlauf_${name}`);

// Users table for subscription management
export const users = createTable(
  "users",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    clerkId: varchar("clerk_id", { length: 256 }).notNull().unique(),
    email: varchar("email", { length: 256 }),
    subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default("free"), // free, starter, pro, business, enterprise
    subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"), // active, canceled, past_due, etc.
    stripeCustomerId: varchar("stripe_customer_id", { length: 256 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (user) => ({
    clerkIdIndex: index("users_clerk_id_idx").on(user.clerkId),
    subscriptionIndex: index("users_subscription_idx").on(user.subscriptionPlan),
    stripeCustomerIndex: index("users_stripe_customer_idx").on(user.stripeCustomerId),
  })
);

// VM Instances table
export const instances = createTable(
  "instances",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull(), // Foreign key from Clerk
    name: varchar("name", { length: 256 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // aws, hetzner
    instanceId: varchar("instance_id", { length: 256 }), // AWS EC2 instance ID or Hetzner server ID
    instanceType: varchar("instance_type", { length: 50 }).notNull(), // t3.micro, g4dn.xlarge, cx11, etc.
    region: varchar("region", { length: 50 }).notNull(),
    publicIp: varchar("public_ip", { length: 45 }), // IPv4 or IPv6
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, running, stopped, terminated
    sshUsername: varchar("ssh_username", { length: 256 }),
    sshPassword: varchar("ssh_password", { length: 256 }),
    useSpotInstance: boolean("use_spot_instance").default(false),
    image: varchar("image", { length: 256 }), // AMI ID or Hetzner image name
    autoTerminateMinutes: integer("auto_terminate_minutes").default(60),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    terminatedAt: timestamp("terminated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (instance) => ({
    userIdIndex: index("instances_user_id_idx").on(instance.userId),
    statusIndex: index("instances_status_idx").on(instance.status),
    providerIndex: index("instances_provider_idx").on(instance.provider),
    instanceIdIndex: index("instances_instance_id_idx").on(instance.instanceId),
  })
);

// Usage Records table for billing
export const usageRecords = createTable(
  "usage_records",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    instanceId: uuid("instance_id").references(() => instances.id).notNull(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"), // calculated duration
    cloudCostUsd: decimal("cloud_cost_usd", { precision: 10, scale: 4 }), // actual cloud provider cost
    creditsCharged: decimal("credits_charged", { precision: 10, scale: 2 }), // credits charged to user (with markup)
    instanceType: varchar("instance_type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // aws, hetzner
    region: varchar("region", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (record) => ({
    instanceIdIndex: index("usage_instance_id_idx").on(record.instanceId),
    userIdIndex: index("usage_user_id_idx").on(record.userId),
    startTimeIndex: index("usage_start_time_idx").on(record.startTime),
  })
);

// User Credits table for billing system
export const userCredits = createTable(
  "user_credits",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull().unique(),
    currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // current credit balance
    monthlyAllocation: integer("monthly_allocation").notNull().default(150), // monthly free credits
    lastAllocationDate: timestamp("last_allocation_date", { withTimezone: true }),
    totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).notNull().default("0.00"), // lifetime credits earned
    totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0.00"), // lifetime credits spent
    overdraftLimit: integer("overdraft_limit").notNull().default(-100), // maximum negative balance allowed
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (credits) => ({
    userIdIndex: index("user_credits_user_id_idx").on(credits.userId),
    balanceIndex: index("user_credits_balance_idx").on(credits.currentBalance),
  })
);

// Credit Transactions table for audit trail
export const creditTransactions = createTable(
  "credit_transactions",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // allocation, usage, bonus, refund, purchase, monthly_allocation, forced_termination
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // positive for additions, negative for deductions
    description: text("description").notNull(), // human-readable description
    relatedInstanceId: uuid("related_instance_id").references(() => instances.id), // optional link to VM instance
    relatedUsageId: uuid("related_usage_id").references(() => usageRecords.id), // optional link to usage record
    balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(), // balance before transaction
    balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(), // balance after transaction
    metadata: jsonb("metadata"), // additional data like Stripe IDs, plan info, etc.
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (transaction) => ({
    userIdIndex: index("credit_transactions_user_id_idx").on(transaction.userId),
    typeIndex: index("credit_transactions_type_idx").on(transaction.type),
    createdAtIndex: index("credit_transactions_created_at_idx").on(transaction.createdAt),
    instanceIdIndex: index("credit_transactions_instance_id_idx").on(transaction.relatedInstanceId),
  })
);

// User Preferences/Settings table
export const userSettings = createTable(
  "user_settings",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull().unique(),
    defaultInstanceType: varchar("default_instance_type", { length: 50 }).default("t3.micro"),
    defaultRegion: varchar("default_region", { length: 50 }).default("us-east-1"),
    autoTerminateMinutes: integer("auto_terminate_minutes").default(60), // auto-terminate after X minutes
    monthlyBudgetCents: integer("monthly_budget_cents"), // spending limit in cents
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (settings) => ({
    userIdIndex: index("user_settings_user_id_idx").on(settings.userId),
  })
);
