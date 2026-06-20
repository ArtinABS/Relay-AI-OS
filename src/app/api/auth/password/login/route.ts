import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authenticatePassword,
  setPasswordSessionCookie,
} from "@/lib/auth/password";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const result = await authenticatePassword(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: "Verify your email before signing in.",
          verificationRequired: true,
          user: result.user,
          devVerificationCode: result.verificationCode,
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true, user: result.user });
    setPasswordSessionCookie(response, result.user, parsed.data.remember);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to sign in.",
      },
      { status: 401 },
    );
  }
}
