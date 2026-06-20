import { NextResponse } from "next/server";
import { z } from "zod";

import { createPasswordUser } from "@/lib/auth/password";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Use a valid email and a password with at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const result = await createPasswordUser(parsed.data);
    return NextResponse.json({
      ok: true,
      verificationRequired: true,
      user: result.user,
      devVerificationCode: result.verificationCode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to create account.",
      },
      { status: 409 },
    );
  }
}
