import { NextResponse } from "next/server";
import { z } from "zod";

import {
  changePassword,
  getPasswordSessionUser,
  setPasswordSessionCookie,
} from "@/lib/auth/password";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const sessionUser = await getPasswordSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, reason: "Sign in with email and password before changing your password." },
      { status: 401 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Enter your current password and a new 8+ character password." },
      { status: 400 },
    );
  }

  try {
    const user = await changePassword(
      sessionUser.email,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    const response = NextResponse.json({ ok: true, user });
    setPasswordSessionCookie(response, user, true);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to update password.",
      },
      { status: 400 },
    );
  }
}
