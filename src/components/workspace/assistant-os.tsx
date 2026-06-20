"use client";

import type { FormEvent, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Columns3,
  Command,
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListTodo,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  User,
  Users,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AppStage = "auth" | "onboarding" | "workspace";
type AuthMode = "login" | "signup" | "forgot" | "verify";
type ThemeMode = "light" | "dark";
type ViewId =
  | "dashboard"
  | "chat"
  | "calendar"
  | "tasks"
  | "files"
  | "github"
  | "memory"
  | "integrations"
  | "profile"
  | "settings";

type RelayTaskPriority = "low" | "medium" | "high" | "urgent";

type RelayTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  notes?: string | null;
  due?: string | null;
  priority?: RelayTaskPriority;
  columnId?: string | null;
};

type TaskColumn = {
  id: string;
  title: string;
  order: number;
  createdAt: string;
};

type AddTaskInput =
  | string
  | {
      title: string;
      notes?: string | null;
      due?: string | null;
      priority?: RelayTaskPriority;
      columnId?: string | null;
    };

type RelayNote = {
  id: string;
  body: string;
  createdAt: string;
};

type OAuthStatus = {
  hasGoogleOAuthConfig: boolean;
  hasNextAuthSecret: boolean;
  checks: Array<{
    label: string;
    ready: boolean;
    where: string;
  }>;
  redirectUri: string;
  origin: string;
  hasDirectGoogleToken: boolean;
  googleEmail: string | null;
  requiredScopes: string[];
  github?: {
    configured: boolean;
    connected: boolean;
    login: string | null;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    htmlUrl: string | null;
    redirectUri: string;
    requiredScopes: string[];
    grantedScopes: string[];
  };
};

type AiStatus = {
  provider: string;
  label: string;
  modelId: string;
  configured: boolean;
  recommendedFreeProvider: string;
  fallbackFreeProvider: string;
};

type PasswordAuthStatus = {
  ok: boolean;
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string | null;
    emailVerified: boolean;
  } | null;
  persistence?: "postgres" | "local-json";
};

type CalendarEvent = {
  id?: string | null;
  title: string;
  start?: string | null;
  end?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
};

type CalendarAction = {
  mode: "create" | "edit";
  event?: CalendarEvent;
  start: Date;
  end: Date;
  title: string;
  attendees?: string;
  location?: string;
  notes?: string;
  reminderMinutes?: number | null;
};

type DriveFile = {
  id?: string | null;
  name: string;
  mimeType: string;
  webViewLink?: string | null;
  modifiedTime?: string | null;
  owner?: string | null;
};

type GoogleTask = {
  id?: string | null;
  title: string;
  notes?: string | null;
  due?: string | null;
  status?: string | null;
  completed?: string | null;
  updated?: string | null;
  taskListId?: string | null;
  taskListTitle?: string | null;
};

type GmailMessage = {
  id?: string | null;
  threadId?: string | null;
  subject: string;
  from?: string | null;
  to?: string | null;
  date?: string | null;
  snippet?: string | null;
  labelIds?: string[];
};

type ScheduledEmail = {
  id: string;
  sendAt: string;
  status: string;
  email: {
    to: string;
    subject: string;
  };
};

type GmailDraft = {
  id?: string | null;
  messageId?: string | null;
  threadId?: string | null;
  subject: string;
  to?: string | null;
  date?: string | null;
  snippet?: string | null;
};

type GithubRepository = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description?: string | null;
  language?: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt?: string | null;
  updatedAt?: string | null;
};

type GithubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  updatedAt?: string | null;
  repositoryFullName?: string | null;
  author?: string | null;
  labels: string[];
};

type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  updatedAt?: string | null;
  repositoryFullName: string;
  author?: string | null;
  draft: boolean;
};

type Briefing = {
  localTime: string;
  focus: RelayTask | null;
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
  github?: {
    configured: boolean;
    connected: boolean;
    login: string | null;
    name: string | null;
    email: string | null;
  };
  calendar: {
    ok: boolean;
    reason?: string;
    events: CalendarEvent[];
  };
  drive: {
    ok: boolean;
    reason?: string;
    files: DriveFile[];
  };
  googleTasks?: {
    ok: boolean;
    reason?: string;
    taskLists: Array<{ id?: string | null; title: string }>;
    tasks: GoogleTask[];
  };
  gmail?: {
    ok: boolean;
    reason?: string;
    messages: GmailMessage[];
  };
  gmailDrafts?: {
    ok: boolean;
    reason?: string;
    drafts: GmailDraft[];
  };
  scheduledEmails?: ScheduledEmail[];
  githubRepositories?: {
    ok: boolean;
    reason?: string;
    repositories: GithubRepository[];
  };
  githubIssues?: {
    ok: boolean;
    reason?: string;
    issues: GithubIssue[];
  };
  githubPullRequests?: {
    ok: boolean;
    reason?: string;
    pullRequests: GithubPullRequest[];
  };
};

type GeneratedSurface = "schedule" | "task" | "files" | "memory" | "email";
type ContextWorkspaceMode =
  | "focus"
  | "calendar"
  | "tasks"
  | "files"
  | "github"
  | "memory"
  | "email";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  surface?: GeneratedSurface;
  surfaceStatus?: "active" | "done";
  toolSummary?: string;
  toolLink?: string | null;
};

type AssistantEndpointResponse = {
  role?: "assistant";
  content?: string;
  aiUsed?: boolean;
};

type Toast = {
  id: string;
  title: string;
  detail?: string;
  tone: "success" | "info" | "warning";
};

type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "github", label: "GitHub", icon: GitBranch },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "integrations", label: "Integrations", icon: Cloud },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

const starterMessages: Message[] = [
  {
    id: "m-start",
    role: "assistant",
    content:
      "Good evening. I am connected to your configured AI provider when available, with local tools for tasks, notes, OAuth status, calendar checks, and generated work surfaces.",
    timestamp: "Now",
  },
];

const quickPrompts = [
  "Plan my day",
  "Schedule a meeting",
  "Draft a follow-up email",
  "List recent Drive files",
  "Remember a preference",
];

const integrationRows = [
  { name: "Google Calendar", icon: CalendarDays, provider: "Google", implemented: true },
  { name: "Gmail", icon: Mail, provider: "Google", implemented: true },
  { name: "Google Drive", icon: FolderOpen, provider: "Google", implemented: true },
  { name: "Google Tasks", icon: ListTodo, provider: "Google", implemented: true },
  { name: "Contacts", icon: Users, provider: "Google", implemented: false },
  { name: "GitHub", icon: GitBranch, provider: "GitHub", implemented: true },
  { name: "Slack", icon: MessageSquare, provider: "Not installed", implemented: false },
  { name: "OpenWeather", icon: Globe, provider: "Not installed", implemented: false },
];

const panelClass =
  "rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] transition duration-300 ease-out";
const softPanelClass =
  "rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] transition duration-300 ease-out";
const iconButtonClass =
  "interactive-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]";
const primaryButtonClass =
  "shine-button inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "interactive-control inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function nowLabel() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function formatEventTime(value?: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFileTime(value?: string | null) {
  if (!value) return "Modified time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Modified time unavailable";

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / 86_400_000),
    "day",
  );
}

function driveFileType(mimeType: string) {
  if (mimeType.includes("document")) return "Docs";
  if (mimeType.includes("spreadsheet")) return "Sheets";
  if (mimeType.includes("presentation")) return "Slides";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("folder")) return "Folder";
  return "File";
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function DriveFileGlyph({
  className,
  mimeType,
}: {
  className: string;
  mimeType: string;
}) {
  if (mimeType.includes("spreadsheet")) return <FileSpreadsheet className={className} />;
  if (mimeType.includes("presentation")) return <Columns3 className={className} />;
  if (mimeType.includes("folder")) return <FolderOpen className={className} />;
  return <FileText className={className} />;
}

