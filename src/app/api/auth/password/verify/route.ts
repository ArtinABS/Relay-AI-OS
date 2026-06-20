import { NextResponse } from "next/server";
import { z } from "zod";

import { setPasswordSessionCookie, verifyEmailCode } from "@/lib/auth/password";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  remember: z.boolean().default(true),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Enter your email and verification code." },
      { status: 400 },
    );
  }

  try {
    const user = await verifyEmailCode(parsed.data.email, parsed.data.code);
    const response = NextResponse.json({ ok: true, user });
    setPasswordSessionCookie(response, user, parsed.data.remember);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to verify email.",
      },
      { status: 400 },
    );
  }
}
