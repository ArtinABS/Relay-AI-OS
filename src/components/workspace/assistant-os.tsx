"use client";

import type {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  Avatar,
  Calendar,
  Card,
  Checkbox,
  Chip,
  DateField,
  DatePicker,
  Disclosure,
  Label,
  Link,
  Modal,
  ProgressBar,
  ScrollShadow,
  Skeleton,
  Surface,
  Switch,
  Tooltip,
} from "@heroui/react";
import { parseDate, type DateValue } from "@internationalized/date";
import { Button, Input, Select, TextArea } from "@/components/ui/relay-ui";
import Image from "next/image";
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
  taskListId?: string | null;
  taskListTitle?: string | null;
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

type GoogleTaskPriority = "low" | "medium" | "high";

type GoogleTaskInput = {
  title: string;
  notes: string | null;
  due: string | null;
  priority: GoogleTaskPriority;
  taskListId: string | null;
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

type GoogleContact = {
  resourceName?: string | null;
  etag?: string | null;
  displayName: string;
  givenName?: string | null;
  familyName?: string | null;
  emails: string[];
  phoneNumbers: string[];
  organization?: string | null;
  jobTitle?: string | null;
  birthday?: string | null;
  notes?: string | null;
  address?: string | null;
  photoUrl?: string | null;
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
  contacts?: {
    ok: boolean;
    reason?: string;
    contacts: GoogleContact[];
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
type TaskSurfaceContext = {
  title?: string;
  due?: string;
  notes?: string;
  priority?: RelayTaskPriority;
  relatedCompletionHint?: string;
};
type GeneratedSurfaceContext = {
  task?: TaskSurfaceContext;
};
type AssistantUiRequest = {
  id: string;
  kind: "need_more_info";
  detail: string;
  action: "shift_task_due" | "select_task" | "generic";
  daysDelta?: number;
};
type ContextWorkspaceMode =
  | "focus"
  | "calendar"
  | "tasks"
  | "files"
  | "github"
  | "memory"
  | "contacts"
  | "email";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  surface?: GeneratedSurface;
  surfaceContext?: GeneratedSurfaceContext;
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

const integrationRows = [
  {
    name: "Google Calendar",
    icon: CalendarDays,
    provider: "Google",
    implemented: true,
  },
  { name: "Gmail", icon: Mail, provider: "Google", implemented: true },
  {
    name: "Google Drive",
    icon: FolderOpen,
    provider: "Google",
    implemented: true,
  },
  {
    name: "Google Tasks",
    icon: ListTodo,
    provider: "Google",
    implemented: true,
  },
  { name: "Contacts", icon: Users, provider: "Google", implemented: true },
  { name: "GitHub", icon: GitBranch, provider: "GitHub", implemented: true },
  {
    name: "Slack",
    icon: MessageSquare,
    provider: "Not installed",
    implemented: false,
  },
  {
    name: "OpenWeather",
    icon: Globe,
    provider: "Not installed",
    implemented: false,
  },
];

const panelClass =
  "relay-panel min-w-0 rounded-2xl border border-separator bg-surface shadow-surface transition duration-200 ease-out";
const softPanelClass =
  "relay-soft-panel min-w-0 rounded-xl border border-separator bg-surface-secondary transition duration-200 ease-out";
const iconButtonClass =
  "interactive-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-separator bg-surface-secondary text-muted transition hover:border-border-secondary hover:bg-accent-soft hover:text-accent";
const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "interactive-control inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-separator bg-surface-secondary px-4 text-sm font-semibold text-foreground transition hover:border-border-secondary hover:bg-surface-tertiary";
const calendarStartHour = 7;
const calendarEndHour = 24;
const calendarHourHeight = 56;

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
  if (mimeType.includes("spreadsheet"))
    return <FileSpreadsheet className={className} />;
  if (mimeType.includes("presentation"))
    return <Columns3 className={className} />;
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
  const [passwordAuth, setPasswordAuth] = useState<PasswordAuthStatus | null>(
    null,
  );
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
        addToast(
          "Google connected",
          "Workspace permissions are ready.",
          "success",
        );
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

  function addToast(
    title: string,
    detail: string | undefined,
    tone: Toast["tone"],
  ) {
    const id = createId("toast");
    setToasts((current) => [...current, { id, title, detail, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  async function refreshWorkspace() {
    const [
      notesResponse,
      oauthResponse,
      passwordResponse,
      briefingResponse,
      aiResponse,
    ] = await Promise.all([
      fetch("/api/local-tools/notes"),
      fetch("/api/oauth/status"),
      fetch("/api/auth/password/status"),
      fetch("/api/local-tools/briefing"),
      fetch("/api/ai/status"),
    ]);

    const notesData = (await notesResponse.json()) as { notes: RelayNote[] };
    const oauthData = (await oauthResponse.json()) as OAuthStatus;
    const passwordData = (await passwordResponse.json()) as PasswordAuthStatus;
    const briefingData = (await briefingResponse.json()) as Briefing;
    const aiData = (await aiResponse.json()) as AiStatus;

    const googleTasks = briefingData.googleTasks?.tasks ?? [];
    const mappedTasks: RelayTask[] = googleTasks
      .filter((task): task is GoogleTask & { id: string } => Boolean(task.id))
      .map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.status === "completed",
        createdAt: task.updated ?? new Date().toISOString(),
        completedAt: task.completed ?? undefined,
        updatedAt: task.updated ?? undefined,
        notes: googleTaskNotes(task.notes),
        due: task.due,
        priority: googleTaskPriority(task),
        columnId: task.taskListId,
        taskListId: task.taskListId,
        taskListTitle: task.taskListTitle,
      }));
    const mappedColumns: TaskColumn[] = (
      briefingData.googleTasks?.taskLists ?? []
    )
      .filter(
        (taskList): taskList is { id: string; title: string } =>
          Boolean(taskList.id),
      )
      .map((taskList, index) => ({
        id: taskList.id,
        title: taskList.title,
        order: index,
        createdAt: new Date(0).toISOString(),
      }));

    setTasks(mappedTasks);
    setTaskColumns(mappedColumns);
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

    const response = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: trimmed,
        notes: parsed.notes,
        due: parsed.due,
        priority:
          parsed.priority === "urgent" ? "high" : (parsed.priority ?? "medium"),
        taskListId: parsed.columnId,
      }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { reason?: string };
      throw new Error(data.reason ?? "Google Tasks could not create this task.");
    }
    await refreshWorkspace();
    addToast("Google Task created", trimmed, "success");
  }

  async function completeTask(task: RelayTask) {
    const response = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        id: task.id,
        taskListId: task.taskListId ?? task.columnId,
      }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { reason?: string };
      throw new Error(data.reason ?? "Google Tasks could not complete this task.");
    }
    await refreshWorkspace();
    addToast("Google Task completed", task.title, "success");
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

  function completeSurfaceMessage(
    messageId: string,
    summary: string,
    link?: string | null,
  ) {
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

  async function submitMessage(
    event?: FormEvent<HTMLFormElement>,
    overrideMessage?: string,
  ) {
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

    const generatedSurface = inferGeneratedSurface(message);

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
        const fallbackData =
          await readJsonResponse<AssistantEndpointResponse>(fallbackResponse);

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
          ...(generatedSurface
            ? [
                {
                  id: createId("surface"),
                  role: "assistant" as const,
                  content: "",
                  timestamp: nowLabel(),
                  surface: generatedSurface.surface,
                  surfaceContext: generatedSurface.context,
                  surfaceStatus: "active" as const,
                },
              ]
            : []),
        ]);

        await refreshWorkspace();
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
        {
          id: createId("assistant"),
          role: "assistant" as const,
          content: assistantContent,
          timestamp: nowLabel(),
        },
        ...(generatedSurface
          ? [
              {
                id: createId("surface"),
                role: "assistant" as const,
                content: "",
                timestamp: nowLabel(),
                surface: generatedSurface.surface,
                surfaceContext: generatedSurface.context,
                surfaceStatus: "active" as const,
              },
            ]
          : []),
      ]);

      await refreshWorkspace();
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
      .then(() =>
        addToast("Google disconnected", "OAuth tokens were removed.", "info"),
      )
      .catch(() =>
        addToast(
          "Disconnect failed",
          "Try again from Integrations.",
          "warning",
        ),
      );
  }

  function connectGithub() {
    window.location.href = "/api/github/oauth/start";
  }

  function disconnectGithub() {
    fetch("/api/github/oauth/disconnect", { method: "POST" })
      .then(() => refreshWorkspace())
      .then(() =>
        addToast("GitHub disconnected", "OAuth tokens were removed.", "info"),
      )
      .catch(() =>
        addToast(
          "Disconnect failed",
          "Try again from Integrations.",
          "warning",
        ),
      );
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
      addToast(
        "Signed out",
        "Email/password session was cleared on this device.",
        "info",
      );
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
      run: () =>
        runPrompt(
          "Summarize my GitHub repositories, issues, and pull requests",
        ),
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
      className={`assistant-shell ${theme} ${stage === "auth" ? "" : "relay-product-shell"} min-h-screen bg-[var(--app-bg)] text-[var(--text)] transition-colors duration-300`}
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
                ? {
                    email: formEmail,
                    code: formCode,
                    password: formPassword,
                    remember,
                  }
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
        await onPasswordAuthenticated(
          `Signed in as ${data.user?.email ?? formEmail}.`,
        );
        return;
      }

      if (response.ok && data.ok && authMode === "signup") {
        setAuthMode("verify");
        setDevCode(data.devVerificationCode ?? null);
        setAuthNotice(
          "Account created. Enter the verification code to activate it.",
        );
        return;
      }

      if (response.ok && data.ok && authMode === "forgot") {
        if (data.user) {
          await onPasswordAuthenticated(
            `Password reset for ${data.user.email ?? formEmail}.`,
          );
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
        await onPasswordAuthenticated(
          `Verified and signed in as ${data.user?.email ?? formEmail}.`,
        );
        return;
      }

      if (data.verificationRequired) {
        setAuthMode("verify");
        setDevCode(data.devVerificationCode ?? null);
      }
      setAuthNotice(data.reason ?? "Authentication failed.");
    } catch (error) {
      setAuthNotice(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isPrimaryMode = authMode === "login" || authMode === "signup";
  const heading =
    authMode === "signup"
      ? "Create your account"
      : authMode === "forgot"
        ? "Reset your password"
        : authMode === "verify"
          ? "Verify your email"
          : "Welcome back";
  const description =
    authMode === "signup"
      ? "Set up your Relay workspace in a moment."
      : authMode === "forgot"
        ? "Request a code, then enter it with your new password."
        : authMode === "verify"
          ? "Enter the code created for your account."
          : "Sign in to continue to your personal workspace.";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Button
        aria-label="Toggle color theme"
        className="absolute right-5 top-5"
        isIconOnly
        onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
        title="Toggle theme"
        variant="ghost"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Card className="w-full max-w-[420px] overflow-hidden border border-[var(--line)] bg-[var(--surface)] p-0 shadow-[var(--shadow-strong)]">
        <Card.Header className="flex flex-col items-start gap-5 border-b border-[var(--line)] px-6 py-6">
          <BrandMark />
          <div>
            <Card.Title className="text-2xl font-semibold tracking-tight">
              {heading}
            </Card.Title>
            <Card.Description className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
              {description}
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content className="px-6 py-6">
          {isPrimaryMode ? (
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-[var(--surface-soft)] p-1">
              {(["login", "signup"] as AuthMode[]).map((mode) => (
                <Button
                  className="w-full"
                  key={mode}
                  onPress={() => {
                    setAuthMode(mode);
                    setAuthNotice(null);
                    setDevCode(null);
                  }}
                  size="sm"
                  variant={authMode === mode ? "secondary" : "ghost"}
                >
                  {mode === "login" ? "Sign in" : "Create account"}
                </Button>
              ))}
            </div>
          ) : (
            <Button
              className="mb-5 -ml-2"
              onPress={() => {
                setAuthMode("login");
                setAuthNotice(null);
                setDevCode(null);
              }}
              size="sm"
              variant="ghost"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to sign in
            </Button>
          )}

          <form className="space-y-4" onSubmit={submit}>
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
                label={
                  authMode === "forgot" ? "Reset code" : "Verification code"
                }
                name="code"
                onChange={setCode}
                placeholder="284991"
                value={code}
              />
            ) : null}

            {authMode === "login" ||
            authMode === "signup" ||
            authMode === "forgot" ? (
              <Field
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
                label={authMode === "forgot" ? "New password" : "Password"}
                name="password"
                placeholder="Enter your password"
                type="password"
              />
            ) : null}

            {authMode === "login" ? (
              <div className="flex items-center justify-between gap-4 text-sm">
                <Checkbox isSelected={remember} onChange={setRemember}>
                  <Checkbox.Content className="text-[var(--muted)]">
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    Remember me
                  </Checkbox.Content>
                </Checkbox>
                <Button
                  className="px-0 text-[var(--accent)]"
                  onPress={() => {
                    setAuthMode("forgot");
                    setAuthNotice(null);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Forgot password?
                </Button>
              </div>
            ) : null}

            <Button
              fullWidth
              isDisabled={submitting}
              type="submit"
              variant="primary"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {authActionLabel(authMode)}
            </Button>

            {authNotice ? (
              <p className="rounded-xl border border-[var(--warning)] bg-[var(--warning-soft)] px-3 py-2 text-sm font-medium text-[var(--warning)]">
                {authNotice}
              </p>
            ) : null}
            {devCode ? (
              <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
                Development code:{" "}
                <span className="font-mono font-semibold text-[var(--text)]">
                  {devCode}
                </span>
              </p>
            ) : null}
            {signedInWithPassword ? (
              <p className="rounded-xl border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2 text-sm font-medium text-[var(--success)]">
                Signed in as {passwordAuth?.user?.email ?? "email user"}.
              </p>
            ) : null}
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)] before:h-px before:flex-1 before:bg-[var(--line)] after:h-px after:flex-1 after:bg-[var(--line)]">
            or
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              fullWidth
              isDisabled={!googleConfigured && !signedInToGoogle}
              onPress={connectGoogle}
              variant="secondary"
            >
              <Globe className="h-4 w-4" />
              Google
            </Button>
            <Button fullWidth onPress={enterAfterAuth} variant="secondary">
              <Sparkles className="h-4 w-4" />
              Local mode
            </Button>
          </div>
        </Card.Content>

        <Card.Footer className="border-t border-[var(--line)] px-6 py-4 text-center text-xs leading-5 text-[var(--muted)]">
          Credentials are hashed locally and sessions use an HTTP-only cookie.
        </Card.Footer>
      </Card>
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
      detail:
        "List and open recent Drive files. Document parsing is not connected yet.",
      icon: FolderOpen,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Connected" : "Pending",
    },
    {
      label: "Gmail",
      detail:
        "Inbox search, drafts, replies, labels, archive, star, trash, and confirmed sends.",
      icon: Mail,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Ready" : "Pending",
    },
    {
      label: "Tasks and Contacts",
      detail:
        "Google Tasks plus saved Contacts search, birthdays, and confirmed contact edits.",
      icon: Users,
      ready: signedInToGoogle,
      status: signedInToGoogle ? "Ready" : "Pending",
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
            <Button
              className={iconButtonClass}
              onClick={() => refreshWorkspace()}
              type="button"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              className={iconButtonClass}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className={`${panelClass} p-6`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-separator bg-surface-secondary px-3 py-1 text-xs font-semibold uppercase text-muted">
              <LockKeyhole className="h-3.5 w-3.5 text-accent" />
              Onboarding
            </div>
            <h1 className="text-4xl font-semibold leading-tight">
              Connect the services your assistant can operate.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              The assistant runs in local mode now and upgrades to Google
              Workspace actions after OAuth consent.
            </p>

            <div className="mt-6 space-y-3">
              {(oauthStatus?.checks ?? []).map((check) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-separator bg-surface-secondary px-4 py-3"
                  key={check.label}
                >
                  <div>
                    <p className="text-sm font-semibold">{check.label}</p>
                    <p className="text-xs text-muted">{check.where}</p>
                  </div>
                  <StatusBadge
                    ready={check.ready}
                    label={check.ready ? "Ready" : "Missing"}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className={primaryButtonClass}
                disabled={!googleConfigured && !signedInToGoogle}
                onClick={connectGoogle}
                type="button"
              >
                <Link2 className="h-4 w-4" />
                {signedInToGoogle ? "Reconnect Google" : "Connect Google"}
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={continueLocal}
                type="button"
              >
                Continue in local mode
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {permissionGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article className={`${panelClass} p-5`} key={group.label}>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <StatusBadge ready={group.ready} label={group.status} />
                  </div>
                  <h2 className="text-lg font-semibold">{group.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {group.detail}
                  </p>
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
  completeSurfaceMessage: (
    messageId: string,
    summary: string,
    link?: string | null,
  ) => void;
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
  setContextMenu: (
    menu: { x: number; y: number; task: RelayTask } | null,
  ) => void;
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
      className="workspace-frame min-h-screen transition-[grid-template-columns] duration-300 ease-out lg:grid"
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

      <main className="workspace-main min-w-0 border-l border-separator">
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

        <div
          className={
            activeView === "chat"
              ? "relay-page relay-page--chat p-3 sm:p-4"
              : "relay-page p-4 sm:p-6 xl:p-8"
          }
        >
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

          {activeView === "files" ? (
            <FilesView briefing={briefing} runPrompt={runPrompt} />
          ) : null}

          {activeView === "github" ? (
            <GithubView
              briefing={briefing}
              runPrompt={runPrompt}
              signedInToGithub={signedInToGithub}
            />
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
    <aside
      className={`sidebar-shell relative flex h-full flex-col bg-[var(--sidebar)] py-5 text-left transition-all duration-300 ease-out ${collapsed ? "px-3" : "px-4"}`}
    >
      <div className="mb-8 flex items-center justify-between">
        {collapsed ? (
          <BrandSymbol />
        ) : (
          <BrandMark />
        )}
        <Button
          className="hidden h-9 w-9 items-center justify-center rounded-md text-muted transition hover:bg-surface-secondary hover:text-foreground lg:inline-flex"
          onClick={onToggleCollapsed}
          type="button"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Columns3 className="h-4 w-4" />
        </Button>
        <Button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
          title="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <Button
              className={`nav-item flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                active
                  ? "is-active bg-surface text-foreground shadow-surface"
                  : "text-muted hover:bg-surface-secondary hover:text-foreground"
              } ${
                collapsed ? "justify-center px-0" : "justify-start text-left"
              }`}
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
            </Button>
          );
        })}
      </nav>

      {!collapsed ? (
        <Input
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
    <header className="relay-topbar sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-separator bg-[var(--surface-glass)] px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          className={iconButtonClass + " lg:hidden"}
          onClick={() => setSidebarOpen(true)}
          type="button"
          title="Menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {ActiveIcon ? <ActiveIcon className="h-4 w-4 text-accent" /> : null}
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {navItem?.label ?? "Workspace"}
            </h1>
          </div>
          <p className="hidden text-xs text-muted sm:block">
            {aiStatus?.configured
              ? `${aiStatus.label} key set`
              : "Local agent active"}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Button
          className="hidden h-10 min-w-0 items-center gap-2 rounded-md border border-separator bg-surface px-3 text-left text-sm text-muted transition hover:border-border sm:inline-flex lg:w-72"
          onClick={() => setCommandOpen(true)}
          type="button"
        >
          <Search className="h-4 w-4" />
          <span className="truncate">Search actions, tools, and views</span>
          <Command className="ml-auto h-3.5 w-3.5" />
        </Button>
        <Button
          className={iconButtonClass}
          onClick={() => setCommandOpen(true)}
          type="button"
          title="Command"
        >
          <Command className="h-4 w-4" />
        </Button>
        <Button
          className={iconButtonClass}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          type="button"
          title="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          className={
            signedInToGoogle ? secondaryButtonClass : primaryButtonClass
          }
          disabled={!googleConfigured && !signedInToGoogle}
          onClick={connectGoogle}
          type="button"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {signedInToGoogle ? "Google connected" : "Connect"}
          </span>
        </Button>
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
        <ControlMetric
          icon={CalendarDays}
          label="Schedule"
          value={
            briefing?.calendar.ok ? `${briefing.calendar.events.length}` : "Off"
          }
          detail="upcoming events"
        />
        <ControlMetric
          icon={ListTodo}
          label="Tasks"
          value={`${openTasks.length}`}
          detail={`${tasks.length - openTasks.length} completed`}
        />
        <ControlMetric
          icon={Mail}
          label="Inbox"
          value={
            briefing?.gmail?.ok ? `${briefing.gmail.messages.length}` : "Off"
          }
          detail="recent messages"
        />
        <ControlMetric
          icon={GitBranch}
          label="GitHub"
          value={
            briefing?.github?.connected
              ? `${briefing.githubRepositories?.repositories.length ?? 0}`
              : "Off"
          }
          detail="recent repos"
        />
        <ControlMetric
          icon={Brain}
          label="Memory"
          value={`${notes.length}`}
          detail="approved notes"
        />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-5 md:grid-cols-3">
      {["Focus", "Timeline", "Inbox"].map((item) => (
        <Surface
          className={`${softPanelClass} p-5`}
          key={item}
          variant="secondary"
        >
          <Skeleton
            aria-label={`Loading ${item}`}
            className="h-4 w-24 rounded-full"
          />
          <Skeleton className="mt-5 h-8 w-3/4 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-full rounded-full" />
          <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
        </Surface>
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
  const googleTasks =
    briefing?.googleTasks?.tasks.filter(
      (task) => task.status !== "completed",
    ) ?? [];
  const githubIssues = briefing?.githubIssues?.issues ?? [];
  const [activeInspectorDay, setActiveInspectorDay] = useState<string | null>(
    null,
  );

  return (
    <section className={`${panelClass} overflow-visible p-5 sm:p-6`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-separator bg-surface-secondary px-3 py-1 text-xs font-semibold uppercase text-muted">
            <span className="pulse-dot" />
            Next 7 days
          </div>
          <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            Weekly operating view
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Calendar, task deadlines, reminders, notes, and GitHub activity are
            grouped by day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className={secondaryButtonClass}
            onClick={() => runPrompt("What should I focus on this week?")}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
          <Button
            className={primaryButtonClass}
            onClick={() => runPrompt("Schedule a meeting")}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            sameCalendarDay(parseEventDate(event.start), day),
          );
          const dayTasks = openTasks.filter((task) =>
            sameCalendarDay(parseEventDate(task.due), day),
          );
          const dayGoogleTasks = googleTasks.filter((task) =>
            sameCalendarDay(parseEventDate(task.due), day),
          );
          const dayNotes = notes.filter((note) =>
            sameCalendarDay(parseEventDate(note.createdAt), day),
          );
          const dayIssues = githubIssues.filter((issue) =>
            sameCalendarDay(parseEventDate(issue.updatedAt), day),
          );
          const count =
            dayEvents.length +
            dayTasks.length +
            dayGoogleTasks.length +
            dayNotes.length +
            dayIssues.length;
          const isToday = sameCalendarDay(day, new Date());
          const dayKey = day.toISOString();
          const inspectorActive = activeInspectorDay === dayKey;

          return (
            <div className="min-w-0" key={dayKey}>
              <Button
                aria-pressed={inspectorActive}
                className={`relay-content-card week-day-card min-h-44 w-full rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-1 hover:shadow-surface ${
                  isToday
                    ? "border-[var(--accent)] bg-accent-soft"
                    : "border-separator bg-surface-secondary hover:border-border"
                }`}
                onClick={() => setActiveInspectorDay(dayKey)}
                type="button"
              >
                <span className="block text-[11px] font-semibold uppercase text-muted">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="mt-1 block text-2xl font-semibold">
                  {day.getDate()}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {day.toLocaleDateString(undefined, { month: "short" })}
                </span>
                <div className="mt-4 space-y-2">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span
                      className="block truncate rounded-lg bg-surface px-2 py-1 text-xs font-semibold"
                      key={event.id ?? `${event.title}-${event.start}`}
                    >
                      {formatEventTime(event.start)} · {event.title}
                    </span>
                  ))}
                  {[...dayTasks, ...dayGoogleTasks].slice(0, 2).map((task) => (
                    <span
                      className="flex items-center gap-2 truncate rounded-lg bg-surface px-2 py-1 text-xs font-semibold"
                      key={task.id ?? task.title}
                    >
                      <PriorityDot
                        priority={
                          "priority" in task ? task.priority : undefined
                        }
                      />
                      {task.title}
                    </span>
                  ))}
                  {count === 0 ? (
                    <span className="block rounded-lg border border-dashed border-separator px-2 py-2 text-xs text-muted">
                      No loaded items
                    </span>
                  ) : null}
                </div>
                <span className="mt-4 inline-flex rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                  {count} signal{count === 1 ? "" : "s"}
                </span>
              </Button>

              <DayInspector
                active={inspectorActive}
                completeTask={completeTask}
                date={day}
                events={dayEvents}
                githubIssues={dayIssues}
                googleTasks={dayGoogleTasks}
                notes={dayNotes}
                onClose={() => setActiveInspectorDay(null)}
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
  active,
  completeTask,
  date,
  events,
  githubIssues,
  googleTasks,
  notes,
  onClose,
  runPrompt,
  tasks,
}: {
  active: boolean;
  completeTask: (task: RelayTask) => Promise<void>;
  date: Date;
  events: CalendarEvent[];
  githubIssues: GithubIssue[];
  googleTasks: GoogleTask[];
  notes: RelayNote[];
  onClose: () => void;
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  return (
    <Modal isOpen={active} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog
            className={`${panelClass} max-h-[min(760px,calc(100vh-2rem))] w-full overflow-y-auto p-5`}
          >
            <Modal.CloseTrigger />
            <div className="pr-8">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted">Day inspector</p>
                </div>
                <StatusBadge
                  ready
                  label={`${events.length + tasks.length + googleTasks.length + githubIssues.length} active`}
                />
              </div>

              <InspectorGroup
                empty="No loaded events."
                icon={CalendarDays}
                items={events.map((event) => ({
                  id: event.id ?? `${event.title}-${event.start}`,
                  title: event.title,
                  detail: `${formatEventTime(event.start)}${event.end ? ` - ${formatEventTime(event.end)}` : ""}`,
                  action: "Edit",
                  onClick: () =>
                    runPrompt(`Edit ${event.title} on ${date.toDateString()}`),
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
                  onClick: () =>
                    runPrompt(
                      `Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`,
                    ),
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
                <Button
                  className={
                    secondaryButtonClass + " pointer-events-auto h-9 px-3"
                  }
                  onClick={() =>
                    runPrompt(`Reschedule items on ${date.toDateString()}`)
                  }
                  type="button"
                >
                  Reschedule
                </Button>
                <Button
                  className={
                    primaryButtonClass + " pointer-events-auto h-9 px-3"
                  }
                  onClick={() =>
                    runPrompt(`Create a task due ${date.toDateString()}`)
                  }
                  type="button"
                >
                  Add task
                </Button>
              </div>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
  items: Array<{
    action: string;
    detail: string;
    id: string;
    onClick: () => void;
    title: string;
  }>;
  title: string;
}) {
  return (
    <div className="mb-3 rounded-xl border border-separator bg-surface-secondary p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {title}
      </div>
      <div className="space-y-1.5">
        {items.length > 0 ? (
          items.slice(0, 4).map((item) => (
            <Button
              className="pointer-events-auto grid w-full grid-cols-[1fr_auto] gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface"
              key={item.id}
              onClick={item.onClick}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted">
                  {item.detail}
                </span>
              </span>
              <span className="text-[11px] font-semibold text-accent">
                {item.action}
              </span>
            </Button>
          ))
        ) : (
          <p className="px-2 py-1 text-xs text-muted">{empty}</p>
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
  const googleTasks =
    briefing?.googleTasks?.tasks.filter(
      (task) => task.status !== "completed",
    ) ?? [];
  const sortedTasks = sortTasksByUrgency(openTasks).slice(0, 6);
  const overdueCount = openTasks.filter((task) => isOverdue(task.due)).length;

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-separator p-4">
        <div>
          <h2 className="text-lg font-semibold">Task snapshot</h2>
          <p className="mt-1 text-sm text-muted">
            {overdueCount > 0
              ? `${overdueCount} overdue`
              : `${openTasks.length} open in Google Tasks`}{" "}
            · {googleTasks.length} Google open
          </p>
        </div>
        <Button
          className={secondaryButtonClass + " h-9 px-3"}
          onClick={() => runPrompt("Review my highest priority tasks")}
          type="button"
        >
          Review
        </Button>
      </div>
      <div className="divide-y divide-separator">
        {sortedTasks.map((task) => (
          <HoverPreview
            detail={task.notes || "No notes saved for this task."}
            key={task.id}
            meta={task.due ? `Due ${formatDueDate(task.due)}` : "No due date"}
            title={task.title}
          >
            <Button
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left transition hover:bg-accent-soft"
              onClick={() => void completeTask(task)}
              type="button"
            >
              <PriorityTag priority={task.priority} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {task.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {task.due ? formatDueDate(task.due) : "No deadline"} ·{" "}
                  {task.notes || "No note"}
                </span>
              </span>
              <Check className="h-4 w-4 text-success" />
            </Button>
          </HoverPreview>
        ))}
        {sortedTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={
              tasks.length > 0 ? "All Google Tasks completed" : "No Google Tasks"
            }
            detail="Create tasks from chat or the Tasks tab."
          />
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
      <div className="flex items-start justify-between gap-3 border-b border-separator p-4">
        <div>
          <h2 className="text-lg font-semibold">GitHub activity</h2>
          <p className="mt-1 text-sm text-muted">
            {briefing?.github?.connected
              ? `${issues.length} assigned issue${issues.length === 1 ? "" : "s"}`
              : "GitHub not connected"}
          </p>
        </div>
        <Button
          className={secondaryButtonClass + " h-9 px-3"}
          onClick={() => runPrompt("What should I fix first on GitHub?")}
          type="button"
        >
          Ask AI
        </Button>
      </div>
      <div className="divide-y divide-separator">
        {issues.slice(0, 5).map((issue) => (
          <HoverPreview
            detail={`${issue.labels.join(", ") || "No labels"} · updated ${formatFileTime(issue.updatedAt)}`}
            key={issue.id}
            meta={issue.repositoryFullName ?? "GitHub"}
            title={issue.title}
          >
            <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
              <Button
                className="relay-content-row min-w-0 text-left"
                onClick={() =>
                  runPrompt(
                    `Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`,
                  )
                }
                type="button"
              >
                <span className="block truncate text-sm font-semibold">
                  {issue.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {issue.repositoryFullName ?? "Repository"} #{issue.number}
                </span>
              </Button>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${githubUrgencyClass(issue)}`}
                >
                  {githubUrgency(issue)}
                </span>
                <Link
                  aria-label="Open issue"
                  className={iconButtonClass + " h-8 w-8"}
                  href={issue.htmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </HoverPreview>
        ))}
        {issues.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title={
              briefing?.github?.connected
                ? "No assigned issues loaded"
                : "GitHub not connected"
            }
            detail={
              briefing?.githubIssues?.reason ??
              "Connect GitHub to see repository work."
            }
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
  const actions = buildPlannerActions(
    briefing,
    openTasks,
    runPrompt,
    setActiveView,
  );

  return (
    <section className={`${panelClass} ai-planner overflow-hidden p-5`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-separator bg-surface-secondary px-3 py-1 text-xs font-semibold uppercase text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Executive decision layer
          </div>
          <h2 className="text-xl font-semibold">What to do next</h2>
          <p className="mt-1 text-sm text-muted">
            Prioritized from live calendar, tasks, inbox, files, and GitHub
            signals.
          </p>
        </div>
        <StatusBadge
          ready={actions.length > 0}
          label={`${actions.length} action${actions.length === 1 ? "" : "s"}`}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              className="relay-content-card group rounded-2xl border border-separator bg-surface p-4 text-left transition hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-accent-soft"
              key={action.title}
              onClick={action.onClick}
              type="button"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <p className="font-semibold">{action.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {action.detail}
              </p>
            </Button>
          );
        })}
        {actions.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No urgent decision loaded"
            detail="Connect services or add tasks to give the planner live context."
          />
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
  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;

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
            <div className="divide-y divide-separator">
              {items.map((item) => (
                <HoverPreview
                  detail={item.snippet}
                  key={item.id}
                  meta={item.time ? formatFileTime(item.time) : item.kind}
                  title={item.person}
                >
                  <Button
                    className={`grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 p-4 text-left transition hover:bg-accent-soft ${
                      selected?.id === item.id ? "bg-accent-soft" : ""
                    }`}
                    onClick={() => setSelectedId(item.id)}
                    type="button"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {item.person}
                      </span>
                    </span>
                    <span className="rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                      {item.kind}
                    </span>
                  </Button>
                </HoverPreview>
              ))}
            </div>
            <div className="border-t border-separator bg-surface-secondary p-4 xl:border-l xl:border-t-0">
              {selected ? (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold uppercase text-muted">
                    {selected.kind}
                  </p>
                  <h3 className="mt-2 text-base font-semibold leading-6">
                    {selected.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{selected.person}</p>
                  <p className="mt-4 text-sm leading-6">{selected.snippet}</p>
                  <Button
                    className={primaryButtonClass + " mt-4 w-full"}
                    onClick={() => runPrompt(selected.prompt)}
                    type="button"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask AI
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Mail}
            title={
              briefing?.gmail?.ok ? "Inbox is quiet" : "Gmail not connected"
            }
            detail={
              briefing?.gmail?.reason ??
              "Connect Gmail to load inbox highlights."
            }
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
    <Card className="group border border-separator bg-surface p-0 shadow-surface transition hover:border-border-secondary">
      <Card.Content className="p-4">
        <div className="mb-5 flex items-center justify-between">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon className="h-4 w-4" />
          </span>
          <MoreHorizontal className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </Card.Content>
    </Card>
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
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <Button className={secondaryButtonClass} onClick={onAction} type="button">
        {action}
      </Button>
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
    <Tooltip closeDelay={100} delay={550}>
      <Tooltip.Trigger className="relay-tooltip-trigger block min-w-0 w-full">
        {children}
      </Tooltip.Trigger>
      <Tooltip.Content
        className="w-72 border border-border bg-overlay p-3 text-sm shadow-overlay"
        placement="bottom start"
        showArrow
      >
        <p className="truncate font-semibold">{title}</p>
        <p className="mt-1 text-xs font-semibold uppercase text-muted">
          {meta}
        </p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
          {detail}
        </p>
      </Tooltip.Content>
    </Tooltip>
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
  completeSurfaceMessage: (
    messageId: string,
    summary: string,
    link?: string | null,
  ) => void;
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
  const showContextWorkspace = false;
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(430);
  const mode = inferContextWorkspaceMode(messages);

  return (
    <div
      className={`h-[calc(100vh-96px)] min-h-0 overflow-hidden ${
        showContextWorkspace
          ? "flex flex-col gap-4 transition-[grid-template-columns] duration-300 ease-out xl:grid"
          : ""
      }`}
      style={
        showContextWorkspace
          ? {
              gridTemplateColumns: workspaceCollapsed
                ? "minmax(0,1fr) 64px"
                : `minmax(0,1fr) minmax(360px,${workspaceWidth}px)`,
            }
          : undefined
      }
    >
      <AgentConsole
        addMemory={addMemory}
        addTask={addTask}
        completeSurfaceMessage={completeSurfaceMessage}
        input={input}
        loading={loading}
        messages={messages}
        openTasks={openTasks}
        refreshWorkspace={refreshWorkspace}
        runPrompt={runPrompt}
        setInput={setInput}
        submitMessage={submitMessage}
      />
      {showContextWorkspace ? (
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
      ) : null}
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
  openTasks,
  refreshWorkspace,
  runPrompt,
  setInput,
  submitMessage,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  completeSurfaceMessage: (
    messageId: string,
    summary: string,
    link?: string | null,
  ) => void;
  input: string;
  loading: boolean;
  messages: Message[];
  openTasks: RelayTask[];
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
      onresult:
        | ((event: {
            results: ArrayLike<{ 0: { transcript: string } }>;
          }) => void)
        | null;
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
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Executive assistant</h2>
            <p className="text-xs text-muted">
              Neutral routing, generated UI, and session memory
            </p>
          </div>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
        ref={scrollRef}
      >
        {messages.map((message) => (
          <ChatMessage
            addMemory={addMemory}
            addTask={addTask}
            completeSurfaceMessage={completeSurfaceMessage}
            key={message.id}
            message={message}
            openTasks={openTasks}
            refreshWorkspace={refreshWorkspace}
            runPrompt={runPrompt}
          />
        ))}
        {loading ? <AssistantThinkingCard messages={messages} /> : null}
      </div>

      <form className="px-1 py-4" id="agent-chat-form" onSubmit={submitMessage}>
        <Input
          className="hidden"
          multiple
          onChange={(event) => attachFiles(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <div className="flex items-center gap-2">
          <Button
            className={
              iconButtonClass + " h-11 w-11 border-transparent bg-transparent"
            }
            onClick={() => fileInputRef.current?.click()}
            type="button"
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            className={
              iconButtonClass + " h-11 w-11 border-transparent bg-transparent"
            }
            onClick={startVoiceInput}
            type="button"
            title="Voice input"
          >
            {listening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Input
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the assistant to plan, schedule, draft, search, or remember..."
            value={input}
          />
          <Button
            className={`${primaryButtonClass} h-11 w-11 px-0`}
            disabled={loading}
            type="submit"
            title="Send"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
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
      <div className="surface-pop rounded-xl border border-separator bg-surface-secondary px-4 py-3 shadow-sm">
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
            <div
              className="flex items-center gap-2 text-xs text-muted"
              key={step}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
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
  openTasks,
  refreshWorkspace,
  runPrompt,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  completeSurfaceMessage: (
    messageId: string,
    summary: string,
    link?: string | null,
  ) => void;
  message: Message;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
}) {
  const fromUser = message.role === "user";
  const parsedContent = fromUser
    ? { markdown: message.content, requests: [] as AssistantUiRequest[] }
    : parseAssistantUiRequests(message.content);
  const visibleContent = fromUser ? message.content : parsedContent.markdown;

  return (
    <div
      className={
        fromUser
          ? "ml-auto flex max-w-[88%] flex-row-reverse gap-3"
          : "mr-auto flex max-w-[92%] gap-3"
      }
    >
      <AvatarIcon role={message.role} />
      <div className="min-w-0">
        {visibleContent ? (
          <div
            className={
              fromUser
                ? "rounded-xl bg-accent px-4 py-3 text-sm leading-6 text-white"
                : "rounded-xl border border-separator bg-surface-secondary px-4 py-3 text-sm leading-6 text-foreground"
            }
          >
            {fromUser ? (
              <p className="whitespace-pre-wrap">{visibleContent}</p>
            ) : (
              <MarkdownMessage content={visibleContent} />
            )}
          </div>
        ) : null}
        <div
          className={`mt-1 text-xs text-muted ${fromUser ? "text-right" : ""}`}
        >
          {message.timestamp}
        </div>
        {message.surface &&
        message.surface !== "schedule" &&
        message.surface !== "task" &&
        message.surfaceStatus !== "done" ? (
          <GeneratedMessageSurface
            addMemory={addMemory}
            addTask={addTask}
            onComplete={(summary, link) =>
              completeSurfaceMessage(message.id, summary, link)
            }
            refreshWorkspace={refreshWorkspace}
            runPrompt={runPrompt}
            surface={message.surface}
            surfaceContext={message.surfaceContext}
          />
        ) : null}
        {!fromUser && parsedContent.requests.length > 0 ? (
          <div className="mt-3 grid gap-3">
            {parsedContent.requests.map((request) => (
              <AssistantUiRequestCard
                key={request.id}
                onComplete={(summary) =>
                  completeSurfaceMessage(message.id, summary)
                }
                openTasks={openTasks}
                refreshWorkspace={refreshWorkspace}
                request={request}
                runPrompt={runPrompt}
              />
            ))}
          </div>
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

function AssistantUiRequestCard({
  onComplete,
  openTasks,
  refreshWorkspace,
  request,
  runPrompt,
}: {
  onComplete: (summary: string) => void;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  request: AssistantUiRequest;
  runPrompt: (prompt: string) => void;
}) {
  const candidateTasks = sortTasksByUrgency(openTasks).slice(0, 8);
  const [selectedTaskId, setSelectedTaskId] = useState(
    candidateTasks[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{
    tone: "success" | "warning";
    text: string;
  } | null>(null);
  const effectiveSelectedTaskId = candidateTasks.some(
    (task) => task.id === selectedTaskId,
  )
    ? selectedTaskId
    : (candidateTasks[0]?.id ?? "");
  const selectedTask =
    candidateTasks.find((task) => task.id === effectiveSelectedTaskId) ?? null;
  const shiftedDue =
    request.action === "shift_task_due" &&
    selectedTask?.due &&
    request.daysDelta
      ? addDays(new Date(selectedTask.due), request.daysDelta)
      : null;

  async function applyTaskDueShift() {
    if (!selectedTask || !shiftedDue || busy) return;

    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/google/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: selectedTask.id,
          taskListId: selectedTask.taskListId ?? selectedTask.columnId,
          due: shiftedDue.toISOString(),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
      };

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "warning",
          text: data.reason ?? "I could not update that Google Task.",
        });
        return;
      }

      await refreshWorkspace();
      onComplete(
        `Updated "${selectedTask.title}" due date to ${formatDateShort(shiftedDue.toISOString())}.`,
      );
      setStatus({ tone: "success", text: "Task updated." });
    } catch (error) {
      setStatus({
        tone: "warning",
        text: error instanceof Error ? error.message : "Task update failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-pop max-w-2xl rounded-2xl border border-separator bg-surface p-4 shadow-surface">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Wand2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Choose the missing detail</h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                {request.detail}
              </p>
            </div>
            <StatusBadge ready={false} label="Needs selection" />
          </div>

          {request.action === "shift_task_due" ? (
            <div className="mt-4 grid gap-3">
              {candidateTasks.length > 0 ? (
                <>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold uppercase text-muted">
                      Task
                    </span>
                    <Select
                      className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none transition focus:border-[var(--accent)]"
                      onChange={(event) =>
                        setSelectedTaskId(event.target.value)
                      }
                      value={effectiveSelectedTaskId}
                    >
                      {candidateTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                          {task.due
                            ? ` - due ${formatDateShort(task.due)}`
                            : " - no due date"}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="grid gap-2 rounded-xl border border-separator bg-surface-secondary p-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <MiniControl
                      label="Current due date"
                      value={formatDateShort(selectedTask?.due)}
                    />
                    <ArrowRight className="hidden h-4 w-4 text-muted sm:block" />
                    <MiniControl
                      label="New due date"
                      value={
                        shiftedDue
                          ? formatDateShort(shiftedDue.toISOString())
                          : "Pick a task with a due date"
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className={primaryButtonClass}
                      disabled={!shiftedDue || busy}
                      onClick={() => void applyTaskDueShift()}
                      type="button"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Apply change
                    </Button>
                    <Button
                      className={secondaryButtonClass}
                      onClick={() =>
                        runPrompt(
                          `Use this task for the change: ${selectedTask?.id ?? effectiveSelectedTaskId}`,
                        )
                      }
                      type="button"
                    >
                      <Sparkles className="h-4 w-4" />
                      Ask assistant
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={ListTodo}
                  title="No open Google Tasks"
                  detail="Create or sync tasks first, then I can attach this action to the right item."
                />
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                className={primaryButtonClass}
                onClick={() => runPrompt(request.detail)}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                Continue in chat
              </Button>
            </div>
          )}

          {status ? (
            <p
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
                status.tone === "success"
                  ? "bg-success-soft text-success"
                  : "bg-warning-soft text-warning"
              }`}
            >
              {status.text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GeneratedMessageSurface({
  addMemory,
  addTask,
  onComplete,
  refreshWorkspace,
  runPrompt,
  surface,
  surfaceContext,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  onComplete: (summary: string, link?: string | null) => void;
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  surface: GeneratedSurface;
  surfaceContext?: GeneratedSurfaceContext;
}) {
  if (surface === "schedule")
    return (
      <ScheduleComposer
        onComplete={onComplete}
        refreshWorkspace={refreshWorkspace}
      />
    );
  if (surface === "task") {
    return (
      <TaskComposer
        addTask={addTask}
        initialContext={surfaceContext?.task}
        onComplete={onComplete}
        refreshWorkspace={refreshWorkspace}
        runPrompt={runPrompt}
      />
    );
  }
  if (surface === "files") return <FileGeneratedSurface />;
  if (surface === "memory")
    return (
      <MemoryPermissionSurface addMemory={addMemory} onComplete={onComplete} />
    );
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
      const nextWidth = Math.min(
        620,
        Math.max(360, startWidth - (moveEvent.clientX - startX)),
      );
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
      <aside
        className={`${panelClass} surface-pop hidden h-full min-h-0 flex-col items-center gap-3 p-3 transition-all duration-300 ease-out xl:flex`}
      >
        <Button
          className={iconButtonClass}
          onClick={onToggleCollapsed}
          title="Expand workspace"
          type="button"
        >
          <Columns3 className="h-4 w-4" />
        </Button>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div className="h-px w-full bg-[var(--line)]" />
        {(
          [
            "focus",
            "calendar",
            "tasks",
            "files",
            "github",
            "memory",
            "contacts",
            "email",
          ] as ContextWorkspaceMode[]
        ).map((item) => {
          const ItemIcon = contextWorkspaceMeta(item).icon;
          return (
            <span
              className={`grid h-9 w-9 place-items-center rounded-md transition ${
                item === mode
                  ? "bg-accent text-white"
                  : "bg-surface-secondary text-muted"
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
    <aside
      className={`${panelClass} surface-pop relative hidden h-full min-h-0 flex-col overflow-hidden transition-all duration-300 ease-out xl:flex`}
    >
      <div
        aria-label="Resize contextual workspace"
        className="resize-rail absolute bottom-0 left-0 top-0 z-10 w-2 cursor-ew-resize"
        onPointerDown={startResize}
        role="separator"
      />
      <div className="flex items-center justify-between gap-3 border-b border-separator p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{meta.label}</p>
            <p className="truncate text-xs text-muted">{meta.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className={iconButtonClass}
            onClick={() => void refreshWorkspace()}
            title="Refresh workspace"
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            className={iconButtonClass}
            onClick={onToggleCollapsed}
            title="Collapse workspace"
            type="button"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-separator px-4 py-2">
        <span className="text-xs font-semibold uppercase text-muted">
          AI selected
        </span>
        <ProgressBar
          aria-label="AI context confidence"
          className="min-w-0 flex-1"
          color="accent"
          size="sm"
          value={67}
        >
          <ProgressBar.Track className="bg-[var(--track)]">
            <ProgressBar.Fill className="animated-progress" />
          </ProgressBar.Track>
        </ProgressBar>
        <span className="text-xs font-semibold text-accent">{meta.signal}</span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-4 animate-fade-in"
        key={mode}
      >
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
        {mode === "files" ? (
          <FilesWorkspace briefing={briefing} runPrompt={runPrompt} />
        ) : null}
        {mode === "github" ? (
          <GithubWorkspace briefing={briefing} runPrompt={runPrompt} />
        ) : null}
        {mode === "memory" ? (
          <MemoryWorkspace notes={notes} runPrompt={runPrompt} />
        ) : null}
        {mode === "contacts" ? (
          <ContactsWorkspace briefing={briefing} runPrompt={runPrompt} />
        ) : null}
        {mode === "email" ? (
          <EmailWorkspace briefing={briefing} runPrompt={runPrompt} />
        ) : null}
      </div>

      <div className="border-t border-separator px-4 py-3">
        <label className="flex items-center gap-3 text-xs font-semibold text-muted">
          Width
          <Input
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
  const googleTasks =
    briefing?.googleTasks?.tasks.filter(
      (task) => task.status !== "completed",
    ) ?? [];
  const contacts = briefing?.contacts?.contacts ?? [];
  const actions = [
    {
      title: nextEvent ? nextEvent.title : "Plan my day",
      detail: nextEvent
        ? formatEventTime(nextEvent.start)
        : "Create a briefing from connected workspace data.",
      icon: CalendarDays,
      prompt: nextEvent ? "Prepare me for my next meeting" : "Plan my day",
    },
    {
      title: openTasks[0]?.title ?? googleTasks[0]?.title ?? "Capture a task",
      detail: openTasks[0]
        ? "Local priority task"
        : googleTasks[0]
          ? "Google Tasks item"
          : "Start with one concrete next action.",
      icon: ListTodo,
      prompt: openTasks[0]
        ? `Plan the next step for ${openTasks[0].title}`
        : googleTasks[0]
          ? `Plan the next step for ${googleTasks[0].title}`
          : "add task ",
    },
    {
      title:
        recentFile?.name ??
        (signedInToGoogle ? "Review Drive" : "Connect Google"),
      detail: recentFile
        ? driveFileType(recentFile.mimeType)
        : "Drive, Calendar, and Tasks unlock live workspace context.",
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
            <p className="mt-1 text-sm text-muted">
              {briefing?.focus?.title ?? "No local focus task selected yet."}
            </p>
          </div>
          <span className="pulse-dot mt-1" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <MiniControl
            label="Calendar"
            value={
              briefing?.calendar.ok
                ? `${briefing.calendar.events.length} events`
                : "Not connected"
            }
          />
          <MiniControl
            label="Tasks"
            value={`${openTasks.length + googleTasks.length} open`}
          />
          <MiniControl
            label="Files"
            value={
              briefing?.drive.ok
                ? `${briefing.drive.files.length} recent`
                : "Not connected"
            }
          />
          <MiniControl
            label="Contacts"
            value={
              briefing?.contacts?.ok
                ? `${contacts.length} people`
                : "Not connected"
            }
          />
        </div>
      </section>

      <section className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              className="interactive-row grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-separator bg-surface-secondary p-3 text-left transition hover:bg-accent-soft"
              key={action.title}
              onClick={() => runPrompt(action.prompt)}
              type="button"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-accent-soft text-accent">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {action.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {action.detail}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Button>
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
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarAction, setCalendarAction] = useState<CalendarAction | null>(
    null,
  );
  const [savingEvent, setSavingEvent] = useState(false);
  const dayEvents = events.filter((event) =>
    sameCalendarDay(parseEventDate(event.start), selectedDate),
  );
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const monthDays = getMonthGrid(selectedDate);

  function openSlot(date: Date, hour: number) {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60_000);
    setCalendarAction({
      mode: "create",
      start,
      end,
      title: "",
      reminderMinutes: 30,
    });
  }

  function openEvent(event: CalendarEvent) {
    const start = parseEventDate(event.start) ?? new Date();
    const end =
      parseEventDate(event.end) ?? new Date(start.getTime() + 30 * 60_000);
    setCalendarAction({
      mode: "edit",
      event,
      start,
      end,
      title: event.title,
      reminderMinutes: 30,
    });
  }

  async function moveEvent(
    event: CalendarEvent,
    targetDate: Date,
    hour: number,
  ) {
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
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={softPanelClass + " p-3"}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              className={iconButtonClass}
              onClick={() =>
                setSelectedDate(shiftCalendarDate(selectedDate, view, -1))
              }
              type="button"
              title="Previous"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold">
                {selectedDate.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted">
                {briefing?.calendar.ok
                  ? "Google Calendar"
                  : (briefing?.calendar.reason ?? "Calendar not connected")}
              </p>
            </div>
            <Button
              className={iconButtonClass}
              onClick={() =>
                setSelectedDate(shiftCalendarDate(selectedDate, view, 1))
              }
              type="button"
              title="Next"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["day", "week", "month"] as const).map((option) => (
              <Button
                className={`h-9 w-full rounded-md text-xs font-semibold transition ${
                  view === option
                    ? "bg-accent text-white"
                    : "border border-separator bg-surface text-muted hover:border-[var(--accent)] hover:text-accent"
                }`}
                key={option}
                onClick={() => setView(option)}
                type="button"
              >
                {option[0].toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            className={`${primaryButtonClass} mt-3 w-full`}
            onClick={() =>
              openSlot(selectedDate, Math.max(9, new Date().getHours() + 1))
            }
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        </section>

        <CalendarSignalStrip
          briefing={briefing}
          dayEvents={dayEvents}
          events={events}
          selectedDate={selectedDate}
          view={view}
        />
      </div>

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
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dayCount = events.filter((event) =>
                sameCalendarDay(parseEventDate(event.start), day),
              ).length;
              const currentMonth = day.getMonth() === selectedDate.getMonth();
              const isSelected = sameCalendarDay(day, selectedDate);
              const isToday = sameCalendarDay(day, new Date());
              return (
                <Button
                  className={`relay-content-card min-h-16 rounded-md border p-1.5 text-left transition hover:border-[var(--accent)] hover:bg-accent-soft ${
                    isSelected
                      ? "border-[var(--accent)] bg-accent-soft"
                      : "border-separator bg-surface"
                  } ${currentMonth ? "" : "opacity-45"}`}
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-1">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {isToday ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-accent">
                        Today
                      </span>
                    ) : null}
                  </span>
                  {dayCount > 0 ? (
                    <span className="mt-2 flex gap-1">
                      {Array.from(
                        { length: Math.min(3, dayCount) },
                        (_, index) => (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                            key={index}
                          />
                        ),
                      )}
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className={primaryButtonClass}
          onClick={() =>
            openSlot(selectedDate, Math.max(9, new Date().getHours() + 1))
          }
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add event
        </Button>
        <Button
          className={secondaryButtonClass}
          onClick={() => void refreshWorkspace()}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
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
    .filter((item): item is { event: CalendarEvent; start: Date } =>
      Boolean(item.start),
    )
    .filter((item) => item.start.getTime() >= now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]?.event;
  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="calendar-signal-strip grid gap-3 rounded-xl border border-separator p-3 shadow-sm sm:grid-cols-3">
      <MiniControl
        label="Selected"
        value={`${selectedLabel} · ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
      />
      <MiniControl
        label="Next"
        value={
          nextEvent
            ? `${nextEvent.title} · ${formatEventTime(nextEvent.start)}`
            : "No upcoming event loaded"
        }
      />
      <MiniControl
        label="Source"
        value={
          briefing
            ? briefing.calendar.ok
              ? `Google Calendar · ${view}`
              : "Calendar disconnected"
            : "Loading"
        }
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
  const hours = Array.from(
    { length: calendarEndHour - calendarStartHour },
    (_, index) => index + calendarStartHour,
  );
  const hourHeight = calendarHourHeight;
  const now = new Date();
  const showNow = weekDays.some((day) => sameCalendarDay(day, now));
  const nowTop =
    ((now.getHours() * 60 + now.getMinutes() - calendarStartHour * 60) / 60) *
    hourHeight;

  return (
    <section className={softPanelClass + " overflow-hidden p-3"}>
      <div className="grid grid-cols-[52px_repeat(7,minmax(86px,1fr))] border-b border-separator pb-2">
        <span />
        {weekDays.map((day) => {
          const isSelected = sameCalendarDay(day, selectedDate);
          const isToday = sameCalendarDay(day, now);

          return (
            <Button
              className={`relay-content-card rounded-xl px-2 py-2 text-left transition hover:bg-accent-soft ${
                isSelected ? "bg-accent-soft text-accent" : ""
              }`}
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              type="button"
            >
              <span className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase text-muted">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
                {isToday ? (
                  <span className="text-[9px] text-accent">Today</span>
                ) : null}
              </span>
              <span
                className={`mt-1 grid h-8 w-8 place-items-center rounded-full text-lg font-semibold ${
                  isToday ? "bg-accent text-accent-foreground shadow-sm" : ""
                }`}
              >
                {day.getDate()}
              </span>
            </Button>
          );
        })}
      </div>
      <div className="relative max-h-[620px] overflow-auto">
        <div className="grid grid-cols-[52px_repeat(7,minmax(86px,1fr))]">
          {hours.map((hour) => (
            <div className="contents" key={hour}>
              <div
                className="border-t border-separator pt-1 text-[10px] font-semibold text-muted"
                style={{ height: hourHeight }}
              >
                {formatHour(hour)}
              </div>
              {weekDays.map((day) => (
                <Button
                  className="relay-calendar-slot border-l border-t border-separator text-left transition hover:bg-accent-soft"
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => onSlotClick(day, hour)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(dropEvent) => {
                    dropEvent.preventDefault();
                    const id = dropEvent.dataTransfer.getData(
                      "text/calendar-event-id",
                    );
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
            <div
              className="relative border-l border-transparent"
              key={`events-${day.toISOString()}`}
            >
              {events
                .filter((event) =>
                  sameCalendarDay(parseEventDate(event.start), day),
                )
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
  const end =
    parseEventDate(event.end) ??
    (start ? new Date(start.getTime() + 30 * 60_000) : null);
  if (!start || !end) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = Math.max(
    startMinutes + 20,
    end.getHours() * 60 + end.getMinutes(),
  );
  const top = ((startMinutes - calendarStartHour * 60) / 60) * hourHeight;
  const height = Math.max(34, ((endMinutes - startMinutes) / 60) * hourHeight);

  return (
    <div
      className="calendar-event-position pointer-events-auto absolute left-1 right-1"
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
        <Button
          className="relay-event-card h-full w-full overflow-hidden rounded-xl border border-[var(--accent)] bg-accent-soft p-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:bg-surface"
          draggable={Boolean(event.id)}
          onClick={onClick}
          onDragStart={(dragEvent) => {
            if (event.id)
              dragEvent.dataTransfer.setData(
                "text/calendar-event-id",
                event.id,
              );
          }}
          type="button"
        >
          <span className="block truncate font-semibold">{event.title}</span>
          <span className="mt-0.5 block truncate text-muted">
            {formatEventTime(event.start)}
          </span>
        </Button>
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
  const hours = Array.from(
    { length: calendarEndHour - calendarStartHour },
    (_, index) => index + calendarStartHour,
  );
  const hourHeight = calendarHourHeight;

  return (
    <section className={softPanelClass + " overflow-hidden p-3"}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </h3>
        <StatusBadge
          ready={events.length > 0}
          label={`${events.length} events`}
        />
      </div>
      <div className="relative">
        <div className="space-y-0">
          {hours.map((hour) => (
            <Button
              className="relay-calendar-slot grid border-t border-separator text-left transition hover:bg-accent-soft"
              key={hour}
              onClick={() => onSlotClick(hour)}
              style={{ height: hourHeight }}
              type="button"
            >
              <span className="-mt-2 w-12 bg-surface-secondary pr-2 text-[10px] font-semibold text-muted">
                {formatHour(hour)}
              </span>
            </Button>
          ))}
        </div>
        <div className="absolute left-14 right-0 top-0">
          {events.map((event) => {
            const start = parseEventDate(event.start);
            const end =
              parseEventDate(event.end) ??
              (start ? new Date(start.getTime() + 30 * 60_000) : null);
            if (!start || !end) return null;

            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutes = Math.max(
              startMinutes + 20,
              end.getHours() * 60 + end.getMinutes(),
            );
            const top =
              ((startMinutes - calendarStartHour * 60) / 60) * hourHeight;
            const height = Math.max(
              34,
              ((endMinutes - startMinutes) / 60) * hourHeight,
            );

            return (
              <div
                className="calendar-event-position absolute left-0 right-1"
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
                  <Button
                    className="relay-event-card h-full w-full overflow-hidden rounded-lg border border-[var(--accent)] bg-accent-soft p-2 text-left text-xs shadow-sm transition hover:bg-surface"
                    onClick={() => onEventClick(event)}
                    type="button"
                  >
                    <span className="block truncate font-semibold">
                      {event.title}
                    </span>
                    <span className="mt-0.5 block truncate text-muted">
                      {formatEventTime(event.start)} -{" "}
                      {formatEventTime(event.end)}
                    </span>
                  </Button>
                </HoverPreview>
              </div>
            );
          })}
        </div>
      </div>
      {events.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">
          No events loaded for this day.
        </p>
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
  const duration = Math.max(
    15,
    Math.round((action.end.getTime() - action.start.getTime()) / 60_000),
  );

  function updateDateTime(
    nextDate = date,
    nextTime = time,
    nextDuration = duration,
  ) {
    const start = new Date(`${nextDate}T${nextTime}:00`);
    const end = new Date(start.getTime() + nextDuration * 60_000);
    onChange({ ...action, start, end });
  }

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog
            className={`${panelClass} w-full max-w-md animate-slide-up p-5`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {action.mode === "edit" ? "Edit event" : "Add event"}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {action.mode === "edit"
                    ? "Update the real Google Calendar event."
                    : "Create a real Google Calendar event."}
                </p>
              </div>
              <Button
                className={iconButtonClass}
                onClick={onClose}
                type="button"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Title
                </span>
                <Input
                  className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) =>
                    onChange({ ...action, title: event.target.value })
                  }
                  value={action.title}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Date
                  </span>
                  <Input
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) => updateDateTime(event.target.value)}
                    type="date"
                    value={date}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Time
                  </span>
                  <Input
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) =>
                      updateDateTime(date, event.target.value)
                    }
                    type="time"
                    value={time}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Min
                  </span>
                  <Input
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    min={15}
                    onChange={(event) =>
                      updateDateTime(date, time, Number(event.target.value))
                    }
                    step={15}
                    type="number"
                    value={duration}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Attendees
                  </span>
                  <Input
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)]"
                    onChange={(event) =>
                      onChange({ ...action, attendees: event.target.value })
                    }
                    placeholder="name@example.com, team@example.com"
                    value={action.attendees ?? ""}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Reminder
                  </span>
                  <Select
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) =>
                      onChange({
                        ...action,
                        reminderMinutes:
                          event.target.value === "default"
                            ? null
                            : Number(event.target.value),
                      })
                    }
                    value={action.reminderMinutes ?? "default"}
                  >
                    <option value="default">Default</option>
                    <option value={5}>5 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>1 day</option>
                  </Select>
                </label>
              </div>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Location
                </span>
                <Input
                  className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)]"
                  onChange={(event) =>
                    onChange({ ...action, location: event.target.value })
                  }
                  placeholder="Room, address, or meeting link"
                  value={action.location ?? ""}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Notes
                </span>
                <TextArea
                  className="min-h-24 w-full resize-y rounded-lg border border-separator bg-surface-secondary px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)]"
                  onChange={(event) =>
                    onChange({ ...action, notes: event.target.value })
                  }
                  placeholder="Agenda, prep notes, links, or context"
                  value={action.notes ?? ""}
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                className={primaryButtonClass}
                disabled={!action.title.trim() || saving}
                onClick={onSave}
                type="button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {action.mode === "edit" ? "Save changes" : "Create event"}
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
  const openGoogleTasks = googleTasks.filter(
    (task) => task.status !== "completed",
  );
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
    setGoogleStatus(
      response.ok && data.ok
        ? "Google task completed."
        : (data.reason ?? "Google task was not completed."),
    );
    await refreshWorkspace();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <TaskComposer addTask={addTask} refreshWorkspace={refreshWorkspace} />

      <section className={softPanelClass + " p-4"}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Open tasks</h3>
            <p className="text-xs text-muted">
              {tasks.length} Google total, {taskColumns.length} task lists,{" "}
              {openGoogleTasks.length} Google open
            </p>
          </div>
          <StatusBadge
            ready={Boolean(briefing?.googleTasks?.ok)}
            label={briefing?.googleTasks?.ok ? "Google ready" : "Connect Google"}
          />
        </div>
        <div className="space-y-2">
          {openTasks.slice(0, 5).map((task) => (
            <Button
              className="interactive-row flex w-full items-center gap-3 rounded-lg border border-separator bg-surface p-3 text-left"
              key={task.id}
              onClick={() => completeTask(task)}
              type="button"
            >
              <Check className="h-4 w-4 text-success" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {task.title}
              </span>
              <PriorityTag priority={task.priority} />
            </Button>
          ))}
          {openGoogleTasks.slice(0, 6).map((task) => (
            <Button
              className="interactive-row flex w-full items-center gap-3 rounded-lg border border-separator bg-surface p-3 text-left"
              key={`${task.taskListId}-${task.id}`}
              onClick={() => void completeGoogleTask(task)}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {task.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {task.due
                    ? `Due ${formatEventTime(task.due)}`
                    : (task.taskListTitle ?? "Google Tasks")}
                </span>
              </span>
              <span className="text-xs text-muted">Google</span>
            </Button>
          ))}
        </div>
        {openTasks.length === 0 && openGoogleTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No open tasks"
            detail={
              briefing?.googleTasks?.reason ??
              "Create one from the task builder."
            }
          />
        ) : null}
        {googleStatus ? (
          <p className="mt-3 text-sm text-muted">{googleStatus}</p>
        ) : null}
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
      <Button
        className={primaryButtonClass}
        onClick={() => runPrompt("List recent Drive files")}
        type="button"
      >
        <FolderOpen className="h-4 w-4" />
        Search Drive
      </Button>
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
            <div
              className="rounded-lg border border-separator bg-surface p-3"
              key={note.id}
            >
              <p className="text-sm leading-5">{note.body}</p>
              <p className="mt-2 text-xs text-muted">
                {formatFileTime(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
        {notes.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No memories saved"
            detail="The assistant asks permission before storing long-term memory."
          />
        ) : null}
      </section>
      <Button
        className={primaryButtonClass}
        onClick={() => runPrompt("Remember that ")}
        type="button"
      >
        <Brain className="h-4 w-4" />
        Add memory
      </Button>
    </div>
  );
}

function ContactsWorkspace({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const contacts = briefing?.contacts?.contacts ?? [];
  const birthdayContacts = contacts
    .filter((contact) => contact.birthday)
    .slice(0, 4);

  return (
    <div className="space-y-4 animate-fade-in">
      <section className={softPanelClass + " p-4"}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Google Contacts</h3>
            <p className="mt-1 text-sm text-muted">
              {briefing?.contacts?.ok
                ? "Saved contacts, birthdays, emails, phones, and organizations."
                : (briefing?.contacts?.reason ??
                  "Reconnect Google to grant Contacts access.")}
            </p>
          </div>
          <StatusBadge
            ready={Boolean(briefing?.contacts?.ok)}
            label={
              briefing?.contacts?.ok
                ? `${contacts.length} loaded`
                : "Scope needed"
            }
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button
            className={secondaryButtonClass}
            onClick={() => runPrompt("Find a contact")}
            type="button"
          >
            <Search className="h-4 w-4" />
            Find contact
          </Button>
          <Button
            className={secondaryButtonClass}
            onClick={() => runPrompt("Show upcoming contact birthdays")}
            type="button"
          >
            <CalendarDays className="h-4 w-4" />
            Birthdays
          </Button>
        </div>
      </section>

      {birthdayContacts.length > 0 ? (
        <section className={softPanelClass + " p-4"}>
          <h3 className="mb-3 font-semibold">Birthdays</h3>
          <div className="space-y-2">
            {birthdayContacts.map((contact) => (
              <Button
                className="interactive-row flex w-full items-center justify-between gap-3 rounded-lg border border-separator bg-surface p-3 text-left transition hover:bg-accent-soft"
                key={`${contact.resourceName}-birthday`}
                onClick={() =>
                  runPrompt(
                    `Prepare a birthday reminder for ${contact.displayName}`,
                  )
                }
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {contact.displayName}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {contact.birthday}
                  </span>
                </span>
                <Bell className="h-4 w-4 text-muted" />
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={softPanelClass + " p-4"}>
        <h3 className="mb-3 font-semibold">Recent contacts</h3>
        <div className="space-y-2">
          {contacts.slice(0, 8).map((contact) => (
            <Button
              className="interactive-row grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-separator bg-surface p-3 text-left transition hover:bg-accent-soft"
              key={contact.resourceName ?? contact.displayName}
              onClick={() => runPrompt(`Open contact ${contact.displayName}`)}
              type="button"
            >
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-accent-soft text-sm font-semibold text-accent">
                {contact.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={contact.photoUrl}
                  />
                ) : (
                  contact.displayName.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {contact.displayName}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {contact.emails[0] ??
                    contact.phoneNumbers[0] ??
                    contact.organization ??
                    "No contact method"}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Button>
          ))}
        </div>
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              briefing?.contacts?.ok
                ? "No contacts loaded"
                : "Contacts not connected"
            }
            detail={
              briefing?.contacts?.reason ??
              "Reconnect Google to grant the Contacts scope."
            }
          />
        ) : null}
      </section>
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
      <Button
        className={primaryButtonClass}
        onClick={() => runPrompt("Draft a follow-up email")}
        type="button"
      >
        <Mail className="h-4 w-4" />
        Draft email
      </Button>
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
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [status, setStatus] = useState<{
    ok: boolean;
    message: string;
    link?: string | null;
  } | null>(null);
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
            : (data.reason ?? "Calendar event was not created."),
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
        message:
          error instanceof Error
            ? error.message
            : "Calendar event was not created.",
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
          <p className="mt-1 text-sm text-muted">
            Create a real Google Calendar event after approval.
          </p>
        </div>
        <StatusBadge
          ready={Boolean(status?.ok)}
          label={status?.ok ? "Created" : "Needs details"}
        />
      </div>
      <div className="grid gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Title
          </span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setSummary(event.target.value)}
            placeholder="What should the meeting be called?"
            value={summary}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-muted">
              Date
            </span>
            <Input
              className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-muted">
              Time
            </span>
            <Input
              className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setTime(event.target.value)}
              type="time"
              value={time}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-muted">
              Duration
            </span>
            <Select
              className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setDuration(Number(event.target.value))}
              value={duration}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-muted">
              Timezone
            </span>
            <Input
              className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
              onChange={(event) => setTimeZone(event.target.value)}
              value={timeZone}
            />
          </label>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ToggleRow checked={online} label="Google Meet" onChange={setOnline} />
        <ToggleRow
          checked={reminder}
          label="10 minute reminder"
          onChange={setReminder}
        />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          className={primaryButtonClass}
          disabled={creating || !summary.trim()}
          onClick={createEvent}
          type="button"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Create Google event
        </Button>
        {status?.link ? (
          <Link
            className={secondaryButtonClass}
            href={status.link}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            Open event
          </Link>
        ) : null}
      </div>
      {status ? (
        <p
          className={
            status.ok
              ? "mt-3 text-sm font-medium text-success"
              : "mt-3 text-sm font-medium text-warning"
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
  initialContext,
  onComplete,
  refreshWorkspace,
  runPrompt,
}: {
  addTask: (input: AddTaskInput) => Promise<void>;
  initialContext?: TaskSurfaceContext;
  onComplete?: (summary: string, link?: string | null) => void;
  refreshWorkspace?: () => Promise<void>;
  runPrompt?: (prompt: string) => void;
}) {
  const [title, setTitle] = useState(initialContext?.title ?? "");
  const [priority, setPriority] = useState<RelayTaskPriority>(
    initialContext?.priority ?? "medium",
  );
  const [due, setDue] = useState(initialContext?.due ?? "");
  const [notes, setNotes] = useState(initialContext?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

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

      await refreshWorkspace?.();
      setStatus({
        ok: true,
        message: "Saved to Google Tasks.",
      });
      onComplete?.(`Google Task "${trimmed}" created.`);
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
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-success-soft text-success">
          <ListTodo className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Task builder</h3>
          <p className="text-sm text-muted">
            Prefilled from your request. Adjust only what changed.
          </p>
        </div>
      </div>
      {initialContext?.relatedCompletionHint ? (
        <div className="mb-4 rounded-xl border border-warning bg-warning-soft p-3">
          <p className="text-sm font-semibold text-warning">
            Existing task reference
          </p>
          <p className="mt-1 text-sm text-muted">
            Possible completed task: {initialContext.relatedCompletionHint}.
            Confirm before I modify it.
          </p>
          {runPrompt ? (
            <Button
              className={`${secondaryButtonClass} mt-3 h-9 px-3`}
              onClick={() =>
                runPrompt(
                  `Confirm and mark the matching task complete: ${initialContext.relatedCompletionHint}`,
                )
              }
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm completion
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Task
          </span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Priority
          </span>
          <Select
            className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) =>
              setPriority(event.target.value as RelayTaskPriority)
            }
            value={priority}
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Due date
          </span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setDue(event.target.value)}
            type="date"
            value={due}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Notes
          </span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Context, project, or reminder details"
            value={notes}
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniControl label="Storage" value="Google Tasks" />
        <MiniControl label="Completion" value="Google Tasks status" />
      </div>
      <Button
        className={`${primaryButtonClass} mt-4`}
        disabled={!title.trim() || saving}
        type="submit"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Save task
      </Button>
      {status ? (
        <p
          className={`mt-3 text-sm font-medium ${status.ok ? "text-success" : "text-warning"}`}
        >
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
        reason:
          error instanceof Error
            ? error.message
            : "Unable to load Drive files.",
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
          reason:
            error instanceof Error
              ? error.message
              : "Unable to load Drive files.",
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
          <p className="text-sm text-muted">
            Real recent files from Google Drive.
          </p>
        </div>
        <Button
          className={iconButtonClass}
          onClick={loadFiles}
          type="button"
          title="Refresh files"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>
      {result?.ok && result.files.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-separator">
          {result.files.map((file) => {
            const row = (
              <>
                <DriveFileGlyph
                  className="h-4 w-4 text-accent"
                  mimeType={file.mimeType}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted">
                    {driveFileType(file.mimeType)} by{" "}
                    {file.owner ?? "Unknown owner"}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted" />
              </>
            );

            return file.webViewLink ? (
              <Link
                className="flex items-center gap-3 border-b border-separator px-4 py-3 transition hover:bg-accent-soft last:border-b-0"
                href={file.webViewLink}
                key={file.id ?? file.name}
                rel="noreferrer"
                target="_blank"
              >
                {row}
              </Link>
            ) : (
              <div
                className="flex items-center gap-3 border-b border-separator px-4 py-3 last:border-b-0"
                key={file.id ?? file.name}
              >
                {row}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Drive files loaded"
          detail={
            result?.reason ?? "Connect Google Drive, then refresh this view."
          }
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
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">Memory request</h3>
          <p className="text-sm text-muted">
            Long-term memory requires approval.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-separator bg-surface-secondary p-3 text-sm leading-6">
        <TextArea
          className="min-h-24 w-full resize-y bg-transparent text-sm outline-none placeholder:text-muted"
          onChange={(event) => setMemory(event.target.value)}
          placeholder="Write the exact preference, project fact, contact note, or habit to remember."
          value={memory}
        />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleRow
          checked={allowed}
          label="Allow memory storage"
          onChange={setAllowed}
        />
        <Button
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
        </Button>
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
        const data = (await response.json()) as {
          ok: boolean;
          reason?: string;
        };
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
          <p className="text-sm text-muted">
            Creates a Gmail draft when a recipient is provided.
          </p>
        </div>
        <StatusBadge
          ready={approved}
          label={approved ? "Approved" : "Pending"}
        />
      </div>
      <div className="space-y-3 rounded-lg border border-separator bg-surface-secondary p-4 text-sm leading-6">
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">To</span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface px-3 text-sm outline-none focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setTo(event.target.value)}
            placeholder="person@example.com"
            value={to}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Subject
          </span>
          <Input
            className="h-10 w-full rounded-md border border-separator bg-surface px-3 text-sm outline-none focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setSubject(event.target.value)}
            value={subject}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Body
          </span>
          <TextArea
            className="min-h-28 w-full resize-y rounded-md border border-separator bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)]"
            disabled={!editing}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write or ask the assistant to draft the email body."
            value={body}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          className={primaryButtonClass}
          disabled={!subject.trim() || !body.trim() || savingDraft}
          onClick={() => void approveDraft()}
          type="button"
        >
          {savingDraft ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Approve draft
        </Button>
        <Button
          className={secondaryButtonClass}
          onClick={() => setEditing(true)}
          type="button"
        >
          Edit draft
        </Button>
      </div>
      {status ? (
        <p className="mt-3 text-sm font-medium text-warning">{status}</p>
      ) : null}
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

function TaskMasterDetailView({
  briefing,
  refreshWorkspace,
}: {
  briefing: Briefing | null;
  refreshWorkspace: () => Promise<void>;
}) {
  const googleTasks = briefing?.googleTasks;
  const tasks = useMemo(() => googleTasks?.tasks ?? [], [googleTasks?.tasks]);
  const taskLists = googleTasks?.taskLists ?? [];
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    googleTaskKey(tasks[0] ?? null),
  );
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const orderedTasks = useMemo(() => {
    const open = sortGoogleTasksByUrgency(
      tasks.filter((task) => task.status !== "completed"),
    );
    const completed = tasks
      .filter((task) => task.status === "completed")
      .sort(
        (left, right) =>
          new Date(right.completed ?? right.updated ?? 0).getTime() -
          new Date(left.completed ?? left.updated ?? 0).getTime(),
      );

    return [...open, ...completed];
  }, [tasks]);
  const selectedTask =
    orderedTasks.find((task) => googleTaskKey(task) === selectedTaskId) ??
    orderedTasks[0] ??
    null;

  async function runGoogleTaskAction(body: Record<string, unknown>) {
    const response = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      reason?: string;
    };

    if (!response.ok || !data.ok) {
      throw new Error(data.reason ?? "Google Tasks could not be updated.");
    }

    await refreshWorkspace();
  }

  async function createTask(input: GoogleTaskInput) {
    await runGoogleTaskAction({
      action: "create",
      ...input,
      notes: input.notes ?? "",
    });
  }

  async function updateTask(task: GoogleTask, input: GoogleTaskInput) {
    if (!task.id) throw new Error("This Google task has no editable ID.");
    await runGoogleTaskAction({
      action: "update",
      id: task.id,
      taskListId: task.taskListId,
      title: input.title,
      notes: input.notes ?? "",
      due: input.due,
      priority: input.priority,
    });
  }

  async function completeTask(task: GoogleTask) {
    if (!task.id) throw new Error("This Google task has no completion ID.");
    await runGoogleTaskAction({
      action: "complete",
      id: task.id,
      taskListId: task.taskListId,
    });
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 lg:h-[calc(100vh-144px)] lg:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]">
      <section
        className={`${panelClass} flex min-h-[420px] flex-col overflow-hidden lg:h-full`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-separator p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Google Tasks
            </p>
            <h2 className="mt-1 text-xl font-semibold">Your Google tasks</h2>
            <p className="mt-1 text-sm text-muted">
              {tasks.filter((task) => task.status !== "completed").length} open
              {" · "}
              {tasks.filter((task) => task.status === "completed").length}{" "}
              complete
            </p>
          </div>
          <Button
            className={primaryButtonClass}
            disabled={!googleTasks?.ok}
            onClick={() => setTaskModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>

        <ScrollShadow
          className="min-h-0 flex-1 p-4"
          hideScrollBar={false}
          offset={8}
          size={56}
        >
          <div className="space-y-3">
            {orderedTasks.map((task) => (
              <TaskListCard
                completeTask={completeTask}
                key={googleTaskKey(task)}
                onSelect={() => setSelectedTaskId(googleTaskKey(task))}
                selected={googleTaskKey(selectedTask) === googleTaskKey(task)}
                task={task}
              />
            ))}
            {orderedTasks.length === 0 ? (
              <EmptyState
                detail={
                  googleTasks?.reason ??
                  "Add a Google task to start building your working list."
                }
                icon={ListTodo}
                title={
                  googleTasks?.ok
                    ? "No Google tasks yet"
                    : "Connect Google Tasks"
                }
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>

      <TaskDetailPanel
        completeTask={completeTask}
        key={googleTaskKey(selectedTask) ?? "empty-task-detail"}
        onSave={updateTask}
        task={selectedTask}
      />

      {taskModalOpen ? (
        <GoogleTaskCreationModal
          onCreate={createTask}
          onClose={() => setTaskModalOpen(false)}
          taskLists={taskLists}
        />
      ) : null}
    </div>
  );
}

function TaskListCard({
  completeTask,
  onSelect,
  selected,
  task,
}: {
  completeTask: (task: GoogleTask) => Promise<void>;
  onSelect: () => void;
  selected: boolean;
  task: GoogleTask;
}) {
  const completed = task.status === "completed";

  return (
    <article
      className={`task-rail-card flex items-start gap-3 rounded-2xl border bg-surface p-3 shadow-sm ${
        selected
          ? "border-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
          : "border-separator"
      }`}
    >
      <Button
        className="relay-content-card min-w-0 flex-1 justify-start bg-transparent p-0 text-left hover:bg-transparent"
        onClick={onSelect}
        type="button"
      >
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <PriorityTag priority={googleTaskPriority(task)} />
            {completed ? (
              <Chip color="success" size="sm" variant="soft">
                Complete
              </Chip>
            ) : null}
          </span>
          <span
            className={`mt-2 block text-sm font-semibold leading-5 ${
              completed ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">
            {googleTaskNotes(task.notes) || "No notes added"}
          </span>
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {task.due ? formatDueDate(task.due) : "No due date"}
            </span>
            <span>{task.taskListTitle ?? "Google Tasks"}</span>
          </span>
        </span>
      </Button>
      <TaskCompletionButton completeTask={completeTask} task={task} />
    </article>
  );
}

function TaskCompletionButton({
  completeTask,
  task,
}: {
  completeTask: (task: GoogleTask) => Promise<void>;
  task: GoogleTask;
}) {
  const [busy, setBusy] = useState(false);
  const completed = task.status === "completed";

  async function markComplete() {
    if (completed || busy) return;
    setBusy(true);
    try {
      await completeTask(task);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      aria-pressed={completed}
      className={`h-9 w-9 shrink-0 rounded-full border-2 p-0 transition ${
        completed
          ? "border-[var(--success)] bg-[var(--success)] text-white"
          : "border-[var(--success)] bg-transparent text-[var(--success)] hover:bg-[var(--success-soft)]"
      }`}
      onClick={() => void markComplete()}
      title={completed ? "Task complete" : "Mark task complete"}
      type="button"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4 stroke-[2.5]" />
      )}
    </Button>
  );
}

function TaskDetailPanel({
  completeTask,
  onSave,
  task,
}: {
  completeTask: (task: GoogleTask) => Promise<void>;
  onSave: (task: GoogleTask, input: GoogleTaskInput) => Promise<void>;
  task: GoogleTask | null;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(googleTaskNotes(task?.notes));
  const [priority, setPriority] = useState<GoogleTaskPriority>(
    googleTaskEditablePriority(task),
  );
  const [due, setDue] = useState<DateValue | null>(taskDateValue(task?.due));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function resetDraft(nextTask: GoogleTask | null) {
    setTitle(nextTask?.title ?? "");
    setNotes(googleTaskNotes(nextTask?.notes));
    setPriority(googleTaskEditablePriority(nextTask));
    setDue(taskDateValue(nextTask?.due));
    setStatus(null);
  }

  if (!task) {
    return (
      <section className={`${panelClass} min-h-[420px] p-5`}>
        <EmptyState
          detail="Choose a task from the left to inspect its full details."
          icon={ListTodo}
          title="Select a task"
        />
      </section>
    );
  }

  const activeTask = task;

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      await onSave(activeTask, {
        title: title.trim(),
        notes: notes.trim() || null,
        due: due ? new Date(`${due.toString()}T23:59:00`).toISOString() : null,
        priority,
        taskListId: activeTask.taskListId ?? null,
      });
      setEditing(false);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Task could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={`${panelClass} flex min-h-[520px] min-w-0 flex-col overflow-hidden`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-separator p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Task detail
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold">
            {editing ? "Edit task" : task.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button
              className={secondaryButtonClass}
              onClick={() => {
                resetDraft(task);
                setEditing(true);
              }}
              type="button"
            >
              <FileText className="h-4 w-4" />
              Edit
            </Button>
          ) : null}
          <TaskCompletionButton completeTask={completeTask} task={task} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {editing ? (
          <div className="space-y-5">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase text-muted">
                Title
              </span>
              <Input
                className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase text-muted">
                Notes
              </span>
              <TextArea
                className="min-h-32 w-full resize-y rounded-xl border border-separator bg-surface-secondary px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <TaskDueDatePicker onChange={setDue} value={due} />
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Priority
                </span>
                <Select
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) =>
                    setPriority(event.target.value as GoogleTaskPriority)
                  }
                  value={priority}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </label>
            </div>

            {status ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {status}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className={primaryButtonClass}
                disabled={!title.trim() || saving}
                onClick={() => void save()}
                type="button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save changes
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={() => {
                  resetDraft(task);
                  setEditing(false);
                }}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityTag priority={googleTaskPriority(task)} />
              <Chip
                color={task.status === "completed" ? "success" : "accent"}
                size="sm"
                variant="soft"
              >
                {task.status === "completed" ? "Complete" : "Open"}
              </Chip>
              <Chip size="sm" variant="secondary">
                {task.taskListTitle ?? "Google Tasks"}
              </Chip>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                {googleTaskNotes(task.notes) ||
                  "No notes have been added to this task."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TaskDetailDatum
                icon={CalendarDays}
                label="Due date"
                value={task.due ? formatDueDate(task.due) : "No due date"}
              />
              <TaskDetailDatum
                icon={Clock}
                label="Last updated"
                value={formatTaskTimestamp(task.updated)}
              />
              <TaskDetailDatum
                icon={CheckCircle2}
                label="Completed"
                value={
                  task.completed
                    ? formatTaskTimestamp(task.completed)
                    : "Not completed"
                }
              />
              <TaskDetailDatum
                icon={ListTodo}
                label="Google task list"
                value={task.taskListTitle ?? "Google Tasks"}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TaskDueDatePicker({
  onChange,
  value,
}: {
  onChange: (value: DateValue | null) => void;
  value: DateValue | null;
}) {
  return (
    <DatePicker className="grid gap-1.5" onChange={onChange} value={value}>
      <Label className="text-xs font-semibold uppercase text-muted">
        Due date
      </Label>
      <DateField.Group
        className="h-11 rounded-xl border border-separator bg-surface-secondary px-3"
        fullWidth
        variant="secondary"
      >
        <DateField.Input className="min-w-0 flex-1 text-sm">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger className="text-muted">
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="rounded-2xl border border-separator bg-overlay p-3 shadow-overlay">
        <Calendar aria-label="Choose task due date">
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

function TaskDetailDatum({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-separator bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function taskDateValue(value?: string | null): DateValue | null {
  if (!value) return null;
  try {
    return parseDate(value.slice(0, 10));
  } catch {
    return null;
  }
}

function formatTaskTimestamp(value?: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function GoogleTaskCreationModal({
  onClose,
  onCreate,
  taskLists,
}: {
  onClose: () => void;
  onCreate: (input: GoogleTaskInput) => Promise<void>;
  taskLists: Array<{ id?: string | null; title: string }>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState<DateValue | null>(null);
  const [priority, setPriority] = useState<GoogleTaskPriority>("medium");
  const [taskListId, setTaskListId] = useState(taskLists[0]?.id ?? "@default");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      await onCreate({
        title: title.trim(),
        notes: notes.trim() || null,
        due: due ? new Date(`${due.toString()}T23:59:00`).toISOString() : null,
        priority,
        taskListId: taskListId || "@default",
      });
      onClose();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Google task could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog
            className={`${panelClass} w-full max-w-lg animate-slide-up p-5`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Add Google task</h3>
                <p className="mt-1 text-sm text-muted">
                  Save directly to one of your Google task lists.
                </p>
              </div>
              <Button
                className={iconButtonClass}
                onClick={onClose}
                title="Close"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Title
                </span>
                <Input
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Notes
                </span>
                <TextArea
                  className="min-h-28 w-full resize-y rounded-xl border border-separator bg-surface-secondary px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <TaskDueDatePicker onChange={setDue} value={due} />
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Priority
                  </span>
                  <Select
                    className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) =>
                      setPriority(event.target.value as GoogleTaskPriority)
                    }
                    value={priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Google task list
                </span>
                <Select
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setTaskListId(event.target.value)}
                  value={taskListId}
                >
                  {taskLists.length > 0 ? (
                    taskLists.map((taskList) => (
                      <option
                        key={taskList.id ?? taskList.title}
                        value={taskList.id ?? "@default"}
                      >
                        {taskList.title}
                      </option>
                    ))
                  ) : (
                    <option value="@default">Default</option>
                  )}
                </Select>
              </label>
            </div>

            {status ? (
              <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {status}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className={primaryButtonClass}
                disabled={!title.trim() || saving}
                onClick={() => void save()}
                type="button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add task
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
  setContextMenu: (
    menu: { x: number; y: number; task: RelayTask } | null,
  ) => void;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
}) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const columns =
    taskColumns.length > 0
      ? taskColumns
      : [{ id: "today", title: "Today", order: 0, createdAt: "system" }];
  const googleTasks =
    briefing?.googleTasks?.tasks.filter(
      (task) => task.status !== "completed",
    ) ?? [];
  const sortedLocalTasks = sortTasksByUrgency(openTasks);

  async function taskAction(body: Record<string, unknown>) {
    await fetch("/api/google/tasks", {
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

  const useMasterDetailLayout = true;
  if (useMasterDetailLayout) {
    return (
      <TaskMasterDetailView
        briefing={briefing}
        refreshWorkspace={refreshWorkspace}
      />
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden p-5`}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Task board</h2>
            <p className="mt-1 text-sm text-muted">
              Editable local Kanban columns with deadline-aware cards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className={secondaryButtonClass}
              onClick={addColumn}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add column
            </Button>
            <Button
              className={primaryButtonClass}
              onClick={() => setTaskModalOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            className="h-10 min-w-0 flex-1 rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)]"
            onChange={(event) => setNewColumnTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addColumn();
            }}
            placeholder="New column name..."
            value={newColumnTitle}
          />
          <Button
            className={secondaryButtonClass + " px-3"}
            onClick={addColumn}
            type="button"
            title="Create column"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto pb-2">
          <div
            className="grid min-w-[920px] gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
            }}
          >
            {columns.map((column, columnIndex) => {
              const columnTasks = openTasks.filter(
                (task) => (task.columnId ?? columns[0]?.id) === column.id,
              );
              return (
                <div
                  className={
                    softPanelClass + " flex min-h-[560px] flex-col p-3"
                  }
                  key={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId =
                      event.dataTransfer.getData("text/relay-task-id");
                    if (taskId)
                      void taskAction({
                        action: "move",
                        id: taskId,
                        columnId: column.id,
                      });
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {renamingColumn === column.id ? (
                      <Input
                        className="h-9 min-w-0 flex-1 rounded-lg border border-separator bg-surface px-2 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter")
                            void renameColumn(column.id);
                          if (event.key === "Escape") setRenamingColumn(null);
                        }}
                        value={renameValue}
                      />
                    ) : (
                      <Button
                        className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
                        onClick={() => {
                          setRenamingColumn(column.id);
                          setRenameValue(column.title);
                        }}
                        type="button"
                      >
                        {column.title}
                      </Button>
                    )}
                    <span className="rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                      {columnTasks.length}
                    </span>
                    <Button
                      className={iconButtonClass + " h-8 w-8"}
                      disabled={columnIndex === 0}
                      onClick={() => void reorderColumn(column.id, -1)}
                      type="button"
                      title="Move column left"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                    <Button
                      className={iconButtonClass + " h-8 w-8"}
                      disabled={columnIndex === columns.length - 1}
                      onClick={() => void reorderColumn(column.id, 1)}
                      type="button"
                      title="Move column right"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      className={iconButtonClass + " h-8 w-8"}
                      disabled={columns.length <= 1}
                      onClick={() =>
                        void taskAction({
                          action: "delete_column",
                          id: column.id,
                        })
                      }
                      type="button"
                      title="Delete column"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
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
                      <div className="rounded-xl border border-dashed border-separator p-5 text-center text-sm text-muted">
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

      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <h2 className="text-lg font-semibold">Global task view</h2>
          <p className="mt-1 text-sm text-muted">
            Sorted by urgency and deadline proximity.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {sortedLocalTasks.map((task) => (
              <Button
                className="interactive-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-separator bg-surface-secondary p-3 text-left"
                key={task.id}
                onClick={() => void completeTask(task)}
                type="button"
              >
                <PriorityTag priority={task.priority} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {task.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {task.due ? formatDueDate(task.due) : "No deadline"} ·{" "}
                    {task.notes || "No notes"}
                  </span>
                </span>
                <Check className="h-4 w-4 text-success" />
              </Button>
            ))}
            {googleTasks.map((task) => (
              <Button
                className="interactive-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-separator bg-surface-secondary p-3 text-left"
                key={`${task.taskListId}-${task.id ?? task.title}`}
                onClick={() => void completeGoogleTask(task)}
                type="button"
              >
                <PriorityTag priority={googleTaskPriority(task)} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {task.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {task.due
                      ? formatDueDate(task.due)
                      : (task.taskListTitle ?? "Google Tasks")}{" "}
                    · {task.notes || "No notes"}
                  </span>
                </span>
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </Button>
            ))}
            {sortedLocalTasks.length === 0 && googleTasks.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                title={tasks.length > 0 ? "All tasks complete" : "No tasks yet"}
                detail={
                  briefing?.googleTasks?.reason ??
                  "Use Add task or ask chat to create one."
                }
              />
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
  setContextMenu: (
    menu: { x: number; y: number; task: RelayTask } | null,
  ) => void;
  task: RelayTask;
}) {
  return (
    <HoverPreview
      detail={task.notes || "No notes saved."}
      meta={task.due ? `Due ${formatDueDate(task.due)}` : "No deadline"}
      title={task.title}
    >
      <article
        className="interactive-row rounded-xl border border-separator bg-surface p-3 shadow-sm"
        draggable
        onContextMenu={(event: MouseEvent<HTMLElement>) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY, task });
        }}
        onDragStart={(event) =>
          event.dataTransfer.setData("text/relay-task-id", task.id)
        }
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <PriorityTag priority={task.priority} />
          <Button
            className={iconButtonClass + " h-8 w-8"}
            onClick={() => completeTask(task)}
            type="button"
            title="Complete task"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm font-semibold leading-5">{task.title}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
          {task.notes || "No notes"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
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
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog
            className={`${panelClass} w-full max-w-lg animate-slide-up p-5`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Add task</h3>
                <p className="mt-1 text-sm text-muted">
                  Create a Google Task with real metadata.
                </p>
              </div>
              <Button
                className={iconButtonClass}
                onClick={onClose}
                type="button"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Title
                </span>
                <Input
                  className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Notes
                </span>
                <TextArea
                  className="min-h-24 w-full resize-y rounded-lg border border-separator bg-surface-secondary px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Due
                  </span>
                  <Input
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) => setDue(event.target.value)}
                    type="date"
                    value={due}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Priority
                  </span>
                  <Select
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) =>
                      setPriority(event.target.value as RelayTaskPriority)
                    }
                    value={priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Column
                  </span>
                  <Select
                    className="h-10 w-full rounded-lg border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) => setColumnId(event.target.value)}
                    value={columnId}
                  >
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                className={primaryButtonClass}
                disabled={!title.trim() || saving}
                onClick={() => void save()}
                type="button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Create task
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function FilesView({
  briefing,
  runPrompt,
}: {
  briefing: Briefing | null;
  runPrompt: (prompt: string) => void;
}) {
  const initialFiles = useMemo(
    () => briefing?.drive.files ?? [],
    [briefing?.drive.files],
  );
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const files = searchResults ?? initialFiles;
  const selectedFile =
    files.find((file) => (file.id ?? file.name) === selectedFileId) ??
    files[0] ??
    null;

  async function searchFiles(nextQuery = query) {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/google/drive/files${nextQuery ? `?q=${encodeURIComponent(nextQuery)}` : ""}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        files: DriveFile[];
      };
      setSearchResults(data.files ?? []);
      setSelectedFileId(
        data.files?.[0] ? (data.files[0].id ?? data.files[0].name) : null,
      );
      if (!response.ok || !data.ok)
        setStatus(data.reason ?? "Drive search failed.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Drive search failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-144px)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Drive browser</h2>
              <p className="mt-1 text-sm text-muted">
                {briefing?.google.connected
                  ? "Browse and search real Google Drive files."
                  : "Connect Google Drive to browse files."}
              </p>
            </div>
            <Button
              className={primaryButtonClass}
              onClick={() => runPrompt("Summarize my recent Drive files")}
              type="button"
            >
              <Wand2 className="h-4 w-4" />
              Ask AI
            </Button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void searchFiles();
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-separator bg-surface-secondary px-3">
              <Search className="h-4 w-4 text-muted" />
              <Input
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Drive files and folders..."
                value={query}
              />
            </div>
            <Button
              className={secondaryButtonClass}
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </div>

        <div className="recent-file-strip border-b border-separator px-5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {initialFiles.slice(0, 8).map((file) => (
              <Button
                className="interactive-control flex min-w-52 items-center gap-2 rounded-xl border border-separator bg-surface-secondary px-3 py-2 text-left"
                key={file.id ?? file.name}
                onClick={() => setSelectedFileId(file.id ?? file.name)}
                type="button"
              >
                <DriveFileGlyph
                  className="h-4 w-4 shrink-0 text-accent"
                  mimeType={file.mimeType}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {file.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {formatFileTime(file.modifiedTime)}
                  </span>
                </span>
              </Button>
            ))}
            {initialFiles.length === 0 ? (
              <span className="text-sm text-muted">
                {briefing?.drive.reason ?? "No recent files loaded."}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {status ? (
            <p className="mb-3 rounded-lg border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
              {status}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {files.map((file) => (
              <HoverPreview
                detail={`${driveFileType(file.mimeType)} · ${file.owner ?? "Unknown owner"} · ${formatFileTime(file.modifiedTime)}`}
                key={file.id ?? file.name}
                meta={
                  file.mimeType.includes("folder")
                    ? "Folder"
                    : driveFileType(file.mimeType)
                }
                title={file.name}
              >
                <Button
                  className={`relay-content-card interactive-row rounded-2xl border p-4 text-left ${
                    selectedFileId === (file.id ?? file.name)
                      ? "border-[var(--accent)] bg-accent-soft"
                      : "border-separator bg-surface-secondary"
                  }`}
                  onClick={() => setSelectedFileId(file.id ?? file.name)}
                  type="button"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                      <DriveFileGlyph
                        className="h-5 w-5"
                        mimeType={file.mimeType}
                      />
                    </span>
                    <span className="rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                      {driveFileType(file.mimeType)}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm font-semibold leading-5">
                    {file.name}
                  </p>
                  <p className="mt-2 truncate text-xs text-muted">
                    {file.owner ?? "Unknown owner"}
                  </p>
                </Button>
              </HoverPreview>
            ))}
          </div>
          {files.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={
                briefing?.google.connected
                  ? "No Drive files found"
                  : "Drive not connected"
              }
              detail={
                status ??
                briefing?.drive.reason ??
                "Search Drive or connect Google."
              }
            />
          ) : null}
        </div>
      </section>

      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <h2 className="text-lg font-semibold">Quick preview</h2>
          <p className="mt-1 text-sm text-muted">
            Open, download, or ask AI about the selected file.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {selectedFile ? (
            <FilePreviewCard file={selectedFile} runPrompt={runPrompt} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No file selected"
              detail="Select a Drive file to preview actions."
            />
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
  const downloadUrl = file.id
    ? `https://drive.google.com/uc?id=${encodeURIComponent(file.id)}&export=download`
    : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-2xl border border-separator bg-surface-secondary p-5">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <DriveFileGlyph className="h-6 w-6" mimeType={file.mimeType} />
        </span>
        <h3 className="mt-4 text-lg font-semibold leading-6">{file.name}</h3>
        <div className="mt-4 space-y-2">
          <MiniControl label="Type" value={driveFileType(file.mimeType)} />
          <MiniControl label="Owner" value={file.owner ?? "Unknown owner"} />
          <MiniControl
            label="Modified"
            value={formatFileTime(file.modifiedTime)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        {file.webViewLink ? (
          <Link
            className={primaryButtonClass}
            href={file.webViewLink}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Drive
          </Link>
        ) : null}
        {downloadUrl ? (
          <Link
            className={secondaryButtonClass}
            href={downloadUrl}
            rel="noreferrer"
            target="_blank"
          >
            <UploadCloud className="h-4 w-4 rotate-180" />
            Download
          </Link>
        ) : null}
        <Button
          className={secondaryButtonClass}
          onClick={() => runPrompt(`Summarize Drive file ${file.name}`)}
          type="button"
        >
          <Sparkles className="h-4 w-4" />
          Ask AI about file
        </Button>
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
  const [selectedRepoName, setSelectedRepoName] = useState(
    repositories[0]?.fullName ?? "",
  );
  const selectedRepo =
    repositories.find((repo) => repo.fullName === selectedRepoName) ??
    repositories[0] ??
    null;
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
          fetch(
            `/api/github/issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&maxResults=20`,
          ),
          fetch(
            `/api/github/pulls?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}&maxResults=10`,
          ),
        ]);
        const issuesData = (await issuesResponse.json()) as {
          ok: boolean;
          reason?: string;
          issues: GithubIssue[];
        };
        const pullsData = (await pullsResponse.json()) as {
          ok: boolean;
          reason?: string;
          pullRequests: GithubPullRequest[];
        };

        if (!active) return;
        setRepoIssues(issuesData.issues ?? []);
        setRepoPulls(pullsData.pullRequests ?? []);
        if (!issuesResponse.ok || !issuesData.ok)
          setGithubStatus(
            issuesData.reason ?? "Unable to load repository issues.",
          );
        if (!pullsResponse.ok || !pullsData.ok)
          setGithubStatus(
            pullsData.reason ?? "Unable to load repository pull requests.",
          );
      } catch (error) {
        if (active)
          setGithubStatus(
            error instanceof Error
              ? error.message
              : "Unable to load repository context.",
          );
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
      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <h2 className="text-lg font-semibold">Repositories</h2>
          <p className="mt-1 text-sm text-muted">
            {signedInToGithub
              ? `${repositories.length} recent repos`
              : "Connect GitHub to browse repositories."}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {repositories.map((repo) => (
            <Button
              className={`relay-content-card mb-2 w-full rounded-xl border p-3 text-left transition hover:border-[var(--accent)] hover:bg-accent-soft ${
                selectedRepo?.id === repo.id
                  ? "border-[var(--accent)] bg-accent-soft"
                  : "border-separator bg-surface-secondary"
              }`}
              key={repo.id}
              onClick={() => setSelectedRepoName(repo.fullName)}
              type="button"
            >
              <span className="block truncate text-sm font-semibold">
                {repo.fullName}
              </span>
              <span className="mt-1 block truncate text-xs text-muted">
                {repo.language ?? "No language"} · {repo.openIssues} open
              </span>
            </Button>
          ))}
          {repositories.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title={
                signedInToGithub
                  ? "No repositories loaded"
                  : "GitHub not connected"
              }
              detail={
                briefing?.githubRepositories?.reason ??
                "Connect GitHub from Integrations."
              }
            />
          ) : null}
        </div>
      </section>

      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {selectedRepo?.fullName ?? "Repository workspace"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedRepo?.description ??
                  "Select a repository to inspect its issues and pull requests."}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedRepo?.htmlUrl ? (
                <Link
                  className={secondaryButtonClass}
                  href={selectedRepo.htmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open repo
                </Link>
              ) : null}
              <Button
                className={primaryButtonClass}
                disabled={!selectedRepo}
                onClick={() => askRepo("What should I fix first in this repo?")}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </div>
          {selectedRepo ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MiniControl
                label="Issues"
                value={`${selectedRepo.openIssues}`}
              />
              <MiniControl label="Stars" value={`${selectedRepo.stars}`} />
              <MiniControl label="Forks" value={`${selectedRepo.forks}`} />
              <MiniControl
                label="Updated"
                value={formatFileTime(selectedRepo.updatedAt)}
              />
            </div>
          ) : null}
          {githubStatus ? (
            <p className="mt-3 rounded-lg border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
              {githubStatus}
            </p>
          ) : null}
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
              <GithubIssueList
                issues={repoIssues}
                runPrompt={runPrompt}
                title="Open issues"
              />
              <GithubPullList pullRequests={repoPulls} runPrompt={runPrompt} />
            </div>
          )}
        </div>
      </section>

      <section
        className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
      >
        <div className="border-b border-separator p-5">
          <h2 className="text-lg font-semibold">Repo Q&A</h2>
          <p className="mt-1 text-sm text-muted">
            Ask the assistant with repository context attached.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {[
            "Summarize open issues",
            "What should I fix first?",
            "What changed recently?",
          ].map((prompt) => (
            <Button
              className="interactive-row w-full rounded-xl border border-separator bg-surface-secondary p-3 text-left text-sm font-semibold"
              key={prompt}
              onClick={() => askRepo(prompt)}
              type="button"
            >
              {prompt}
            </Button>
          ))}
        </div>
        <form
          className="border-t border-separator p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!question.trim()) return;
            askRepo(question);
            setQuestion("");
          }}
        >
          <div className="flex gap-2 rounded-xl border border-separator bg-surface-secondary p-2">
            <Input
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this repo..."
              value={question}
            />
            <Button
              className={primaryButtonClass + " h-10 w-10 px-0"}
              disabled={!selectedRepo}
              type="submit"
              title="Ask"
            >
              <Send className="h-4 w-4" />
            </Button>
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
          <div
            className="rounded-xl border border-separator bg-surface-secondary p-3"
            key={issue.id}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <Button
                className="relay-content-row min-w-0 text-left"
                onClick={() =>
                  runPrompt(
                    `Summarize GitHub issue ${issue.repositoryFullName ?? ""} #${issue.number}`,
                  )
                }
                type="button"
              >
                <span className="block line-clamp-3 text-sm font-semibold leading-5">
                  {issue.title}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  #{issue.number} · {formatFileTime(issue.updatedAt)}
                </span>
              </Button>
              <Link
                aria-label="Open issue"
                className={iconButtonClass + " h-8 w-8"}
                href={issue.htmlUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${githubUrgencyClass(issue)}`}
              >
                {githubUrgency(issue)}
              </span>
              {issue.labels.slice(0, 3).map((label) => (
                <span
                  className="rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted"
                  key={label}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
        {issues.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No issues loaded"
            detail="This repository has no open issues in the loaded view."
          />
        ) : null}
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
          <div
            className="rounded-xl border border-separator bg-surface-secondary p-3"
            key={pullRequest.id}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <Button
                className="relay-content-row min-w-0 text-left"
                onClick={() =>
                  runPrompt(
                    `Summarize GitHub pull request ${pullRequest.repositoryFullName} #${pullRequest.number}`,
                  )
                }
                type="button"
              >
                <span className="block line-clamp-3 text-sm font-semibold leading-5">
                  {pullRequest.title}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  #{pullRequest.number} ·{" "}
                  {formatFileTime(pullRequest.updatedAt)}
                </span>
              </Button>
              <Link
                aria-label="Open pull request"
                className={iconButtonClass + " h-8 w-8"}
                href={pullRequest.htmlUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                {pullRequest.state}
              </span>
              {pullRequest.draft ? (
                <span className="rounded-full bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning">
                  draft
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {pullRequests.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No pull requests loaded"
            detail="Open pull requests will appear here."
          />
        ) : null}
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
            <h3 className="truncate font-semibold">
              {selectedRepo?.fullName ?? "GitHub context"}
            </h3>
            <p className="mt-1 truncate text-xs text-muted">
              {briefing?.github?.connected
                ? `${repositories.length} repos loaded`
                : "GitHub not connected"}
            </p>
          </div>
          <GitBranch className="h-4 w-4 text-accent" />
        </div>
        <div className="grid gap-2">
          <Button
            className={primaryButtonClass + " w-full"}
            onClick={() => runPrompt("What should I fix first on GitHub?")}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            Prioritize GitHub work
          </Button>
          {selectedRepo?.htmlUrl ? (
            <Link
              className={secondaryButtonClass + " w-full"}
              href={selectedRepo.htmlUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              Open repo
            </Link>
          ) : null}
        </div>
      </section>
      <GithubIssueList
        issues={issues.slice(0, 5)}
        runPrompt={runPrompt}
        title="Assigned issues"
      />
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
            <p className="mt-1 text-sm text-muted">
              Preferences, projects, contacts, and habits.
            </p>
          </div>
          <StatusBadge ready label={`${notes.length} notes`} />
        </div>
        <div className="space-y-3">
          {notes.length > 0 ? (
            notes.slice(0, 8).map((note) => (
              <div
                className="rounded-lg border border-separator bg-surface-secondary p-4"
                key={note.id}
              >
                <p className="text-sm leading-6">{note.body}</p>
                <p className="mt-2 text-xs text-muted">
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
          description="Calendar, Gmail, Drive, Tasks, Contacts management, and Meet creation."
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
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <StatusBadge ready={ready} label={statusLabel} />
              </div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="mt-1 text-sm text-muted">
              {signedIn
                ? `Connected as ${connectedLabel}`
                : configured
                  ? "OAuth app configured"
                  : disconnectedLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            className={signedIn ? secondaryButtonClass : primaryButtonClass}
            disabled={!configured && !signedIn}
            onClick={onConnect}
            type="button"
          >
            <Link2 className="h-4 w-4" />
            {signedIn ? "Reconnect" : "Connect"}
          </Button>
          {signedIn ? (
            <Button
              className={secondaryButtonClass}
              onClick={onDisconnect}
              type="button"
            >
              Disconnect
            </Button>
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
  const displayEmail =
    user?.email ??
    oauthStatus?.googleEmail ??
    oauthStatus?.github?.email ??
    "No email connected";
  const displayName =
    user?.name ||
    oauthStatus?.github?.name ||
    oauthStatus?.github?.login ||
    "Relay user";
  const usingPostgres = passwordAuth?.persistence === "postgres";
  const initials =
    displayName
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
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/90 text-xl font-semibold text-accent shadow-lg shadow-black/10">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    Profile
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">
                    {displayName}
                  </h2>
                  <p className="mt-1 truncate text-sm text-white/75">
                    {displayEmail}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  ready={Boolean(user?.emailVerified)}
                  label={
                    user?.emailVerified
                      ? "Email verified"
                      : "Email not verified"
                  }
                />
                <StatusBadge
                  ready={Boolean(signedInToGoogle || signedInToGithub)}
                  label={
                    signedInToGoogle || signedInToGithub
                      ? "OAuth linked"
                      : "No OAuth"
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <MiniControl
              label="Password session"
              value={passwordAuth?.authenticated ? "Active" : "Not signed in"}
            />
            <MiniControl
              label="Google"
              value={
                signedInToGoogle
                  ? (oauthStatus?.googleEmail ?? "Connected")
                  : "Not connected"
              }
            />
            <MiniControl
              label="GitHub"
              value={
                signedInToGithub
                  ? (oauthStatus?.github?.login ?? "Connected")
                  : "Not connected"
              }
            />
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
              <p className="mt-1 text-sm text-muted">
                Manage the accounts this assistant can use.
              </p>
            </div>
            <Link2 className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-3">
            <ProfileConnectionRow
              configured={googleConfigured}
              detail={
                signedInToGoogle
                  ? (oauthStatus?.googleEmail ?? "Google Workspace connected")
                  : "Calendar, Gmail, Drive, and Tasks access"
              }
              icon={Globe}
              name="Google Workspace"
              onConnect={connectGoogle}
              onDisconnect={disconnectGoogle}
              signedIn={signedInToGoogle}
            />
            <ProfileConnectionRow
              configured={githubConfigured}
              detail={
                signedInToGithub
                  ? (oauthStatus?.github?.login ?? "GitHub connected")
                  : "Repositories, issues, and pull requests"
              }
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
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning-soft text-warning">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Account persistence</h3>
              <p className="mt-1 text-sm text-muted">
                What is real in this deployment.
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            <SettingRow
              label="Email/password users"
              value={
                usingPostgres ? "Postgres database" : "Local JSON file store"
              }
            />
            <SettingRow label="Session type" value="Signed HTTP-only cookie" />
            <SettingRow
              label="Vercel database"
              value={
                usingPostgres
                  ? "Connected through DATABASE_URL"
                  : "Not connected yet"
              }
            />
            <SettingRow
              label="Production recommendation"
              value="Postgres + Auth adapter"
            />
          </div>
          <p
            className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
              usingPostgres
                ? "border-success/30 bg-success-soft text-success"
                : "border-warning/30 bg-warning-soft text-warning"
            }`}
          >
            {usingPostgres
              ? "Password users, memories, and scheduled-email metadata are persisted through Postgres when DATABASE_URL is available. Tasks remain in Google Tasks."
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
  const [message, setMessage] = useState<{
    tone: "success" | "warning";
    text: string;
  } | null>(null);
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
        setMessage({
          tone: "warning",
          text: data.reason ?? "Unable to change password.",
        });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({
        tone: "success",
        text: "Password updated. Your session remains active.",
      });
      await onPasswordChanged();
    } catch {
      setMessage({
        tone: "warning",
        text: "Password update failed. Try again.",
      });
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
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="mt-1 text-sm text-muted">
            Change password or end this browser session.
          </p>
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
          <p
            className={`rounded-lg p-3 text-sm font-medium ${message.tone === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}
          >
            {message.text}
          </p>
        ) : null}
        <Button
          className={primaryButtonClass + " w-full"}
          disabled={!canChangePassword || saving}
          type="submit"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Change password
        </Button>
      </form>

      <div className="mt-4 border-t border-separator pt-4">
        <Button
          className={secondaryButtonClass + " w-full"}
          disabled={signingOut}
          onClick={signOut}
          type="button"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </Button>
        {!canChangePassword ? (
          <p className="mt-3 text-xs leading-5 text-muted">
            Password changes require an active email/password session.
            OAuth-only users can manage connected accounts below.
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
    <div className="hover-lift rounded-xl border border-separator bg-surface-secondary p-4 transition">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{name}</p>
            <p className="mt-1 truncate text-sm text-muted">{detail}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            className={signedIn ? secondaryButtonClass : primaryButtonClass}
            disabled={!configured && !signedIn}
            onClick={onConnect}
            type="button"
          >
            {signedIn ? "Reconnect" : "Connect"}
          </Button>
          {signedIn ? (
            <Button
              className={secondaryButtonClass}
              onClick={onDisconnect}
              type="button"
            >
              Disconnect
            </Button>
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
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the provider check.",
      });
    } finally {
      setCheckingProvider(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className={`${panelClass} p-5`}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">AI provider</h2>
            <p className="mt-1 text-sm text-muted">
              {aiStatus?.configured
                ? `${aiStatus.label} key is present`
                : "Local mode"}
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <SettingRow
            label="Provider"
            value={aiStatus?.label ?? "OpenRouter"}
          />
          <SettingRow
            label="Model"
            value={aiStatus?.modelId ?? "openrouter/free"}
          />
          <SettingRow
            label="Server key"
            value={aiStatus?.configured ? "Present" : "Missing"}
          />
          <SettingRow
            label="Recommended free start"
            value="OpenRouter free router"
          />
          <SettingRow label="Regional fallback" value="Gemini when available" />
        </div>
        <div className="mt-5 rounded-lg border border-separator bg-surface-secondary p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Live provider check</p>
              <p className="mt-1 text-xs text-muted">
                Confirms the server key can make a real model call.
              </p>
            </div>
            <Button
              className={secondaryButtonClass}
              disabled={checkingProvider}
              onClick={testProvider}
              type="button"
            >
              {checkingProvider ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Test
            </Button>
          </div>
          {providerHealth ? (
            <p
              className={
                providerHealth.ok
                  ? "mt-3 text-sm font-medium text-success"
                  : "mt-3 text-sm font-medium text-warning"
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
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-success-soft text-success">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Security posture</h2>
            <p className="mt-1 text-sm text-muted">
              Human approval and scoped OAuth.
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <SettingRow
            label="Google OAuth"
            value={
              oauthStatus?.hasDirectGoogleToken ? "Connected" : "Not connected"
            }
          />
          <SettingRow
            label="GitHub OAuth"
            value={
              oauthStatus?.github?.connected
                ? (oauthStatus.github.login ?? "Connected")
                : "Not connected"
            }
          />
          <SettingRow
            label="Token storage"
            value="HTTP-only cookie in development"
          />
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
    <aside className="hidden min-h-screen flex-col gap-4 bg-surface-secondary p-4 xl:flex">
      <section className={`${panelClass} hover-lift p-4`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Current task</h2>
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent-soft text-accent">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <p className="text-sm leading-6 text-muted">
          {briefing?.focus?.title ??
            openTasks[0]?.title ??
            "No current task. Add one from chat or Tasks."}
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
            value: briefing?.calendar.ok
              ? `${briefing.calendar.events.length} events`
              : "Unavailable",
          },
          {
            label: "Drive data",
            ready: Boolean(briefing?.drive.ok),
            value: briefing?.drive.ok
              ? `${briefing.drive.files.length} files`
              : "Unavailable",
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
          <SidebarStatus
            label="Google"
            ready={signedInToGoogle}
            value={oauthStatus?.googleEmail ?? "OAuth"}
          />
          <SidebarStatus
            label="AI"
            ready={Boolean(aiStatus?.configured)}
            value={aiStatus?.configured ? `${aiStatus.label} key` : "Local"}
          />
          <SidebarStatus
            label="Local store"
            ready
            value={`${openTasks.length} open tasks`}
          />
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
          <NotificationLine
            icon={ListTodo}
            text={`${openTasks.length} tasks remain open`}
          />
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
    <Disclosure
      className={`${panelClass} overflow-hidden`}
      isExpanded={open}
      onExpandedChange={setOpen}
    >
      <Disclosure.Heading>
        <Disclosure.Trigger className="group flex w-full items-center gap-3 rounded-none px-4 py-3 text-left transition hover:bg-accent-soft">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold">{title}</span>
          <Disclosure.Indicator className="h-4 w-4 text-muted" />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="border-t border-separator p-4">
          {children}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

function RecentFilesPanel({ briefing }: { briefing: Briefing | null }) {
  const files = briefing?.drive.files ?? [];

  return (
    <section className={`${panelClass} hover-lift p-5`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent files</h2>
          <p className="mt-1 text-sm text-muted">
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
                <span className="grid h-10 w-10 place-items-center rounded-md bg-accent-soft text-accent">
                  <DriveFileGlyph
                    className="h-5 w-5"
                    mimeType={file.mimeType}
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {driveFileType(file.mimeType)} by{" "}
                    {file.owner ?? "Unknown owner"}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {formatFileTime(file.modifiedTime)}
                </span>
              </>
            );

            return file.webViewLink ? (
              <Link
                className="interactive-row grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-separator bg-surface-secondary p-3"
                href={file.webViewLink}
                key={file.id ?? file.name}
                rel="noreferrer"
                target="_blank"
              >
                {content}
              </Link>
            ) : (
              <div
                className="interactive-row grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-separator bg-surface-secondary p-3"
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
          title={
            briefing?.google.connected
              ? "No Drive files loaded"
              : "Drive not connected"
          }
          detail={
            briefing?.drive.reason ??
            "Connect Google and refresh the workspace."
          }
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
    <Modal isOpen onOpenChange={setOpen}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="top">
          <Modal.Dialog
            className={`${panelClass} mt-20 w-full max-w-xl overflow-hidden p-0`}
          >
            <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
              <Search className="h-4 w-4 text-muted" />
              <Input
                autoFocus
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands..."
                value={query}
              />
              <Button
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-secondary"
                onClick={() => setOpen(false)}
                type="button"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {filtered.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-surface-secondary"
                    key={action.label}
                    onClick={() => run(action)}
                    type="button"
                  >
                    <Icon className="h-4 w-4 text-accent" />
                    {action.label}
                  </Button>
                );
              })}
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted">
                  No matching commands.
                </div>
              ) : null}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
          {toast.detail ? (
            <p className="mt-1 text-xs text-muted">{toast.detail}</p>
          ) : null}
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
      <Button
        className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-surface-secondary"
        onClick={() => {
          onComplete();
          onClose();
        }}
        type="button"
      >
        <Check className="h-4 w-4 text-success" />
        Complete
      </Button>
      <Button
        className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-surface-secondary"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4 text-muted" />
        Close menu
      </Button>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <BrandSymbol />
      <div>
        <p className="brand-wordmark text-base font-semibold leading-5">
          Relay
        </p>
        <p className="text-xs text-muted">Personal AI OS</p>
      </div>
    </div>
  );
}

function BrandSymbol() {
  return (
    <span className="brand-symbol grid h-11 w-11 shrink-0 place-items-center">
      <Image
        alt=""
        aria-hidden="true"
        className="brand-symbol-image h-11 w-11 object-contain"
        height={44}
        src="/brand/relay-mark-cyan.svg"
        unoptimized
        width={44}
      />
    </span>
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
      <span className="text-xs font-semibold uppercase text-muted">
        {label}
      </span>
      <Input
        autoComplete={autoComplete}
        className="h-11 w-full rounded-md border border-separator bg-surface-secondary px-3 text-sm outline-none transition placeholder:text-muted focus:border-[var(--accent)]"
        name={name}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function MiniControl({ label, value }: { label: string; value: string }) {
  return (
    <Surface
      className="rounded-xl border border-separator px-3 py-3"
      variant="secondary"
    >
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </Surface>
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
    <Switch
      className="h-11 rounded-lg border border-separator bg-surface-secondary px-3"
      isSelected={checked}
      onChange={onChange}
    >
      <Switch.Content className="flex w-full items-center justify-between gap-3 text-sm font-semibold">
        {label}
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

function StatusBadge({ label, ready }: { label: string; ready: boolean }) {
  return (
    <Chip
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
        ready ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
      }`}
    >
      {ready ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </Chip>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <Surface
      className="flex items-center justify-between gap-4 rounded-xl border border-separator px-4 py-3"
      variant="secondary"
    >
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </Surface>
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
    <Surface
      className="flex items-center justify-between gap-3 rounded-xl border border-separator px-3 py-2"
      variant="secondary"
    >
      <span className="text-sm font-medium">{label}</span>
      <Chip
        className="text-xs font-semibold"
        color={ready ? "success" : "warning"}
        size="sm"
        variant="soft"
      >
        {value}
      </Chip>
    </Surface>
  );
}

function NotificationLine({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <Surface
      className="flex items-center gap-3 rounded-xl border border-separator px-3 py-2"
      variant="secondary"
    >
      <Icon className="h-4 w-4 text-accent" />
      <span>{text}</span>
    </Surface>
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
    <Surface
      className="rounded-xl border border-dashed border-border p-8 text-center"
      variant="secondary"
    >
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-surface text-muted shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </Surface>
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

function priorityColor(
  priority?: RelayTaskPriority,
): "accent" | "danger" | "success" | "warning" {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "low") return "success";
  return "accent";
}

function PriorityTag({ priority }: { priority?: RelayTaskPriority }) {
  return (
    <Chip
      className="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold"
      color={priorityColor(priority)}
      size="sm"
      variant="soft"
    >
      {priorityLabel(priority)}
    </Chip>
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
          : "bg-accent";

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

function formatDateShort(value?: string | null) {
  const date = parseEventDate(value);
  if (!date) return "No due date";

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
    const leftDue =
      parseEventDate(left.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightDue =
      parseEventDate(right.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const leftScore =
      priorityWeight(left.priority) + (isOverdue(left.due) ? 10 : 0);
    const rightScore =
      priorityWeight(right.priority) + (isOverdue(right.due) ? 10 : 0);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return leftDue - rightDue;
  });
}

function googleTaskPriority(task: GoogleTask): RelayTaskPriority {
  const text = `${task.title} ${task.notes ?? ""}`.toLowerCase();
  if (text.includes("urgent") || isOverdue(task.due)) return "urgent";
  if (text.includes("priority: high") || text.includes("high priority"))
    return "high";
  if (text.includes("priority: low") || text.includes("low priority"))
    return "low";
  return "medium";
}

function googleTaskEditablePriority(
  task: GoogleTask | null,
): GoogleTaskPriority {
  const priority = task ? googleTaskPriority(task) : "medium";
  return priority === "urgent" ? "high" : priority;
}

function googleTaskNotes(notes?: string | null) {
  return (
    notes
      ?.replace(/^Priority:\s*(?:high|medium|low)\s*(?:\r?\n){0,2}/i, "")
      .trim() ?? ""
  );
}

function googleTaskKey(task: GoogleTask | null) {
  if (!task) return null;
  return `${task.taskListId ?? "@default"}:${task.id ?? task.title}`;
}

function sortGoogleTasksByUrgency(items: GoogleTask[]) {
  return [...items].sort((left, right) => {
    const leftDue =
      parseEventDate(left.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightDue =
      parseEventDate(right.due)?.getTime() ?? Number.POSITIVE_INFINITY;
    const leftScore =
      priorityWeight(googleTaskPriority(left)) + (isOverdue(left.due) ? 10 : 0);
    const rightScore =
      priorityWeight(googleTaskPriority(right)) +
      (isOverdue(right.due) ? 10 : 0);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return leftDue - rightDue;
  });
}

function githubUrgency(issue: GithubIssue) {
  const text = `${issue.title} ${issue.labels.join(" ")}`.toLowerCase();
  if (/(security|critical|urgent|blocker|prod|production|crash)/.test(text))
    return "Urgent";
  if (/(bug|broken|regression|hotfix)/.test(text)) return "High";
  if (/(question|docs|cleanup|chore)/.test(text)) return "Low";
  return "Normal";
}

function githubUrgencyClass(issue: GithubIssue) {
  const urgency = githubUrgency(issue);
  if (urgency === "Urgent") return "bg-danger-soft text-danger";
  if (urgency === "High") return "bg-warning-soft text-warning";
  if (urgency === "Low") return "bg-success-soft text-success";
  return "bg-accent-soft text-accent";
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
    .filter((item): item is { event: CalendarEvent; start: Date } =>
      Boolean(item.start),
    )
    .filter((item) => item.start.getTime() >= now.getTime())
    .sort(
      (left, right) => left.start.getTime() - right.start.getTime(),
    )[0]?.event;
  const urgentIssue = briefing?.githubIssues?.issues.find(
    (issue) => githubUrgency(issue) === "Urgent",
  );
  const inboxMessage = briefing?.gmail?.messages[0];
  const recentFile = briefing?.drive.files[0];
  const actions: Array<{
    detail: string;
    icon: LucideIcon;
    onClick: () => void;
    title: string;
  }> = [];

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
        runPrompt(
          `What should I do about GitHub issue ${urgentIssue.repositoryFullName ?? ""} #${urgentIssue.number}?`,
        );
      },
    });
  }

  if (inboxMessage) {
    actions.push({
      icon: Mail,
      title: "Triage latest email",
      detail: `${inboxMessage.from ?? "Gmail"}: ${inboxMessage.subject}`,
      onClick: () =>
        runPrompt(
          `Summarize this email and suggest a response: ${inboxMessage.subject}`,
        ),
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
      detail: `${sortedTasks[0].title} is the highest-ranked open Google Task.`,
      onClick: () => {
        setActiveView("tasks");
        runPrompt(`Plan the next step for ${sortedTasks[0].title}`);
      },
    });
  }

  return actions.slice(0, 3);
}

function inferExecutionTrace(messages: Message[]) {
  const latest =
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content.toLowerCase() ?? "";

  if (/(github|repo|repository|issue|pull request|pr )/.test(latest)) {
    return [
      "Checking GitHub context",
      "Selecting repo tools",
      "Preparing issue workspace",
    ];
  }
  if (
    /(contact|contacts|person|people|phone|birthday|birthdays)/.test(latest)
  ) {
    return [
      "Reading Google Contacts",
      "Checking birthdays",
      "Preparing contact actions",
    ];
  }
  if (/(calendar|meeting|schedule|availability)/.test(latest)) {
    return [
      "Fetching calendar events",
      "Checking task deadlines",
      "Building scheduling UI",
    ];
  }
  if (/(email|gmail|inbox|draft|reply)/.test(latest)) {
    return [
      "Reading Gmail context",
      "Checking drafts",
      "Preparing email actions",
    ];
  }
  if (/(drive|file|document|pdf)/.test(latest)) {
    return [
      "Searching Drive files",
      "Reading metadata",
      "Preparing file preview",
    ];
  }
  if (/(task|todo|deadline|remind)/.test(latest)) {
    return [
      "Reviewing task lists",
      "Ranking urgency",
      "Preparing task builder",
    ];
  }

  return ["Understanding intent", "Selecting tools", "Preparing workspace"];
}

function AvatarIcon({ role }: { role: Message["role"] }) {
  return (
    <Avatar
      aria-label={role === "user" ? "You" : "Relay assistant"}
      className="shrink-0"
      color="accent"
      size="sm"
      variant={role === "user" ? "default" : "soft"}
    >
      <Avatar.Fallback>
        {role === "user" ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </Avatar.Fallback>
    </Avatar>
  );
}

function authActionLabel(mode: AuthMode) {
  if (mode === "signup") return "Create account";
  if (mode === "forgot") return "Send or use reset code";
  if (mode === "verify") return "Verify email";
  return "Sign in";
}

function dateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function titleCaseFirst(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed[0]?.toUpperCase() ?? ""}${trimmed.slice(1)}`;
}

function cleanTaskTitle(value: string) {
  return titleCaseFirst(
    value
      .replace(/\b(due|by)\s+(today|tomorrow|next\s+\w+|on\s+\w+).*$/i, "")
      .replace(/[.?!]\s*$/g, "")
      .trim(),
  );
}

function parseAssistantUiRequests(content: string): {
  markdown: string;
  requests: AssistantUiRequest[];
} {
  const requests: AssistantUiRequest[] = [];
  const markdown = content
    .replace(
      /<need-more-info>([\s\S]*?)<\/need-more-info>/gi,
      (_match, detail: string) => {
        const normalized = normalizeWhitespace(detail);
        requests.push(inferAssistantUiRequest(normalized));
        return "";
      },
    )
    .replace(
      /<ui-component(?:\s+[^>]*)?>([\s\S]*?)<\/ui-component>/gi,
      (_match, detail: string) => {
        const normalized = normalizeWhitespace(detail);
        requests.push(
          inferAssistantUiRequest(
            normalized || "Choose the missing details to continue.",
          ),
        );
        return "";
      },
    )
    .replace(/<\/?(?:need-more-info|ui-component)(?:\s+[^>]*)?>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { markdown, requests };
}

function inferAssistantUiRequest(detail: string): AssistantUiRequest {
  const lower = detail.toLowerCase();
  const isTask = /\b(task|todo|to-do)\b/.test(lower);
  const asksForIdentifier = /\b(id|identifier|which|select|specific)\b/.test(
    lower,
  );
  const mentionsDueDate = /\b(due date|deadline|due)\b/.test(lower);
  const shiftMatch = lower.match(
    /\b(\d+|one|two|three|a)\s+day[s]?\s+(earlier|sooner|before|later|after)\b/,
  );
  const shiftAmount = shiftMatch?.[1] ? wordNumberToInteger(shiftMatch[1]) : 1;
  const direction = shiftMatch?.[2];
  const daysDelta =
    direction === "earlier" || direction === "sooner" || direction === "before"
      ? -shiftAmount
      : direction === "later" || direction === "after"
        ? shiftAmount
        : undefined;

  if (isTask && mentionsDueDate && daysDelta) {
    return {
      id: stableUiRequestId(detail, "shift_task_due"),
      kind: "need_more_info",
      detail,
      action: "shift_task_due",
      daysDelta,
    };
  }

  if (isTask && asksForIdentifier) {
    return {
      id: stableUiRequestId(detail, "select_task"),
      kind: "need_more_info",
      detail,
      action: "select_task",
    };
  }

  return {
    id: stableUiRequestId(detail, "generic"),
    kind: "need_more_info",
    detail,
    action: "generic",
  };
}

function stableUiRequestId(
  detail: string,
  action: AssistantUiRequest["action"],
) {
  let hash = 0;
  const input = `${action}:${detail}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `ui-request-${hash.toString(36)}`;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wordNumberToInteger(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "one" || normalized === "a") return 1;
  if (normalized === "two") return 2;
  if (normalized === "three") return 3;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function inferTaskSurfaceContext(message: string): TaskSurfaceContext {
  const text = message.trim();
  const lower = text.toLowerCase();
  const context: TaskSurfaceContext = {};
  const reminderMatch =
    text.match(
      /(?:remind(?:ing)? me to|reminder to|task (?:due .*? )?(?:to|for))\s+(.+)$/i,
    ) ??
    text.match(
      /(?:create|add|make|save)\s+(?:me\s+)?(?:a\s+)?(?:new\s+)?task(?:\s+due\s+\w+)?\s+(?:to|for)\s+(.+)$/i,
    );
  const completionMatch = text.match(
    /\b(?:i\s+)?(?:finished|completed|did)\s+(?:my\s+)?(.+?)\s+task\b/i,
  );

  if (reminderMatch?.[1]) {
    context.title = cleanTaskTitle(reminderMatch[1]);
  }

  if (!context.title) {
    const taskMatch = text.match(
      /\b(?:create|add|make|save)\s+(?:me\s+)?(?:a\s+)?(?:new\s+)?task\s+(.+)$/i,
    );
    if (taskMatch?.[1]) context.title = cleanTaskTitle(taskMatch[1]);
  }

  if (lower.includes("tomorrow")) {
    context.due = dateInputValue(addDays(new Date(), 1));
  } else if (lower.includes("today")) {
    context.due = dateInputValue(new Date());
  }

  if (/\burgent\b/.test(lower)) context.priority = "urgent";
  else if (/\bhigh\b/.test(lower)) context.priority = "high";
  else if (/\blow\b/.test(lower)) context.priority = "low";

  if (completionMatch?.[1]) {
    context.relatedCompletionHint = cleanTaskTitle(completionMatch[1]);
    context.notes = [
      context.notes,
      `Follow-up after finishing ${context.relatedCompletionHint}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return context;
}

function inferGeneratedSurface(
  message: string,
):
  | { surface: GeneratedSurface; context?: GeneratedSurfaceContext }
  | undefined {
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
    return { surface: "schedule" };
  }
  if (wantsTaskWrite) {
    return {
      surface: "task",
      context: { task: inferTaskSurfaceContext(message) },
    };
  }
  if (
    text.includes("drive") ||
    text.includes("file") ||
    text.includes("document")
  ) {
    return { surface: "files" };
  }
  if (
    text.includes("remember") ||
    text.includes("memory") ||
    text.includes("preference")
  ) {
    return { surface: "memory" };
  }
  if (wantsEmailDraft) {
    return { surface: "email" };
  }
  return undefined;
}

function inferContextWorkspaceMode(messages: Message[]): ContextWorkspaceMode {
  const latest =
    [...messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";
  const text = latest.toLowerCase();

  if (
    text.includes("schedule") ||
    text.includes("meeting") ||
    text.includes("calendar") ||
    text.includes("availability") ||
    text.includes("birthday") ||
    text.includes("birthdays")
  ) {
    return text.includes("birthday") || text.includes("birthdays")
      ? "contacts"
      : "calendar";
  }
  if (
    text.includes("task") ||
    text.includes("todo") ||
    text.includes("deadline") ||
    text.includes("remind me")
  ) {
    return "tasks";
  }
  if (
    text.includes("drive") ||
    text.includes("file") ||
    text.includes("document") ||
    text.includes("pdf")
  ) {
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
  if (
    text.includes("remember") ||
    text.includes("memory") ||
    text.includes("preference")
  ) {
    return "memory";
  }
  if (
    text.includes("contact") ||
    text.includes("contacts") ||
    text.includes("person") ||
    text.includes("people") ||
    text.includes("phone")
  ) {
    return "contacts";
  }
  if (
    text.includes("email") ||
    text.includes("gmail") ||
    text.includes("draft") ||
    text.includes("inbox")
  ) {
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
    contacts: {
      detail: "Saved people, birthdays, and invitee context",
      icon: Users,
      label: "Contacts",
      signal: "People",
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

function shiftCalendarDate(
  date: Date,
  view: "day" | "week" | "month",
  direction: -1 | 1,
) {
  if (view !== "month") {
    return addDays(date, direction * (view === "week" ? 7 : 1));
  }

  const next = new Date(date);
  const selectedDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + direction);
  const finalDayOfMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();
  next.setDate(Math.min(selectedDay, finalDayOfMonth));
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
