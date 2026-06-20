import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

type DbGlobal = typeof globalThis & {
  __dailyWorkAgentPool?: Pool;
};

const globalForDb = globalThis as DbGlobal;
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

export const pool =
  connectionString && !globalForDb.__dailyWorkAgentPool
    ? new Pool({ connectionString })
    : globalForDb.__dailyWorkAgentPool;

if (connectionString && !globalForDb.__dailyWorkAgentPool) {
  globalForDb.__dailyWorkAgentPool = pool;
}

export const db = pool ? drizzle(pool, { schema }) : null;

export async function getDatabaseHealth() {
  if (!pool) {
    return {
      configured: false,
      ok: false,
      provider: "local-json",
      message: "DATABASE_URL is not configured.",
    };
  }

  try {
    await pool.query("select 1");
    return {
      configured: true,
      ok: true,
      provider: "postgres",
      message: "Postgres connection is healthy.",
    };
  } catch (error) {
    const message = error instanceof Error && error.message.trim()
      ? error.message
      : "Postgres connection failed.";
    return {
      configured: true,
      ok: false,
      provider: "postgres",
      message,
    };
  }
}