export function AssistantOS() {
  const [stage, setStage] = useState<AppStage>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [activeView, setActiveView] = useState<ViewId>("chat");
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [tasks, setTasks] = useState<RelayTask[]>([]);
  const [taskColumns, setTaskColumns] = useState<TaskColumn[]>([]);
  const [notes, setNotes] = useState<RelayNote[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [passwordAuth, setPasswordAuth] = useState<PasswordAuthStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: RelayTask;
  } | null>(null);

  const signedInToGoogle = Boolean(oauthStatus?.hasDirectGoogleToken);
  const signedInToGithub = Boolean(oauthStatus?.github?.connected);
  const signedInWithPassword = Boolean(passwordAuth?.authenticated);
  const githubConfigured = Boolean(oauthStatus?.github?.configured);
  const googleConfigured = Boolean(
    oauthStatus?.hasGoogleOAuthConfig && oauthStatus.hasNextAuthSecret,
  );
  const openTasks = tasks.filter((task) => !task.completed);

  useEffect(() => {
    refreshWorkspace().catch(() => undefined);

    const params = new URLSearchParams(window.location.search);
    if (params.get("googleOAuth") === "connected") {
      window.setTimeout(() => {
        setStage("workspace");
        addToast("Google connected", "Workspace permissions are ready.", "success");
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const googleOAuthError = params.get("googleOAuthError");
    if (googleOAuthError) {
      window.setTimeout(() => {
        addToast("Google OAuth failed", googleOAuthError, "warning");
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (params.get("githubOAuth") === "connected") {
      window.setTimeout(() => {
        setStage("workspace");
        addToast("GitHub connected", "Repository context is ready.", "success");
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const githubOAuthError = params.get("githubOAuthError");
    if (githubOAuthError) {
      window.setTimeout(() => {
        addToast("GitHub OAuth failed", githubOAuthError, "warning");
      }, 0);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    function handleKeydown(event: globalThis.KeyboardEvent) {
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (key === "escape") {
        setCommandOpen(false);
        setContextMenu(null);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  function addToast(title: string, detail: string | undefined, tone: Toast["tone"]) {
    const id = createId("toast");
    setToasts((current) => [...current, { id, title, detail, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  async function refreshWorkspace() {
    const [tasksResponse, notesResponse, oauthResponse, passwordResponse, briefingResponse, aiResponse] =
      await Promise.all([
        fetch("/api/local-tools/tasks"),
        fetch("/api/local-tools/notes"),
        fetch("/api/oauth/status"),
        fetch("/api/auth/password/status"),
        fetch("/api/local-tools/briefing"),
        fetch("/api/ai/status"),
      ]);

    const tasksData = (await tasksResponse.json()) as {
      tasks: RelayTask[];
      columns?: TaskColumn[];
    };
    const notesData = (await notesResponse.json()) as { notes: RelayNote[] };
    const oauthData = (await oauthResponse.json()) as OAuthStatus;
    const passwordData = (await passwordResponse.json()) as PasswordAuthStatus;
    const briefingData = (await briefingResponse.json()) as Briefing;
    const aiData = (await aiResponse.json()) as AiStatus;

    setTasks(tasksData.tasks);
    setTaskColumns(tasksData.columns ?? []);
    setNotes(notesData.notes);
    setOauthStatus(oauthData);
    setPasswordAuth(passwordData);
    setBriefing(briefingData);
    setAiStatus(aiData);
  }

  async function addTask(input: AddTaskInput) {
    const parsed = typeof input === "string" ? { title: input } : input;
    const trimmed = parsed.title.trim();
    if (!trimmed) return;

    await fetch("/api/local-tools/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        title: trimmed,
        notes: parsed.notes,
        due: parsed.due,
        priority: parsed.priority,
        columnId: parsed.columnId,
      }),
    });
    await refreshWorkspace();
    addToast("Task created", trimmed, "success");
  }

  async function completeTask(task: RelayTask) {
    await fetch("/api/local-tools/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", identifier: task.id }),
    });
    await refreshWorkspace();
    addToast("Task completed", task.title, "success");
  }

  async function addMemory(body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;

    await fetch("/api/local-tools/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", body: trimmed }),
    });
    await refreshWorkspace();
    addToast("Memory saved", "Stored in local notes.", "success");
  }

function completeSurfaceMessage(messageId: string, summary: string, link?: string | null) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: link ? `✓ [${summary}](${link})` : `✓ ${summary}`,
              surfaceStatus: "done",
              toolSummary: undefined,
              toolLink: null,
            }
          : message,
      ),
    );
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>, overrideMessage?: string) {
    event?.preventDefault();
    const message = (overrideMessage ?? input).trim();
    if (!message || agentLoading) return;

    if (!overrideMessage) setInput("");
    setActiveView("chat");
    setAgentLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: createId("user"),
        role: "user",
        content: message,
        timestamp: nowLabel(),
      },
    ]);

    const surface = inferGeneratedSurface(message);

    try {
      let responseOk = false;
      let responseStatus = 0;
      let data: AssistantEndpointResponse | null = null;

      try {
        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: [
              ...messages.slice(-14).map((item) => ({
                role: item.role,
                content: item.toolSummary
                  ? `${item.content} ${item.toolSummary}`.trim()
                  : item.content,
              })),
              { role: "user", content: message },
            ],
          }),
        });
        responseOk = response.ok;
        responseStatus = response.status;
        data = await readJsonResponse<AssistantEndpointResponse>(response);
      } catch (error) {
        data = {
          content:
            error instanceof Error
              ? `AI endpoint request failed: ${error.message}`
              : "AI endpoint request failed before it returned a response.",
          aiUsed: false,
        };
      }

      if (!responseOk || data?.aiUsed === false || !data) {
        const fallbackResponse = await fetch("/api/local-agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const fallbackData = await readJsonResponse<AssistantEndpointResponse>(fallbackResponse);

        if (!fallbackResponse.ok || !fallbackData?.content) {
          throw new Error(
            fallbackData?.content ??
              `Local fallback failed with HTTP ${fallbackResponse.status}.`,
          );
        }

        setMessages((current) => [
          ...current,
          {
            id: createId("assistant"),
            role: "assistant",
            content: [
              data?.content
                ? `Provider status: ${data.content}`
                : responseStatus
                  ? `Provider status: AI endpoint returned HTTP ${responseStatus} without JSON.`
                  : "Provider status: AI endpoint did not respond.",
              `Local fallback: ${fallbackData.content}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
            timestamp: nowLabel(),
          },
          ...(surface
            ? [
                {
                  id: createId("surface"),
                  role: "assistant" as const,
                  content: "",
                  timestamp: nowLabel(),
                  surface,
                  surfaceStatus: "active" as const,
                },
              ]
            : []),
        ]);

        return;
      }

      if (!data?.content) {
        throw new Error(
          responseStatus
            ? `AI endpoint returned HTTP ${responseStatus} without content.`
            : "AI endpoint returned no content.",
        );
      }
      const assistantContent = data.content;

      setMessages((current) => [
        ...current,
        ...(surface
          ? []
          : [
              {
                id: createId("assistant"),
                role: "assistant" as const,
                content: assistantContent,
                timestamp: nowLabel(),
              },
            ]),
        ...(surface
          ? [
              {
                id: createId("surface"),
                role: "assistant" as const,
                content: "",
                timestamp: nowLabel(),
                surface,
                surfaceStatus: "active" as const,
              },
            ]
          : []),
      ]);

      if (message.toLowerCase().startsWith("add task ")) {
        await refreshWorkspace();
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          content:
            "The local agent endpoint did not respond. The dashboard is still available in local mode.",
          timestamp: nowLabel(),
        },
      ]);
    } finally {
      setAgentLoading(false);
    }
  }

  function runPrompt(prompt: string) {
    setInput("");
    void submitMessage(undefined, prompt);
  }

  function enterAfterAuth() {
    setStage(signedInToGoogle ? "workspace" : "onboarding");
  }

  function connectGoogle() {
    window.location.href = "/api/google/oauth/start";
  }

  function disconnectGoogle() {
    fetch("/api/google/oauth/disconnect", { method: "POST" })
      .then(() => refreshWorkspace())
      .then(() => addToast("Google disconnected", "OAuth tokens were removed.", "info"))
      .catch(() => addToast("Disconnect failed", "Try again from Integrations.", "warning"));
  }

  function connectGithub() {
    window.location.href = "/api/github/oauth/start";
  }

  function disconnectGithub() {
    fetch("/api/github/oauth/disconnect", { method: "POST" })
      .then(() => refreshWorkspace())
      .then(() => addToast("GitHub disconnected", "OAuth tokens were removed.", "info"))
      .catch(() => addToast("Disconnect failed", "Try again from Integrations.", "warning"));
  }

  async function handlePasswordAuthenticated(detail?: string) {
    await refreshWorkspace();
    setStage("workspace");
    addToast("Signed in", detail ?? "Email session is active.", "success");
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/password/logout", { method: "POST" });
      await refreshWorkspace();
      setStage("auth");
      setAuthMode("login");
      addToast("Signed out", "Email/password session was cleared on this device.", "info");
    } catch {
      addToast("Sign out failed", "Try again from Profile.", "warning");
    }
  }

  const commandActions = [
    {
      label: "Open dashboard",
      icon: LayoutDashboard,
      run: () => setActiveView("dashboard"),
    },
    {
      label: "Open chat",
      icon: MessageSquare,
      run: () => setActiveView("chat"),
    },
    {
      label: "Plan a meeting",
      icon: CalendarDays,
      run: () => runPrompt("Schedule a meeting"),
    },
    {
      label: "Create task",
      icon: ListTodo,
      run: () => runPrompt("add task Review weekly priorities"),
    },
    {
      label: "Check OAuth status",
      icon: ShieldCheck,
      run: () => runPrompt("OAuth status"),
    },
    {
      label: "Review GitHub",
      icon: GitBranch,
      run: () => runPrompt("Summarize my GitHub repositories, issues, and pull requests"),
    },
    {
      label: "Open integrations",
      icon: Cloud,
      run: () => setActiveView("integrations"),
    },
    {
      label: "Open profile",
      icon: User,
      run: () => setActiveView("profile"),
    },
  ];

  const shared = {
    theme,
    setTheme,
    oauthStatus,
    aiStatus,
    googleConfigured,
    githubConfigured,
    signedInToGoogle,
    signedInToGithub,
    signedInWithPassword,
    passwordAuth,
    connectGoogle,
    disconnectGoogle,
    connectGithub,
    disconnectGithub,
    enterAfterAuth,
    onPasswordAuthenticated: handlePasswordAuthenticated,
  };

  return (
    <div
      className="assistant-shell min-h-screen bg-[var(--app-bg)] text-[var(--text)] transition-colors duration-300"
      data-theme={theme}
      onClick={() => setContextMenu(null)}
    >
      {stage === "auth" ? (
        <AuthExperience
          {...shared}
          authMode={authMode}
          setAuthMode={setAuthMode}
        />
      ) : null}

      {stage === "onboarding" ? (
        <OnboardingExperience
          {...shared}
          continueLocal={() => setStage("workspace")}
          refreshWorkspace={refreshWorkspace}
        />
      ) : null}

      {stage === "workspace" ? (
        <WorkspaceExperience
          activeView={activeView}
          addMemory={addMemory}
          addTask={addTask}
          aiStatus={aiStatus}
          briefing={briefing}
          completeSurfaceMessage={completeSurfaceMessage}
          completeTask={completeTask}
          connectGithub={connectGithub}
          connectGoogle={connectGoogle}
          disconnectGithub={disconnectGithub}
          disconnectGoogle={disconnectGoogle}
          githubConfigured={githubConfigured}
          googleConfigured={googleConfigured}
          input={input}
          messages={messages}
          notes={notes}
          oauthStatus={oauthStatus}
          onSignOut={handleSignOut}
          openTasks={openTasks}
          passwordAuth={passwordAuth}
          refreshWorkspace={refreshWorkspace}
          runPrompt={runPrompt}
          setActiveView={setActiveView}
          setCommandOpen={setCommandOpen}
          setContextMenu={setContextMenu}
          setInput={setInput}
          setSidebarOpen={setSidebarOpen}
          setTheme={setTheme}
          sidebarOpen={sidebarOpen}
          signedInToGithub={signedInToGithub}
          signedInToGoogle={signedInToGoogle}
          submitMessage={submitMessage}
          taskColumns={taskColumns}
          tasks={tasks}
          theme={theme}
          loading={agentLoading}
        />
      ) : null}

      <CommandPalette
        actions={commandActions}
        open={commandOpen}
        setOpen={setCommandOpen}
      />

      <ToastStack toasts={toasts} />

      {contextMenu ? (
        <TaskContextMenu
          contextMenu={contextMenu}
          onComplete={() => completeTask(contextMenu.task)}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
}

function AuthExperience({
  authMode,
  setAuthMode,
  setTheme,
  theme,
  aiStatus,
  oauthStatus,
  googleConfigured,
  passwordAuth,
  signedInToGoogle,
  signedInWithPassword,
  connectGoogle,
  enterAfterAuth,
  onPasswordAuthenticated,
}: {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
  aiStatus: AiStatus | null;
  oauthStatus: OAuthStatus | null;
  googleConfigured: boolean;
  passwordAuth: PasswordAuthStatus | null;
  signedInToGoogle: boolean;
  signedInWithPassword: boolean;
  connectGoogle: () => void;
  enterAfterAuth: () => void;
  onPasswordAuthenticated: (detail?: string) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const formEmail = String(form.get("email") ?? email).trim();
    const formPassword = String(form.get("password") ?? "");
    const formCode = String(form.get("code") ?? code).trim();
    const formName = String(form.get("name") ?? name).trim();

    setSubmitting(true);
    setAuthNotice(null);
    setDevCode(null);

    try {
      const endpoint =
        authMode === "login"
          ? "/api/auth/password/login"
          : authMode === "signup"
            ? "/api/auth/password/signup"
            : authMode === "forgot"
              ? formCode && formPassword
                ? "/api/auth/password/reset"
                : "/api/auth/password/forgot"
              : "/api/auth/password/verify";
      const body =
        authMode === "login"
          ? { email: formEmail, password: formPassword, remember }
          : authMode === "signup"
            ? { email: formEmail, password: formPassword, name: formName }
            : authMode === "forgot"
              ? formCode && formPassword
                ? { email: formEmail, code: formCode, password: formPassword, remember }
                : { email: formEmail }
              : { email: formEmail, code: formCode, remember };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        user?: { email: string };
        verificationRequired?: boolean;
        devVerificationCode?: string | null;
        devResetCode?: string | null;
      };

      if (response.ok && data.ok && authMode === "login") {
        await onPasswordAuthenticated(`Signed in as ${data.user?.email ?? formEmail}.`);
        return;
      }

      if (response.ok && data.ok && authMode === "signup") {
        setAuthMode("verify");
        setDevCode(data.devVerificationCode ?? null);
        setAuthNotice("Account created. Enter the verification code to activate it.");
        return;
      }

      if (response.ok && data.ok && authMode === "forgot") {
        if (data.user) {
          await onPasswordAuthenticated(`Password reset for ${data.user.email ?? formEmail}.`);
          return;
        }
        setDevCode(data.devResetCode ?? null);
        setAuthNotice(
          data.devResetCode
            ? "Reset code generated. Enter it with your new password."
            : "If an account exists, a reset code has been prepared.",
        );
        return;
      }

      if (response.ok && data.ok && authMode === "verify") {
        await onPasswordAuthenticated(`Verified and signed in as ${data.user?.email ?? formEmail}.`);
        return;
      }

      if (data.verificationRequired) {
        setAuthMode("verify");
        setDevCode(data.devVerificationCode ?? null);
      }
      setAuthNotice(data.reason ?? "Authentication failed.");
    } catch (error) {
      setAuthNotice(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(420px,0.85fr)_1.15fr]">
      <section className="flex min-h-screen flex-col justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <BrandMark />
          <button
            className={iconButtonClass}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="button"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              Executive workspace
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Sign in to your AI operating system.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              One secure workspace for chat, scheduling, memory, files, tasks, and
              approvals.
            </p>
          </div>

          <div className={panelClass}>
            <div className="grid grid-cols-4 border-b border-[var(--line)] text-sm font-semibold">
              {(["login", "signup", "forgot", "verify"] as AuthMode[]).map((mode) => (
                <button
                  className={`h-12 border-b-2 px-2 transition ${
                    authMode === mode
                      ? "border-[var(--accent)] text-[var(--text)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                  key={mode}
                  onClick={() => {
                    setAuthMode(mode);
                    setAuthNotice(null);
                    setDevCode(null);
                  }}
                  type="button"
                >
                  {authLabel(mode)}
                </button>
              ))}
            </div>

            <form className="space-y-4 p-5" onSubmit={submit}>
              {authMode === "signup" ? (
                <Field
                  label="Full name"
                  name="name"
                  onChange={setName}
                  placeholder="Alex Morgan"
                  value={name}
                />
              ) : null}

              <Field
                autoComplete="email"
                label="Email"
                name="email"
                onChange={setEmail}
                placeholder="you@company.com"
                type="email"
                value={email}
              />

              {authMode === "verify" || authMode === "forgot" ? (
                <Field
                  label={authMode === "forgot" ? "Reset code" : "Verification code"}
                  name="code"
                  onChange={setCode}
                  placeholder="284991"
                  value={code}
                />
              ) : null}

              {authMode === "login" || authMode === "signup" || authMode === "forgot" ? (
                <Field label="Password" name="password" placeholder="••••••••••" type="password" />
              ) : null}

              {authMode === "login" ? (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex items-center gap-2 text-[var(--muted)]">
                    <input
                      checked={remember}
                      className="h-4 w-4 accent-[var(--accent)]"
                      onChange={(event) => setRemember(event.target.checked)}
                      type="checkbox"
                    />
                    Remember me
                  </label>
                  <button
                    className="font-semibold text-[var(--accent)]"
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthNotice(null);
                    }}
                    type="button"
                  >
                    Forgot password
                  </button>
                </div>
              ) : null}

              <button className={`${primaryButtonClass} w-full`} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {authActionLabel(authMode)}
              </button>
              {authNotice ? (
                <p className="rounded-md border border-[var(--warning)] bg-[var(--warning-soft)] px-3 py-2 text-sm font-medium text-[var(--warning)]">
                  {authNotice}
                </p>
              ) : null}
              {devCode ? (
                <p className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
                  Development code: <span className="font-mono font-semibold text-[var(--text)]">{devCode}</span>
                </p>
              ) : null}
              {signedInWithPassword ? (
                <p className="rounded-md border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2 text-sm font-medium text-[var(--success)]">
                  Signed in as {passwordAuth?.user?.email ?? "email user"}.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={secondaryButtonClass}
                  disabled={!googleConfigured && !signedInToGoogle}
                  onClick={connectGoogle}
                  type="button"
                >
                  <Globe className="h-4 w-4" />
                  Google
                </button>
                <button className={secondaryButtonClass} onClick={enterAfterAuth} type="button">
                  <Sparkles className="h-4 w-4" />
                  Local mode
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="text-xs text-[var(--muted)]">
          Email/password uses hashed local credentials and an HTTP-only session cookie.
          Codes are displayed in development until an email sender is configured.
        </div>
      </section>

      <section className="hidden min-h-screen border-l border-[var(--line)] bg-[var(--surface-soft)] p-6 lg:block">
        <div className="grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-strong)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Relay Command Center</p>
              <p className="text-xs text-[var(--muted)]">Current setup status</p>
            </div>
            <StatusBadge
              ready={signedInToGoogle}
              label={signedInToGoogle ? "Google connected" : "Not connected"}
            />
          </div>

          <div className="grid grid-cols-[0.95fr_1.05fr] gap-5 p-5">
            <div className="space-y-4">
              <PreviewMetric
                icon={CalendarDays}
                label="Google OAuth"
                value={
                  signedInToGoogle
                    ? "Connected"
                    : googleConfigured
                      ? "Configured"
                      : "Missing env"
                }
              />
              <PreviewMetric
                icon={Bot}
                label="AI provider"
                value={aiStatus?.configured ? `${aiStatus.label} key set` : "Missing key"}
              />
              <PreviewMetric icon={ListTodo} label="Local tools" value="Available" />
              <div className={softPanelClass + " p-4"}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">Required env checks</span>
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                </div>
                {(oauthStatus?.checks ?? []).map((check) => (
                  <div className="mb-3 flex items-center gap-3" key={check.label}>
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${
                        check.ready
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-[var(--warning-soft)] text-[var(--warning)]"
                      }`}
                    >
                      {check.ready ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{check.label}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{check.where}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={softPanelClass + " flex flex-col overflow-hidden"}>
              <div className="border-b border-[var(--line)] px-4 py-3 text-sm font-semibold">
                Available actions
              </div>
              <div className="space-y-4 p-4">
                <MiniControl label="Chat" value={aiStatus?.configured ? "Provider key set" : "Local fallback only"} />
                <MiniControl label="Calendar" value={signedInToGoogle ? "Can read/create" : "Connect Google first"} />
                <MiniControl label="Drive" value={signedInToGoogle ? "Can list files" : "Connect Google first"} />
                <MiniControl label="Memory" value="Local notes store" />
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">Security</span>
                    <LockKeyhole className="h-4 w-4 text-[var(--success)]" />
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    High-impact actions require a click confirmation and server-side credentials.
                  </p>
                </div>
                <button className={`${primaryButtonClass} w-full`} onClick={enterAfterAuth} type="button">
                  Enter workspace
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 border-t border-[var(--line)] p-5">
            {["Calendar", "Drive", "Gmail", "Memory"].map((item) => (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-4 text-center text-sm font-semibold" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function OnboardingExperience({
  theme,
  setTheme,
  oauthStatus,
  aiStatus,
  googleConfigured,
  signedInToGoogle,
  connectGoogle,
  continueLocal,
  refreshWorkspace,
}: {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  oauthStatus: OAuthStatus | null;
  aiStatus: AiStatus | null;
  googleConfigured: boolean;
  signedInToGoogle: boolean;
  connectGoogle: () => void;
  continueLocal: () => void;
  refreshWorkspace: () => Promise<void>;
}) {
  const permissionGroups = [
    {
      label: "Identity",
      detail: oauthStatus?.googleEmail ?? "Google profile and account email",
      icon: User,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Connected" : "Pending",
    },
    {
      label: "Calendar",
      detail: "Events, availability, Meet links, reminders",
      icon: CalendarDays,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Connected" : "Pending",
    },
    {
      label: "Drive and Docs",
      detail: "List and open recent Drive files. Document parsing is not connected yet.",
      icon: FolderOpen,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Connected" : "Pending",
    },
    {
      label: "Gmail",
      detail: "Inbox search, drafts, replies, labels, archive, star, trash, and confirmed sends.",
      icon: Mail,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Ready" : "Pending",
    },
    {
      label: "Tasks and Contacts",
      detail: "Local tasks and Google Tasks are implemented. Contacts are read-scope only for now.",
      icon: Users,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Tasks ready" : "Pending",
    },
    {
      label: "AI provider",
      detail: aiStatus?.configured
        ? `${aiStatus.label} ${aiStatus.modelId}`
        : "Local mode until an API key is added",
      icon: Bot,
      ready: Boolean(aiStatus?.configured),
      status: aiStatus?.configured ? "Key present" : "Missing key",
    },
  ];

  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-3">
            <button
              className={iconButtonClass}
              onClick={() => refreshWorkspace()}
              type="button"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              className={iconButtonClass}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className={`${panelClass} p-6`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--muted)]">
              <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent)]" />
              Onboarding
            </div>
            <h1 className="text-4xl font-semibold leading-tight">
              Connect the services your assistant can operate.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              The assistant runs in local mode now and upgrades to Google Workspace
              actions after OAuth consent.
            </p>

            <div className="mt-6 space-y-3">
              {(oauthStatus?.checks ?? []).map((check) => (
                <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3" key={check.label}>
                  <div>
                    <p className="text-sm font-semibold">{check.label}</p>
                    <p className="text-xs text-[var(--muted)]">{check.where}</p>
                  </div>
                  <StatusBadge ready={check.ready} label={check.ready ? "Ready" : "Missing"} />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className={primaryButtonClass}
                disabled={!googleConfigured && !signedInToGoogle}
                onClick={connectGoogle}
                type="button"
              >
                <Link2 className="h-4 w-4" />
                {signedInToGoogle ? "Reconnect Google" : "Connect Google"}
              </button>
              <button className={secondaryButtonClass} onClick={continueLocal} type="button">
                Continue in local mode
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {permissionGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article className={`${panelClass} p-5`} key={group.label}>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <StatusBadge ready={group.ready} label={group.status} />
                  </div>
                  <h2 className="text-lg font-semibold">{group.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{group.detail}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkspaceExperience({
  activeView,
  addMemory,
  addTask,
  aiStatus,
  briefing,
  completeSurfaceMessage,
  completeTask,
  connectGithub,
  connectGoogle,
  disconnectGithub,
  disconnectGoogle,
  githubConfigured,
  googleConfigured,
  input,
  loading,
  messages,
  notes,
  oauthStatus,
  onSignOut,
  openTasks,
  passwordAuth,
  refreshWorkspace,
  runPrompt,
  setActiveView,
  setCommandOpen,
  setContextMenu,
  setInput,
  setSidebarOpen,
  setTheme,
  sidebarOpen,
  signedInToGithub,
  signedInToGoogle,
  submitMessage,
  taskColumns,
  tasks,
  theme,
}: {
  activeView: ViewId;
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  aiStatus: AiStatus | null;
  briefing: Briefing | null;
  completeSurfaceMessage: (messageId: string, summary: string, link?: string | null) => void;
  completeTask: (task: RelayTask) => Promise<void>;
  connectGithub: () => void;
  connectGoogle: () => void;
  disconnectGithub: () => void;
  disconnectGoogle: () => void;
  githubConfigured: boolean;
  googleConfigured: boolean;
  input: string;
  loading: boolean;
  messages: Message[];
  notes: RelayNote[];
  oauthStatus: OAuthStatus | null;
  onSignOut: () => Promise<void>;
  openTasks: RelayTask[];
  passwordAuth: PasswordAuthStatus | null;
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  setActiveView: (view: ViewId) => void;
  setCommandOpen: (open: boolean) => void;
  setContextMenu: (menu: { x: number; y: number; task: RelayTask } | null) => void;
  setInput: (value: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  sidebarOpen: boolean;
  signedInToGithub: boolean;
  signedInToGoogle: boolean;
  submitMessage: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
  theme: ThemeMode;
}) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const showGlobalRightSidebar = false;

  return (
    <div
      className="min-h-screen transition-[grid-template-columns] duration-300 ease-out lg:grid"
      style={{
        gridTemplateColumns: showGlobalRightSidebar
          ? `${navCollapsed ? 76 : sidebarWidth}px minmax(0,1fr) 340px`
          : `${navCollapsed ? 76 : sidebarWidth}px minmax(0,1fr)`,
      }}
    >
      <Sidebar
        activeView={activeView}
        collapsed={navCollapsed}
        mobileOpen={sidebarOpen}
        onToggleCollapsed={() => setNavCollapsed((current) => !current)}
        setDesktopWidth={setSidebarWidth}
        setActiveView={setActiveView}
        setMobileOpen={setSidebarOpen}
        width={sidebarWidth}
      />

      <main className="min-w-0 border-l border-[var(--line)]">
        <TopBar
          activeView={activeView}
          aiStatus={aiStatus}
          connectGoogle={connectGoogle}
          googleConfigured={googleConfigured}
          setCommandOpen={setCommandOpen}
          setSidebarOpen={setSidebarOpen}
          setTheme={setTheme}
          signedInToGoogle={signedInToGoogle}
          theme={theme}
        />

        <div className={activeView === "chat" ? "p-3 sm:p-4" : "p-5 sm:p-7 xl:p-9"}>
          {activeView === "dashboard" ? (
            <DashboardView
              briefing={briefing}
              completeTask={completeTask}
              notes={notes}
              openTasks={openTasks}
              runPrompt={runPrompt}
              setActiveView={setActiveView}
              tasks={tasks}
            />
          ) : null}

          {activeView === "chat" ? (
            <ChatView
              addMemory={addMemory}
              addTask={addTask}
              briefing={briefing}
              completeSurfaceMessage={completeSurfaceMessage}
              completeTask={completeTask}
              input={input}
              loading={loading}
              messages={messages}
              notes={notes}
              openTasks={openTasks}
              refreshWorkspace={refreshWorkspace}
              runPrompt={runPrompt}
              setInput={setInput}
              signedInToGoogle={signedInToGoogle}
              submitMessage={submitMessage}
              taskColumns={taskColumns}
              tasks={tasks}
            />
          ) : null}

          {activeView === "calendar" ? (
            <CalendarView
              briefing={briefing}
              refreshWorkspace={refreshWorkspace}
            />
          ) : null}

          {activeView === "tasks" ? (
            <TasksView
              addTask={addTask}
              briefing={briefing}
              completeTask={completeTask}
              openTasks={openTasks}
              refreshWorkspace={refreshWorkspace}
              setContextMenu={setContextMenu}
              taskColumns={taskColumns}
              tasks={tasks}
            />
          ) : null}

          {activeView === "files" ? <FilesView briefing={briefing} runPrompt={runPrompt} /> : null}

          {activeView === "github" ? (
            <GithubView briefing={briefing} runPrompt={runPrompt} signedInToGithub={signedInToGithub} />
          ) : null}

          {activeView === "memory" ? (
            <MemoryView addMemory={addMemory} notes={notes} />
          ) : null}

          {activeView === "integrations" ? (
            <IntegrationsView
              connectGithub={connectGithub}
              connectGoogle={connectGoogle}
              disconnectGithub={disconnectGithub}
              disconnectGoogle={disconnectGoogle}
              githubConfigured={githubConfigured}
              googleConfigured={googleConfigured}
              oauthStatus={oauthStatus}
              signedInToGithub={signedInToGithub}
              signedInToGoogle={signedInToGoogle}
            />
          ) : null}

          {activeView === "profile" ? (
            <ProfileView
              connectGithub={connectGithub}
              connectGoogle={connectGoogle}
              disconnectGithub={disconnectGithub}
              disconnectGoogle={disconnectGoogle}
              googleConfigured={googleConfigured}
              githubConfigured={githubConfigured}
              oauthStatus={oauthStatus}
              onSignOut={onSignOut}
              passwordAuth={passwordAuth}
              refreshWorkspace={refreshWorkspace}
              signedInToGithub={signedInToGithub}
              signedInToGoogle={signedInToGoogle}
            />
          ) : null}

          {activeView === "settings" ? (
            <SettingsView aiStatus={aiStatus} oauthStatus={oauthStatus} />
          ) : null}
        </div>
      </main>

      {showGlobalRightSidebar ? (
        <RightSidebar
          aiStatus={aiStatus}
          briefing={briefing}
          oauthStatus={oauthStatus}
          openTasks={openTasks}
          signedInToGoogle={signedInToGoogle}
        />
      ) : null}
    </div>
  );
}

function Sidebar({
  activeView,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  setActiveView,
  setDesktopWidth,
  setMobileOpen,
  width,
}: {
  activeView: ViewId;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  setActiveView: (view: ViewId) => void;
  setDesktopWidth: (width: number) => void;
  setMobileOpen: (open: boolean) => void;
  width: number;
}) {
  const content = (
    <aside className={`sidebar-shell relative flex h-full flex-col bg-[var(--sidebar)] py-5 transition-all duration-300 ease-out ${collapsed ? "px-3" : "px-4"}`}>
      <div className="mb-8 flex items-center justify-between">
        {collapsed ? (
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            R
          </span>
        ) : (
          <BrandMark />
        )}
        <button
          className="hidden h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)] lg:inline-flex"
          onClick={onToggleCollapsed}
          type="button"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Columns3 className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              className={`nav-item flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                active
                  ? "is-active bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
              } ${collapsed ? "justify-center px-0" : ""}`}
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setMobileOpen(false);
              }}
              type="button"
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {collapsed ? null : item.label}
            </button>
          );
        })}
      </nav>

      {collapsed ? null : (
        <div className={`${softPanelClass} mt-auto p-4`}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-[var(--warning)]" />
          Automation guard
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Sends, deletes, permission changes, and shared-doc edits require approval.
        </p>
        </div>
      )}
      {!collapsed ? (
        <input
          aria-label="Resize sidebar"
          className="absolute right-1 top-1/2 hidden h-28 w-1 -translate-y-1/2 cursor-ew-resize appearance-none rounded-full bg-[var(--line-strong)] opacity-0 transition hover:opacity-100 lg:block"
          max={360}
          min={220}
          onChange={(event) => setDesktopWidth(Number(event.target.value))}
          title="Resize sidebar"
          type="range"
          value={width}
        />
      ) : null}
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {mobileOpen ? (
        <div className="mobile-sidebar-backdrop fixed inset-0 z-40 bg-black/40 lg:hidden">
          <div className="mobile-sidebar-panel h-full w-[280px]">{content}</div>
        </div>
      ) : null}
    </>
  );
}

function TopBar({
  activeView,
  aiStatus,
  connectGoogle,
  googleConfigured,
  setCommandOpen,
  setSidebarOpen,
  setTheme,
  signedInToGoogle,
  theme,
}: {
  activeView: ViewId;
  aiStatus: AiStatus | null;
  connectGoogle: () => void;
  googleConfigured: boolean;
  setCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  signedInToGoogle: boolean;
  theme: ThemeMode;
}) {
  const navItem = navItems.find((item) => item.id === activeView);
  const ActiveIcon = navItem?.icon;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-glass)] px-4 backdrop-blur-xl sm:px-5 xl:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className={iconButtonClass + " lg:hidden"}
          onClick={() => setSidebarOpen(true)}
          type="button"
          title="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {ActiveIcon ? <ActiveIcon className="h-4 w-4 text-[var(--accent)]" /> : null}
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {navItem?.label ?? "Workspace"}
            </h1>
          </div>
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            {aiStatus?.configured
              ? `${aiStatus.label} key set`
              : "Local agent active"}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <button
          className="hidden h-10 min-w-0 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--line-strong)] sm:inline-flex lg:w-72"
          onClick={() => setCommandOpen(true)}
          type="button"
        >
          <Search className="h-4 w-4" />
          <span className="truncate">Search actions, tools, and views</span>
          <Command className="ml-auto h-3.5 w-3.5" />
        </button>
        <button
          className={iconButtonClass}
          onClick={() => setCommandOpen(true)}
          type="button"
          title="Command"
        >
          <Command className="h-4 w-4" />
        </button>
        <button
          className={iconButtonClass}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          type="button"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          className={signedInToGoogle ? secondaryButtonClass : primaryButtonClass}
          disabled={!googleConfigured && !signedInToGoogle}
          onClick={connectGoogle}
          type="button"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{signedInToGoogle ? "Google connected" : "Connect"}</span>
        </button>
      </div>
    </header>
  );
}

function DashboardView({
  briefing,
  completeTask,
  notes,
  openTasks,
  runPrompt,
  setActiveView,
  tasks,
}: {
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  notes: RelayNote[];
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  setActiveView: (view: ViewId) => void;
  tasks: RelayTask[];
}) {
  return (
    <div className="space-y-7 animate-fade-in">
      <WeeklyCommandCalendar
        briefing={briefing}
        completeTask={completeTask}
        notes={notes}
        openTasks={openTasks}
        runPrompt={runPrompt}
        tasks={tasks}
      />

      {!briefing ? <DashboardSkeleton /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.72fr)_minmax(340px,0.72fr)]">
        <InboxHighlights briefing={briefing} runPrompt={runPrompt} />
        <TaskSnapshot
          briefing={briefing}
          completeTask={completeTask}
          openTasks={openTasks}
          runPrompt={runPrompt}
          tasks={tasks}
        />
        <GithubActivityPanel briefing={briefing} runPrompt={runPrompt} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <AiActionPlanner
          briefing={briefing}
          openTasks={openTasks}
          runPrompt={runPrompt}
          setActiveView={setActiveView}
          tasks={tasks}
        />
        <RecentFilesPanel briefing={briefing} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ControlMetric icon={CalendarDays} label="Schedule" value={briefing?.calendar.ok ? `${briefing.calendar.events.length}` : "Off"} detail="upcoming events" />
        <ControlMetric icon={ListTodo} label="Tasks" value={`${openTasks.length}`} detail={`${tasks.length - openTasks.length} completed`} />
        <ControlMetric icon={Mail} label="Inbox" value={briefing?.gmail?.ok ? `${briefing.gmail.messages.length}` : "Off"} detail="recent messages" />
        <ControlMetric icon={GitBranch} label="GitHub" value={briefing?.github?.connected ? `${briefing.githubRepositories?.repositories.length ?? 0}` : "Off"} detail="recent repos" />
        <ControlMetric icon={Brain} label="Memory" value={`${notes.length}`} detail="approved notes" />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-5 md:grid-cols-3">
      {["Focus", "Timeline", "Inbox"].map((item) => (
        <div className={`${softPanelClass} p-5`} key={item}>
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton mt-5 h-8 w-3/4 rounded-lg" />
          <div className="skeleton mt-3 h-4 w-full rounded-full" />
          <div className="skeleton mt-2 h-4 w-2/3 rounded-full" />
        </div>
      ))}
    </section>
  );
}

function WeeklyCommandCalendar({
  briefing,
  completeTask,
  notes,
  openTasks,
  runPrompt,
}: {
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  notes: RelayNote[];
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }, []);
  const events = briefing?.calendar.events ?? [];
  const googleTasks = briefing?.googleTasks?.tasks.filter((task) => task.status !== "completed") ?? [];
  const githubIssues = briefing?.githubIssues?.issues ?? [];

  return (
    <section className={`${panelClass} overflow-visible p-5 sm:p-6`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--muted)]">
            <span className="pulse-dot" />
            Next 7 days
          </div>
          <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            Weekly operating view
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Calendar, task deadlines, reminders, notes, and GitHub activity are grouped by day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={secondaryButtonClass} onClick={() => runPrompt("What should I focus on this week?")} type="button">
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>
          <button className={primaryButtonClass} onClick={() => runPrompt("Schedule a meeting")} type="button">
            <Plus className="h-4 w-4" />
            Add event
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) => sameCalendarDay(parseEventDate(event.start), day));
          const dayTasks = openTasks.filter((task) => sameCalendarDay(parseEventDate(task.due), day));
          const dayGoogleTasks = googleTasks.filter((task) => sameCalendarDay(parseEventDate(task.due), day));
          const dayNotes = notes.filter((note) => sameCalendarDay(parseEventDate(note.createdAt), day));
          const dayIssues = githubIssues.filter((issue) => sameCalendarDay(parseEventDate(issue.updatedAt), day));
          const count = dayEvents.length + dayTasks.length + dayGoogleTasks.length + dayNotes.length + dayIssues.length;
          const isToday = sameCalendarDay(day, new Date());

          return (
            <div className="day-inspector group relative" key={day.toISOString()}>
              <button
                className={`min-h-44 w-full rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow)] ${
                  isToday
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface-soft)] hover:border-[var(--line-strong)]"
                }`}
                onClick={() => runPrompt(`Inspect my schedule and deadlines for ${day.toDateString()}`)}
                type="button"
              >
                <span className="block text-[11px] font-semibold uppercase text-[var(--muted)]">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="mt-1 block text-2xl font-semibold">{day.getDate()}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {day.toLocaleDateString(undefined, { month: "short" })}
                </span>
                <div className="mt-4 space-y-2">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span className="block truncate rounded-lg bg-[var(--surface)] px-2 py-1 text-xs font-semibold" key={event.id ?? `${event.title}-${event.start}`}>
                      {formatEventTime(event.start)} · {event.title}
                    </span>
                  ))}
                  {[...dayTasks, ...dayGoogleTasks].slice(0, 2).map((task) => (
                    <span className="flex items-center gap-2 truncate rounded-lg bg-[var(--surface)] px-2 py-1 text-xs font-semibold" key={task.id ?? task.title}>
                      <PriorityDot priority={"priority" in task ? task.priority : undefined} />
                      {task.title}
                    </span>
                  ))}
                  {count === 0 ? (
                    <span className="block rounded-lg border border-dashed border-[var(--line)] px-2 py-2 text-xs text-[var(--muted)]">
                      No loaded items
                    </span>
                  ) : null}
                </div>
                <span className="mt-4 inline-flex rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                  {count} signal{count === 1 ? "" : "s"}
                </span>
              </button>

              <DayInspector
                completeTask={completeTask}
                date={day}
                events={dayEvents}
                githubIssues={dayIssues}
                googleTasks={dayGoogleTasks}
                notes={dayNotes}
                runPrompt={runPrompt}
                tasks={dayTasks}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DayInspector({
  completeTask,
  date,
  events,
  githubIssues,
  googleTasks,
  notes,
  runPrompt,
  tasks,
}: {
  completeTask: (task: RelayTask) => Promise<void>;
  date: Date;
  events: CalendarEvent[];
  githubIssues: GithubIssue[];
  googleTasks: GoogleTask[];
  notes: RelayNote[];
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  return (
    <div className="day-inspector-panel pointer-events-none absolute left-0 top-[calc(100%+10px)] z-40 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 opacity-0 shadow-[var(--shadow-strong)] transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:left-auto md:right-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="text-xs text-[var(--muted)]">Day inspector</p>
        </div>
        <StatusBadge ready label={`${events.length + tasks.length + googleTasks.length + githubIssues.length} active`} />
      </div>

      <InspectorGroup
        empty="No loaded events."
        icon={CalendarDays}
        items={events.map((event) => ({
          id: event.id ?? `${event.title}-${event.start}`,
          title: event.title,
          detail: `${formatEventTime(event.start)}${event.end ? ` - ${formatEventTime(event.end)}` : ""}`,
          action: "Edit",
          onClick: () => runPrompt(`Edit ${event.title} on ${date.toDateString()}`),
        }))}
        title="Events"
      />
      <InspectorGroup
        empty="No task deadlines."
        icon={ListTodo}
        items={[
          ...tasks.map((task) => ({
            id: task.id,
            title: task.title,
            detail: task.notes || priorityLabel(task.priority),
            action: "Complete",
            onClick: () => void completeTask(task),
          })),
          ...googleTasks.map((task) => ({
            id: task.id ?? task.title,
            title: task.title,
            detail: task.notes || task.taskListTitle || "Google Tasks",
            action: "Plan",
            onClick: () => runPrompt(`Plan ${task.title}`),
          })),
        ]}
        title="Tasks"
      />
      <InspectorGroup
        empty="No GitHub activity for this day."
        icon={GitBranch}
        items={githubIssues.map((issue) => ({
          id: String(issue.id),
          title: issue.title,
          detail: `${issue.repositoryFullName ?? "GitHub"} #${issue.number} · ${githubUrgency(issue)}`,
          action: "Review",
          onClick: () => runPrompt(`Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`),
        }))}
        title="GitHub"
      />
      <InspectorGroup
        empty="No notes captured."
        icon={Brain}
        items={notes.map((note) => ({
          id: note.id,
          title: note.body,
          detail: formatFileTime(note.createdAt),
          action: "Use",
          onClick: () => runPrompt(`Use this memory: ${note.body}`),
        }))}
        title="Notes"
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={secondaryButtonClass + " pointer-events-auto h-9 px-3"} onClick={() => runPrompt(`Reschedule items on ${date.toDateString()}`)} type="button">
          Reschedule
        </button>
        <button className={primaryButtonClass + " pointer-events-auto h-9 px-3"} onClick={() => runPrompt(`Create a task due ${date.toDateString()}`)} type="button">
          Add task
        </button>
      </div>
    </div>
  );
}

