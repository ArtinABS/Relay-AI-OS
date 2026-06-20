import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

type DbGlobal = typeof globalThis & {
  __dailyWorkAgentPool?: Pool;
};

const globalForDb = globalThis as DbGlobal;
const connectionString = process.env.DATABASE_URL;

export const pool =
  connectionString && !globalForDb.__dailyWorkAgentPool
    ? new Pool({ connectionString })
    : globalForDb.__dailyWorkAgentPool;

if (connectionString && !globalForDb.__dailyWorkAgentPool) {
  globalForDb.__dailyWorkAgentPool = pool;
}

export const db = pool ? drizzle(pool, { schema }) : null;
