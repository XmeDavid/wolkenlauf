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

// Projects table
export const projects = createTable(
  "projects",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull(), // Foreign key from Clerk
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (project) => ({
    userIdIndex: index("user_id_idx").on(project.userId),
    nameIndex: index("name_idx").on(project.name),
  })
);

// Files table
export const files = createTable(
  "files",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    projectId: uuid("project_id").references(() => projects.id).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    s3Url: varchar("s3_url", { length: 1024 }).notNull(),
    relativePath: varchar("relative_path", { length: 1024 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (file) => ({
    projectIdIndex: index("files_project_id_idx").on(file.projectId),
  })
);

// Runs table
export const runs = createTable(
  "runs",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    projectId: uuid("project_id").references(() => projects.id).notNull(),
    runAt: timestamp("run_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    logs: text("logs"),
    success: boolean("success").notNull(),
    runTime: integer("run_time").notNull(), // in seconds
  },
  (run) => ({
    projectIdIndex: index("runs_project_id_idx").on(run.projectId),
    runAtIndex: index("run_at_idx").on(run.runAt),
  })
);
