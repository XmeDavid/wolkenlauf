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
  uuid
} from "drizzle-orm/pg-core";

// Create a table prefix function
export const createTable = pgTableCreator((name) => `wolkenlauf_${name}`);

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
    costUsd: integer("cost_usd"), // cost in cents
    instanceType: varchar("instance_type", { length: 50 }).notNull(),
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
