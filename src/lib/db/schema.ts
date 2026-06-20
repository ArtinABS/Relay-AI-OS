import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    scopes: text("scopes").array().notNull().default([]),
    encryptedAccessToken: text("encrypted_access_token"),
    encryptedRefreshToken: text("encrypted_refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userProviderIdx: index("integrations_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    priority: integer("priority").notNull().default(3),
    source: text("source").notNull().default("manual"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("tasks_user_status_idx").on(table.userId, table.status),
  }),
);

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userKindIdx: index("memories_user_kind_idx").on(table.userId, table.kind),
  }),
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    riskLevel: text("risk_level").notNull().default("medium"),
    requestedByRunId: uuid("requested_by_run_id"),
    payload: jsonb("payload").notNull().default({}),
    approved: boolean("approved"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userApprovalIdx: index("approvals_user_approval_idx").on(
      table.userId,
      table.approved,
    ),
  }),
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id"),
    status: text("status").notNull().default("running"),
    input: jsonb("input").notNull().default({}),
    output: jsonb("output").notNull().default({}),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userRunIdx: index("agent_runs_user_run_idx").on(table.userId, table.createdAt),
  }),
);

export const toolAuditLogs = pgTable(
  "tool_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    args: jsonb("args").notNull().default({}),
    result: jsonb("result").notNull().default({}),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userToolIdx: index("tool_audit_user_tool_idx").on(table.userId, table.toolName),
  }),
);

export const relayKvStore = pgTable("relay_kv_store", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
