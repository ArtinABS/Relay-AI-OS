import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { pool } from "@/lib/db";

const dataDir = path.join(process.cwd(), ".relay-data");
let kvStoreReady: Promise<void> | null = null;

export function hasDatabaseStore() {
  return Boolean(pool);
}

async function ensureKvStore() {
  if (!pool) return;
  kvStoreReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS relay_kv_store (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `).then(() => undefined);
  await kvStoreReady;
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (pool) {
    try {
      await ensureKvStore();
      const result = await pool.query<{ value: T }>(
        "SELECT value FROM relay_kv_store WHERE key = $1",
        [filename],
      );
      return result.rows[0]?.value ?? fallback;
    } catch {
      // Fall through to local JSON so a broken local DATABASE_URL does not
      // erase the local development experience.
    }
  }

  try {
    const contents = await readFile(path.join(dataDir, filename), "utf8");
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T) {
  if (pool) {
    try {
      await ensureKvStore();
      await pool.query(
        `
          INSERT INTO relay_kv_store (key, value, updated_at)
          VALUES ($1, $2::jsonb, now())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        `,
        [filename, JSON.stringify(data)],
      );
      return;
    } catch {
      // Fall through to local JSON so local development keeps working even if
      // DATABASE_URL points at an unavailable database.
    }
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, filename),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

export function createLocalId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
