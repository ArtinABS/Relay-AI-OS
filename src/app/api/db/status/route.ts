import { NextResponse } from "next/server";

import { getDatabaseHealth } from "@/lib/db";
import { hasDatabaseStore } from "@/lib/local-store/store";

export async function GET() {
  const health = await getDatabaseHealth();

  return NextResponse.json({
    ...health,
    persistence: health.ok && hasDatabaseStore() ? "postgres" : "local-json",
  });
}
