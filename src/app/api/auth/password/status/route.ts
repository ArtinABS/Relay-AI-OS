import { NextResponse } from "next/server";

import { getPasswordSessionUser } from "@/lib/auth/password";
import { getDatabaseHealth } from "@/lib/db";
import { hasDatabaseStore } from "@/lib/local-store/store";

export async function GET() {
  const [user, database] = await Promise.all([
    getPasswordSessionUser(),
    getDatabaseHealth(),
  ]);
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    user,
    persistence: database.ok && hasDatabaseStore() ? "postgres" : "local-json",
    database,
  });
}