function InspectorGroup({
  empty,
  icon: Icon,
  items,
  title,
}: {
  empty: string;
  icon: LucideIcon;
  items: Array<{ action: string; detail: string; id: string; onClick: () => void; title: string }>;
  title: string;
}) {
  return (
    <div className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
        <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
        {title}
      </div>
      <div className="space-y-1.5">
        {items.length > 0 ? (
          items.slice(0, 4).map((item) => (
            <button
              className="pointer-events-auto grid w-full grid-cols-[1fr_auto] gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface)]"
              key={item.id}
              onClick={item.onClick}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{item.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">{item.detail}</span>
              </span>
              <span className="text-[11px] font-semibold text-[var(--accent)]">{item.action}</span>
            </button>
          ))
        ) : (
          <p className="px-2 py-1 text-xs text-[var(--muted)]">{empty}</p>
        )}
      </div>
    </div>
  );
}

function TaskSnapshot({
  briefing,
  completeTask,
  openTasks,
  runPrompt,
  tasks,
}: {
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  const googleTasks = briefing?.googleTasks?.tasks.filter((task) => task.status !== "completed") ?? [];
  const sortedTasks = sortTasksByUrgency(openTasks).slice(0, 6);
  const overdueCount = openTasks.filter((task) => isOverdue(task.due)).length;

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-4">
        <div>
          <h2 className="text-lg font-semibold">Task snapshot</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {overdueCount > 0 ? `${overdueCount} overdue` : `${openTasks.length} local open`} · {googleTasks.length} Google open
          </p>
        </div>
        <button className={secondaryButtonClass + " h-9 px-3"} onClick={() => runPrompt("Review my highest priority tasks")} type="button">
          Review
        </button>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {sortedTasks.map((task) => (
          <HoverPreview
            detail={task.notes || "No notes saved for this task."}
            key={task.id}
            meta={task.due ? `Due ${formatDueDate(task.due)}` : "No due date"}
            title={task.title}
          >
            <button
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left transition hover:bg-[var(--accent-soft)]"
              onClick={() => void completeTask(task)}
              type="button"
            >
              <PriorityTag priority={task.priority} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{task.title}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                  {task.due ? formatDueDate(task.due) : "No deadline"} · {task.notes || "No note"}
                </span>
              </span>
              <Check className="h-4 w-4 text-[var(--success)]" />
            </button>
          </HoverPreview>
        ))}
        {sortedTasks.length === 0 ? (
          <EmptyState icon={ListTodo} title={tasks.length > 0 ? "All local tasks completed" : "No local tasks"} detail="Create tasks from chat or the Tasks tab." />
        ) : null}
      </div>
    </section>
  );
}

function GithubActivityPanel({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const issues = briefing?.githubIssues?.issues ?? [];

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-4">
        <div>
          <h2 className="text-lg font-semibold">GitHub activity</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {briefing?.github?.connected ? `${issues.length} assigned issue${issues.length === 1 ? "" : "s"}` : "GitHub not connected"}
          </p>
        </div>
        <button className={secondaryButtonClass + " h-9 px-3"} onClick={() => runPrompt("What should I fix first on GitHub?")} type="button">
          Ask AI
        </button>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {issues.slice(0, 5).map((issue) => (
          <HoverPreview
            detail={`${issue.labels.join(", ") || "No labels"} · updated ${formatFileTime(issue.updatedAt)}`}
            key={issue.id}
            meta={issue.repositoryFullName ?? "GitHub"}
            title={issue.title}
          >
            <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
              <button
                className="min-w-0 text-left"
                onClick={() => runPrompt(`Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`)}
                type="button"
              >
                <span className="block truncate text-sm font-semibold">{issue.title}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                  {issue.repositoryFullName ?? "Repository"} #{issue.number}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${githubUrgencyClass(issue)}`}>
                  {githubUrgency(issue)}
                </span>
                <a className={iconButtonClass + " h-8 w-8"} href={issue.htmlUrl} rel="noreferrer" target="_blank" title="Open issue">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </HoverPreview>
        ))}
        {issues.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title={briefing?.github?.connected ? "No assigned issues loaded" : "GitHub not connected"}
            detail={briefing?.githubIssues?.reason ?? "Connect GitHub to see repository work."}
          />
        ) : null}
      </div>
    </section>
  );
}

function AiActionPlanner({
  briefing,
  openTasks,
  runPrompt,
  setActiveView,
}: {
  briefing: Briefing | null;
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  setActiveView: (view: ViewId) => void;
  tasks: RelayTask[];
}) {
  const actions = buildPlannerActions(briefing, openTasks, runPrompt, setActiveView);

  return (
    <section className={`${panelClass} ai-planner overflow-hidden p-5`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--muted)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Executive decision layer
          </div>
          <h2 className="text-xl font-semibold">What to do next</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Prioritized from live calendar, tasks, inbox, files, and GitHub signals.</p>
        </div>
        <StatusBadge ready={actions.length > 0} label={`${actions.length} action${actions.length === 1 ? "" : "s"}`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              key={action.title}
              onClick={action.onClick}
              type="button"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
              </div>
              <p className="font-semibold">{action.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{action.detail}</p>
            </button>
          );
        })}
        {actions.length === 0 ? (
          <EmptyState icon={Sparkles} title="No urgent decision loaded" detail="Connect services or add tasks to give the planner live context." />
        ) : null}
      </div>
    </section>
  );
}

