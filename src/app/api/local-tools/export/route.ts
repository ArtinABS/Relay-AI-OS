import { NextResponse } from "next/server";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { getGoogleSetupStatus } from "@/lib/google/client";
import { listNotes } from "@/lib/local-store/notes";
import { listTasks } from "@/lib/local-store/tasks";

export async function GET() {
  const [tasks, notes, directTokens] = await Promise.all([
    listTasks(),
    listNotes(),
    getDirectGoogleTokens(),
  ]);
  const google = getGoogleSetupStatus();

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      product: "Relay",
      tasks,
      notes,
      google: {
        configured: google.hasOAuthApp,
        connected: Boolean(directTokens?.accessToken || directTokens?.refreshToken),
        email: directTokens?.email ?? null,
      },
    },
    {
      headers: {
        "Content-Disposition": 'attachment; filename="relay-export.json"',
      },
    },
  );
}
