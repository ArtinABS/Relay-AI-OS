import { NextResponse } from "next/server";

import { googleTokenCookieName } from "@/lib/google/direct-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(googleTokenCookieName);
  return response;
}
