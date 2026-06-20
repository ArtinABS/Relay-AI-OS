import { NextResponse } from "next/server";

import { getPasswordSessionUser } from "@/lib/auth/password";

export async function GET() {
  const user = await getPasswordSessionUser();
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    user,
  });
}
