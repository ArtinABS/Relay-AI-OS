import { NextResponse } from "next/server";

import { githubTokenCookieName } from "@/lib/github/direct-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(githubTokenCookieName);
  return response;
}
