import { NextResponse } from "next/server";

import { passwordSessionCookieName } from "@/lib/auth/password";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(passwordSessionCookieName);
  return response;
}
