import { NextResponse } from "next/server";
import { z } from "zod";

import { issueResetCode } from "@/lib/auth/password";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const result = await issueResetCode(parsed.data.email);
  return NextResponse.json({
    ok: true,
    message: "If an account exists, a reset code has been prepared.",
    devResetCode: result?.resetCode ?? null,
  });
}
