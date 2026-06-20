import { NextResponse } from "next/server";
import { z } from "zod";

import { resetPassword, setPasswordSessionCookie } from "@/lib/auth/password";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  password: z.string().min(8),
  remember: z.boolean().default(true),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Enter email, reset code, and a new 8+ character password." },
      { status: 400 },
    );
  }

  try {
    const user = await resetPassword(
      parsed.data.email,
      parsed.data.code,
      parsed.data.password,
    );
    const response = NextResponse.json({ ok: true, user });
    setPasswordSessionCookie(response, user, parsed.data.remember);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to reset password.",
      },
      { status: 400 },
    );
  }
}
