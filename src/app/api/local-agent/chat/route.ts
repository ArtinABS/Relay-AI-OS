import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { getGoogleSetupStatus } from "@/lib/google/client";
import {
  completeGoogleTaskForUser,
  createGoogleTaskForUser,
  deleteGoogleTaskForUser,
  getUpcomingCalendarEventsForUser,
  listGoogleTasksForUser,
} from "@/lib/google/workspace";
import { calculateExpression } from "@/lib/local-tools/calculator";
import {
  addNote,
  deleteNote,
  listNotes,
  searchNotes,
} from "@/lib/local-store/notes";

type BriefingResponse = {
  localTime: string;
  focus: { title: string } | null;
  openTasks: Array<{ title: string }>;
  recentNotes: Array<{ body: string }>;
  counts: {
    openTasks: number;
    completedTasks: number;
    notes: number;
  };
  google: {
    configured: boolean;
    connected: boolean;
    email: string | null;
  };
};

const requestSchema = z.object({
  message: z.string().min(1),
});

type ChatResponse = {
  role: "assistant";
  content: string;
  data?: unknown;
};

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content: "Send me a message first, then I can help.",
      },
      { status: 400 },
    );
  }

  try {
  const directTokens = await getDirectGoogleTokens();
  const text = body.data.message.toLowerCase();
  const originalMessage = body.data.message.trim();
  const setup = getGoogleSetupStatus();
  const googleConnected = Boolean(
    directTokens?.accessToken || directTokens?.refreshToken,
  );

  async function loadGoogleTasks() {
    if (!directTokens || !googleConnected) {
      return { ok: false, taskLists: [], tasks: [] };
    }
    return listGoogleTasksForUser(directTokens, 100);
  }

  if (
    text === "help" ||
    text.includes("what can you do") ||
    text.includes("tools")
  ) {
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: [
        "## Relay tools",
        "",
        "- OAuth status",
        "- Add Google Task: `add task review thesis outline`",
        "- List Google Tasks",
        "- Complete Google Task: `complete task 1`",
        "- Clear completed Google Tasks",
        "- Remember note: `remember that thesis meeting is Monday`",
        "- List notes",
        "- Search notes: `search notes thesis`",
        "- Delete note: `delete note 1`",
        "- Calculate: `calculate (1200 * 0.2) + 45`",
        "- Time/date: what time is it",
        "- Briefing/focus: briefing, daily summary, what should I focus on",
        "- Export: export workspace",
      ].join("\n"),
    });
  }

  if (text.includes("export")) {
    const [googleTasks, notes] = await Promise.all([
      loadGoogleTasks(),
      listNotes(),
    ]);
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: [
        "## Workspace export ready",
        "",
        `- **Google Tasks:** ${googleTasks.tasks.length}`,
        `- **Notes:** ${notes.length}`,
        "",
        "Open `/api/local-tools/export` in the browser to download the JSON snapshot.",
      ].join("\n"),
      data: {
        exportUrl: "/api/local-tools/export",
        taskCount: googleTasks.tasks.length,
        noteCount: notes.length,
      },
    });
  }

  if (
    text.includes("briefing") ||
    text.includes("daily summary") ||
    text.includes("plan my day") ||
    text.includes("focus")
  ) {
    const [googleTasks, notes] = await Promise.all([
      loadGoogleTasks(),
      listNotes(),
    ]);
    const openTasks = googleTasks.tasks.filter(
      (task) => task.status !== "completed",
    );
    const briefing: BriefingResponse = {
      localTime: new Date().toLocaleString(),
      focus: openTasks[0] ? { title: openTasks[0].title } : null,
      openTasks: openTasks.slice(0, 5).map((task) => ({ title: task.title })),
      recentNotes: notes.slice(0, 5).map((note) => ({ body: note.body })),
      counts: {
        openTasks: openTasks.length,
        completedTasks: googleTasks.tasks.length - openTasks.length,
        notes: notes.length,
      },
      google: {
        configured: setup.hasOAuthApp,
        connected: Boolean(directTokens?.accessToken || directTokens?.refreshToken),
        email: directTokens?.email ?? null,
      },
    };

    const taskLines =
      briefing.openTasks.length > 0
        ? briefing.openTasks
            .map((task, index) => `${index + 1}. ${task.title}`)
            .join("\n")
        : "No open tasks.";
    const noteLines =
      briefing.recentNotes.length > 0
        ? briefing.recentNotes
            .map((note, index) => `${index + 1}. ${note.body}`)
            .join("\n")
        : "No recent notes.";

    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: [
        `## Relay briefing`,
        "",
        `**Local time:** ${briefing.localTime}`,
        "",
        `**Focus:** ${briefing.focus?.title ?? "No focus task yet."}`,
        "",
        `### Open tasks (${briefing.counts.openTasks})`,
        taskLines,
        "",
        `### Recent notes (${briefing.counts.notes})`,
        noteLines,
        "",
        `**Google:** ${
          briefing.google.connected
            ? `connected as ${briefing.google.email ?? "your account"}`
            : briefing.google.configured
              ? "configured, not connected"
              : "not configured"
        }`,
      ].join("\n"),
      data: briefing,
    });
  }

  if (
    text.includes("time") ||
    text.includes("date") ||
    text.includes("today")
  ) {
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: `**Local server time:** ${new Date().toLocaleString()}`,
    });
  }

  if (text.startsWith("calculate ") || text.startsWith("calc ")) {
    try {
      const { expression, result } = calculateExpression(originalMessage);
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content: `\`${expression}\` = **${result}**`,
        data: { expression, result },
      });
    } catch (error) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content:
          error instanceof Error
            ? `I could not calculate that: ${error.message}`
            : "I could not calculate that.",
      });
    }
  }

  const taskMatch =
    originalMessage.match(/^(?:add|create)\s+(?:a\s+)?task\s+(.+)$/i) ??
    originalMessage.match(/^remind me to\s+(.+)$/i);

  if (taskMatch?.[1]) {
    if (!directTokens || !googleConnected) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content: "Connect Google before creating a task.",
      });
    }
    const task = await createGoogleTaskForUser(directTokens, {
      title: taskMatch[1],
    });
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: task.ok
        ? `Google Task added: **${task.task?.title ?? taskMatch[1]}**`
        : (task.reason ?? "Google Tasks could not create that task."),
      data: task,
    });
  }

  if (text.includes("list tasks") || text.includes("show tasks")) {
    const googleTasks = await loadGoogleTasks();
    const openTasks = googleTasks.tasks.filter(
      (task) => task.status !== "completed",
    );

    if (openTasks.length === 0) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content: "You have no open tasks.",
        data: googleTasks.tasks,
      });
    }

    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: openTasks
        .map((task, index) => `${index + 1}. ${task.title}`)
        .join("\n"),
      data: openTasks,
    });
  }

  const completeMatch = originalMessage.match(/^complete task\s+(.+)$/i);
  if (completeMatch?.[1]) {
    const googleTasks = await loadGoogleTasks();
    const identifier = completeMatch[1].trim();
    const listIndex = Number(identifier);
    const openTasks = googleTasks.tasks.filter(
      (task) => task.status !== "completed",
    );
    const task =
      (Number.isInteger(listIndex) && listIndex > 0
        ? openTasks[listIndex - 1]
        : null) ??
      openTasks.find((candidate) => candidate.id === identifier) ??
      openTasks.find((candidate) =>
        candidate.title.toLowerCase().includes(identifier.toLowerCase()),
      );
    const result =
      task?.id && directTokens && googleConnected
        ? await completeGoogleTaskForUser(directTokens, {
            id: task.id,
            taskListId: task.taskListId,
          })
        : null;
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content:
        result?.ok && task
          ? `Completed Google Task: ${task.title}`
          : (result?.reason ?? "I could not find that Google Task."),
      data: result,
    });
  }

  if (text.includes("clear completed")) {
    const googleTasks = await loadGoogleTasks();
    const completedTasks = googleTasks.tasks.filter(
      (task) => task.status === "completed" && task.id,
    );
    const results =
      directTokens && googleConnected
        ? await Promise.all(
            completedTasks.map((task) =>
              deleteGoogleTaskForUser(directTokens, {
                id: task.id as string,
                taskListId: task.taskListId,
              }),
            ),
          )
        : [];
    const removed = results.filter((result) => result.ok).length;
    const remaining = googleTasks.tasks.length - completedTasks.length;
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: `Cleared ${removed} completed Google Task(s). ${remaining} open task(s) remain.`,
      data: { removed, remaining },
    });
  }

  const noteMatch =
    originalMessage.match(/^(?:add\s+)?note\s+(.+)$/i) ??
    originalMessage.match(/^remember(?: that)?\s+(.+)$/i);

  if (noteMatch?.[1]) {
    const note = await addNote(noteMatch[1]);
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: `Remembered: ${note.body}`,
      data: note,
    });
  }

  if (text.includes("list notes") || text.includes("show notes")) {
    const notes = await listNotes();

    if (notes.length === 0) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content: "You do not have any notes yet.",
        data: notes,
      });
    }

    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: notes.map((note, index) => `${index + 1}. ${note.body}`).join("\n"),
      data: notes,
    });
  }

  const searchNotesMatch = originalMessage.match(/^search notes(?: for)?\s+(.+)$/i);
  if (searchNotesMatch?.[1]) {
    const notes = await searchNotes(searchNotesMatch[1]);
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content:
        notes.length > 0
          ? notes.map((note, index) => `${index + 1}. ${note.body}`).join("\n")
          : "I did not find matching notes.",
      data: notes,
    });
  }

  const deleteNoteMatch = originalMessage.match(/^delete note\s+(.+)$/i);
  if (deleteNoteMatch?.[1]) {
    const note = await deleteNote(deleteNoteMatch[1].trim());
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: note ? `Deleted note: ${note.body}` : "I could not find that note.",
      data: note,
    });
  }

  if (
    (text.includes("connect") || text.includes("how")) &&
    text.includes("oauth")
  ) {
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: [
        "## Connect Google OAuth",
        "",
        "You need to create a Google OAuth client first. This app cannot invent that client ID/secret locally.",
        "",
        "1. Open Google Cloud Console.",
        "2. Create or select a project.",
        "3. Go to APIs & Services > OAuth consent screen and create the consent screen.",
        "4. Add yourself as a test user if the app is in Testing mode.",
        "5. Go to APIs & Services > Credentials > Create credentials > OAuth client ID.",
        "6. Choose Web application.",
        "7. Add Authorized JavaScript origin: `http://localhost:3000`",
        "8. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`",
        "9. Copy the Client ID and Client Secret into `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.",
        "10. Restart the dev server, then click Connect Google.",
      ].join("\n"),
      data: {
        origin: "http://localhost:3000",
        redirectUri: "http://localhost:3000/api/auth/callback/google",
      },
    });
  }

  if (text.includes("oauth") || text.includes("status") || text.includes("setup")) {
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content: [
        "## OAuth status",
        "",
        `- **Google OAuth app configured:** ${setup.hasOAuthApp ? "yes" : "no"}`,
        `- **Signed in:** ${directTokens?.email ? `yes, as ${directTokens.email}` : "no"}`,
        `- **Google token available in this session:** ${
          directTokens?.accessToken || directTokens?.refreshToken
            ? "yes"
            : "no"
        }`,
      ].join("\n"),
      data: { setup, signedInEmail: directTokens?.email ?? null },
    });
  }

  if (!directTokens?.accessToken && !directTokens?.refreshToken) {
    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content:
        "I can chat locally, but I cannot use Google yet because you are not signed in. Use **Connect Google**, then ask me for **OAuth status** or upcoming calendar events.",
    });
  }

  if (
    text.includes("calendar") ||
    text.includes("event") ||
    text.includes("meeting") ||
    text.includes("agenda")
  ) {
    if (!directTokens?.accessToken) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content:
          "Calendar needs Google OAuth first. Connect Google, then we can add the Calendar read-only scope.",
      });
    }

    try {
      const result = await getUpcomingCalendarEventsForUser(
        {
          accessToken:
            typeof directTokens?.accessToken === "string"
              ? directTokens.accessToken
              : undefined,
          refreshToken: directTokens?.refreshToken,
        },
        8,
      );

      if (!result.ok) {
        return NextResponse.json<ChatResponse>({
          role: "assistant",
          content:
            result.reason ??
            "Google Calendar is not ready for this session yet.",
          data: result,
        });
      }

      const events = result.events ?? [];

      if (events.length === 0) {
        return NextResponse.json<ChatResponse>({
          role: "assistant",
          content: "I checked your Google Calendar and did not find upcoming events.",
          data: events,
        });
      }

      const lines = events.map((event, index) => {
        const when = event.start ? new Date(event.start).toLocaleString() : "no time";
        return `${index + 1}. ${event.title} - ${when}`;
      });

      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content: `## Next ${events.length} calendar items\n\n${lines.join(
          "\n",
        )}`,
        data: events,
      });
    } catch (error) {
      return NextResponse.json<ChatResponse>({
        role: "assistant",
        content:
          error instanceof Error
            ? `Google Calendar rejected the request: ${error.message}`
            : "Google Calendar rejected the request.",
      });
    }
  }

  return NextResponse.json<ChatResponse>({
    role: "assistant",
    content:
      "I am Relay's fallback agent. Try: help, add task review notes, list tasks, remember that meeting is Monday, list notes, calculate 24*7, or OAuth status. Task actions use Google Tasks.",
  });
  } catch (error) {
    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content:
          error instanceof Error
            ? `Local fallback hit a server issue: ${error.message}`
            : "Local fallback hit a server issue.",
      },
      { status: 500 },
    );
  }
}