function InboxHighlights({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const messages = briefing?.gmail?.messages ?? [];
  const drafts = briefing?.gmailDrafts?.drafts ?? [];
  const scheduledDrafts =
    briefing?.scheduledEmails?.map((email) => ({
      id: email.id,
      subject: email.email.subject,
      to: email.email.to,
      date: email.sendAt,
      snippet: `Scheduled for ${formatEventTime(email.sendAt)}`,
    })) ?? [];
  const items = [
    ...messages.slice(0, 5).map((message) => ({
      id: message.id ?? message.subject,
      kind: "Inbox",
      title: message.subject,
      person: message.from ?? "Unknown sender",
      time: message.date,
      snippet: message.snippet ?? "No preview text",
      prompt: `Summarize this email: ${message.subject}`,
    })),
    ...drafts.slice(0, 3).map((draft) => ({
      id: `draft-${draft.id ?? draft.subject}`,
      kind: "Draft",
      title: draft.subject,
      person: draft.to ?? "No recipient",
      time: draft.date,
      snippet: draft.snippet ?? "Draft saved in Gmail.",
      prompt: `Review my Gmail draft: ${draft.subject}`,
    })),
    ...scheduledDrafts.slice(0, 2).map((draft) => ({
      id: `scheduled-${draft.id}`,
      kind: "Scheduled",
      title: draft.subject,
      person: draft.to,
      time: draft.date,
      snippet: draft.snippet,
      prompt: `Review my scheduled email draft: ${draft.subject}`,
    })),
  ];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <section className="space-y-4">
      <SectionHeader
        action="Open chat"
        icon={Mail}
        onAction={() => runPrompt("Summarize my inbox activity")}
        title="Inbox highlights"
      />
      <div className={`${panelClass} overflow-hidden`}>
        {items.length > 0 ? (
          <div className="grid min-h-80 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="divide-y divide-[var(--line)]">
              {items.map((item) => (
            <HoverPreview
              detail={item.snippet}
              key={item.id}
              meta={item.time ? formatFileTime(item.time) : item.kind}
              title={item.person}
            >
              <button
                className={`grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 p-4 text-left transition hover:bg-[var(--accent-soft)] ${
                  selected?.id === item.id ? "bg-[var(--accent-soft)]" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning)]">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">{item.person}</span>
                </span>
                <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                  {item.kind}
                </span>
              </button>
            </HoverPreview>
              ))}
            </div>
            <div className="border-t border-[var(--line)] bg-[var(--surface-soft)] p-4 xl:border-l xl:border-t-0">
              {selected ? (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">{selected.kind}</p>
                  <h3 className="mt-2 text-base font-semibold leading-6">{selected.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{selected.person}</p>
                  <p className="mt-4 text-sm leading-6">{selected.snippet}</p>
                  <button className={primaryButtonClass + " mt-4 w-full"} onClick={() => runPrompt(selected.prompt)} type="button">
                    <Sparkles className="h-4 w-4" />
                    Ask AI
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Mail}
            title={briefing?.gmail?.ok ? "Inbox is quiet" : "Gmail not connected"}
            detail={briefing?.gmail?.reason ?? "Connect Gmail to load inbox highlights."}
          />
        )}
      </div>
    </section>
  );
}

function ControlMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
      <div className="mb-5 flex items-center justify-between">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <MoreHorizontal className="h-4 w-4 text-[var(--muted)] opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}

function SectionHeader({
  action,
  icon: Icon,
  onAction,
  title,
}: {
  action: string;
  icon: LucideIcon;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <button className={secondaryButtonClass} onClick={onAction} type="button">
        {action}
      </button>
    </div>
  );
}

function HoverPreview({
  children,
  detail,
  meta,
  title,
}: {
  children: ReactNode;
  detail: string;
  meta: string;
  title: string;
}) {
  return (
    <div className="hover-card group relative">
      {children}
      <div className="hover-card-panel pointer-events-none absolute left-4 top-[calc(100%+8px)] z-30 w-72 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm opacity-0 shadow-[var(--shadow-strong)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="truncate font-semibold">{title}</p>
        <p className="mt-1 text-xs font-semibold uppercase text-[var(--muted)]">{meta}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  );
}

function ChatView({
  addMemory,
  addTask,
  briefing,
  completeSurfaceMessage,
  completeTask,
  input,
  loading,
  messages,
  notes,
  openTasks,
  refreshWorkspace,
  runPrompt,
  setInput,
  signedInToGoogle,
  submitMessage,
  taskColumns,
  tasks,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  briefing: Briefing | null;
  completeSurfaceMessage: (messageId: string, summary: string, link?: string | null) => void;
  completeTask: (task: RelayTask) => Promise<void>;
  input: string;
  loading: boolean;
  messages: Message[];
  notes: RelayNote[];
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  setInput: (value: string) => void;
  signedInToGoogle: boolean;
  submitMessage: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
}) {
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(430);
  const mode = inferContextWorkspaceMode(messages);

  return (
    <div
      className="flex h-[calc(100vh-96px)] min-h-0 flex-col gap-4 overflow-hidden transition-all duration-300 xl:grid"
      style={{
        gridTemplateColumns: workspaceCollapsed
          ? "minmax(0,1fr) 64px"
          : `minmax(0,1fr) minmax(360px,${workspaceWidth}px)`,
      }}
    >
      <AgentConsole
        addMemory={addMemory}
        addTask={addTask}
        completeSurfaceMessage={completeSurfaceMessage}
        input={input}
        loading={loading}
        messages={messages}
        refreshWorkspace={refreshWorkspace}
        runPrompt={runPrompt}
        setInput={setInput}
        submitMessage={submitMessage}
      />
      <ContextWorkspace
        addTask={addTask}
        briefing={briefing}
        collapsed={workspaceCollapsed}
        completeTask={completeTask}
        mode={mode}
        notes={notes}
        onToggleCollapsed={() => setWorkspaceCollapsed((current) => !current)}
        openTasks={openTasks}
        refreshWorkspace={refreshWorkspace}
        runPrompt={runPrompt}
        setWidth={setWorkspaceWidth}
        signedInToGoogle={signedInToGoogle}
        taskColumns={taskColumns}
        tasks={tasks}
        width={workspaceWidth}
      />
    </div>
  );
}

function AgentConsole({
  addMemory,
  addTask,
  completeSurfaceMessage,
  input,
  loading,
  messages,
  refreshWorkspace,
  runPrompt,
  setInput,
  submitMessage,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  completeSurfaceMessage: (messageId: string, summary: string, link?: string | null) => void;
  input: string;
  loading: boolean;
  messages: Message[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  setInput: (value: string) => void;
  submitMessage: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [listening, setListening] = useState(false);

  function attachFiles(files: FileList | null) {
    const names = Array.from(files ?? []).map((file) => file.name);
    if (names.length === 0) return;

    setInput(
      [
        input,
        `Attached local files: ${names.join(", ")}`,
        "Use the file intelligence tools when file upload parsing is connected.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  function startVoiceInput() {
    type SpeechRecognitionConstructor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      start: () => void;
    };
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setInput(
        [
          input,
          "Voice input is not supported in this browser. I can still take typed instructions.",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput([input, transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <section className={`${panelClass} flex h-full min-h-0 flex-col overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Executive assistant</h2>
            <p className="text-xs text-[var(--muted)]">Neutral routing, generated UI, and session memory</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] px-5 py-3">
        {quickPrompts.map((prompt) => (
          <button
            className="interactive-control inline-flex h-8 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            key={prompt}
            onClick={() => runPrompt(prompt)}
            type="button"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {prompt}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5" ref={scrollRef}>
        {messages.map((message) => (
          <ChatMessage
            addMemory={addMemory}
            addTask={addTask}
            completeSurfaceMessage={completeSurfaceMessage}
            key={message.id}
            message={message}
            refreshWorkspace={refreshWorkspace}
          />
        ))}
        {loading ? <AssistantThinkingCard messages={messages} /> : null}
      </div>

      <form
        className="border-t border-[var(--line)] p-4"
        id="agent-chat-form"
        onSubmit={submitMessage}
      >
        <input
          className="hidden"
          multiple
          onChange={(event) => attachFiles(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <div className="flex gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-2">
          <button
            className={iconButtonClass + " h-11 w-11 border-transparent bg-transparent"}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            className={iconButtonClass + " h-11 w-11 border-transparent bg-transparent"}
            onClick={startVoiceInput}
            type="button"
            title="Voice input"
          >
            {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          </button>
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[var(--muted)]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the assistant to plan, schedule, draft, search, or remember..."
            value={input}
          />
          <button className={`${primaryButtonClass} h-11 w-11 px-0`} disabled={loading} type="submit" title="Send">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </section>
  );
}

function AssistantThinkingCard({ messages }: { messages: Message[] }) {
  const steps = inferExecutionTrace(messages);

  return (
    <div className="flex max-w-[85%] gap-3">
      <AvatarIcon role="assistant" />
      <div className="surface-pop rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center gap-1">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </span>
          Coordinating
        </div>
        <div className="grid gap-2">
          {steps.map((step) => (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]" key={step}>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  addMemory,
  addTask,
  completeSurfaceMessage,
  message,
  refreshWorkspace,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  completeSurfaceMessage: (messageId: string, summary: string, link?: string | null) => void;
  message: Message;
  refreshWorkspace: () => Promise<void>;
}) {
  const fromUser = message.role === "user";

  return (
    <div className={fromUser ? "ml-auto flex max-w-[88%] flex-row-reverse gap-3" : "mr-auto flex max-w-[92%] gap-3"}>
      <AvatarIcon role={message.role} />
      <div className="min-w-0">
        {message.content ? (
          <div
            className={
              fromUser
                ? "rounded-xl bg-[var(--accent)] px-4 py-3 text-sm leading-6 text-white"
                : "rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text)]"
            }
          >
            {fromUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <MarkdownMessage content={message.content} />
            )}
          </div>
        ) : null}
        <div className={`mt-1 text-xs text-[var(--muted)] ${fromUser ? "text-right" : ""}`}>
          {message.timestamp}
        </div>
        {message.surface && message.surfaceStatus !== "done" ? (
          <GeneratedMessageSurface
            addMemory={addMemory}
            addTask={addTask}
            onComplete={(summary, link) => completeSurfaceMessage(message.id, summary, link)}
            refreshWorkspace={refreshWorkspace}
            surface={message.surface}
          />
        ) : null}
      </div>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function GeneratedMessageSurface({
  addMemory,
  addTask,
  onComplete,
  refreshWorkspace,
  surface,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  onComplete: (summary: string, link?: string | null) => void;
  refreshWorkspace: () => Promise<void>;
  surface: GeneratedSurface;
}) {
  if (surface === "schedule") return <ScheduleComposer onComplete={onComplete} refreshWorkspace={refreshWorkspace} />;
  if (surface === "task") return <TaskComposer addTask={addTask} onComplete={onComplete} refreshWorkspace={refreshWorkspace} />;
  if (surface === "files") return <FileGeneratedSurface />;
  if (surface === "memory") return <MemoryPermissionSurface addMemory={addMemory} onComplete={onComplete} />;
  return <EmailApprovalSurface onComplete={onComplete} />;
}

function ContextWorkspace({
  addTask,
  briefing,
  collapsed,
  completeTask,
  mode,
  notes,
  onToggleCollapsed,
  openTasks,
  refreshWorkspace,
  runPrompt,
  setWidth,
  signedInToGoogle,
  taskColumns,
  tasks,
  width,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  briefing: Briefing | null;
  collapsed: boolean;
  completeTask: (task: RelayTask) => Promise<void>;
  mode: ContextWorkspaceMode;
  notes: RelayNote[];
  onToggleCollapsed: () => void;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  setWidth: (width: number) => void;
  signedInToGoogle: boolean;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
  width: number;
}) {
  const meta = contextWorkspaceMeta(mode);
  const Icon = meta.icon;
  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    function onMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(620, Math.max(360, startWidth - (moveEvent.clientX - startX)));
      setWidth(nextWidth);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  if (collapsed) {
    return (
      <aside className={`${panelClass} hidden h-full min-h-0 flex-col items-center gap-3 p-3 xl:flex`}>
        <button
          className={iconButtonClass}
          onClick={onToggleCollapsed}
          title="Expand workspace"
          type="button"
        >
          <Columns3 className="h-4 w-4" />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="h-px w-full bg-[var(--line)]" />
        {(["focus", "calendar", "tasks", "files", "github", "memory", "email"] as ContextWorkspaceMode[]).map((item) => {
          const ItemIcon = contextWorkspaceMeta(item).icon;
          return (
            <span
              className={`grid h-9 w-9 place-items-center rounded-md transition ${
                item === mode
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-soft)] text-[var(--muted)]"
              }`}
              key={item}
              title={contextWorkspaceMeta(item).label}
            >
              <ItemIcon className="h-4 w-4" />
            </span>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className={`${panelClass} relative hidden h-full min-h-0 flex-col overflow-hidden xl:flex`}>
      <div
        aria-label="Resize contextual workspace"
        className="resize-rail absolute bottom-0 left-0 top-0 z-10 w-2 cursor-ew-resize"
        onPointerDown={startResize}
        role="separator"
      />
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{meta.label}</p>
            <p className="truncate text-xs text-[var(--muted)]">{meta.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={iconButtonClass}
            onClick={() => void refreshWorkspace()}
            title="Refresh workspace"
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            className={iconButtonClass}
            onClick={onToggleCollapsed}
            title="Collapse workspace"
            type="button"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-2">
        <span className="text-xs font-semibold uppercase text-[var(--muted)]">AI selected</span>
        <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--track)]">
          <div className="animated-progress h-1.5 w-2/3 rounded-full bg-[var(--accent)]" />
        </div>
        <span className="text-xs font-semibold text-[var(--accent)]">{meta.signal}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {mode === "focus" ? (
          <FocusWorkspace
            briefing={briefing}
            openTasks={openTasks}
            runPrompt={runPrompt}
            signedInToGoogle={signedInToGoogle}
          />
        ) : null}
        {mode === "calendar" ? (
          <CalendarWorkspace
            briefing={briefing}
            refreshWorkspace={refreshWorkspace}
          />
        ) : null}
        {mode === "tasks" ? (
          <TaskWorkspace
            addTask={addTask}
            briefing={briefing}
            completeTask={completeTask}
            openTasks={openTasks}
            refreshWorkspace={refreshWorkspace}
            taskColumns={taskColumns}
            tasks={tasks}
          />
        ) : null}
        {mode === "files" ? <FilesWorkspace briefing={briefing} runPrompt={runPrompt} /> : null}
        {mode === "github" ? <GithubWorkspace briefing={briefing} runPrompt={runPrompt} /> : null}
        {mode === "memory" ? <MemoryWorkspace notes={notes} runPrompt={runPrompt} /> : null}
        {mode === "email" ? <EmailWorkspace briefing={briefing} runPrompt={runPrompt} /> : null}
      </div>

      <div className="border-t border-[var(--line)] px-4 py-3">
        <label className="flex items-center gap-3 text-xs font-semibold text-[var(--muted)]">
          Width
          <input
            aria-label="Resize contextual workspace"
            className="min-w-0 flex-1 accent-[var(--accent)]"
            max={620}
            min={360}
            onChange={(event) => setWidth(Number(event.target.value))}
            type="range"
            value={width}
          />
        </label>
      </div>
    </aside>
  );
}

function FocusWorkspace({
  briefing,
  openTasks,
  runPrompt,
  signedInToGoogle,
}: {
  briefing: Briefing | null;
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  signedInToGoogle: boolean;
}) {
  const nextEvent = briefing?.calendar.events[0];
  const recentFile = briefing?.drive.files[0];
  const googleTasks = briefing?.googleTasks?.tasks.filter((task) => task.status !== "completed") ?? [];
  const actions = [
    {
      title: nextEvent ? nextEvent.title : "Plan my day",
      detail: nextEvent ? formatEventTime(nextEvent.start) : "Create a briefing from connected workspace data.",
      icon: CalendarDays,
      prompt: nextEvent ? "Prepare me for my next meeting" : "Plan my day",
    },
    {
      title: openTasks[0]?.title ?? googleTasks[0]?.title ?? "Capture a task",
      detail: openTasks[0] ? "Local priority task" : googleTasks[0] ? "Google Tasks item" : "Start with one concrete next action.",
      icon: ListTodo,
      prompt: openTasks[0]
        ? `Plan the next step for ${openTasks[0].title}`
        : googleTasks[0]
          ? `Plan the next step for ${googleTasks[0].title}`
          : "add task ",
    },
    {
      title: recentFile?.name ?? (signedInToGoogle ? "Review Drive" : "Connect Google"),
      detail: recentFile ? driveFileType(recentFile.mimeType) : "Drive, Calendar, and Tasks unlock live workspace context.",
      icon: FolderOpen,
      prompt: recentFile ? `Summarize ${recentFile.name}` : "OAuth status",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <section className={softPanelClass + " p-4"}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Current focus</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {briefing?.focus?.title ?? "No local focus task selected yet."}
            </p>
          </div>
          <span className="pulse-dot mt-1" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <MiniControl label="Calendar" value={briefing?.calendar.ok ? `${briefing.calendar.events.length} events` : "Not connected"} />
          <MiniControl label="Tasks" value={`${openTasks.length + googleTasks.length} open`} />
          <MiniControl label="Files" value={briefing?.drive.ok ? `${briefing.drive.files.length} recent` : "Not connected"} />
        </div>
      </section>

      <section className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              className="interactive-row grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-left transition hover:bg-[var(--accent-soft)]"
              key={action.title}
              onClick={() => runPrompt(action.prompt)}
              type="button"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{action.title}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">{action.detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
            </button>
          );
        })}
      </section>
    </div>
  );
}

function CalendarWorkspace({
  briefing,
  refreshWorkspace,
}: {
  briefing: Briefing | null;
  refreshWorkspace: () => Promise<void>;
}) {
  const events = briefing?.calendar.events ?? [];
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarAction, setCalendarAction] = useState<CalendarAction | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const dayEvents = events.filter((event) => sameCalendarDay(parseEventDate(event.start), selectedDate));
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthDays = getMonthGrid(selectedDate);

  function openSlot(date: Date, hour: number) {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60_000);
    setCalendarAction({ mode: "create", start, end, title: "", reminderMinutes: 30 });
  }

  function openEvent(event: CalendarEvent) {
    const start = parseEventDate(event.start) ?? new Date();
    const end = parseEventDate(event.end) ?? new Date(start.getTime() + 30 * 60_000);
    setCalendarAction({ mode: "edit", event, start, end, title: event.title, reminderMinutes: 30 });
  }

  async function moveEvent(event: CalendarEvent, targetDate: Date, hour: number) {
    const start = parseEventDate(event.start);
    const end = parseEventDate(event.end);
    if (!event.id || !start) return;

    const duration = end ? end.getTime() - start.getTime() : 30 * 60_000;
    const nextStart = new Date(targetDate);
    nextStart.setHours(hour, 0, 0, 0);
    const nextEnd = new Date(nextStart.getTime() + duration);

    await fetch("/api/google/calendar/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: event.id,
        startDateTime: nextStart.toISOString(),
        endDateTime: nextEnd.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    await refreshWorkspace();
  }

  async function saveCalendarAction() {
    if (!calendarAction?.title.trim() || savingEvent) return;

    setSavingEvent(true);
    try {
      const payload = {
        summary: calendarAction.title.trim(),
        startDateTime: calendarAction.start.toISOString(),
        endDateTime: calendarAction.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        description: calendarAction.notes?.trim() || undefined,
        location: calendarAction.location?.trim() || undefined,
        attendees: calendarAction.attendees
          ?.split(",")
          .map((email) => email.trim())
          .filter(Boolean),
        reminderMinutes: calendarAction.reminderMinutes ?? undefined,
      };
      await fetch("/api/google/calendar/events", {
        method: calendarAction.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          calendarAction.mode === "edit"
            ? { id: calendarAction.event?.id, ...payload }
            : payload,
        ),
      });
      setCalendarAction(null);
      await refreshWorkspace();
    } finally {
      setSavingEvent(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <section className={softPanelClass + " p-3"}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button className={iconButtonClass} onClick={() => setSelectedDate(addDays(selectedDate, view === "month" ? -30 : view === "week" ? -7 : -1))} type="button" title="Previous">
            <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold">
              {selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {briefing?.calendar.ok ? "Google Calendar" : briefing?.calendar.reason ?? "Calendar not connected"}
            </p>
          </div>
          <button className={iconButtonClass} onClick={() => setSelectedDate(addDays(selectedDate, view === "month" ? 30 : view === "week" ? 7 : 1))} type="button" title="Next">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["day", "week", "month"] as const).map((option) => (
            <button
              className={`h-9 rounded-md text-xs font-semibold transition ${
                view === option
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <button
          className={`${primaryButtonClass} mt-3 w-full`}
          onClick={() => openSlot(selectedDate, Math.max(9, new Date().getHours() + 1))}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </section>

      <CalendarSignalStrip
        briefing={briefing}
        dayEvents={dayEvents}
        events={events}
        selectedDate={selectedDate}
        view={view}
      />

      {view === "day" ? (
        <DayCalendar
          events={dayEvents}
          onEventClick={openEvent}
          onSlotClick={(hour) => openSlot(selectedDate, hour)}
          selectedDate={selectedDate}
        />
      ) : null}

      {view === "week" ? (
        <WeekCalendar
          events={events}
          onEventClick={openEvent}
          onEventDrop={moveEvent}
          onSelectDate={setSelectedDate}
          onSlotClick={openSlot}
          selectedDate={selectedDate}
          weekDays={weekDays}
        />
      ) : null}

      {view === "month" ? (
        <section className={softPanelClass + " overflow-hidden p-3"}>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[var(--muted)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dayCount = events.filter((event) => sameCalendarDay(parseEventDate(event.start), day)).length;
              const currentMonth = day.getMonth() === selectedDate.getMonth();
              return (
                <button
                  className={`min-h-16 rounded-md border p-1.5 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] ${
                    sameCalendarDay(day, selectedDate)
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface)]"
                  } ${currentMonth ? "" : "opacity-45"}`}
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setView("day");
                  }}
                  type="button"
                >
                  <span className="text-xs font-semibold">{day.getDate()}</span>
                  {dayCount > 0 ? (
                    <span className="mt-2 flex gap-1">
                      {Array.from({ length: Math.min(3, dayCount) }, (_, index) => (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" key={index} />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className={primaryButtonClass} onClick={() => openSlot(selectedDate, Math.max(9, new Date().getHours() + 1))} type="button">
          <Plus className="h-4 w-4" />
          Add event
        </button>
        <button className={secondaryButtonClass} onClick={() => void refreshWorkspace()} type="button">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      {calendarAction ? (
        <CalendarEventEditor
          action={calendarAction}
          onChange={setCalendarAction}
          onClose={() => setCalendarAction(null)}
          onSave={saveCalendarAction}
          saving={savingEvent}
        />
      ) : null}
    </div>
  );
}

function CalendarSignalStrip({
  briefing,
  dayEvents,
  events,
  selectedDate,
  view,
}: {
  briefing: Briefing | null;
  dayEvents: CalendarEvent[];
  events: CalendarEvent[];
  selectedDate: Date;
  view: "day" | "week" | "month";
}) {
  const now = new Date();
  const nextEvent = events
    .map((event) => ({ event, start: parseEventDate(event.start) }))
    .filter((item): item is { event: CalendarEvent; start: Date } => Boolean(item.start))
    .filter((item) => item.start.getTime() >= now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]?.event;
  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="calendar-signal-strip grid gap-3 rounded-xl border border-[var(--line)] p-3 shadow-sm sm:grid-cols-3">
      <MiniControl
        label="Selected"
        value={`${selectedLabel} · ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
      />
      <MiniControl
        label="Next"
        value={nextEvent ? `${nextEvent.title} · ${formatEventTime(nextEvent.start)}` : "No upcoming event loaded"}
      />
      <MiniControl
        label="Source"
        value={briefing ? (briefing.calendar.ok ? `Google Calendar · ${view}` : "Calendar disconnected") : "Loading"}
      />
    </section>
  );
}

function WeekCalendar({
  events,
  onEventClick,
  onEventDrop,
  onSelectDate,
  onSlotClick,
  selectedDate,
  weekDays,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (event: CalendarEvent, targetDate: Date, hour: number) => void;
  onSelectDate: (date: Date) => void;
  onSlotClick: (date: Date, hour: number) => void;
  selectedDate: Date;
  weekDays: Date[];
}) {
  const hours = Array.from({ length: 14 }, (_, index) => index + 7);
  const hourHeight = 56;
  const now = new Date();
  const showNow = weekDays.some((day) => sameCalendarDay(day, now));
  const nowTop = ((now.getHours() * 60 + now.getMinutes() - 7 * 60) / 60) * hourHeight;

  return (
    <section className={softPanelClass + " overflow-hidden p-3"}>
      <div className="grid grid-cols-[52px_repeat(7,minmax(86px,1fr))] border-b border-[var(--line)] pb-2">
        <span />
        {weekDays.map((day) => (
          <button
            className={`rounded-xl px-2 py-2 text-left transition hover:bg-[var(--accent-soft)] ${
              sameCalendarDay(day, selectedDate) ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""
            }`}
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            type="button"
          >
            <span className="block text-[10px] font-semibold uppercase text-[var(--muted)]">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="mt-1 block text-lg font-semibold">{day.getDate()}</span>
          </button>
        ))}
      </div>
      <div className="relative max-h-[620px] overflow-auto">
        <div className="grid grid-cols-[52px_repeat(7,minmax(86px,1fr))]">
          {hours.map((hour) => (
            <div className="contents" key={hour}>
              <div className="border-t border-[var(--line)] pt-1 text-[10px] font-semibold text-[var(--muted)]" style={{ height: hourHeight }}>
                {formatHour(hour)}
              </div>
              {weekDays.map((day) => (
                <button
                  className="border-l border-t border-[var(--line)] text-left transition hover:bg-[var(--accent-soft)]"
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => onSlotClick(day, hour)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(dropEvent) => {
                    dropEvent.preventDefault();
                    const id = dropEvent.dataTransfer.getData("text/calendar-event-id");
                    const dropped = events.find((event) => event.id === id);
                    if (dropped) void onEventDrop(dropped, day, hour);
                  }}
                  style={{ height: hourHeight }}
                  title={`Add event ${day.toLocaleDateString()} ${formatHour(hour)}`}
                  type="button"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-[52px] right-0 top-0 grid grid-cols-7">
          {weekDays.map((day) => (
            <div className="relative border-l border-transparent" key={`events-${day.toISOString()}`}>
              {events
                .filter((event) => sameCalendarDay(parseEventDate(event.start), day))
                .map((event) => (
                  <CalendarEventBlock
                    event={event}
                    hourHeight={hourHeight}
                    key={event.id ?? `${event.title}-${event.start}`}
                    onClick={() => onEventClick(event)}
                  />
                ))}
            </div>
          ))}
        </div>
        {showNow && nowTop >= 0 && nowTop <= hours.length * hourHeight ? (
          <div
            className="pointer-events-none absolute left-[52px] right-0 z-20 flex items-center"
            style={{ top: nowTop }}
          >
            <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
            <span className="h-px flex-1 bg-[var(--danger)]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CalendarEventBlock({
  event,
  hourHeight,
  onClick,
}: {
  event: CalendarEvent;
  hourHeight: number;
  onClick: () => void;
}) {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end) ?? (start ? new Date(start.getTime() + 30 * 60_000) : null);
  if (!start || !end) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = Math.max(startMinutes + 20, end.getHours() * 60 + end.getMinutes());
  const top = ((startMinutes - 7 * 60) / 60) * hourHeight;
  const height = Math.max(34, ((endMinutes - startMinutes) / 60) * hourHeight);

  return (
    <div
      className="pointer-events-auto absolute left-1 right-1"
      style={{
        top: Math.max(0, top),
        height,
      }}
    >
      <HoverPreview
        detail={`${formatEventTime(event.start)} - ${formatEventTime(event.end)}${event.hangoutLink ? " · Google Meet" : ""}`}
        meta={event.hangoutLink ? "Online meeting" : "Calendar event"}
        title={event.title}
      >
        <button
          className="h-full w-full overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface)]"
          draggable={Boolean(event.id)}
          onClick={onClick}
          onDragStart={(dragEvent) => {
            if (event.id) dragEvent.dataTransfer.setData("text/calendar-event-id", event.id);
          }}
          type="button"
        >
          <span className="block truncate font-semibold">{event.title}</span>
          <span className="mt-0.5 block truncate text-[var(--muted)]">
            {formatEventTime(event.start)}
          </span>
        </button>
      </HoverPreview>
    </div>
  );
}

function DayCalendar({
  events,
  onEventClick,
  onSlotClick,
  selectedDate,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (hour: number) => void;
  selectedDate: Date;
}) {
  const hours = Array.from({ length: 14 }, (_, index) => index + 7);
  const hourHeight = 56;

  return (
    <section className={softPanelClass + " overflow-hidden p-3"}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        <StatusBadge ready={events.length > 0} label={`${events.length} events`} />
      </div>
      <div className="relative">
        <div className="space-y-0">
          {hours.map((hour) => (
            <button
              className="grid border-t border-[var(--line)] text-left transition hover:bg-[var(--accent-soft)]"
              key={hour}
              onClick={() => onSlotClick(hour)}
              style={{ height: hourHeight }}
              type="button"
            >
              <span className="-mt-2 w-12 bg-[var(--surface-soft)] pr-2 text-[10px] font-semibold text-[var(--muted)]">
                {formatHour(hour)}
              </span>
            </button>
          ))}
        </div>
        <div className="absolute left-14 right-0 top-0">
          {events.map((event) => {
            const start = parseEventDate(event.start);
            const end = parseEventDate(event.end) ?? (start ? new Date(start.getTime() + 30 * 60_000) : null);
            if (!start || !end) return null;

            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutes = Math.max(startMinutes + 20, end.getHours() * 60 + end.getMinutes());
            const top = ((startMinutes - 7 * 60) / 60) * hourHeight;
            const height = Math.max(34, ((endMinutes - startMinutes) / 60) * hourHeight);

            return (
              <div
                className="absolute left-0 right-1"
                key={event.id ?? `${event.title}-${event.start}`}
                style={{
                  top: Math.max(0, top),
                  height,
                }}
              >
                <HoverPreview
                  detail={`${formatEventTime(event.start)} - ${formatEventTime(event.end)}${event.hangoutLink ? " · Google Meet" : ""}`}
                  meta={event.hangoutLink ? "Online meeting" : "Calendar event"}
                  title={event.title}
                >
                  <button
                    className="h-full w-full overflow-hidden rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] p-2 text-left text-xs shadow-sm transition hover:bg-[var(--surface)]"
                    onClick={() => onEventClick(event)}
                    type="button"
                  >
                    <span className="block truncate font-semibold">{event.title}</span>
                    <span className="mt-0.5 block truncate text-[var(--muted)]">
                      {formatEventTime(event.start)} - {formatEventTime(event.end)}
                    </span>
                  </button>
                </HoverPreview>
              </div>
            );
          })}
        </div>
      </div>
      {events.length === 0 ? (
        <p className="mt-3 text-center text-sm text-[var(--muted)]">No events loaded for this day.</p>
      ) : null}
    </section>
  );
}

function CalendarEventEditor({
  action,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  action: CalendarAction;
  onChange: (action: CalendarAction) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const date = action.start.toISOString().slice(0, 10);
  const time = action.start.toTimeString().slice(0, 5);
  const duration = Math.max(15, Math.round((action.end.getTime() - action.start.getTime()) / 60_000));

  function updateDateTime(nextDate = date, nextTime = time, nextDuration = duration) {
    const start = new Date(`${nextDate}T${nextTime}:00`);
    const end = new Date(start.getTime() + nextDuration * 60_000);
    onChange({ ...action, start, end });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4 backdrop-blur-sm">
      <div className={`${panelClass} w-full max-w-md animate-slide-up p-5`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {action.mode === "edit" ? "Edit event" : "Add event"}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {action.mode === "edit" ? "Update the real Google Calendar event." : "Create a real Google Calendar event."}
            </p>
          </div>
          <button className={iconButtonClass} onClick={onClose} type="button" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Title</span>
            <input
              className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => onChange({ ...action, title: event.target.value })}
              value={action.title}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Date</span>
              <input
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                onChange={(event) => updateDateTime(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Time</span>
              <input
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                onChange={(event) => updateDateTime(date, event.target.value)}
                type="time"
                value={time}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Min</span>
              <input
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                min={15}
                onChange={(event) => updateDateTime(date, time, Number(event.target.value))}
                step={15}
                type="number"
                value={duration}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Attendees</span>
              <input
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                onChange={(event) => onChange({ ...action, attendees: event.target.value })}
                placeholder="name@example.com, team@example.com"
                value={action.attendees ?? ""}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Reminder</span>
              <select
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                onChange={(event) =>
                  onChange({
                    ...action,
                    reminderMinutes: event.target.value === "default" ? null : Number(event.target.value),
                  })
                }
                value={action.reminderMinutes ?? "default"}
              >
                <option value="default">Default</option>
                <option value={5}>5 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={1440}>1 day</option>
              </select>
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Location</span>
            <input
              className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              onChange={(event) => onChange({ ...action, location: event.target.value })}
              placeholder="Room, address, or meeting link"
              value={action.location ?? ""}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Notes</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              onChange={(event) => onChange({ ...action, notes: event.target.value })}
              placeholder="Agenda, prep notes, links, or context"
              value={action.notes ?? ""}
            />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button className={primaryButtonClass} disabled={!action.title.trim() || saving} onClick={onSave} type="button">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {action.mode === "edit" ? "Save changes" : "Create event"}
          </button>
          <button className={secondaryButtonClass} onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskWorkspace({
  addTask,
  briefing,
  completeTask,
  openTasks,
  refreshWorkspace,
  taskColumns,
  tasks,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
}) {
  const googleTasks = briefing?.googleTasks?.tasks ?? [];
  const openGoogleTasks = googleTasks.filter((task) => task.status !== "completed");
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);

  async function completeGoogleTask(task: GoogleTask) {
    if (!task.id) return;

    const response = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        id: task.id,
        taskListId: task.taskListId,
      }),
    });
    const data = (await response.json()) as { ok: boolean; reason?: string };
    setGoogleStatus(response.ok && data.ok ? "Google task completed." : data.reason ?? "Google task was not completed.");
    await refreshWorkspace();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <TaskComposer addTask={addTask} refreshWorkspace={refreshWorkspace} />

      <section className={softPanelClass + " p-4"}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Open tasks</h3>
            <p className="text-xs text-[var(--muted)]">
              {tasks.length} local total, {taskColumns.length} columns, {openGoogleTasks.length} Google open
            </p>
          </div>
          <StatusBadge ready={Boolean(briefing?.googleTasks?.ok)} label={briefing?.googleTasks?.ok ? "Google ready" : "Local"} />
        </div>
        <div className="space-y-2">
          {openTasks.slice(0, 5).map((task) => (
            <button
              className="interactive-row flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-left"
              key={task.id}
              onClick={() => completeTask(task)}
              type="button"
            >
              <Check className="h-4 w-4 text-[var(--success)]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{task.title}</span>
              <PriorityTag priority={task.priority} />
            </button>
          ))}
          {openGoogleTasks.slice(0, 6).map((task) => (
            <button
              className="interactive-row flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-left"
              key={`${task.taskListId}-${task.id}`}
              onClick={() => void completeGoogleTask(task)}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{task.title}</span>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                  {task.due ? `Due ${formatEventTime(task.due)}` : task.taskListTitle ?? "Google Tasks"}
                </span>
              </span>
              <span className="text-xs text-[var(--muted)]">Google</span>
            </button>
          ))}
        </div>
        {openTasks.length === 0 && openGoogleTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No open tasks"
            detail={briefing?.googleTasks?.reason ?? "Create one from the task builder."}
          />
        ) : null}
        {googleStatus ? <p className="mt-3 text-sm text-[var(--muted)]">{googleStatus}</p> : null}
      </section>
    </div>
  );
}

function FilesWorkspace({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <RecentFilesPanel briefing={briefing} />
      <button className={primaryButtonClass} onClick={() => runPrompt("List recent Drive files")} type="button">
        <FolderOpen className="h-4 w-4" />
        Search Drive
      </button>
    </div>
  );
}

function MemoryWorkspace({
  notes,
  runPrompt,
}: {
  notes: RelayNote[];
  runPrompt: (prompt: string) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <section className={softPanelClass + " p-4"}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Approved memories</h3>
          <StatusBadge ready label={`${notes.length} saved`} />
        </div>
        <div className="space-y-2">
          {notes.slice(0, 8).map((note) => (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3" key={note.id}>
              <p className="text-sm leading-5">{note.body}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{formatFileTime(note.createdAt)}</p>
            </div>
          ))}
        </div>
        {notes.length === 0 ? (
          <EmptyState icon={Brain} title="No memories saved" detail="The assistant asks permission before storing long-term memory." />
        ) : null}
      </section>
      <button className={primaryButtonClass} onClick={() => runPrompt("Remember that ")} type="button">
        <Brain className="h-4 w-4" />
        Add memory
      </button>
    </div>
  );
}

function EmailWorkspace({
  briefing,
  runPrompt,
}: {
  briefing?: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <EmailApprovalSurface />
      <InboxHighlights briefing={briefing ?? null} runPrompt={runPrompt} />
      <button className={primaryButtonClass} onClick={() => runPrompt("Draft a follow-up email")} type="button">
        <Mail className="h-4 w-4" />
        Draft email
      </button>
    </div>
  );
}

function ScheduleComposer({
  onComplete,
  refreshWorkspace,
}: {
  onComplete?: (summary: string, link?: string | null) => void;
  refreshWorkspace?: () => Promise<void>;
}) {
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    return date;
  }, []);
  const [online, setOnline] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [status, setStatus] = useState<{ ok: boolean; message: string; link?: string | null } | null>(null);
  const [creating, setCreating] = useState(false);

  async function createEvent() {
    setCreating(true);
    setStatus(null);

    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60_000);
      const response = await fetch("/api/google/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          timeZone,
          conferenceData: online,
          reminderMinutes: reminder ? 10 : null,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        event?: { htmlLink?: string | null; title?: string | null };
      };

      setStatus({
        ok: response.ok && data.ok,
        message:
          response.ok && data.ok
            ? `Created ${data.event?.title ?? summary} in Google Calendar.`
            : data.reason ?? "Calendar event was not created.",
        link: data.event?.htmlLink ?? null,
      });
      if (response.ok && data.ok) {
        await refreshWorkspace?.();
        onComplete?.(
          `Meeting "${data.event?.title ?? summary}" scheduled for ${formatEventTime(start.toISOString())}`,
          data.event?.htmlLink ?? null,
        );
      }
    } catch (error) {
      setStatus({
        ok: false,
        message: error instanceof Error ? error.message : "Calendar event was not created.",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={`${panelClass} mt-3 max-w-2xl p-4`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Meeting details</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Create a real Google Calendar event after approval.</p>
        </div>
        <StatusBadge ready={Boolean(status?.ok)} label={status?.ok ? "Created" : "Needs details"} />
      </div>
      <div className="grid gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Title</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setSummary(event.target.value)}
            placeholder="What should the meeting be called?"
            value={summary}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Date</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Time</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setTime(event.target.value)}
              type="time"
              value={time}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Duration</span>
            <select
              className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setDuration(Number(event.target.value))}
              value={duration}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Timezone</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setTimeZone(event.target.value)}
              value={timeZone}
            />
          </label>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ToggleRow checked={online} label="Google Meet" onChange={setOnline} />
        <ToggleRow checked={reminder} label="10 minute reminder" onChange={setReminder} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className={primaryButtonClass}
          disabled={creating || !summary.trim()}
          onClick={createEvent}
          type="button"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Create Google event
        </button>
        {status?.link ? (
          <a className={secondaryButtonClass} href={status.link} rel="noreferrer" target="_blank">
            <ExternalLink className="h-4 w-4" />
            Open event
          </a>
        ) : null}
      </div>
      {status ? (
        <p
          className={
            status.ok
              ? "mt-3 text-sm font-medium text-[var(--success)]"
              : "mt-3 text-sm font-medium text-[var(--warning)]"
          }
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

function TaskComposer({
  addTask,
  onComplete,
  refreshWorkspace,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  onComplete?: (summary: string, link?: string | null) => void;
  refreshWorkspace?: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<RelayTaskPriority>("high");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [syncGoogle, setSyncGoogle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function saveTask() {
    const trimmed = title.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setStatus(null);

    try {
      await addTask({
        title: trimmed,
        notes: notes.trim() || null,
        due: due ? new Date(`${due}T12:00:00`).toISOString() : null,
        priority,
      });

      if (syncGoogle) {
        const response = await fetch("/api/google/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            title: trimmed,
            notes: notes.trim() || undefined,
            due: due ? new Date(`${due}T12:00:00`).toISOString() : undefined,
            priority,
          }),
        });
        const data = (await response.json()) as { ok: boolean; reason?: string };

        if (!response.ok || !data.ok) {
          setStatus({
            ok: false,
            message: data.reason ?? "Saved locally, but Google Tasks did not accept the task.",
          });
          return;
        }
      }

      await refreshWorkspace?.();
      setStatus({
        ok: true,
        message: syncGoogle ? "Saved locally and synced to Google Tasks." : "Saved to local tasks.",
      });
      onComplete?.(`Task "${trimmed}" created${syncGoogle ? " and synced to Google Tasks" : ""}.`);
      setTitle("");
      setNotes("");
      setDue("");
    } catch (error) {
      setStatus({
        ok: false,
        message: error instanceof Error ? error.message : "Task was not saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={`${panelClass} mt-3 max-w-2xl p-4`}
      onSubmit={(event) => {
        event.preventDefault();
        void saveTask();
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success)]">
          <ListTodo className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Task builder</h3>
          <p className="text-sm text-[var(--muted)]">Saves locally and can sync to Google Tasks.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Task</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Priority</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setPriority(event.target.value as RelayTaskPriority)}
            value={priority}
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Due date</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setDue(event.target.value)}
            type="date"
            value={due}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Notes</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Context, project, or reminder details"
            value={notes}
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniControl label="Storage" value="Local task file" />
        <MiniControl label="Completion" value="Task board checkbox" />
        <ToggleRow checked={syncGoogle} label="Sync Google Tasks" onChange={setSyncGoogle} />
      </div>
      <button className={`${primaryButtonClass} mt-4`} disabled={!title.trim() || saving} type="submit">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Save task
      </button>
      {status ? (
        <p className={`mt-3 text-sm font-medium ${status.ok ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

function FileGeneratedSurface() {
  const [result, setResult] = useState<{
    ok: boolean;
    reason?: string;
    files: DriveFile[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFiles() {
    setLoading(true);
    try {
      const response = await fetch("/api/google/drive/files");
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        files: DriveFile[];
      };
      setResult({ ...data, ok: response.ok && data.ok });
    } catch (error) {
      setResult({
        ok: false,
        reason: error instanceof Error ? error.message : "Unable to load Drive files.",
        files: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetch("/api/google/drive/files")
      .then(async (response) => {
        const data = (await response.json()) as {
          ok: boolean;
          reason?: string;
          files: DriveFile[];
        };

        if (active) setResult({ ...data, ok: response.ok && data.ok });
      })
      .catch((error) => {
        if (!active) return;
        setResult({
          ok: false,
          reason: error instanceof Error ? error.message : "Unable to load Drive files.",
          files: [],
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`${panelClass} mt-3 max-w-2xl p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Drive organizer</h3>
          <p className="text-sm text-[var(--muted)]">Real recent files from Google Drive.</p>
        </div>
        <button className={iconButtonClass} onClick={loadFiles} type="button" title="Refresh files">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </button>
      </div>
      {result?.ok && result.files.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[var(--line)]">
          {result.files.map((file) => {
            const row = (
              <>
                <DriveFileGlyph className="h-4 w-4 text-[var(--accent)]" mimeType={file.mimeType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {driveFileType(file.mimeType)} by {file.owner ?? "Unknown owner"}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-[var(--muted)]" />
              </>
            );

          return (
            file.webViewLink ? (
              <a
                className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 transition hover:bg-[var(--accent-soft)] last:border-b-0"
                href={file.webViewLink}
                key={file.id ?? file.name}
                rel="noreferrer"
                target="_blank"
              >
                {row}
              </a>
            ) : (
              <div
                className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
                key={file.id ?? file.name}
              >
                {row}
              </div>
            )
          );
        })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Drive files loaded"
          detail={result?.reason ?? "Connect Google Drive, then refresh this view."}
        />
      )}
    </div>
  );
}

function MemoryPermissionSurface({
  addMemory,
  onComplete,
}: {
  addMemory: (body: string) => Promise<void>;
  onComplete?: (summary: string, link?: string | null) => void;
}) {
  const [allowed, setAllowed] = useState(false);
  const [memory, setMemory] = useState("");

  return (
    <div className={`${panelClass} mt-3 max-w-2xl p-4`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning)]">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Memory request</h3>
          <p className="text-sm text-[var(--muted)]">Long-term memory requires approval.</p>
        </div>
      </div>
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6">
        <textarea
          className="min-h-24 w-full resize-y bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          onChange={(event) => setMemory(event.target.value)}
          placeholder="Write the exact preference, project fact, contact note, or habit to remember."
          value={memory}
        />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleRow checked={allowed} label="Allow memory storage" onChange={setAllowed} />
        <button
          className={primaryButtonClass}
          disabled={!allowed || !memory.trim()}
          onClick={async () => {
            const value = memory.trim();
            await addMemory(value);
            onComplete?.("Memory saved with approval.");
          }}
          type="button"
        >
          <Database className="h-4 w-4" />
          Store memory
        </button>
      </div>
    </div>
  );
}

function EmailApprovalSurface({
  onComplete,
}: {
  onComplete?: (summary: string, link?: string | null) => void;
}) {
  const [approved, setApproved] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Follow-up and next steps");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function approveDraft() {
    setSavingDraft(true);
    setStatus(null);

    try {
      if (to.trim()) {
        const response = await fetch("/api/google/gmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "draft",
            email: {
              to,
              subject,
              body,
            },
          }),
        });
        const data = (await response.json()) as { ok: boolean; reason?: string };
        if (!response.ok || !data.ok) {
          setStatus(data.reason ?? "Gmail draft was not created.");
          return;
        }
      }

      setApproved(true);
      setEditing(false);
      onComplete?.(
        to.trim()
          ? `Gmail draft "${subject}" created for ${to.trim()}.`
          : `Email draft "${subject}" approved locally.`,
      );
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <div className={`${panelClass} mt-3 max-w-2xl p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email draft</h3>
          <p className="text-sm text-[var(--muted)]">Creates a Gmail draft when a recipient is provided.</p>
        </div>
        <StatusBadge ready={approved} label={approved ? "Approved" : "Pending"} />
      </div>
      <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-sm leading-6">
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">To</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setTo(event.target.value)}
            placeholder="person@example.com"
            value={to}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Subject</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setSubject(event.target.value)}
            value={subject}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">Body</span>
          <textarea
            className="min-h-28 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write or ask the assistant to draft the email body."
            value={body}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className={primaryButtonClass}
          disabled={!subject.trim() || !body.trim() || savingDraft}
          onClick={() => void approveDraft()}
          type="button"
        >
          {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Approve draft
        </button>
        <button className={secondaryButtonClass} onClick={() => setEditing(true)} type="button">
          Edit draft
        </button>
      </div>
      {status ? <p className="mt-3 text-sm font-medium text-[var(--warning)]">{status}</p> : null}
    </div>
  );
}

function CalendarView({
  briefing,
  refreshWorkspace,
}: {
  briefing: Briefing | null;
  refreshWorkspace: () => Promise<void>;
}) {
  return (
    <div className="calendar-page animate-fade-in">
      <CalendarWorkspace
        briefing={briefing}
        refreshWorkspace={refreshWorkspace}
      />
    </div>
  );
}

function TasksView({
  addTask,
  briefing,
  completeTask,
  openTasks,
  refreshWorkspace,
  setContextMenu,
  taskColumns,
  tasks,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  setContextMenu: (menu: { x: number; y: number; task: RelayTask } | null) => void;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
}) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const columns = taskColumns.length > 0 ? taskColumns : [{ id: "today", title: "Today", order: 0, createdAt: "system" }];
  const googleTasks = briefing?.googleTasks?.tasks.filter((task) => task.status !== "completed") ?? [];
  const sortedLocalTasks = sortTasksByUrgency(openTasks);

  async function taskAction(body: Record<string, unknown>) {
    await fetch("/api/local-tools/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refreshWorkspace();
  }

  async function addColumn() {
    const title = newColumnTitle.trim();
    if (!title) return;
    await taskAction({ action: "add_column", title });
    setNewColumnTitle("");
  }

  async function renameColumn(id: string) {
    const title = renameValue.trim();
    if (!title) return;
    await taskAction({ action: "rename_column", id, title });
    setRenamingColumn(null);
    setRenameValue("");
  }

  async function reorderColumn(id: string, direction: -1 | 1) {
    const index = columns.findIndex((column) => column.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= columns.length) return;

    const ids = columns.map((column) => column.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await taskAction({ action: "reorder_columns", ids });
  }

  async function completeGoogleTask(task: GoogleTask) {
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
    await refreshWorkspace();
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden p-5`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Task board</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Editable local Kanban columns with deadline-aware cards.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={addColumn} type="button">
              <Plus className="h-4 w-4" />
              Add column
            </button>
            <button className={primaryButtonClass} onClick={() => setTaskModalOpen(true)} type="button">
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            onChange={(event) => setNewColumnTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addColumn();
            }}
            placeholder="New column name..."
            value={newColumnTitle}
          />
          <button className={secondaryButtonClass + " px-3"} onClick={addColumn} type="button" title="Create column">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto pb-2">
          <div className="grid min-w-[920px] gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))` }}>
            {columns.map((column, columnIndex) => {
              const columnTasks = openTasks.filter((task) => (task.columnId ?? columns[0]?.id) === column.id);
              return (
                <div
                  className={softPanelClass + " flex min-h-[560px] flex-col p-3"}
                  key={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId = event.dataTransfer.getData("text/relay-task-id");
                    if (taskId) void taskAction({ action: "move", id: taskId, columnId: column.id });
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {renamingColumn === column.id ? (
                      <input
                        className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void renameColumn(column.id);
                          if (event.key === "Escape") setRenamingColumn(null);
                        }}
                        value={renameValue}
                      />
                    ) : (
                      <button
                        className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
                        onClick={() => {
                          setRenamingColumn(column.id);
                          setRenameValue(column.title);
                        }}
                        type="button"
                      >
                        {column.title}
                      </button>
                    )}
                    <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                      {columnTasks.length}
                    </span>
                    <button className={iconButtonClass + " h-8 w-8"} disabled={columnIndex === 0} onClick={() => void reorderColumn(column.id, -1)} type="button" title="Move column left">
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                    </button>
                    <button className={iconButtonClass + " h-8 w-8"} disabled={columnIndex === columns.length - 1} onClick={() => void reorderColumn(column.id, 1)} type="button" title="Move column right">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button className={iconButtonClass + " h-8 w-8"} disabled={columns.length <= 1} onClick={() => void taskAction({ action: "delete_column", id: column.id })} type="button" title="Delete column">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <TaskKanbanCard
                        completeTask={completeTask}
                        key={task.id}
                        setContextMenu={setContextMenu}
                        task={task}
                      />
                    ))}
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--muted)]">
                        Drop tasks here
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-semibold">Global task view</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sorted by urgency and deadline proximity.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {sortedLocalTasks.map((task) => (
              <button
                className="interactive-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-left"
                key={task.id}
                onClick={() => void completeTask(task)}
                type="button"
              >
                <PriorityTag priority={task.priority} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{task.title}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {task.due ? formatDueDate(task.due) : "No deadline"} · {task.notes || "No notes"}
                  </span>
                </span>
                <Check className="h-4 w-4 text-[var(--success)]" />
              </button>
            ))}
            {googleTasks.map((task) => (
              <button
                className="interactive-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-left"
                key={`${task.taskListId}-${task.id ?? task.title}`}
                onClick={() => void completeGoogleTask(task)}
                type="button"
              >
                <PriorityTag priority={googleTaskPriority(task)} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{task.title}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {task.due ? formatDueDate(task.due) : task.taskListTitle ?? "Google Tasks"} · {task.notes || "No notes"}
                  </span>
                </span>
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              </button>
            ))}
            {sortedLocalTasks.length === 0 && googleTasks.length === 0 ? (
              <EmptyState icon={ListTodo} title={tasks.length > 0 ? "All tasks complete" : "No tasks yet"} detail={briefing?.googleTasks?.reason ?? "Use Add task or ask chat to create one."} />
            ) : null}
          </div>
        </div>
      </section>

      {taskModalOpen ? (
        <TaskCreationModal
          addTask={addTask}
          columns={columns}
          onClose={() => setTaskModalOpen(false)}
          refreshWorkspace={refreshWorkspace}
        />
      ) : null}
    </div>
  );
}

function TaskKanbanCard({
  completeTask,
  setContextMenu,
  task,
}: {
  completeTask: (task: RelayTask) => Promise<void>;
  setContextMenu: (menu: { x: number; y: number; task: RelayTask } | null) => void;
  task: RelayTask;
}) {
  return (
    <HoverPreview
      detail={task.notes || "No notes saved."}
      meta={task.due ? `Due ${formatDueDate(task.due)}` : "No deadline"}
      title={task.title}
    >
      <article
        className="interactive-row rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm"
        draggable
        onContextMenu={(event: MouseEvent<HTMLElement>) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY, task });
        }}
        onDragStart={(event) => event.dataTransfer.setData("text/relay-task-id", task.id)}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <PriorityTag priority={task.priority} />
          <button className={iconButtonClass + " h-8 w-8"} onClick={() => completeTask(task)} type="button" title="Complete task">
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-sm font-semibold leading-5">{task.title}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
          {task.notes || "No notes"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>{task.due ? formatDueDate(task.due) : "No due date"}</span>
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </article>
    </HoverPreview>
  );
}

function TaskCreationModal({
  addTask,
  columns,
  onClose,
  refreshWorkspace,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  columns: TaskColumn[];
  onClose: () => void;
  refreshWorkspace: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<RelayTaskPriority>("medium");
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    await addTask({
      title,
      notes,
      due: due ? new Date(`${due}T23:59:00`).toISOString() : null,
      priority,
      columnId,
    });
    await refreshWorkspace();
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4 backdrop-blur-sm">
      <div className={`${panelClass} w-full max-w-lg animate-slide-up p-5`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Add task</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Create a local task with real metadata.</p>
          </div>
          <button className={iconButtonClass} onClick={onClose} type="button" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Title</span>
            <input className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Notes</span>
            <textarea className="min-h-24 w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setNotes(event.target.value)} value={notes} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Due</span>
              <input className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setDue(event.target.value)} type="date" value={due} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Priority</span>
              <select className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setPriority(event.target.value as RelayTaskPriority)} value={priority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Column</span>
              <select className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setColumnId(event.target.value)} value={columnId}>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>{column.title}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button className={primaryButtonClass} disabled={!title.trim() || saving} onClick={() => void save()} type="button">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Create task
          </button>
          <button className={secondaryButtonClass} onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FilesView({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const initialFiles = useMemo(() => briefing?.drive.files ?? [], [briefing?.drive.files]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const files = searchResults ?? initialFiles;
  const selectedFile =
    files.find((file) => (file.id ?? file.name) === selectedFileId) ?? files[0] ?? null;

  async function searchFiles(nextQuery = query) {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/google/drive/files${nextQuery ? `?q=${encodeURIComponent(nextQuery)}` : ""}`);
      const data = (await response.json()) as { ok: boolean; reason?: string; files: DriveFile[] };
      setSearchResults(data.files ?? []);
      setSelectedFileId(data.files?.[0] ? data.files[0].id ?? data.files[0].name : null);
      if (!response.ok || !data.ok) setStatus(data.reason ?? "Drive search failed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Drive search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Drive browser</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {briefing?.google.connected ? "Browse and search real Google Drive files." : "Connect Google Drive to browse files."}
              </p>
            </div>
            <button className={primaryButtonClass} onClick={() => runPrompt("Summarize my recent Drive files")} type="button">
              <Wand2 className="h-4 w-4" />
              Ask AI
            </button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void searchFiles();
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3">
              <Search className="h-4 w-4 text-[var(--muted)]" />
              <input
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Drive files and folders..."
                value={query}
              />
            </div>
            <button className={secondaryButtonClass} disabled={loading} type="submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>
        </div>

        <div className="recent-file-strip border-b border-[var(--line)] px-5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {initialFiles.slice(0, 8).map((file) => (
              <button
                className="interactive-control flex min-w-52 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-left"
                key={file.id ?? file.name}
                onClick={() => setSelectedFileId(file.id ?? file.name)}
                type="button"
              >
                <DriveFileGlyph className="h-4 w-4 shrink-0 text-[var(--accent)]" mimeType={file.mimeType} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{file.name}</span>
                  <span className="block truncate text-[11px] text-[var(--muted)]">{formatFileTime(file.modifiedTime)}</span>
                </span>
              </button>
            ))}
            {initialFiles.length === 0 ? (
              <span className="text-sm text-[var(--muted)]">{briefing?.drive.reason ?? "No recent files loaded."}</span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {status ? <p className="mb-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">{status}</p> : null}
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {files.map((file) => (
                <HoverPreview
                  detail={`${driveFileType(file.mimeType)} · ${file.owner ?? "Unknown owner"} · ${formatFileTime(file.modifiedTime)}`}
                  key={file.id ?? file.name}
                  meta={file.mimeType.includes("folder") ? "Folder" : driveFileType(file.mimeType)}
                  title={file.name}
                >
                  <button
                    className={`interactive-row rounded-2xl border p-4 text-left ${
                      selectedFileId === (file.id ?? file.name)
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--surface-soft)]"
                    }`}
                    onClick={() => setSelectedFileId(file.id ?? file.name)}
                    type="button"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <DriveFileGlyph className="h-5 w-5" mimeType={file.mimeType} />
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                        {driveFileType(file.mimeType)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm font-semibold leading-5">{file.name}</p>
                    <p className="mt-2 truncate text-xs text-[var(--muted)]">{file.owner ?? "Unknown owner"}</p>
                  </button>
                </HoverPreview>
              ))}
          </div>
          {files.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={briefing?.google.connected ? "No Drive files found" : "Drive not connected"}
              detail={status ?? briefing?.drive.reason ?? "Search Drive or connect Google."}
            />
          ) : null}
        </div>
      </section>

      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-semibold">Quick preview</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Open, download, or ask AI about the selected file.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {selectedFile ? (
            <FilePreviewCard file={selectedFile} runPrompt={runPrompt} />
          ) : (
            <EmptyState icon={FileText} title="No file selected" detail="Select a Drive file to preview actions." />
          )}
        </div>
      </section>
    </div>
  );
}

function FilePreviewCard({
  file,
  runPrompt,
}: {
  file: DriveFile;
  runPrompt: (prompt: string) => void;
}) {
  const downloadUrl = file.id ? `https://drive.google.com/uc?id=${encodeURIComponent(file.id)}&export=download` : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <DriveFileGlyph className="h-6 w-6" mimeType={file.mimeType} />
        </span>
        <h3 className="mt-4 text-lg font-semibold leading-6">{file.name}</h3>
        <div className="mt-4 space-y-2">
          <MiniControl label="Type" value={driveFileType(file.mimeType)} />
          <MiniControl label="Owner" value={file.owner ?? "Unknown owner"} />
          <MiniControl label="Modified" value={formatFileTime(file.modifiedTime)} />
        </div>
      </div>
      <div className="grid gap-2">
        {file.webViewLink ? (
          <a className={primaryButtonClass} href={file.webViewLink} rel="noreferrer" target="_blank">
            <ExternalLink className="h-4 w-4" />
            Open in Drive
          </a>
        ) : null}
        {downloadUrl ? (
          <a className={secondaryButtonClass} href={downloadUrl} rel="noreferrer" target="_blank">
            <UploadCloud className="h-4 w-4 rotate-180" />
            Download
          </a>
        ) : null}
        <button className={secondaryButtonClass} onClick={() => runPrompt(`Summarize Drive file ${file.name}`)} type="button">
          <Sparkles className="h-4 w-4" />
          Ask AI about file
        </button>
      </div>
    </div>
  );
}

function GithubView({
  briefing,
  runPrompt,
  signedInToGithub,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
  signedInToGithub: boolean;
}) {
  const repositories = useMemo(
    () => briefing?.githubRepositories?.repositories ?? [],
    [briefing?.githubRepositories?.repositories],
  );
  const [selectedRepoName, setSelectedRepoName] = useState(repositories[0]?.fullName ?? "");
  const selectedRepo = repositories.find((repo) => repo.fullName === selectedRepoName) ?? repositories[0] ?? null;
  const selectedRepoFullName = selectedRepo?.fullName ?? "";
  const [repoIssues, setRepoIssues] = useState<GithubIssue[]>([]);
  const [repoPulls, setRepoPulls] = useState<GithubPullRequest[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [question, setQuestion] = useState("");
  const [githubStatus, setGithubStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepoFullName) return;
    let active = true;
    const [owner, name] = selectedRepoFullName.split("/");

    async function loadRepoContext() {
      setLoadingRepo(true);
      setGithubStatus(null);
      try {
        const [issuesResponse, pullsResponse] = await Promise.all([
          fetch(`/api/github/issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&maxResults=20`),
          fetch(`/api/github/pulls?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&maxResults=10`),
        ]);
        const issuesData = (await issuesResponse.json()) as { ok: boolean; reason?: string; issues: GithubIssue[] };
        const pullsData = (await pullsResponse.json()) as { ok: boolean; reason?: string; pullRequests: GithubPullRequest[] };

        if (!active) return;
        setRepoIssues(issuesData.issues ?? []);
        setRepoPulls(pullsData.pullRequests ?? []);
        if (!issuesResponse.ok || !issuesData.ok) setGithubStatus(issuesData.reason ?? "Unable to load repository issues.");
        if (!pullsResponse.ok || !pullsData.ok) setGithubStatus(pullsData.reason ?? "Unable to load repository pull requests.");
      } catch (error) {
        if (active) setGithubStatus(error instanceof Error ? error.message : "Unable to load repository context.");
      } finally {
        if (active) setLoadingRepo(false);
      }
    }

    void loadRepoContext();
    return () => {
      active = false;
    };
  }, [selectedRepoFullName]);

  function askRepo(prompt: string) {
    if (!selectedRepo) return;
    runPrompt(`${prompt} Repository: ${selectedRepo.fullName}.`);
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-semibold">Repositories</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {signedInToGithub ? `${repositories.length} recent repos` : "Connect GitHub to browse repositories."}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {repositories.map((repo) => (
            <button
              className={`mb-2 w-full rounded-xl border p-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] ${
                selectedRepo?.id === repo.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--surface-soft)]"
              }`}
              key={repo.id}
              onClick={() => setSelectedRepoName(repo.fullName)}
              type="button"
            >
              <span className="block truncate text-sm font-semibold">{repo.fullName}</span>
              <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                {repo.language ?? "No language"} · {repo.openIssues} open
              </span>
            </button>
          ))}
          {repositories.length === 0 ? (
            <EmptyState icon={GitBranch} title={signedInToGithub ? "No repositories loaded" : "GitHub not connected"} detail={briefing?.githubRepositories?.reason ?? "Connect GitHub from Integrations."} />
          ) : null}
        </div>
      </section>

      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{selectedRepo?.fullName ?? "Repository workspace"}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{selectedRepo?.description ?? "Select a repository to inspect its issues and pull requests."}</p>
            </div>
            <div className="flex gap-2">
              {selectedRepo?.htmlUrl ? (
                <a className={secondaryButtonClass} href={selectedRepo.htmlUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  Open repo
                </a>
              ) : null}
              <button className={primaryButtonClass} disabled={!selectedRepo} onClick={() => askRepo("What should I fix first in this repo?")} type="button">
                <Sparkles className="h-4 w-4" />
                Ask AI
              </button>
            </div>
          </div>
          {selectedRepo ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MiniControl label="Issues" value={`${selectedRepo.openIssues}`} />
              <MiniControl label="Stars" value={`${selectedRepo.stars}`} />
              <MiniControl label="Forks" value={`${selectedRepo.forks}`} />
              <MiniControl label="Updated" value={formatFileTime(selectedRepo.updatedAt)} />
            </div>
          ) : null}
          {githubStatus ? <p className="mt-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">{githubStatus}</p> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loadingRepo ? (
            <div className="space-y-3">
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <GithubIssueList issues={repoIssues} runPrompt={runPrompt} title="Open issues" />
              <GithubPullList pullRequests={repoPulls} runPrompt={runPrompt} />
            </div>
          )}
        </div>
      </section>

      <section className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-semibold">Repo Q&A</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Ask the assistant with repository context attached.</p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {["Summarize open issues", "What should I fix first?", "What changed recently?"].map((prompt) => (
            <button
              className="interactive-row w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-left text-sm font-semibold"
              key={prompt}
              onClick={() => askRepo(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          className="border-t border-[var(--line)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!question.trim()) return;
            askRepo(question);
            setQuestion("");
          }}
        >
          <div className="flex gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2">
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[var(--muted)]"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this repo..."
              value={question}
            />
            <button className={primaryButtonClass + " h-10 w-10 px-0"} disabled={!selectedRepo} type="submit" title="Ask">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function GithubIssueList({
  issues,
  runPrompt,
  title,
}: {
  issues: GithubIssue[];
  runPrompt: (prompt: string) => void;
  title: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <StatusBadge ready label={`${issues.length}`} />
      </div>
      <div className="space-y-3">
        {issues.map((issue) => (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3" key={issue.id}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <button
                className="min-w-0 text-left"
                onClick={() => runPrompt(`Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`)}
                type="button"
              >
                <span className="block line-clamp-3 text-sm font-semibold leading-5">{issue.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">#{issue.number} · {formatFileTime(issue.updatedAt)}</span>
              </button>
              <a className={iconButtonClass + " h-8 w-8"} href={issue.htmlUrl} rel="noreferrer" target="_blank" title="Open issue">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${githubUrgencyClass(issue)}`}>{githubUrgency(issue)}</span>
              {issue.labels.slice(0, 3).map((label) => (
                <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]" key={label}>{label}</span>
              ))}
            </div>
          </div>
        ))}
        {issues.length === 0 ? <EmptyState icon={GitBranch} title="No issues loaded" detail="This repository has no open issues in the loaded view." /> : null}
      </div>
    </section>
  );
}

function GithubPullList({
  pullRequests,
  runPrompt,
}: {
  pullRequests: GithubPullRequest[];
  runPrompt: (prompt: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pull requests</h3>
        <StatusBadge ready label={`${pullRequests.length}`} />
      </div>
      <div className="space-y-3">
        {pullRequests.map((pullRequest) => (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3" key={pullRequest.id}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <button
                className="min-w-0 text-left"
                onClick={() => runPrompt(`Summarize GitHub pull request ${pullRequest.repositoryFullName} #${pullRequest.number}`)}
                type="button"
              >
                <span className="block line-clamp-3 text-sm font-semibold leading-5">{pullRequest.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">#{pullRequest.number} · {formatFileTime(pullRequest.updatedAt)}</span>
              </button>
              <a className={iconButtonClass + " h-8 w-8"} href={pullRequest.htmlUrl} rel="noreferrer" target="_blank" title="Open pull request">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)]">{pullRequest.state}</span>
              {pullRequest.draft ? <span className="rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--warning)]">draft</span> : null}
            </div>
          </div>
        ))}
        {pullRequests.length === 0 ? <EmptyState icon={GitBranch} title="No pull requests loaded" detail="Open pull requests will appear here." /> : null}
      </div>
    </section>
  );
}

function GithubWorkspace({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const repositories = briefing?.githubRepositories?.repositories ?? [];
  const issues = briefing?.githubIssues?.issues ?? [];
  const selectedRepo = repositories[0] ?? null;

  return (
    <div className="space-y-4 animate-fade-in">
      <section className={softPanelClass + " p-4"}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{selectedRepo?.fullName ?? "GitHub context"}</h3>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {briefing?.github?.connected ? `${repositories.length} repos loaded` : "GitHub not connected"}
            </p>
          </div>
          <GitBranch className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div className="grid gap-2">
          <button className={primaryButtonClass + " w-full"} onClick={() => runPrompt("What should I fix first on GitHub?")} type="button">
            <Sparkles className="h-4 w-4" />
            Prioritize GitHub work
          </button>
          {selectedRepo?.htmlUrl ? (
            <a className={secondaryButtonClass + " w-full"} href={selectedRepo.htmlUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="h-4 w-4" />
              Open repo
            </a>
          ) : null}
        </div>
      </section>
      <GithubIssueList issues={issues.slice(0, 5)} runPrompt={runPrompt} title="Assigned issues" />
    </div>
  );
}

function MemoryView({
  addMemory,
  notes,
}: {
  addMemory: (body: string) => Promise<void>;
  notes: RelayNote[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <MemoryPermissionSurface addMemory={addMemory} />
      <section className={`${panelClass} p-5`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Memory vault</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Preferences, projects, contacts, and habits.</p>
          </div>
          <StatusBadge ready label={`${notes.length} notes`} />
        </div>
        <div className="space-y-3">
          {notes.length > 0 ? (
            notes.slice(0, 8).map((note) => (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4" key={note.id}>
                <p className="text-sm leading-6">{note.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Brain}
              title="No stored memories yet"
              detail="Approved memories will appear here."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function IntegrationsView({
  connectGithub,
  connectGoogle,
  disconnectGithub,
  disconnectGoogle,
  githubConfigured,
  googleConfigured,
  oauthStatus,
  signedInToGithub,
  signedInToGoogle,
}: {
  connectGithub: () => void;
  connectGoogle: () => void;
  disconnectGithub: () => void;
  disconnectGoogle: () => void;
  githubConfigured: boolean;
  googleConfigured: boolean;
  oauthStatus: OAuthStatus | null;
  signedInToGithub: boolean;
  signedInToGoogle: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-2">
        <IntegrationConnectPanel
          connectedLabel={oauthStatus?.googleEmail ?? "Google user"}
          configured={googleConfigured}
          description="Calendar, Gmail, Drive, Tasks, Contacts read scope, and Meet creation."
          disconnectedLabel="OAuth credentials missing"
          icon={Globe}
          name="Google Workspace"
          onConnect={connectGoogle}
          onDisconnect={disconnectGoogle}
          signedIn={signedInToGoogle}
        />
        <IntegrationConnectPanel
          connectedLabel={oauthStatus?.github?.login ?? "GitHub user"}
          configured={githubConfigured}
          description="Repositories, issues, pull requests, and confirmed issue/comment actions."
          disconnectedLabel="GitHub OAuth credentials missing"
          icon={GitBranch}
          name="GitHub"
          onConnect={connectGithub}
          onDisconnect={disconnectGithub}
          signedIn={signedInToGithub}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {integrationRows.map((integration) => {
          const Icon = integration.icon;
          const isGoogle = integration.provider === "Google";
          const isGithub = integration.provider === "GitHub";
          const ready =
            (isGoogle && integration.implemented && signedInToGoogle) ||
            (isGithub && integration.implemented && signedInToGithub);
          const statusLabel = ready
            ? "Connected"
            : isGoogle
              ? !integration.implemented
                ? "Not implemented"
                : googleConfigured
                  ? "OAuth app ready"
                  : "Missing OAuth"
              : isGithub
                ? githubConfigured
                  ? "OAuth app ready"
                  : "Missing OAuth"
                : "Not installed";
          return (
            <article className={`${panelClass} p-5`} key={integration.name}>
              <div className="mb-5 flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <StatusBadge ready={ready} label={statusLabel} />
              </div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {isGoogle
                  ? integration.implemented
                    ? "Uses your connected Google OAuth session."
                    : "OAuth scope may be requested, but this tool route is not implemented yet."
                  : isGithub
                    ? "Uses your connected GitHub OAuth session."
                    : "No connector is installed in this build."}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function IntegrationConnectPanel({
  connectedLabel,
  configured,
  description,
  disconnectedLabel,
  icon: Icon,
  name,
  onConnect,
  onDisconnect,
  signedIn,
}: {
  connectedLabel: string;
  configured: boolean;
  description: string;
  disconnectedLabel: string;
  icon: LucideIcon;
  name: string;
  onConnect: () => void;
  onDisconnect: () => void;
  signedIn: boolean;
}) {
  return (
    <section className={`${panelClass} p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {signedIn
                ? `Connected as ${connectedLabel}`
                : configured
                  ? "OAuth app configured"
                  : disconnectedLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className={signedIn ? secondaryButtonClass : primaryButtonClass}
            disabled={!configured && !signedIn}
            onClick={onConnect}
            type="button"
          >
            <Link2 className="h-4 w-4" />
            {signedIn ? "Reconnect" : "Connect"}
          </button>
          {signedIn ? (
            <button className={secondaryButtonClass} onClick={onDisconnect} type="button">
              Disconnect
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProfileView({
  connectGithub,
  connectGoogle,
  disconnectGithub,
  disconnectGoogle,
  githubConfigured,
  googleConfigured,
  oauthStatus,
  onSignOut,
  passwordAuth,
  refreshWorkspace,
  signedInToGithub,
  signedInToGoogle,
}: {
  connectGithub: () => void;
  connectGoogle: () => void;
  disconnectGithub: () => void;
  disconnectGoogle: () => void;
  githubConfigured: boolean;
  googleConfigured: boolean;
  oauthStatus: OAuthStatus | null;
  onSignOut: () => Promise<void>;
  passwordAuth: PasswordAuthStatus | null;
  refreshWorkspace: () => Promise<void>;
  signedInToGithub: boolean;
  signedInToGoogle: boolean;
}) {
  const user = passwordAuth?.user;
  const displayEmail = user?.email ?? oauthStatus?.googleEmail ?? oauthStatus?.github?.email ?? "No email connected";
  const displayName = user?.name || oauthStatus?.github?.name || oauthStatus?.github?.login || "Relay user";
  const usingPostgres = passwordAuth?.persistence === "postgres";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "R";

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className={`${panelClass} overflow-hidden`}>
          <div className="profile-identity-band p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/90 text-xl font-semibold text-[var(--accent)] shadow-lg shadow-black/10">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Profile</p>
                  <h2 className="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">{displayName}</h2>
                  <p className="mt-1 truncate text-sm text-white/75">{displayEmail}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge ready={Boolean(user?.emailVerified)} label={user?.emailVerified ? "Email verified" : "Email not verified"} />
                <StatusBadge ready={Boolean(signedInToGoogle || signedInToGithub)} label={signedInToGoogle || signedInToGithub ? "OAuth linked" : "No OAuth"} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <MiniControl label="Password session" value={passwordAuth?.authenticated ? "Active" : "Not signed in"} />
            <MiniControl label="Google" value={signedInToGoogle ? oauthStatus?.googleEmail ?? "Connected" : "Not connected"} />
            <MiniControl label="GitHub" value={signedInToGithub ? oauthStatus?.github?.login ?? "Connected" : "Not connected"} />
          </div>
        </div>

        <ProfilePasswordPanel
          canChangePassword={Boolean(passwordAuth?.authenticated)}
          onPasswordChanged={refreshWorkspace}
          onSignOut={onSignOut}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`${panelClass} p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Connected identities</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Manage the accounts this assistant can use.</p>
            </div>
            <Link2 className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="space-y-3">
            <ProfileConnectionRow
              configured={googleConfigured}
              detail={signedInToGoogle ? oauthStatus?.googleEmail ?? "Google Workspace connected" : "Calendar, Gmail, Drive, and Tasks access"}
              icon={Globe}
              name="Google Workspace"
              onConnect={connectGoogle}
              onDisconnect={disconnectGoogle}
              signedIn={signedInToGoogle}
            />
            <ProfileConnectionRow
              configured={githubConfigured}
              detail={signedInToGithub ? oauthStatus?.github?.login ?? "GitHub connected" : "Repositories, issues, and pull requests"}
              icon={GitBranch}
              name="GitHub"
              onConnect={connectGithub}
              onDisconnect={disconnectGithub}
              signedIn={signedInToGithub}
            />
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Account persistence</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">What is real in this deployment.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <SettingRow label="Email/password users" value={usingPostgres ? "Postgres database" : "Local JSON file store"} />
            <SettingRow label="Session type" value="Signed HTTP-only cookie" />
            <SettingRow label="Vercel database" value={usingPostgres ? "Connected through DATABASE_URL" : "Not connected yet"} />
            <SettingRow label="Production recommendation" value="Postgres + Auth adapter" />
          </div>
          <p
            className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
              usingPostgres
                ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                : "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
            }`}
          >
            {usingPostgres
              ? "Password users, local tasks, memories, task columns, and scheduled-email metadata are now persisted through Postgres when DATABASE_URL is available."
              : "On Vercel, local filesystem data can disappear between deployments or instances. Connect a Postgres database and set DATABASE_URL before inviting real users."}
          </p>
        </div>
      </section>
    </div>
  );
}

function ProfilePasswordPanel({
  canChangePassword,
  onPasswordChanged,
  onSignOut,
}: {
  canChangePassword: boolean;
  onPasswordChanged: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ tone: "warning", text: "New passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { ok: boolean; reason?: string };

      if (!response.ok || !data.ok) {
        setMessage({ tone: "warning", text: data.reason ?? "Unable to change password." });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ tone: "success", text: "Password updated. Your session remains active." });
      await onPasswordChanged();
    } catch {
      setMessage({ tone: "warning", text: "Password update failed. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className={`${panelClass} p-5`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Change password or end this browser session.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <Field
          autoComplete="current-password"
          label="Current password"
          name="currentPassword"
          onChange={setCurrentPassword}
          placeholder="Current password"
          type="password"
          value={currentPassword}
        />
        <Field
          autoComplete="new-password"
          label="New password"
          name="newPassword"
          onChange={setNewPassword}
          placeholder="8+ characters"
          type="password"
          value={newPassword}
        />
        <Field
          autoComplete="new-password"
          label="Confirm new password"
          name="confirmPassword"
          onChange={setConfirmPassword}
          placeholder="Repeat new password"
          type="password"
          value={confirmPassword}
        />
        {message ? (
          <p className={`rounded-lg p-3 text-sm font-medium ${message.tone === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--warning-soft)] text-[var(--warning)]"}`}>
            {message.text}
          </p>
        ) : null}
        <button className={primaryButtonClass + " w-full"} disabled={!canChangePassword || saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Change password
        </button>
      </form>

      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <button className={secondaryButtonClass + " w-full"} disabled={signingOut} onClick={signOut} type="button">
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out
        </button>
        {!canChangePassword ? (
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Password changes require an active email/password session. OAuth-only users can manage
            connected accounts below.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ProfileConnectionRow({
  configured,
  detail,
  icon: Icon,
  name,
  onConnect,
  onDisconnect,
  signedIn,
}: {
  configured: boolean;
  detail: string;
  icon: LucideIcon;
  name: string;
  onConnect: () => void;
  onDisconnect: () => void;
  signedIn: boolean;
}) {
  return (
    <div className="hover-lift rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 transition">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{name}</p>
            <p className="mt-1 truncate text-sm text-[var(--muted)]">{detail}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className={signedIn ? secondaryButtonClass : primaryButtonClass}
            disabled={!configured && !signedIn}
            onClick={onConnect}
            type="button"
          >
            {signedIn ? "Reconnect" : "Connect"}
          </button>
          {signedIn ? (
            <button className={secondaryButtonClass} onClick={onDisconnect} type="button">
              Disconnect
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsView({
  aiStatus,
  oauthStatus,
}: {
  aiStatus: AiStatus | null;
  oauthStatus: OAuthStatus | null;
}) {
  const [providerHealth, setProviderHealth] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [checkingProvider, setCheckingProvider] = useState(false);

  async function testProvider() {
    setCheckingProvider(true);
    setProviderHealth(null);

    try {
      const response = await fetch("/api/ai/health", { method: "POST" });
      const data = (await response.json()) as {
        ok: boolean;
        message: string;
      };

      setProviderHealth({
        ok: response.ok && data.ok,
        message: data.message,
      });
    } catch (error) {
      setProviderHealth({
        ok: false,
        message: error instanceof Error ? error.message : "Unable to reach the provider check.",
      });
    } finally {
      setCheckingProvider(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className={`${panelClass} p-5`}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">AI provider</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {aiStatus?.configured ? `${aiStatus.label} key is present` : "Local mode"}
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <SettingRow label="Provider" value={aiStatus?.label ?? "OpenRouter"} />
          <SettingRow label="Model" value={aiStatus?.modelId ?? "openrouter/free"} />
          <SettingRow label="Server key" value={aiStatus?.configured ? "Present" : "Missing"} />
          <SettingRow label="Recommended free start" value="OpenRouter free router" />
          <SettingRow label="Regional fallback" value="Gemini when available" />
        </div>
        <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Live provider check</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Confirms the server key can make a real model call.
              </p>
            </div>
            <button
              className={secondaryButtonClass}
              disabled={checkingProvider}
              onClick={testProvider}
              type="button"
            >
              {checkingProvider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test
            </button>
          </div>
          {providerHealth ? (
            <p
              className={
                providerHealth.ok
                  ? "mt-3 text-sm font-medium text-[var(--success)]"
                  : "mt-3 text-sm font-medium text-[var(--warning)]"
              }
            >
              {providerHealth.ok ? "Connected: " : "Provider issue: "}
              {providerHealth.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className={`${panelClass} p-5`}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Security posture</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Human approval and scoped OAuth.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <SettingRow label="Google OAuth" value={oauthStatus?.hasDirectGoogleToken ? "Connected" : "Not connected"} />
          <SettingRow label="GitHub OAuth" value={oauthStatus?.github?.connected ? oauthStatus.github.login ?? "Connected" : "Not connected"} />
          <SettingRow label="Token storage" value="HTTP-only cookie in development" />
          <SettingRow label="High-impact actions" value="Approval required" />
          <SettingRow label="Long-term memory" value="Permission required" />
        </div>
      </section>
    </div>
  );
}

function RightSidebar({
  aiStatus,
  briefing,
  oauthStatus,
  openTasks,
  signedInToGoogle,
}: {
  aiStatus: AiStatus | null;
  briefing: Briefing | null;
  oauthStatus: OAuthStatus | null;
  openTasks: RelayTask[];
  signedInToGoogle: boolean;
}) {
  return (
    <aside className="hidden min-h-screen flex-col gap-4 bg-[var(--surface-soft)] p-4 xl:flex">
      <section className={`${panelClass} hover-lift p-4`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Current task</h2>
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {briefing?.focus?.title ?? openTasks[0]?.title ?? "No current task. Add one from chat or Tasks."}
        </p>
      </section>

      <RailDisclosure defaultOpen icon={Activity} title="System checks">
        {[
          {
            label: "AI server key",
            ready: Boolean(aiStatus?.configured),
            value: aiStatus?.configured ? aiStatus.label : "Missing",
          },
          {
            label: "Google OAuth",
            ready: signedInToGoogle,
            value: oauthStatus?.googleEmail ?? "Not connected",
          },
          {
            label: "Calendar data",
            ready: Boolean(briefing?.calendar.ok),
            value: briefing?.calendar.ok ? `${briefing.calendar.events.length} events` : "Unavailable",
          },
          {
            label: "Drive data",
            ready: Boolean(briefing?.drive.ok),
            value: briefing?.drive.ok ? `${briefing.drive.files.length} files` : "Unavailable",
          },
        ].map((check) => (
          <SidebarStatus
            key={check.label}
            label={check.label}
            ready={check.ready}
            value={check.value}
          />
        ))}
      </RailDisclosure>

      <RailDisclosure icon={Cloud} title="Active integrations">
        <div className="space-y-2">
          <SidebarStatus label="Google" ready={signedInToGoogle} value={oauthStatus?.googleEmail ?? "OAuth"} />
          <SidebarStatus label="AI" ready={Boolean(aiStatus?.configured)} value={aiStatus?.configured ? `${aiStatus.label} key` : "Local"} />
          <SidebarStatus label="Local store" ready value={`${openTasks.length} open tasks`} />
        </div>
      </RailDisclosure>

      <RailDisclosure icon={Bell} title="Workspace facts">
        <div className="space-y-3 text-sm">
          <NotificationLine
            icon={CalendarDays}
            text={
              briefing?.google.connected
                ? `${briefing.calendar.events.length} upcoming calendar events loaded`
                : "Google Calendar is not connected"
            }
          />
          <NotificationLine
            icon={FolderOpen}
            text={
              briefing?.google.connected
                ? `${briefing.drive.files.length} recent Drive files loaded`
                : "Google Drive is not connected"
            }
          />
          <NotificationLine icon={ListTodo} text={`${openTasks.length} tasks remain open`} />
        </div>
      </RailDisclosure>
    </aside>
  );
}

function RailDisclosure({
  children,
  defaultOpen = false,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  icon: LucideIcon;
  title: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <button
        aria-expanded={open}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--accent-soft)]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">{title}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`collapsible-content ${open ? "is-open" : ""}`}>
        <div className="border-t border-[var(--line)] p-4">{children}</div>
      </div>
    </section>
  );
}

function RecentFilesPanel({ briefing }: { briefing: Briefing | null }) {
  const files = briefing?.drive.files ?? [];

  return (
    <section className={`${panelClass} hover-lift p-5`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent files</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {briefing?.google.connected
              ? "Loaded from Google Drive."
              : "Connect Google Drive to list real files."}
          </p>
        </div>
        <StatusBadge
          ready={Boolean(briefing?.google.connected)}
          label={briefing?.google.connected ? "Connected" : "Not connected"}
        />
      </div>
      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => {
            const content = (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                  <DriveFileGlyph className="h-5 w-5" mimeType={file.mimeType} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {driveFileType(file.mimeType)} by {file.owner ?? "Unknown owner"}
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)]">{formatFileTime(file.modifiedTime)}</span>
              </>
            );

            return file.webViewLink ? (
              <a
                className="interactive-row grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                href={file.webViewLink}
                key={file.id ?? file.name}
                rel="noreferrer"
                target="_blank"
              >
                {content}
              </a>
            ) : (
              <div
                className="interactive-row grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                key={file.id ?? file.name}
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={briefing?.google.connected ? "No Drive files loaded" : "Drive not connected"}
          detail={briefing?.drive.reason ?? "Connect Google and refresh the workspace."}
        />
      )}
    </section>
  );
}

function CommandPalette({
  actions,
  open,
  setOpen,
}: {
  actions: Array<{ label: string; icon: LucideIcon; run: () => void }>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase()),
  );

  function run(action: { run: () => void }) {
    action.run();
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && filtered[0]) {
      run(filtered[0]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm">
      <div className={`${panelClass} w-full max-w-xl overflow-hidden`}>
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--muted)]" />
          <input
            autoFocus
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands..."
            value={query}
          />
          <button
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            onClick={() => setOpen(false)}
            type="button"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.map((action) => {
            const Icon = action.icon;
            return (
              <button
                className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-[var(--surface-soft)]"
                key={action.label}
                onClick={() => run(action)}
                type="button"
              >
                <Icon className="h-4 w-4 text-[var(--accent)]" />
                {action.label}
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--muted)]">No matching commands.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          className={`${panelClass} animate-slide-up border-l-4 p-4 ${
            toast.tone === "success"
              ? "border-l-[var(--success)]"
              : toast.tone === "warning"
                ? "border-l-[var(--warning)]"
                : "border-l-[var(--accent)]"
          }`}
          key={toast.id}
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.detail ? <p className="mt-1 text-xs text-[var(--muted)]">{toast.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

function TaskContextMenu({
  contextMenu,
  onClose,
  onComplete,
}: {
  contextMenu: { x: number; y: number; task: RelayTask };
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <div
      className={`${panelClass} fixed z-50 w-52 p-2`}
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-[var(--surface-soft)]"
        onClick={() => {
          onComplete();
          onClose();
        }}
        type="button"
      >
        <Check className="h-4 w-4 text-[var(--success)]" />
        Complete
      </button>
      <button
        className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-[var(--surface-soft)]"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4 text-[var(--muted)]" />
        Close menu
      </button>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white shadow-lg shadow-black/10">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <p className="text-base font-semibold leading-5">Relay</p>
        <p className="text-xs text-[var(--muted)]">Personal AI OS</p>
      </div>
    </div>
  );
}

function Field({
  autoComplete,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  placeholder: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</span>
      <input
        autoComplete={autoComplete}
        className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
        <MoreHorizontal className="h-4 w-4 text-[var(--muted)]" />
      </div>
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniControl({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-3">
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-left text-sm font-semibold"
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[var(--accent)]" : "bg-[var(--track)]"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function StatusBadge({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
        ready
          ? "bg-[var(--success-soft)] text-[var(--success)]"
          : "bg-[var(--warning-soft)] text-[var(--warning)]"
      }`}
    >
      {ready ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

function SidebarStatus({
  label,
  ready,
  value,
}: {
  label: string;
  ready: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <span className={ready ? "text-xs font-semibold text-[var(--success)]" : "text-xs font-semibold text-[var(--warning)]"}>
        {value}
      </span>
    </div>
  );
}

function NotificationLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2">
      <Icon className="h-4 w-4 text-[var(--accent)]" />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-[var(--muted)]" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function priorityLabel(priority?: RelayTaskPriority) {
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function priorityWeight(priority?: RelayTaskPriority) {
  if (priority === "urgent") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function priorityTone(priority?: RelayTaskPriority) {
  if (priority === "urgent") return "bg-[var(--danger-soft)] text-[var(--danger)]";
  if (priority === "high") return "bg-[var(--warning-soft)] text-[var(--warning)]";
  if (priority === "low") return "bg-[var(--success-soft)] text-[var(--success)]";
  return "bg-[var(--accent-soft)] text-[var(--accent)]";
}

function PriorityTag({ priority }: { priority?: RelayTaskPriority }) {
  return (
    <span className={`inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold ${priorityTone(priority)}`}>
      {priorityLabel(priority)}
    </span>
  );
}

function PriorityDot({ priority }: { priority?: RelayTaskPriority }) {
  const color =
    priority === "urgent"
      ? "bg-[var(--danger)]"
      : priority === "high"
        ? "bg-[var(--warning)]"
        : priority === "low"
          ? "bg-[var(--success)]"
          : "bg-[var(--accent)]";

  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function formatDueDate(value?: string | null) {
  if (!value) return "No due date";
  const date = parseEventDate(value);
  if (!date) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(value?: string | null) {
  const date = parseEventDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function sortTasksByUrgency(items: RelayTask[]) {
  return [...items].sort((left, right) => {
    const leftDue = parseEventDate(left.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightDue = parseEventDate(right.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const leftScore = priorityWeight(left.priority) + (isOverdue(left.due) ? 10 : 0);
    const rightScore = priorityWeight(right.priority) + (isOverdue(right.due) ? 10 : 0);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return leftDue - rightDue;
  });
}

function googleTaskPriority(task: GoogleTask): RelayTaskPriority {
  const text = `${task.title} ${task.notes ?? ""}`.toLowerCase();
  if (text.includes("urgent") || isOverdue(task.due)) return "urgent";
  if (text.includes("priority: high") || text.includes("high priority")) return "high";
  if (text.includes("priority: low") || text.includes("low priority")) return "low";
  return "medium";
}

function githubUrgency(issue: GithubIssue) {
  const text = `${issue.title} ${issue.labels.join(" ")}`.toLowerCase();
  if (/(security|critical|urgent|blocker|prod|production|crash)/.test(text)) return "Urgent";
  if (/(bug|broken|regression|hotfix)/.test(text)) return "High";
  if (/(question|docs|cleanup|chore)/.test(text)) return "Low";
  return "Normal";
}

function githubUrgencyClass(issue: GithubIssue) {
  const urgency = githubUrgency(issue);
  if (urgency === "Urgent") return "bg-[var(--danger-soft)] text-[var(--danger)]";
  if (urgency === "High") return "bg-[var(--warning-soft)] text-[var(--warning)]";
  if (urgency === "Low") return "bg-[var(--success-soft)] text-[var(--success)]";
  return "bg-[var(--accent-soft)] text-[var(--accent)]";
}

function buildPlannerActions(
  briefing: Briefing | null,
  openTasks: RelayTask[],
  runPrompt: (prompt: string) => void,
  setActiveView: (view: ViewId) => void,
) {
  const now = new Date();
  const sortedTasks = sortTasksByUrgency(openTasks);
  const overdueTask = sortedTasks.find((task) => isOverdue(task.due));
  const nextEvent = briefing?.calendar.events
    .map((event) => ({ event, start: parseEventDate(event.start) }))
    .filter((item): item is { event: CalendarEvent; start: Date } => Boolean(item.start))
    .filter((item) => item.start.getTime() >= now.getTime())
    .sort((left, right) => left.start.getTime() - right.start.getTime())[0]?.event;
  const urgentIssue = briefing?.githubIssues?.issues.find((issue) => githubUrgency(issue) === "Urgent");
  const inboxMessage = briefing?.gmail?.messages[0];
  const recentFile = briefing?.drive.files[0];
  const actions: Array<{ detail: string; icon: LucideIcon; onClick: () => void; title: string }> = [];

  if (overdueTask) {
    actions.push({
      icon: ListTodo,
      title: `Clear overdue task`,
      detail: `${overdueTask.title} was due ${formatDueDate(overdueTask.due)}.`,
      onClick: () => {
        setActiveView("tasks");
        runPrompt(`Help me finish overdue task: ${overdueTask.title}`);
      },
    });
  }

  if (nextEvent) {
    actions.push({
      icon: CalendarDays,
      title: "Prepare next meeting",
      detail: `${nextEvent.title} starts ${formatEventTime(nextEvent.start)}.`,
      onClick: () => runPrompt("Prepare me for my next meeting"),
    });
  }

  if (urgentIssue) {
    actions.push({
      icon: GitBranch,
      title: "Review GitHub blocker",
      detail: `${urgentIssue.repositoryFullName ?? "GitHub"} #${urgentIssue.number}: ${urgentIssue.title}`,
      onClick: () => {
        setActiveView("github");
        runPrompt(`What should I do about GitHub issue ${urgentIssue.repositoryFullName ?? ""} #${urgentIssue.number}?`);
      },
    });
  }

  if (inboxMessage) {
    actions.push({
      icon: Mail,
      title: "Triage latest email",
      detail: `${inboxMessage.from ?? "Gmail"}: ${inboxMessage.subject}`,
      onClick: () => runPrompt(`Summarize this email and suggest a response: ${inboxMessage.subject}`),
    });
  }

  if (recentFile) {
    actions.push({
      icon: FolderOpen,
      title: "Review recent file",
      detail: `${recentFile.name} changed ${formatFileTime(recentFile.modifiedTime)}.`,
      onClick: () => {
        setActiveView("files");
        runPrompt(`Summarize recent Drive file ${recentFile.name}`);
      },
    });
  }

  if (sortedTasks[0] && !overdueTask) {
    actions.push({
      icon: CheckCircle2,
      title: "Advance priority task",
      detail: `${sortedTasks[0].title} is the highest-ranked open local task.`,
      onClick: () => {
        setActiveView("tasks");
        runPrompt(`Plan the next step for ${sortedTasks[0].title}`);
      },
    });
  }

  return actions.slice(0, 3);
}

function inferExecutionTrace(messages: Message[]) {
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";

  if (/(github|repo|repository|issue|pull request|pr )/.test(latest)) {
    return ["Checking GitHub context", "Selecting repo tools", "Preparing issue workspace"];
  }
  if (/(calendar|meeting|schedule|availability|birthday)/.test(latest)) {
    return ["Fetching calendar events", "Checking task deadlines", "Building scheduling UI"];
  }
  if (/(email|gmail|inbox|draft|reply)/.test(latest)) {
    return ["Reading Gmail context", "Checking drafts", "Preparing email actions"];
  }
  if (/(drive|file|document|pdf)/.test(latest)) {
    return ["Searching Drive files", "Reading metadata", "Preparing file preview"];
  }
  if (/(task|todo|deadline|remind)/.test(latest)) {
    return ["Reviewing task lists", "Ranking urgency", "Preparing task builder"];
  }

  return ["Understanding intent", "Selecting tools", "Preparing workspace"];
}

function AvatarIcon({ role }: { role: Message["role"] }) {
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${role === "user" ? "bg-[var(--accent)] text-white" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
      {role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </span>
  );
}

function authLabel(mode: AuthMode) {
  if (mode === "signup") return "Sign Up";
  if (mode === "forgot") return "Reset";
  if (mode === "verify") return "Verify";
  return "Login";
}

function authActionLabel(mode: AuthMode) {
  if (mode === "signup") return "Create account";
  if (mode === "forgot") return "Send or use reset code";
  if (mode === "verify") return "Verify email";
  return "Sign in";
}

function inferGeneratedSurface(message: string): GeneratedSurface | undefined {
  const text = message.toLowerCase();
  const wantsCalendarWrite =
    /\b(schedule|book|create|add|set up|set|plan)\b/.test(text) &&
    /\b(meeting|event|call|calendar)\b/.test(text);
  const wantsTaskWrite =
    /\b(add|create|make|save|remind|reminder)\b/.test(text) &&
    /\b(task|todo|to-do|remind|reminder)\b/.test(text);
  const wantsEmailDraft =
    /\b(draft|write|compose|reply|respond)\b/.test(text) &&
    /\b(email|gmail|message)\b/.test(text);

  if (wantsCalendarWrite) {
    return "schedule";
  }
  if (wantsTaskWrite) {
    return "task";
  }
  if (text.includes("drive") || text.includes("file") || text.includes("document")) {
    return "files";
  }
  if (text.includes("remember") || text.includes("memory") || text.includes("preference")) {
    return "memory";
  }
  if (wantsEmailDraft) {
    return "email";
  }
  return undefined;
}

function inferContextWorkspaceMode(messages: Message[]): ContextWorkspaceMode {
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const text = latest.toLowerCase();

  if (
    text.includes("schedule") ||
    text.includes("meeting") ||
    text.includes("calendar") ||
    text.includes("availability") ||
    text.includes("birthday") ||
    text.includes("birthdays")
  ) {
    return "calendar";
  }
  if (text.includes("task") || text.includes("todo") || text.includes("deadline") || text.includes("remind me")) {
    return "tasks";
  }
  if (text.includes("drive") || text.includes("file") || text.includes("document") || text.includes("pdf")) {
    return "files";
  }
  if (
    text.includes("github") ||
    text.includes("repo") ||
    text.includes("repository") ||
    text.includes("issue") ||
    text.includes("pull request") ||
    text.includes("pr ")
  ) {
    return "github";
  }
  if (text.includes("remember") || text.includes("memory") || text.includes("preference")) {
    return "memory";
  }
  if (text.includes("email") || text.includes("gmail") || text.includes("draft") || text.includes("inbox")) {
    return "email";
  }

  return "focus";
}

function contextWorkspaceMeta(mode: ContextWorkspaceMode) {
  const meta: Record<
    ContextWorkspaceMode,
    { detail: string; icon: LucideIcon; label: string; signal: string }
  > = {
    focus: {
      detail: "Today, priorities, and next actions",
      icon: Sparkles,
      label: "Context workspace",
      signal: "Focus",
    },
    calendar: {
      detail: "Interactive schedule and event creation",
      icon: CalendarDays,
      label: "Calendar",
      signal: "Scheduling",
    },
    tasks: {
      detail: "Local and Google Tasks execution",
      icon: ListTodo,
      label: "Task manager",
      signal: "Tasks",
    },
    files: {
      detail: "Drive browser and file intelligence",
      icon: FolderOpen,
      label: "Files",
      signal: "Drive",
    },
    github: {
      detail: "Repository, issue, and pull request context",
      icon: GitBranch,
      label: "GitHub",
      signal: "Dev",
    },
    memory: {
      detail: "Approved long-term notes",
      icon: Brain,
      label: "Memory",
      signal: "Memory",
    },
    email: {
      detail: "Drafting and approval workflow",
      icon: Mail,
      label: "Email",
      signal: "Gmail",
    },
  };

  return meta[mode];
}

function parseEventDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameCalendarDay(left: Date | null, right: Date | null) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function formatHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric" });
}
