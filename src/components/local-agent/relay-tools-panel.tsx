"use client";

import { Check, Download, ListTodo, RefreshCcw, StickyNote } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type RelayTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
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
  focus: RelayTask | null;
  counts: {
    openTasks: number;
    completedTasks: number;
    notes: number;
  };
};

export function RelayToolsPanel() {
  const [tasks, setTasks] = useState<RelayTask[]>([]);
  const [notes, setNotes] = useState<RelayNote[]>([]);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  async function refresh() {
    const [tasksResponse, notesResponse, oauthResponse, briefingResponse] =
      await Promise.all([
      fetch("/api/local-tools/tasks"),
      fetch("/api/local-tools/notes"),
      fetch("/api/oauth/status"),
      fetch("/api/local-tools/briefing"),
    ]);

    const tasksData = (await tasksResponse.json()) as { tasks: RelayTask[] };
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
          fetch("/api/local-tools/tasks"),
          fetch("/api/local-tools/notes"),
          fetch("/api/oauth/status"),
          fetch("/api/local-tools/briefing"),
        ]);

      if (!active) return;

      const tasksData = (await tasksResponse.json()) as { tasks: RelayTask[] };
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

    await fetch("/api/local-tools/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", title }),
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

  async function markDone(task: RelayTask) {
    await fetch("/api/local-tools/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", identifier: task.id }),
    });
    await refresh();
  }

  const openTasks = tasks.filter((task) => !task.completed);

  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Relay Status</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Local tools are active. OAuth is optional for no-key tools.
            </p>
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 transition hover:bg-stone-50"
            onClick={() => refresh()}
            title="Refresh"
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 text-sm">
          <StatusRow
            label="Google OAuth"
            value={
              oauthStatus?.hasDirectGoogleToken
                ? oauthStatus.googleEmail ?? "connected"
                : oauthStatus?.hasGoogleOAuthConfig
                  ? "configured"
                  : "missing credentials"
            }
          />
          <StatusRow label="Open tasks" value={String(openTasks.length)} />
          <StatusRow label="Notes" value={String(notes.length)} />
          <StatusRow
            label="Focus"
            value={briefing?.focus?.title ?? "none"}
          />
        </div>
        <a
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          href="/api/local-tools/export"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </a>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">Tasks</h2>
        </div>
        <form className="mt-4 flex gap-2" onSubmit={addTaskFromForm}>
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-sm outline-none focus:ring-2 focus:ring-stone-950"
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Add a task..."
            value={taskTitle}
          />
          <button className="h-10 rounded-md bg-stone-950 px-3 text-sm font-medium text-white">
            Add
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {openTasks.slice(0, 5).map((task) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
              key={task.id}
            >
              <span className="line-clamp-2">{task.title}</span>
              <button
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800"
                onClick={() => markDone(task)}
                title="Complete task"
                type="button"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ))}
          {openTasks.length === 0 ? (
            <p className="text-sm text-stone-500">No open tasks.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-sky-700" />
          <h2 className="text-lg font-semibold">Notes</h2>
        </div>
        <form className="mt-4 flex gap-2" onSubmit={addNoteFromForm}>
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-sm outline-none focus:ring-2 focus:ring-stone-950"
            onChange={(event) => setNoteBody(event.target.value)}
            placeholder="Remember something..."
            value={noteBody}
          />
          <button className="h-10 rounded-md bg-stone-950 px-3 text-sm font-medium text-white">
            Add
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {notes.slice(0, 5).map((note) => (
            <div
              className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-700"
              key={note.id}
            >
              {note.body}
            </div>
          ))}
          {notes.length === 0 ? (
            <p className="text-sm text-stone-500">No notes yet.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
      <span className="text-stone-600">{label}</span>
      <span className="font-medium text-stone-950">{value}</span>
    </div>
  );
}
