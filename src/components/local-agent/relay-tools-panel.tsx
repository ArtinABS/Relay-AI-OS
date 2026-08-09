"use client";

import {
  Check,
  Download,
  ListTodo,
  RefreshCcw,
  StickyNote,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Card, Link, Surface } from "@heroui/react";
import { Button, Input } from "@/components/ui/relay-ui";
import { RichTextEditor } from "@/components/ui/task-rich-text-editor";

type GoogleTask = {
  id?: string | null;
  title: string;
  status?: string | null;
  taskListId?: string | null;
};

type RelayNote = {
  id: string;
  body: string;
  createdAt: string;
};

type OAuthStatus = {
  hasGoogleOAuthConfig: boolean;
  hasDirectGoogleToken: boolean;
  googleEmail: string | null;
};

type Briefing = {
  localTime: string;
  focus: GoogleTask | null;
  counts: {
    openTasks: number;
    completedTasks: number;
    notes: number;
  };
};

export function RelayToolsPanel() {
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [notes, setNotes] = useState<RelayNote[]>([]);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  async function refresh() {
    const [tasksResponse, notesResponse, oauthResponse, briefingResponse] =
      await Promise.all([
        fetch("/api/google/tasks"),
        fetch("/api/local-tools/notes"),
        fetch("/api/oauth/status"),
        fetch("/api/local-tools/briefing"),
      ]);

    const tasksData = (await tasksResponse.json()) as { tasks: GoogleTask[] };
    const notesData = (await notesResponse.json()) as { notes: RelayNote[] };
    const oauthData = (await oauthResponse.json()) as OAuthStatus;
    const briefingData = (await briefingResponse.json()) as Briefing;

    setTasks(tasksData.tasks);
    setNotes(notesData.notes);
    setOauthStatus(oauthData);
    setBriefing(briefingData);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [tasksResponse, notesResponse, oauthResponse, briefingResponse] =
        await Promise.all([
          fetch("/api/google/tasks"),
          fetch("/api/local-tools/notes"),
          fetch("/api/oauth/status"),
          fetch("/api/local-tools/briefing"),
        ]);

      if (!active) return;

      const tasksData = (await tasksResponse.json()) as { tasks: GoogleTask[] };
      const notesData = (await notesResponse.json()) as { notes: RelayNote[] };
      const oauthData = (await oauthResponse.json()) as OAuthStatus;
      const briefingData = (await briefingResponse.json()) as Briefing;

      setTasks(tasksData.tasks);
      setNotes(notesData.notes);
      setOauthStatus(oauthData);
      setBriefing(briefingData);
    }

    loadInitialData().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  async function addTaskFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title }),
    });
    setTaskTitle("");
    await refresh();
  }

  async function addNoteFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) return;

    await fetch("/api/local-tools/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", body }),
    });
    setNoteBody("");
    await refresh();
  }

  async function markDone(task: GoogleTask) {
    if (!task.id) return;
    await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        id: task.id,
        taskListId: task.taskListId,
      }),
    });
    await refresh();
  }

  const openTasks = tasks.filter((task) => task.status !== "completed");

  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <Card className="border border-separator bg-surface p-0 shadow-surface">
        <Card.Content className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Relay Status</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Notes work locally; tasks are synced with Google Tasks.
              </p>
            </div>
            <Button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-separator bg-surface-secondary text-muted transition hover:bg-surface-tertiary hover:text-foreground"
              onClick={() => refresh()}
              title="Refresh"
              type="button"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <StatusRow
              label="Google OAuth"
              value={
                oauthStatus?.hasDirectGoogleToken
                  ? (oauthStatus.googleEmail ?? "connected")
                  : oauthStatus?.hasGoogleOAuthConfig
                    ? "configured"
                    : "missing credentials"
              }
            />
            <StatusRow label="Open tasks" value={String(openTasks.length)} />
            <StatusRow label="Notes" value={String(notes.length)} />
            <StatusRow label="Focus" value={briefing?.focus?.title ?? "none"} />
          </div>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-separator bg-surface-secondary px-3 text-sm font-medium text-foreground transition hover:bg-surface-tertiary"
            href="/api/local-tools/export"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Link>
        </Card.Content>
      </Card>

      <Card className="border border-separator bg-surface p-0 shadow-surface">
        <Card.Content className="p-5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold">Google Tasks</h2>
          </div>
          <form className="mt-4 flex gap-2" onSubmit={addTaskFromForm}>
            <Input
              className="h-10 min-w-0 flex-1 rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Add a task..."
              value={taskTitle}
            />
            <Button className="h-10 rounded-xl bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
              Add
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            {openTasks.slice(0, 5).map((task) => (
              <Surface
                className="flex items-center justify-between gap-3 rounded-xl border border-separator px-3 py-2 text-sm"
                key={`${task.taskListId}-${task.id ?? task.title}`}
                variant="secondary"
              >
                <span className="line-clamp-2">{task.title}</span>
                <Button
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"
                  onClick={() => markDone(task)}
                  title="Complete task"
                  type="button"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </Surface>
            ))}
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted">No open tasks.</p>
            ) : null}
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-separator bg-surface p-0 shadow-surface">
        <Card.Content className="p-5">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Notes</h2>
          </div>
          <form className="mt-4 space-y-2" onSubmit={addNoteFromForm}>
            <RichTextEditor
              ariaLabel="Note formatting"
              className="task-rich-text--compact"
              onChange={(_, plainText) => setNoteBody(plainText)}
              placeholder="Remember something..."
              value={noteBody}
            />
            <Button className="h-10 w-full rounded-xl bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
              Add
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            {notes.slice(0, 5).map((note) => (
              <Surface
                className="rounded-xl border border-separator px-3 py-2 text-sm leading-6 text-foreground"
                key={note.id}
                variant="secondary"
              >
                <span className="whitespace-pre-wrap">{note.body}</span>
              </Surface>
            ))}
            {notes.length === 0 ? (
              <p className="text-sm text-muted">No notes yet.</p>
            ) : null}
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <Surface
      className="flex items-center justify-between gap-3 rounded-xl border border-separator px-3 py-2"
      variant="secondary"
    >
      <span className="text-muted">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </Surface>
  );
}
