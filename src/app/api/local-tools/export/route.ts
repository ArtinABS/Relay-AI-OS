import { NextResponse } from "next/server";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { getGoogleSetupStatus } from "@/lib/google/client";
import { listGoogleTasksForUser } from "@/lib/google/workspace";
import { listNotes } from "@/lib/local-store/notes";

export async function GET() {
  const [notes, directTokens] = await Promise.all([
    listNotes(),
    getDirectGoogleTokens(),
  ]);
  const google = getGoogleSetupStatus();
  const googleTasks =
    directTokens?.accessToken || directTokens?.refreshToken
      ? await listGoogleTasksForUser(directTokens, 100).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to export Google Tasks.",
          taskLists: [],
          tasks: [],
        }))
      : {
          ok: false,
          reason: "Google Tasks is not connected.",
          taskLists: [],
          tasks: [],
        };

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      product: "Relay",
      tasks: googleTasks.tasks,
      taskLists: googleTasks.taskLists,
      taskSource: "google-tasks",
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
