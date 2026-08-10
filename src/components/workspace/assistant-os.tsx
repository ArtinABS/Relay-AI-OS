"use client";

import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
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
  Tabs,
  Toast,
  Tooltip,
  toast,
} from "@heroui/react";
import { parseDate, type DateValue } from "@internationalized/date";
import { useAui, useAuiState, type ThreadMessage } from "@assistant-ui/react";
import { convertFileListToFileUIParts, type FileUIPart } from "ai";
import { RelayAssistantRuntimeProvider } from "@/components/assistant-ui/relay-runtime";
import { RelayThread } from "@/components/assistant-ui/relay-thread";
import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { Button, Input, Select, TextArea } from "@/components/ui/relay-ui";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  RichTextEditor,
  TaskRichTextEditor,
  type TaskRichDocument,
} from "@/components/ui/task-rich-text-editor";
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger,
  TreeProvider,
  TreeView,
  useTree,
} from "@/components/ui/tree";
import SoftAurora from "@/components/ui/soft-aurora";
import {
  relayMessageFiles,
  relayMessageText,
  type RelayChatMessage,
} from "@/lib/ai/relay-chat";
import {
  applyBrowserProjectRecord,
  readBrowserProjectRecord,
} from "@/lib/projects/client";
import {
  projectRecordSchema,
  projectRecordUpdatedEvent,
  type Project as RelayProject,
  type ProjectRecord,
} from "@/lib/projects/model";
import Image from "next/image";
import {
  Activity,
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Columns3,
  Copy,
  Database,
  ExternalLink,
  Filter,
  Flag,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderTree,
  FolderOpen,
  GitBranch,
  Globe,
  Heart,
  Home,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListTodo,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Moon,
  Paperclip,
  Palette,
  Pencil,
  Plus,
  Plane,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Square,
  Sun,
  Trash2,
  UploadCloud,
  User,
  Users,
  Volume2,
  Wand2,
  Dumbbell,
  Target,
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
  | "projects"
  | "files"
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
  projectId: string | null;
  repositoryFullName?: string | null;
  richDescription?: TaskRichDocument | null;
};

type TaskCategoryIconName =
  | "book"
  | "briefcase"
  | "fitness"
  | "folder"
  | "globe"
  | "heart"
  | "home"
  | "palette"
  | "plane"
  | "shopping"
  | "sparkles"
  | "target"
  | "users";

type TaskCategory = {
  icon: TaskCategoryIconName;
  id: string;
  name: string;
  parentId: string | null;
};

type TaskCategoryAssignments = Record<string, string>;
type TaskRepositoryAssignments = Record<string, string>;
type TaskRichDescriptions = Record<string, TaskRichDocument>;

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
  size?: number | null;
  owner?: string | null;
  parents?: string[];
  appProperties?: Record<string, string>;
  properties?: Record<string, string>;
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
  repositoryFullName?: string | null;
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
  attachments?: Array<{
    attachmentId?: string | null;
    filename: string;
    mimeType: string;
    size: number;
  }>;
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
  defaultBranch?: string;
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
  focus: GoogleTask | null;
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

type Message = RelayChatMessage;

type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
};

const primaryNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "files", label: "Files", icon: FolderTree },
];

const sidebarNavGroups: Array<{ label: string; items: NavItem[] }> = [
  { label: "Start", items: primaryNavItems.slice(0, 2) },
  { label: "Workspace", items: primaryNavItems.slice(2) },
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
const taskCategoryStorageKey = "relay.task-categories.v1";
const taskCategoryAssignmentStorageKey = "relay.task-category-assignments.v1";
const taskArchiveStorageKey = "relay.task-archive.v1";
const taskRichDescriptionStorageKey = "relay.task-rich-descriptions.v1";
const taskRepositoryAssignmentStorageKey =
  "relay.task-repository-assignments.v1";
const taskLayoutStorageKey = "relay.task-layout.v1";
const defaultTaskLayout = { railWidth: 288, calendarHeight: 240 };
const defaultTaskCategories: TaskCategory[] = [
  { icon: "heart", id: "personal", name: "Personal", parentId: null },
  {
    icon: "shopping",
    id: "personal-errands",
    name: "Errands",
    parentId: "personal",
  },
  {
    icon: "home",
    id: "personal-home",
    name: "Home",
    parentId: "personal",
  },
  { icon: "briefcase", id: "work", name: "Work", parentId: null },
  {
    icon: "target",
    id: "work-projects",
    name: "Projects",
    parentId: "work",
  },
  {
    icon: "users",
    id: "work-meetings",
    name: "Meetings",
    parentId: "work",
  },
];
const taskCategoryIconMap: Record<TaskCategoryIconName, LucideIcon> = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  fitness: Dumbbell,
  folder: FolderOpen,
  globe: Globe,
  heart: Heart,
  home: Home,
  palette: Palette,
  plane: Plane,
  shopping: ShoppingBag,
  sparkles: Sparkles,
  target: Target,
  users: Users,
};
const calendarStartHour = 7;
const calendarEndHour = 24;
const calendarHourHeight = 56;

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

function formatFileSize(value?: number | null) {
  if (!value || value < 1) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const amount = value / 1024 ** unitIndex;
  return `${amount >= 10 || unitIndex === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
}

function driveFileFormat(file: DriveFile) {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.trim()
    : null;
  if (extension && extension.length <= 8) return extension.toUpperCase();

  const mimeType =
    file.appProperties?.attachmentMimeType ?? file.mimeType ?? "";
  const subtype = mimeType.split("/").pop()?.split(".").pop();
  return subtype ? subtype.replaceAll("-", " ").toUpperCase() : "FILE";
}

type DriveFileKind =
  | "aistudio"
  | "docs"
  | "drive"
  | "folder"
  | "gmail"
  | "image"
  | "pdf"
  | "sheets"
  | "slides";

type DriveFileFilter = "all" | DriveFileKind;

const driveFileKindMeta: Record<
  DriveFileKind,
  {
    badgeClass: string;
    label: string;
    openLabel: string;
    icon: LucideIcon;
  }
> = {
  aistudio: {
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    icon: Bot,
    label: "AI Studio",
    openLabel: "Open in AI Studio",
  },
  docs: {
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    icon: FileText,
    label: "Google Docs",
    openLabel: "Open in Google Docs",
  },
  drive: {
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    icon: Cloud,
    label: "Drive",
    openLabel: "Open in Drive",
  },
  folder: {
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    icon: FolderOpen,
    label: "Drive folder",
    openLabel: "Open folder in Drive",
  },
  gmail: {
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    icon: Mail,
    label: "Gmail",
    openLabel: "Open in Gmail",
  },
  image: {
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
    icon: FileText,
    label: "Image",
    openLabel: "Open image in Drive",
  },
  pdf: {
    badgeClass: "bg-red-500/15 text-red-600 dark:text-red-300",
    icon: FileText,
    label: "PDF",
    openLabel: "Open PDF in Drive",
  },
  sheets: {
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    icon: FileSpreadsheet,
    label: "Google Sheets",
    openLabel: "Open in Google Sheets",
  },
  slides: {
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    icon: Columns3,
    label: "Google Slides",
    openLabel: "Open in Google Slides",
  },
};

function driveFileKind(file: DriveFile): DriveFileKind {
  const mimeType = file.mimeType.toLowerCase();
  const name = file.name.toLowerCase();
  const webViewLink = file.webViewLink?.toLowerCase() ?? "";
  const appMetadata = JSON.stringify({
    ...file.appProperties,
    ...file.properties,
  }).toLowerCase();

  if (
    webViewLink.includes("aistudio.google.com") ||
    mimeType.includes("makersuite") ||
    appMetadata.includes("aistudio") ||
    appMetadata.includes("ai studio") ||
    appMetadata.includes("makersuite") ||
    name.endsWith(".prompt")
  ) {
    return "aistudio";
  }
  if (
    webViewLink.includes("mail.google.com") ||
    mimeType.includes("message/rfc822") ||
    mimeType.includes("gmail")
  ) {
    return "gmail";
  }
  if (mimeType.includes("spreadsheet")) return "sheets";
  if (mimeType.includes("presentation")) return "slides";
  if (mimeType.includes("document")) return "docs";
  if (mimeType.includes("folder")) return "folder";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("image")) return "image";
  return "drive";
}

function driveFileType(file: DriveFile) {
  return driveFileKindMeta[driveFileKind(file)].label;
}

function driveFileDestination(file: DriveFile) {
  const kind = driveFileKind(file);
  const id = file.id ? encodeURIComponent(file.id) : null;
  let href = file.webViewLink ?? null;

  if (id && kind === "sheets") {
    href = `https://docs.google.com/spreadsheets/d/${id}/edit`;
  } else if (id && kind === "docs") {
    href = `https://docs.google.com/document/d/${id}/edit`;
  } else if (id && kind === "slides") {
    href = `https://docs.google.com/presentation/d/${id}/edit`;
  } else if (id && kind === "folder") {
    href = `https://drive.google.com/drive/folders/${id}`;
  } else if (!href && kind === "aistudio") {
    href = "https://aistudio.google.com/app/library";
  } else if (!href && kind === "gmail") {
    href = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`"${file.name}"`)}`;
  } else if (id && !href && kind !== "gmail" && kind !== "aistudio") {
    href = `https://drive.google.com/file/d/${id}/view`;
  }

  return {
    href,
    label: driveFileKindMeta[kind].openLabel,
  };
}

function driveFileOpenBehavior(file: DriveFile) {
  const kind = driveFileKind(file);

  if (kind === "gmail") {
    return {
      detail:
        "Opens the original email so the attachment stays alongside its message context.",
      title: "Original email in Gmail",
    };
  }
  if (kind === "folder") {
    return {
      detail: "Opens the folder with its current Drive contents and sharing.",
      title: "Folder in Google Drive",
    };
  }
  if (kind === "sheets" || kind === "docs" || kind === "slides") {
    return {
      detail: "Opens the native editor. Changes continue syncing to Drive.",
      title: driveFileKindMeta[kind].openLabel.replace("Open in ", ""),
    };
  }
  if (kind === "aistudio") {
    return {
      detail:
        "Opens the saved prompt in AI Studio when its direct link is available.",
      title: "Google AI Studio",
    };
  }

  return {
    detail:
      "Opens the Drive preview where you can inspect, share, or download it.",
    title: "Google Drive preview",
  };
}

function FileTypeBadge({ file }: { file: DriveFile }) {
  const kind = driveFileKind(file);
  const meta = driveFileKindMeta[kind];
  const Glyph = meta.icon;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      <Glyph className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{meta.label}</span>
    </span>
  );
}

function DriveFileGlyph({
  className,
  file,
}: {
  className: string;
  file: DriveFile;
}) {
  const Glyph = driveFileKindMeta[driveFileKind(file)].icon;
  return <Glyph className={className} />;
}

export function AssistantOS() {
  const [stage, setStage] = useState<AppStage>("auth");

  if (stage === "workspace") {
    return (
      <RelayAssistantRuntimeProvider>
        <AssistantOSRuntimeContent stage={stage} setStage={setStage} />
      </RelayAssistantRuntimeProvider>
    );
  }

  return <AssistantOSContent stage={stage} setStage={setStage} />;
}

function AssistantOSRuntimeContent({
  setStage,
  stage,
}: {
  setStage: (stage: AppStage) => void;
  stage: AppStage;
}) {
  const aui = useAui();

  return (
    <AssistantOSContent
      appendPrompt={(prompt) => {
        if (aui.thread.getState().isRunning) return;
        aui.thread.append(prompt);
      }}
      setStage={setStage}
      startNewChat={() => aui.threads.switchToNewThread()}
      stage={stage}
    />
  );
}

function AssistantOSContent({
  appendPrompt,
  setStage,
  startNewChat,
  stage,
}: {
  appendPrompt?: (prompt: string) => void;
  setStage: (stage: AppStage) => void;
  startNewChat?: () => void;
  stage: AppStage;
}) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authResolved, setAuthResolved] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [tasks, setTasks] = useState<RelayTask[]>([]);
  const [taskColumns, setTaskColumns] = useState<TaskColumn[]>([]);
  const [notes, setNotes] = useState<RelayNote[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [passwordAuth, setPasswordAuth] = useState<PasswordAuthStatus | null>(
    null,
  );
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
  }, [theme]);

  const signedInToGoogle = Boolean(oauthStatus?.hasDirectGoogleToken);
  const signedInToGithub = Boolean(oauthStatus?.github?.connected);
  const signedInWithPassword = Boolean(passwordAuth?.authenticated);
  const githubConfigured = Boolean(oauthStatus?.github?.configured);
  const googleConfigured = Boolean(
    oauthStatus?.hasGoogleOAuthConfig && oauthStatus.hasNextAuthSecret,
  );
  const openTasks = tasks.filter((task) => !task.completed);

  useEffect(() => {
    const identityController = new AbortController();
    void Promise.all([
      fetch("/api/auth/password/status", {
        cache: "no-store",
        signal: identityController.signal,
      }),
      fetch("/api/oauth/status", {
        cache: "no-store",
        signal: identityController.signal,
      }),
    ])
      .then(async ([passwordResponse, oauthResponse]) => {
        const [passwordStatus, oauthStatus] = await Promise.all([
          passwordResponse.ok
            ? (passwordResponse.json() as Promise<PasswordAuthStatus>)
            : null,
          oauthResponse.ok
            ? (oauthResponse.json() as Promise<OAuthStatus>)
            : null,
        ]);
        if (identityController.signal.aborted) return;
        if (passwordStatus) setPasswordAuth(passwordStatus);
        if (oauthStatus) setOauthStatus(oauthStatus);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!identityController.signal.aborted) setAuthResolved(true);
      });

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

    return () => identityController.abort();
  }, [setStage]);

  function addToast(
    title: string,
    detail: string | undefined,
    tone: "success" | "info" | "warning",
  ) {
    const options = {
      description: detail,
      timeout: 4200,
    };

    if (tone === "success") {
      toast.success(title, options);
      return;
    }

    if (tone === "warning") {
      toast.warning(title, options);
      return;
    }

    toast.info(title, options);
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
      .filter((taskList): taskList is { id: string; title: string } =>
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

  async function createTask(input: AddTaskInput): Promise<RelayTask> {
    const parsed = typeof input === "string" ? { title: input } : input;
    const trimmed = parsed.title.trim();
    if (!trimmed) throw new Error("A task title is required.");

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
    const data = (await response.json()) as {
      reason?: string;
      task?: GoogleTask;
    };
    if (!response.ok || !data.task?.id) {
      throw new Error(
        data.reason ?? "Google Tasks could not create this task.",
      );
    }
    await refreshWorkspace();
    addToast("Google Task created", trimmed, "success");
    return {
      id: data.task.id,
      title: data.task.title,
      completed: data.task.status === "completed",
      createdAt: data.task.updated ?? new Date().toISOString(),
      completedAt: data.task.completed ?? undefined,
      updatedAt: data.task.updated ?? undefined,
      notes: googleTaskNotes(data.task.notes),
      due: data.task.due,
      priority: googleTaskPriority(data.task),
      columnId: data.task.taskListId,
      taskListId: data.task.taskListId,
      taskListTitle: data.task.taskListTitle,
    };
  }

  async function addTask(input: AddTaskInput) {
    await createTask(input);
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
      throw new Error(
        data.reason ?? "Google Tasks could not complete this task.",
      );
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

  /*
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
              metadata: {
                ...message.metadata,
                timestamp: message.metadata?.timestamp ?? nowLabel(),
                surfaceStatus: "done",
                toolSummary: undefined,
                toolLink: null,
              },
              parts: [
                {
                  type: "text",
                  text: link ? `✓ [${summary}](${link})` : `✓ ${summary}`,
                  state: "done",
                },
              ],
            }
          : message,
      ),
    );
  }

  async function submitMessage(
    event?: FormEvent<HTMLFormElement>,
    overrideMessage?: string,
    files?: FileUIPart[],
  ) {
    event?.preventDefault();
    const message = (overrideMessage ?? input).trim();
    if ((!message && !files?.length) || agentLoading) return;

    if (!overrideMessage) setInput("");
    setActiveView("chat");

    const generatedSurface = inferGeneratedSurface(message);

    try {
      await sendMessage({
        text: message || "Review the attached files.",
        files,
        metadata: { timestamp: nowLabel() },
      });

      if (generatedSurface) {
        setMessages((current) => [
          ...current,
          {
            id: createId("surface"),
            role: "assistant",
            metadata: {
              timestamp: nowLabel(),
              surface: generatedSurface.surface,
              surfaceContext: generatedSurface.context,
              surfaceStatus: "active",
            },
            parts: [],
          },
        ]);
      }

      await refreshWorkspace();
    } catch (error) {
      addToast(
        "Chat request failed",
        error instanceof Error
          ? error.message
          : "The assistant did not return a response.",
        "warning",
      );
    }
  }

  */
  function runPrompt(prompt: string) {
    const message = prompt.trim();
    if (!message || !appendPrompt) return;

    startNewChat?.();
    setActiveView("chat");
    appendPrompt(message);
  }

  function navigateToView(view: ViewId) {
    if (view === "chat") startNewChat?.();
    setActiveView(view);
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
    >
      <Toast.Provider maxVisibleToasts={4} placement="bottom end" width={380} />

      {stage === "auth" ? (
        <AuthExperience
          {...shared}
          authMode={authMode}
          authResolving={!authResolved}
          onPasswordSignOut={handleSignOut}
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
          completeTask={completeTask}
          createTaskForProject={createTask}
          connectGithub={connectGithub}
          connectGoogle={connectGoogle}
          disconnectGithub={disconnectGithub}
          disconnectGoogle={disconnectGoogle}
          githubConfigured={githubConfigured}
          googleConfigured={googleConfigured}
          notes={notes}
          oauthStatus={oauthStatus}
          onSignOut={handleSignOut}
          openTasks={openTasks}
          passwordAuth={passwordAuth}
          refreshWorkspace={refreshWorkspace}
          runPrompt={runPrompt}
          setActiveView={navigateToView}
          setSidebarOpen={setSidebarOpen}
          setTheme={setTheme}
          sidebarOpen={sidebarOpen}
          signedInToGithub={signedInToGithub}
          signedInToGoogle={signedInToGoogle}
          taskColumns={taskColumns}
          tasks={tasks}
          theme={theme}
        />
      ) : null}
    </div>
  );
}

function AuthExperience({
  authMode,
  authResolving,
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
  onPasswordSignOut,
}: {
  authMode: AuthMode;
  authResolving: boolean;
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
  onPasswordSignOut: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [rememberedEmail, setRememberedEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = window.localStorage
      .getItem("relay:remembered-email")
      ?.trim();
    if (!storedEmail) return;

    const hydrationTimer = window.setTimeout(() => {
      setEmail(storedEmail);
      setRememberedEmail(storedEmail);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const authenticatedEmail = signedInWithPassword
    ? (passwordAuth?.user?.email.trim() ?? "")
    : "";
  const recognizedEmail = authenticatedEmail || rememberedEmail;
  const hasActivePasswordSession = Boolean(authenticatedEmail);

  async function continueWithRecognizedAccount() {
    if (!hasActivePasswordSession || submitting) return;
    setSubmitting(true);
    setAuthNotice(null);
    try {
      await onPasswordAuthenticated(`Continued as ${authenticatedEmail}.`);
    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Your session could not be opened.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRecognizedAccount() {
    if (submitting) return;
    setSubmitting(true);
    setAuthNotice(null);
    try {
      if (hasActivePasswordSession) await onPasswordSignOut();
      window.localStorage.removeItem("relay:remembered-email");
      setRememberedEmail("");
      setEmail("");
    } catch (error) {
      setAuthNotice(
        error instanceof Error ? error.message : "Unable to change account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    submittedMode: AuthMode = authMode,
  ) {
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
        submittedMode === "login"
          ? "/api/auth/password/login"
          : submittedMode === "signup"
            ? "/api/auth/password/signup"
            : submittedMode === "forgot"
              ? formCode && formPassword
                ? "/api/auth/password/reset"
                : "/api/auth/password/forgot"
              : "/api/auth/password/verify";
      const body =
        submittedMode === "login"
          ? { email: formEmail, password: formPassword, remember }
          : submittedMode === "signup"
            ? { email: formEmail, password: formPassword, name: formName }
            : submittedMode === "forgot"
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

      if (response.ok && data.ok && submittedMode === "login") {
        if (remember) {
          window.localStorage.setItem("relay:remembered-email", formEmail);
          setRememberedEmail(formEmail);
        } else {
          window.localStorage.removeItem("relay:remembered-email");
          setRememberedEmail("");
        }
        await onPasswordAuthenticated(
          `Signed in as ${data.user?.email ?? formEmail}.`,
        );
        return;
      }

      if (response.ok && data.ok && submittedMode === "signup") {
        window.localStorage.setItem("relay:remembered-email", formEmail);
        setRememberedEmail(formEmail);
        setAuthMode("verify");
        setDevCode(data.devVerificationCode ?? null);
        setAuthNotice(
          "Account created. Enter the verification code to activate it.",
        );
        return;
      }

      if (response.ok && data.ok && submittedMode === "forgot") {
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

      if (response.ok && data.ok && submittedMode === "verify") {
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
  const heading = authResolving
    ? "Opening Relay"
    : authMode === "signup"
      ? "Create your account"
      : authMode === "forgot"
        ? "Reset your password"
        : authMode === "verify"
          ? "Verify your email"
          : "Welcome back";
  const description = authResolving
    ? "Checking this device for a secure session."
    : authMode === "signup"
      ? "Set up your Relay workspace in a moment."
      : authMode === "forgot"
        ? "Request a code, then enter it with your new password."
        : authMode === "verify"
          ? "Enter the code created for your account."
          : hasActivePasswordSession
            ? "Your verified session is ready. Continue to your workspace."
            : "Sign in to continue to your personal workspace.";

  const renderAuthContent = (mode: AuthMode) => (
    <>
      <form className="space-y-4" onSubmit={(event) => submit(event, mode)}>
        {mode === "signup" ? (
          <Field
            label="Full name"
            name="name"
            onChange={setName}
            placeholder="Alex Morgan"
            value={name}
          />
        ) : null}

        {mode === "login" && recognizedEmail ? (
          <div
            className="auth-saved-account"
            data-session-ready={hasActivePasswordSession || undefined}
          >
            <input name="email" type="hidden" value={recognizedEmail} />
            <button
              className="auth-saved-account__continue"
              disabled={!hasActivePasswordSession || submitting}
              onClick={() => void continueWithRecognizedAccount()}
              type="button"
            >
              <span className="auth-saved-account__avatar" aria-hidden="true">
                {recognizedEmail.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-medium text-muted">
                  {hasActivePasswordSession ? "Continue as" : "Saved email"}
                </span>
                <span className="block truncate text-sm font-semibold">
                  {recognizedEmail}
                </span>
              </span>
              {hasActivePasswordSession ? (
                <span className="auth-saved-account__ready">
                  <span className="hidden sm:inline">Session ready</span>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </span>
              ) : null}
            </button>
            <Button
              className="h-8 px-2 text-xs"
              isDisabled={submitting}
              onPress={() => void changeRecognizedAccount()}
              size="sm"
              variant="ghost"
            >
              Change
            </Button>
          </div>
        ) : (
          <Field
            autoComplete="email"
            label="Email"
            name="email"
            onChange={setEmail}
            placeholder="you@company.com"
            type="email"
            value={email}
          />
        )}

        {mode === "verify" || mode === "forgot" ? (
          <Field
            label={mode === "forgot" ? "Reset code" : "Verification code"}
            name="code"
            onChange={setCode}
            placeholder="284991"
            value={code}
          />
        ) : null}

        {(mode === "login" && !hasActivePasswordSession) ||
        mode === "signup" ||
        mode === "forgot" ? (
          <Field
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            label={mode === "forgot" ? "New password" : "Password"}
            name="password"
            placeholder="Enter your password"
            type="password"
          />
        ) : null}

        {mode === "login" && !hasActivePasswordSession ? (
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

        {mode !== "login" || !hasActivePasswordSession ? (
          <Button
            className="auth-primary-action"
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
            {authActionLabel(mode)}
          </Button>
        ) : null}

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
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)] before:h-px before:flex-1 before:bg-[var(--line)] after:h-px after:flex-1 after:bg-[var(--line)]">
        or
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          className="auth-provider-button"
          fullWidth
          isDisabled={!googleConfigured && !signedInToGoogle}
          onPress={connectGoogle}
          variant="secondary"
        >
          <Globe className="h-4 w-4" />
          Google
        </Button>
        <Button
          className="auth-provider-button"
          fullWidth
          onPress={enterAfterAuth}
          variant="secondary"
        >
          <Sparkles className="h-4 w-4" />
          Local mode
        </Button>
      </div>
    </>
  );

  return (
    <main className="auth-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="soft-aurora">
        <SoftAurora
          bandHeight={0.46}
          bandSpread={0.92}
          brightness={theme === "dark" ? 0.72 : 0.5}
          color1="#20c8e8"
          color2="#008fa5"
          colorSpeed={0.72}
          enableMouseInteraction
          layerOffset={0.38}
          mouseInfluence={0.14}
          noiseAmplitude={0.86}
          noiseFrequency={2.15}
          octaveDecay={0.14}
          scale={1.35}
          speed={0.42}
        />
      </div>
      <div className="auth-brand absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <BrandMark />
      </div>
      <AnimatedThemeToggler
        className="absolute right-5 top-5 z-20 border border-[var(--line)] bg-[var(--surface-glass)] text-[var(--muted)] shadow-[var(--shadow)] backdrop-blur-xl hover:text-[var(--text)]"
        onThemeChange={setTheme}
        theme={theme}
      />

      <div className="auth-stack relative z-10 w-full max-w-[400px]">
        <div className="auth-intro mb-5 text-center">
          <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-[var(--text)]">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>

        <Card className="auth-card w-full overflow-hidden border border-[var(--line)] bg-[var(--surface-glass)] p-0 backdrop-blur-2xl">
          <Card.Content className="px-5 py-5 sm:px-6 sm:py-6">
            {authResolving ? (
              <div
                aria-label="Checking your Relay session"
                aria-live="polite"
                className="auth-session-loader"
                role="status"
              >
                <span className="auth-session-loader__orbit" aria-hidden="true">
                  <span className="auth-session-loader__core">
                    <KeyRound className="h-5 w-5" />
                  </span>
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    Recognizing this device
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Verifying your existing session before showing sign-in
                    options.
                  </p>
                </div>
                <div className="auth-session-loader__track" aria-hidden="true">
                  <span />
                </div>
              </div>
            ) : isPrimaryMode ? (
              <Tabs
                className="auth-mode-tabs"
                onSelectionChange={(key) => {
                  const nextMode = String(key);
                  if (nextMode !== "login" && nextMode !== "signup") return;
                  setAuthMode(nextMode);
                  setAuthNotice(null);
                  setDevCode(null);
                }}
                selectedKey={authMode}
                variant="secondary"
              >
                <Tabs.ListContainer className="w-full">
                  <Tabs.List
                    aria-label="Authentication mode"
                    className="w-full *:flex-1"
                  >
                    <Tabs.Tab id="login">
                      Sign in
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="signup">
                      Create account
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel className="auth-mode-tabs__panel" id="login">
                  {renderAuthContent("login")}
                </Tabs.Panel>
                <Tabs.Panel className="auth-mode-tabs__panel" id="signup">
                  {renderAuthContent("signup")}
                </Tabs.Panel>
              </Tabs>
            ) : (
              <>
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
                {renderAuthContent(authMode)}
              </>
            )}
          </Card.Content>
        </Card>
      </div>
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
            <AnimatedThemeToggler
              className={iconButtonClass}
              onThemeChange={setTheme}
              theme={theme}
            />
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
  completeTask,
  createTaskForProject,
  connectGithub,
  connectGoogle,
  disconnectGithub,
  disconnectGoogle,
  githubConfigured,
  googleConfigured,
  notes,
  oauthStatus,
  onSignOut,
  openTasks,
  passwordAuth,
  refreshWorkspace,
  runPrompt,
  setActiveView,
  setSidebarOpen,
  setTheme,
  sidebarOpen,
  signedInToGithub,
  signedInToGoogle,
  taskColumns,
  tasks,
  theme,
}: {
  activeView: ViewId;
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  aiStatus: AiStatus | null;
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  createTaskForProject: (input: AddTaskInput) => Promise<RelayTask>;
  connectGithub: () => void;
  connectGoogle: () => void;
  disconnectGithub: () => void;
  disconnectGoogle: () => void;
  githubConfigured: boolean;
  googleConfigured: boolean;
  notes: RelayNote[];
  oauthStatus: OAuthStatus | null;
  onSignOut: () => Promise<void>;
  openTasks: RelayTask[];
  passwordAuth: PasswordAuthStatus | null;
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  setActiveView: (view: ViewId) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  sidebarOpen: boolean;
  signedInToGithub: boolean;
  signedInToGoogle: boolean;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
  theme: ThemeMode;
}) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(296);
  const [requestedTaskKey, setRequestedTaskKey] = useState<string | null>(null);
  const [requestedProjectId, setRequestedProjectId] = useState<string | null>(
    null,
  );
  const { repositoryAssignments, setTaskRepository } =
    useTaskRepositoryAssignments();
  const repositoryLinkedTasks = useMemo(
    () =>
      (briefing?.googleTasks?.tasks ?? []).map((task) => {
        const taskKey = googleTaskKey(task);
        return {
          ...task,
          repositoryFullName:
            (taskKey ? repositoryAssignments[taskKey] : null) ??
            task.repositoryFullName ??
            null,
        };
      }),
    [briefing?.googleTasks?.tasks, repositoryAssignments],
  );
  const showGlobalRightSidebar = false;
  const workspaceContentClass =
    activeView === "chat" ||
    activeView === "calendar" ||
    activeView === "projects" ||
    activeView === "files"
      ? "overflow-hidden"
      : "overflow-y-auto overscroll-contain";

  return (
    <div
      className="workspace-frame min-h-screen transition-[grid-template-columns] duration-300 ease-out lg:grid lg:h-screen lg:min-h-0 lg:overflow-hidden"
      style={{
        gridTemplateColumns: showGlobalRightSidebar
          ? `${navCollapsed ? 72 : sidebarWidth}px minmax(0,1fr) 340px`
          : `${navCollapsed ? 72 : sidebarWidth}px minmax(0,1fr)`,
      }}
    >
      <Sidebar
        activeView={activeView}
        collapsed={navCollapsed}
        mobileOpen={sidebarOpen}
        oauthStatus={oauthStatus}
        onToggleCollapsed={() => setNavCollapsed((current) => !current)}
        onSignOut={onSignOut}
        passwordAuth={passwordAuth}
        setActiveView={setActiveView}
        setDesktopWidth={setSidebarWidth}
        setMobileOpen={setSidebarOpen}
        setTheme={setTheme}
        theme={theme}
        width={sidebarWidth}
      />

      <main className="workspace-main flex h-[100dvh] min-w-0 flex-col overflow-hidden border-l border-separator">
        <div
          className={`workspace-main-content min-h-0 flex-1 pt-[4.75rem] lg:pt-0 ${workspaceContentClass}`}
        >
          <div
            key={activeView}
            className={
              activeView === "chat"
                ? "relay-page workspace-view-transition relay-page--chat h-full min-h-0 p-0"
                : activeView === "calendar"
                  ? "relay-page workspace-view-transition relay-page--calendar p-3 sm:p-4 xl:p-5"
                  : activeView === "projects"
                    ? "relay-page workspace-view-transition relay-page--projects p-0"
                    : activeView === "files"
                      ? "relay-page workspace-view-transition relay-page--files p-3 sm:p-4 xl:p-5"
                      : "relay-page workspace-view-transition min-h-full p-4 sm:p-6 xl:p-8"
            }
          >
            {activeView === "dashboard" ? (
              <DashboardView
                briefing={briefing}
                completeTask={completeTask}
                notes={notes}
                onOpenProject={(projectId) => {
                  setRequestedProjectId(projectId);
                  setActiveView("projects");
                }}
                openTasks={openTasks}
                runPrompt={runPrompt}
                tasks={tasks}
              />
            ) : null}

            {activeView === "chat" ? (
              <ChatView
                addMemory={addMemory}
                addTask={addTask}
                briefing={briefing}
                completeTask={completeTask}
                notes={notes}
                openTasks={openTasks}
                refreshWorkspace={refreshWorkspace}
                runPrompt={runPrompt}
                signedInToGoogle={signedInToGoogle}
                taskColumns={taskColumns}
                tasks={tasks}
              />
            ) : null}

            {activeView === "calendar" ? (
              <CalendarView
                briefing={briefing}
                onOpenProject={(projectId) => {
                  setRequestedProjectId(projectId);
                  setActiveView("projects");
                }}
                onOpenTask={(task) => {
                  setRequestedTaskKey(
                    `${task.taskListId ?? task.columnId ?? "@default"}:${task.id}`,
                  );
                  setActiveView("tasks");
                }}
                refreshWorkspace={refreshWorkspace}
                tasks={tasks}
              />
            ) : null}

            {activeView === "tasks" ? (
              <TasksView
                briefing={briefing}
                initialTaskKey={requestedTaskKey}
                key={requestedTaskKey ?? "tasks"}
                repositories={briefing?.githubRepositories?.repositories ?? []}
                repositoryAssignments={repositoryAssignments}
                refreshWorkspace={refreshWorkspace}
                setTaskRepository={setTaskRepository}
              />
            ) : null}

            {activeView === "projects" ? (
              <ProjectsWorkspace
                initialProjectId={requestedProjectId}
                key={requestedProjectId ?? "projects"}
                onCompleteTask={completeTask}
                onCreateTask={createTaskForProject}
                onOpenTask={(task) => {
                  setRequestedTaskKey(
                    `${task.taskListId ?? "@default"}:${task.id}`,
                  );
                  setActiveView("tasks");
                }}
                repositories={briefing?.githubRepositories?.repositories ?? []}
                repositoryError={briefing?.githubRepositories?.reason}
                repositoryTasks={repositoryLinkedTasks}
                signedInToGithub={signedInToGithub}
                taskLists={taskColumns}
                tasks={tasks}
              />
            ) : null}

            {activeView === "files" ? (
              <FilesWorkspaceView briefing={briefing} />
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
              <SettingsView
                addMemory={addMemory}
                aiStatus={aiStatus}
                connectGithub={connectGithub}
                connectGoogle={connectGoogle}
                disconnectGithub={disconnectGithub}
                disconnectGoogle={disconnectGoogle}
                githubConfigured={githubConfigured}
                googleConfigured={googleConfigured}
                notes={notes}
                oauthStatus={oauthStatus}
                setTheme={setTheme}
                signedInToGithub={signedInToGithub}
                signedInToGoogle={signedInToGoogle}
                theme={theme}
              />
            ) : null}
          </div>
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
  oauthStatus,
  onSignOut,
  onToggleCollapsed,
  passwordAuth,
  setActiveView,
  setDesktopWidth,
  setMobileOpen,
  setTheme,
  theme,
  width,
}: {
  activeView: ViewId;
  collapsed: boolean;
  mobileOpen: boolean;
  oauthStatus: OAuthStatus | null;
  onSignOut: () => Promise<void>;
  onToggleCollapsed: () => void;
  passwordAuth: PasswordAuthStatus | null;
  setActiveView: (view: ViewId) => void;
  setDesktopWidth: (width: number) => void;
  setMobileOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
  width: number;
}) {
  const effectiveCollapsed = collapsed && !mobileOpen;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const displayName =
    passwordAuth?.user?.name ||
    oauthStatus?.github?.name ||
    oauthStatus?.github?.login ||
    "Relay user";
  const displayEmail =
    passwordAuth?.user?.email ||
    oauthStatus?.googleEmail ||
    oauthStatus?.github?.email ||
    "Local workspace";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R";

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsidePress = (event: globalThis.PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const resize = (moveEvent: globalThis.PointerEvent) => {
      setDesktopWidth(
        Math.min(360, Math.max(248, startWidth + moveEvent.clientX - startX)),
      );
    };
    const stopResizing = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
  };

  const content = (
    <aside
      className="sidebar-shell relative flex h-full flex-col overflow-hidden text-left transition-all duration-300 ease-out motion-reduce:transition-none"
      data-collapsed={effectiveCollapsed ? "true" : "false"}
    >
      <header className="sidebar-header shrink-0">
        <div className="sidebar-brand flex min-h-12 items-center">
          <Button
            aria-label={
              mobileOpen
                ? "Close navigation"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            className="sidebar-brand-toggle grid h-11 w-11 min-w-11 shrink-0 place-items-center rounded-xl"
            isIconOnly
            onClick={() => {
              if (mobileOpen) {
                setMobileOpen(false);
                return;
              }
              onToggleCollapsed();
            }}
            type="button"
            title={
              mobileOpen
                ? "Close navigation"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
          >
            <BrandSymbol compact={effectiveCollapsed} />
          </Button>
          {!effectiveCollapsed ? (
            <div className="min-w-0">
              <p className="brand-wordmark truncate text-[0.95rem] font-semibold leading-5">
                Relay
              </p>
              <p className="truncate text-[0.68rem] font-medium tracking-[0.08em] text-muted">
                PERSONAL WORKSPACE
              </p>
            </div>
          ) : null}
        </div>
        {mobileOpen ? (
          <Button
            className="sidebar-mobile-close h-9 w-9 min-w-9 place-items-center rounded-lg text-muted"
            isIconOnly
            onClick={() => setMobileOpen(false)}
            type="button"
            title="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </header>

      <div className="sidebar-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {sidebarNavGroups.map((group) => (
          <SidebarNavGroup
            activeView={activeView}
            collapsed={effectiveCollapsed}
            items={group.items}
            key={group.label}
            label={group.label}
            onNavigate={(view) => {
              setActiveView(view);
              setMobileOpen(false);
            }}
          />
        ))}
      </div>

      <footer className="sidebar-footer shrink-0">
        <div className="sidebar-profile-control relative" ref={profileMenuRef}>
          {profileMenuOpen ? (
            <div
              className="sidebar-profile-menu"
              role="menu"
              aria-label="Account menu"
            >
              <div className="sidebar-profile-menu-identity">
                <span className="sidebar-profile-avatar sidebar-profile-avatar--large">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted">{displayEmail}</p>
                </div>
              </div>

              <div className="sidebar-profile-menu-actions">
                {[
                  { id: "profile" as const, label: "Profile", icon: User },
                  {
                    id: "settings" as const,
                    label: "Settings",
                    icon: Settings,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.id;

                  return (
                    <Button
                      aria-current={active ? "page" : undefined}
                      className={`sidebar-profile-menu-item ${
                        active
                          ? "bg-surface text-foreground shadow-surface"
                          : "text-muted hover:bg-surface-secondary hover:text-foreground"
                      }`}
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setProfileMenuOpen(false);
                        setMobileOpen(false);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span>{item.label}</span>
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}

                <button
                  aria-label={
                    theme === "dark" ? "Switch to light" : "Switch to dark"
                  }
                  className="sidebar-theme-switch"
                  data-theme={theme}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  role="menuitem"
                  type="button"
                >
                  <span className="sidebar-theme-switch__label">
                    {theme === "dark" ? "Switch to light" : "Switch to dark"}
                  </span>
                  <span
                    className="sidebar-theme-switch__thumb"
                    aria-hidden="true"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </span>
                </button>

                <div className="sidebar-profile-menu-separator" />
                <Button
                  className="sidebar-profile-menu-item text-danger hover:bg-danger-soft"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void onSignOut();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>Log out</span>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          <Button
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            className={`sidebar-profile-trigger ${
              effectiveCollapsed ? "justify-center px-0" : "justify-start"
            }`}
            onClick={() => setProfileMenuOpen((current) => !current)}
            type="button"
            title="Open account menu"
          >
            <span className="sidebar-profile-avatar">{initials}</span>
            {!effectiveCollapsed ? (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="block truncate text-[0.7rem] text-muted">
                    {displayEmail}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            ) : null}
          </Button>
        </div>
      </footer>

      {!effectiveCollapsed ? (
        <div
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemax={360}
          aria-valuemin={248}
          aria-valuenow={width}
          className="sidebar-resize-control absolute right-0 top-0 hidden h-full w-2 cursor-ew-resize lg:block"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setDesktopWidth(Math.max(248, width - 8));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setDesktopWidth(Math.min(360, width + 8));
            }
          }}
          onPointerDown={handleResizeStart}
          role="separator"
          tabIndex={0}
          title="Resize sidebar"
        />
      ) : null}
    </aside>
  );

  return (
    <>
      {!mobileOpen ? (
        <Button
          aria-label="Open navigation"
          className="sidebar-mobile-brand-trigger fixed left-4 top-4 z-30 grid h-11 w-11 min-w-11 place-items-center rounded-xl bg-overlay shadow-overlay lg:hidden"
          isIconOnly
          onClick={() => setMobileOpen(true)}
          type="button"
          title="Open navigation"
        >
          <BrandSymbol compact />
        </Button>
      ) : null}
      <div className="relative hidden h-screen lg:block">{content}</div>
      {mobileOpen ? (
        <div className="mobile-sidebar-backdrop fixed inset-0 z-40 lg:hidden">
          <Button
            className="absolute inset-0 h-full w-full rounded-none bg-[var(--backdrop)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            type="button"
            title="Close navigation"
          />
          <div className="mobile-sidebar-panel relative h-full w-[min(296px,86vw)]">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SidebarNavGroup({
  activeView,
  collapsed,
  items,
  label,
  onNavigate,
}: {
  activeView: ViewId;
  collapsed: boolean;
  items: NavItem[];
  label: string;
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <section className="sidebar-nav-group" aria-label={label}>
      {!collapsed ? (
        <div className="sidebar-group-label" aria-hidden="true">
          <span className="sidebar-group-signal" />
          <span>{label}</span>
        </div>
      ) : (
        <div className="sidebar-group-divider" aria-hidden="true" />
      )}
      <nav className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <Button
              aria-current={active ? "page" : undefined}
              className={`nav-item flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                active
                  ? "is-active bg-surface text-foreground shadow-surface"
                  : "text-muted hover:bg-surface-secondary hover:text-foreground"
              } ${
                collapsed ? "justify-center px-0" : "justify-start text-left"
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {collapsed ? null : (
                <span className="truncate">{item.label}</span>
              )}
            </Button>
          );
        })}
      </nav>
    </section>
  );
}

type DashboardProject = {
  archived: boolean;
  categoryId: string | null;
  color: string;
  dueDate: string | null;
  id: string;
  name: string;
  status: "planning" | "active" | "on-hold" | "completed";
  updatedAt: string;
};

type DashboardProjectCategory = {
  id: string;
  name: string;
  parentId: string | null;
};

type DashboardProjectData = {
  categories: DashboardProjectCategory[];
  projects: DashboardProject[];
};

const emptyDashboardProjectData: DashboardProjectData = {
  categories: [],
  projects: [],
};

function safeDashboardProjectData(value: unknown): DashboardProjectData {
  if (!value || typeof value !== "object") return emptyDashboardProjectData;
  const store = value as {
    categories?: unknown;
    projects?: unknown;
  };
  const projects = Array.isArray(store.projects)
    ? store.projects.filter((project): project is DashboardProject => {
        if (!project || typeof project !== "object") return false;
        const candidate = project as Partial<DashboardProject>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.name === "string" &&
          typeof candidate.color === "string" &&
          typeof candidate.archived === "boolean" &&
          typeof candidate.updatedAt === "string" &&
          ["planning", "active", "on-hold", "completed"].includes(
            candidate.status ?? "",
          )
        );
      })
    : [];
  const categories = Array.isArray(store.categories)
    ? store.categories.filter(
        (category): category is DashboardProjectCategory => {
          if (!category || typeof category !== "object") return false;
          const candidate = category as Partial<DashboardProjectCategory>;
          return (
            typeof candidate.id === "string" &&
            typeof candidate.name === "string" &&
            (candidate.parentId === null ||
              typeof candidate.parentId === "string")
          );
        },
      )
    : [];
  return { categories, projects };
}

type CalendarLocalProjectTask = {
  completed: boolean;
  dueDate: string | null;
  id: string;
  projectId: string;
  title: string;
};

type CalendarProjectData = {
  localTasks: CalendarLocalProjectTask[];
  projects: DashboardProject[];
  taskAssignments: Record<string, string>;
};

type CalendarDeadline = {
  color: string;
  completed: boolean;
  date: Date;
  id: string;
  kind: "project" | "task";
  projectId: string | null;
  projectName: string | null;
  sourceTask: RelayTask | null;
  title: string;
};

type MonthIntervalHighlight = {
  color: string;
  id: string;
  projectName: string;
  taskTitles: string[];
};

const emptyCalendarProjectData: CalendarProjectData = {
  localTasks: [],
  projects: [],
  taskAssignments: {},
};

function safeCalendarProjectData(value: unknown): CalendarProjectData {
  const dashboardData = safeDashboardProjectData(value);
  if (!value || typeof value !== "object") {
    return { ...emptyCalendarProjectData, projects: dashboardData.projects };
  }
  const store = value as {
    localTasks?: unknown;
    taskAssignments?: unknown;
  };
  const localTasks = Array.isArray(store.localTasks)
    ? store.localTasks.filter((task): task is CalendarLocalProjectTask => {
        if (!task || typeof task !== "object") return false;
        const candidate = task as Partial<CalendarLocalProjectTask>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.projectId === "string" &&
          typeof candidate.title === "string" &&
          typeof candidate.completed === "boolean" &&
          (candidate.dueDate === null || typeof candidate.dueDate === "string")
        );
      })
    : [];
  const taskAssignments =
    store.taskAssignments && typeof store.taskAssignments === "object"
      ? Object.fromEntries(
          Object.entries(store.taskAssignments).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};

  return {
    localTasks,
    projects: dashboardData.projects,
    taskAssignments,
  };
}

async function readCalendarProjectData(signal?: AbortSignal) {
  let localData = emptyCalendarProjectData;
  try {
    const saved = window.localStorage.getItem("relay.projects.v1");
    if (saved) localData = safeCalendarProjectData(JSON.parse(saved));
  } catch {
    // Ignore malformed local project data and continue with account sync.
  }

  try {
    const response = await fetch("/api/projects", {
      cache: "no-store",
      signal,
    });
    const data = (await response.json()) as {
      account?: unknown;
      record?: { store?: unknown } | null;
    };
    return response.ok && data.account && data.record?.store
      ? safeCalendarProjectData(data.record.store)
      : localData;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn("Project deadlines are unavailable from account sync.", error);
    return localData;
  }
}

function DashboardView({
  briefing,
  completeTask,
  notes,
  onOpenProject,
  openTasks,
  runPrompt,
  tasks,
}: {
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  notes: RelayNote[];
  onOpenProject: (projectId: string | null) => void;
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  const [projectData, setProjectData] = useState<DashboardProjectData>(
    emptyDashboardProjectData,
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/projects", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          account?: unknown;
          record?: { store?: unknown } | null;
        };
        if (!response.ok) return;
        if (data.record?.store) {
          setProjectData(safeDashboardProjectData(data.record.store));
          return;
        }
        if (!data.account) {
          try {
            const local = window.localStorage.getItem("relay.projects.v1");
            if (local)
              setProjectData(safeDashboardProjectData(JSON.parse(local)));
          } catch {
            // An invalid local cache should render as an empty project panel.
          }
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const activeProjects = projectData.projects.filter(
    (project) => !project.archived && project.status === "active",
  );

  return (
    <div className="relay-dashboard space-y-7 animate-fade-in">
      <WeeklyCommandCalendar
        briefing={briefing}
        completeTask={completeTask}
        notes={notes}
        openTasks={openTasks}
        runPrompt={runPrompt}
      />

      {!briefing ? <DashboardSkeleton /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.72fr)_minmax(340px,0.72fr)]">
        <InboxHighlights briefing={briefing} runPrompt={runPrompt} />
        <TaskSnapshot
          completeTask={completeTask}
          openTasks={openTasks}
          runPrompt={runPrompt}
          tasks={tasks}
        />
        <DashboardProjectsPanel
          categories={projectData.categories}
          onOpenProject={onOpenProject}
          projects={activeProjects}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          icon={FolderTree}
          label="Projects"
          value={`${activeProjects.length}`}
          detail="active projects"
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
}) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }, []);
  const events = briefing?.calendar.events ?? [];
  const githubIssues = briefing?.githubIssues?.issues ?? [];
  const [activeInspectorDay, setActiveInspectorDay] = useState<string | null>(
    null,
  );

  return (
    <section className="overflow-visible">
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

      <div className="grid auto-rows-fr gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            sameCalendarDay(parseEventDate(event.start), day),
          );
          const dayTasks = openTasks.filter((task) =>
            sameCalendarDay(parseEventDate(task.due), day),
          );
          const dayNotes = notes.filter((note) =>
            sameCalendarDay(parseEventDate(note.createdAt), day),
          );
          const dayIssues = githubIssues.filter((issue) =>
            sameCalendarDay(parseEventDate(issue.updatedAt), day),
          );
          const taskCount = dayTasks.length;
          const isToday = sameCalendarDay(day, new Date());
          const dayKey = day.toISOString();
          const inspectorActive = activeInspectorDay === dayKey;
          const dayLabel = day.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

          return (
            <div className="h-full min-w-0" key={dayKey}>
              <Button
                aria-expanded={inspectorActive}
                aria-haspopup="dialog"
                aria-label={`View ${taskCount} task${taskCount === 1 ? "" : "s"} and ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} for ${dayLabel}`}
                className={`relay-content-card week-day-card !h-52 w-full overflow-hidden rounded-2xl border-2 p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent ${
                  isToday
                    ? "border-[var(--accent)] bg-accent-soft shadow-[0_14px_32px_color-mix(in_oklab,var(--accent)_14%,transparent)]"
                    : "border-separator bg-surface-secondary"
                }`}
                onClick={() => setActiveInspectorDay(dayKey)}
                type="button"
              >
                <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="mt-1 block text-4xl font-bold leading-none tracking-tight text-foreground">
                  {day.getDate()}
                </span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {day.toLocaleDateString(undefined, { month: "short" })}
                </span>
                <div className="mt-auto grid grid-cols-2 divide-x divide-separator overflow-hidden rounded-xl border border-separator bg-surface shadow-sm">
                  <span className="grid min-w-0 gap-1.5 px-2.5 py-2.5">
                    <span className="text-2xl font-bold leading-none tracking-tight text-accent tabular-nums">
                      {taskCount}
                    </span>
                    <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                      Tasks due
                    </span>
                  </span>
                  <span className="grid min-w-0 gap-1.5 px-2.5 py-2.5">
                    <span className="text-2xl font-bold leading-none tracking-tight text-accent tabular-nums">
                      {dayEvents.length}
                    </span>
                    <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                      Events
                    </span>
                  </span>
                </div>
              </Button>

              <DayInspector
                active={inspectorActive}
                completeTask={completeTask}
                date={day}
                events={dayEvents}
                githubIssues={dayIssues}
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
  notes: RelayNote[];
  onClose: () => void;
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  const itemCount =
    events.length + tasks.length + githubIssues.length + notes.length;

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
                  label={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
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
                items={tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  detail: task.notes || priorityLabel(task.priority),
                  action: "Complete",
                  onClick: () => void completeTask(task),
                }))}
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
          items.map((item) => (
            <Button
              className="dashboard-row pointer-events-auto grid w-full grid-cols-[1fr_auto] gap-2 rounded-lg px-2 py-1.5 text-left transition"
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
  completeTask,
  openTasks,
  runPrompt,
  tasks,
}: {
  completeTask: (task: RelayTask) => Promise<void>;
  openTasks: RelayTask[];
  runPrompt: (prompt: string) => void;
  tasks: RelayTask[];
}) {
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const sortedTasks = sortTasksByUrgency(openTasks).slice(0, 5);
  const overdueCount = openTasks.filter((task) => isOverdue(task.due)).length;

  async function markTaskDone(task: RelayTask) {
    if (completingTaskIds.has(task.id)) return;

    setCompletingTaskIds((current) => new Set(current).add(task.id));
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      await completeTask(task);
    } catch {
      setCompletingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  }

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-separator p-4">
        <div>
          <h2 className="text-lg font-semibold">Task snapshot</h2>
          <p className="mt-1 text-sm text-muted">
            {overdueCount > 0
              ? `${overdueCount} overdue`
              : `${openTasks.length} open in Google Tasks`}
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
        {sortedTasks.map((task) => {
          const isCompleting = completingTaskIds.has(task.id);

          return (
            <div
              className={`dashboard-task-row grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 ${
                isCompleting ? "is-completing" : ""
              }`}
              key={task.id}
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
              <Button
                aria-busy={isCompleting}
                aria-label={`Mark ${task.title} as done`}
                className={`dashboard-task-done ${
                  isCompleting ? "is-completing" : ""
                }`}
                isIconOnly
                onPress={() => void markTaskDone(task)}
                size="sm"
                variant="ghost"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {sortedTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={
              tasks.length > 0
                ? "All Google Tasks completed"
                : "No Google Tasks"
            }
            detail="Create tasks from chat or the Tasks tab."
          />
        ) : null}
      </div>
    </section>
  );
}

function dashboardProjectCategoryPath(
  categoryId: string | null,
  categories: DashboardProjectCategory[],
) {
  if (!categoryId) return "Uncategorized";
  const names: string[] = [];
  const visited = new Set<string>();
  let current = categories.find((category) => category.id === categoryId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.name);
    current = current.parentId
      ? categories.find((category) => category.id === current?.parentId)
      : undefined;
  }
  return names.join(" / ") || "Uncategorized";
}

function DashboardProjectsPanel({
  categories,
  onOpenProject,
  projects,
}: {
  categories: DashboardProjectCategory[];
  onOpenProject: (projectId: string | null) => void;
  projects: DashboardProject[];
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-separator p-4">
        <div>
          <h2 className="text-lg font-semibold">Active projects</h2>
          <p className="mt-1 text-sm text-muted">
            {projects.length} project{projects.length === 1 ? "" : "s"} moving
            now
          </p>
        </div>
        <Button
          className={secondaryButtonClass + " h-9 px-3"}
          onClick={() => onOpenProject(null)}
          type="button"
        >
          View all
        </Button>
      </div>
      <div className="divide-y divide-separator">
        {projects.slice(0, 5).map((project) => (
          <button
            className="dashboard-project-row group relative flex w-full items-center gap-3 overflow-hidden px-4 py-3.5 text-left"
            key={project.id}
            onClick={() => onOpenProject(project.id)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-2 left-0 w-0.5 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-separator bg-surface-secondary"
              style={{ color: project.color }}
            >
              <FolderTree className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {project.name}
              </span>
              <span className="mt-1 block truncate text-xs text-muted">
                {dashboardProjectCategoryPath(project.categoryId, categories)}
                {project.dueDate ? ` · ${formatDueDate(project.dueDate)}` : ""}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </button>
        ))}
        {projects.length === 0 ? (
          <EmptyState
            detail="Create or activate a project to keep it within reach here."
            icon={FolderTree}
            title="No active projects"
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
  const messages = [...(briefing?.gmail?.messages ?? [])].sort(
    (left, right) =>
      new Date(right.date ?? 0).getTime() - new Date(left.date ?? 0).getTime(),
  );
  const items = messages.slice(0, 5).map((message) => ({
    id: message.id ?? message.subject,
    kind: "Inbox",
    title: message.subject,
    person: message.from ?? "Unknown sender",
    time: message.date,
    snippet: message.snippet ?? "No preview text",
    prompt: `Summarize this email: ${message.subject}`,
  }));
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
                <div key={item.id}>
                  <Button
                    className={`dashboard-mail-row dashboard-row grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-none p-4 text-left transition ${
                      selected?.id === item.id ? "is-selected" : ""
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
                </div>
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
    <Card className="border border-separator bg-surface p-0 shadow-surface">
      <Card.Content className="p-4">
        <div className="mb-5 flex items-center justify-between">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon className="h-4 w-4" />
          </span>
          <MoreHorizontal className="h-4 w-4 text-muted" />
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
        className="relay-themed-overlay w-72 border border-border bg-overlay p-3 text-sm shadow-overlay"
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
  completeTask,
  notes,
  openTasks,
  refreshWorkspace,
  runPrompt,
  signedInToGoogle,
  taskColumns,
  tasks,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  briefing: Briefing | null;
  completeTask: (task: RelayTask) => Promise<void>;
  notes: RelayNote[];
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
  signedInToGoogle: boolean;
  taskColumns: TaskColumn[];
  tasks: RelayTask[];
}) {
  const showContextWorkspace = false;
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(430);
  const mode: ContextWorkspaceMode = "focus";

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden lg:h-screen ${
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
        openTasks={openTasks}
        refreshWorkspace={refreshWorkspace}
        runPrompt={runPrompt}
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
  openTasks,
  refreshWorkspace,
  runPrompt,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
}) {
  return (
    <RelayThread
      assistantExtras={
        <RelayAssistantExtras
          addMemory={addMemory}
          addTask={addTask}
          openTasks={openTasks}
          refreshWorkspace={refreshWorkspace}
          runPrompt={runPrompt}
        />
      }
      onPrompt={runPrompt}
      onRunEnd={() => {
        void refreshWorkspace();
      }}
    />
  );
}

function RelayAssistantExtras({
  addMemory,
  addTask,
  openTasks,
  refreshWorkspace,
  runPrompt,
}: {
  addMemory: (body: string) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  openTasks: RelayTask[];
  refreshWorkspace: () => Promise<void>;
  runPrompt: (prompt: string) => void;
}) {
  const message = useAuiState((state) => state.message);
  const messages = useAuiState((state) => state.thread.messages);
  const [surfaceCompletion, setSurfaceCompletion] = useState<{
    link?: string | null;
    summary: string;
  } | null>(null);
  const [completedRequestIds, setCompletedRequestIds] = useState<Set<string>>(
    () => new Set(),
  );

  const messageContent = threadMessageText(message);
  const parsedContent = parseAssistantUiRequests(messageContent);
  const precedingUserMessage = [...messages.slice(0, message.index)]
    .reverse()
    .find((candidate) => candidate.role === "user");
  const precedingPrompt = precedingUserMessage
    ? threadMessageText(precedingUserMessage)
    : "";
  const generatedSurface = inferGeneratedSurface(precedingPrompt);
  const showGeneratedSurface =
    generatedSurface &&
    generatedSurface.surface !== "schedule" &&
    generatedSurface.surface !== "task";

  return (
    <>
      {showGeneratedSurface && !surfaceCompletion ? (
        <GeneratedMessageSurface
          addMemory={addMemory}
          addTask={addTask}
          onComplete={(summary, link) =>
            setSurfaceCompletion({ summary, link })
          }
          refreshWorkspace={refreshWorkspace}
          runPrompt={runPrompt}
          surface={generatedSurface.surface}
          surfaceContext={generatedSurface.context}
        />
      ) : null}

      {surfaceCompletion ? (
        surfaceCompletion.link ? (
          <Marker asChild className="mt-3">
            <a href={surfaceCompletion.link} rel="noreferrer" target="_blank">
              <MarkerIcon>
                <Check />
              </MarkerIcon>
              <MarkerContent>{surfaceCompletion.summary}</MarkerContent>
            </a>
          </Marker>
        ) : (
          <Marker className="mt-3">
            <MarkerIcon>
              <Check className="text-success" />
            </MarkerIcon>
            <MarkerContent>{surfaceCompletion.summary}</MarkerContent>
          </Marker>
        )
      ) : null}

      {parsedContent.requests.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {parsedContent.requests.map((request) =>
            completedRequestIds.has(request.id) ? (
              <Marker key={request.id}>
                <MarkerIcon>
                  <Check className="text-success" />
                </MarkerIcon>
                <MarkerContent>Action completed</MarkerContent>
              </Marker>
            ) : (
              <AssistantUiRequestCard
                key={request.id}
                onComplete={() =>
                  setCompletedRequestIds((current) => {
                    const next = new Set(current);
                    next.add(request.id);
                    return next;
                  })
                }
                openTasks={openTasks}
                refreshWorkspace={refreshWorkspace}
                request={request}
                runPrompt={runPrompt}
              />
            ),
          )}
        </div>
      ) : null}
    </>
  );
}

function threadMessageText(message: ThreadMessage) {
  return message.content
    .filter(
      (
        part,
      ): part is Extract<(typeof message.content)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

function LegacyAgentConsole({
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
  stopChat,
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
  stopChat: () => void;
  submitMessage: (
    event?: FormEvent<HTMLFormElement>,
    overrideMessage?: string,
    files?: FileUIPart[],
  ) => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const pinnedToBottomRef = useRef(true);
  const previousLoadingRef = useRef(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [preparingFiles, setPreparingFiles] = useState(false);

  async function attachFiles(files: FileList | null) {
    if (!files?.length) return;

    setPreparingFiles(true);
    try {
      const fileParts = await convertFileListToFileUIParts(files);
      setPendingFiles((current) => [...current, ...fileParts]);
    } finally {
      setPreparingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submitWithFiles(event: FormEvent<HTMLFormElement>) {
    const files = pendingFiles;
    setPendingFiles([]);
    await submitMessage(event, undefined, files);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  async function handleFileDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingFiles(false);
    await attachFiles(event.dataTransfer.files);
  }

  function updateScrollPosition() {
    const viewport = scrollRef.current;
    if (!viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const pinned = distanceFromBottom < 72;
    pinnedToBottomRef.current = pinned;
    setShowScrollToBottom(!pinned);
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const viewport = scrollRef.current;
    if (!viewport) return;

    pinnedToBottomRef.current = true;
    setShowScrollToBottom(false);
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
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
    const justStarted = loading && !previousLoadingRef.current;
    previousLoadingRef.current = loading;

    if (!pinnedToBottomRef.current && !justStarted) return;
    const frame = window.requestAnimationFrame(() => {
      const viewport = scrollRef.current;
      if (!viewport) return;
      pinnedToBottomRef.current = true;
      setShowScrollToBottom(false);
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading]);

  useEffect(() => {
    const composer = composerInputRef.current;
    if (!composer) return;

    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 160)}px`;
  }, [input]);

  const showThinking = loading && messages.at(-1)?.role !== "assistant";
  const showSuggestions = messages.length === 0 && !loading;

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className="relay-chat-viewport min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-5 sm:px-6 sm:pt-8"
        onScroll={updateScrollPosition}
        ref={scrollRef}
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-[48rem] flex-col ${
            showSuggestions ? "justify-center pb-16" : ""
          }`}
        >
          {showSuggestions ? (
            <ChatWelcomeSuggestions runPrompt={runPrompt} />
          ) : (
            <>
              <Marker className="mb-8" variant="separator">
                <MarkerContent>Today</MarkerContent>
              </Marker>
              <div className="flex flex-col gap-8 sm:gap-10">
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
                {showThinking ? (
                  <AssistantThinkingCard messages={messages} />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 bg-[linear-gradient(to_top,var(--background)_72%,transparent)] px-3 pb-3 pt-8 sm:px-6 sm:pb-5">
        <div className="relative mx-auto w-full max-w-[48rem]">
          {showScrollToBottom ? (
            <Button
              className={`${iconButtonClass} absolute -top-14 left-1/2 z-20 h-9 w-9 -translate-x-1/2 rounded-full bg-surface shadow-surface`}
              onClick={() => scrollToBottom()}
              type="button"
              title="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          ) : null}
          <form id="agent-chat-form" onSubmit={submitWithFiles}>
            <Input
              className="hidden"
              multiple
              onChange={(event) => void attachFiles(event.target.files)}
              ref={fileInputRef}
              type="file"
            />
            <div
              className={`relay-chat-composer relative rounded-[1.65rem] border bg-surface-secondary p-2 shadow-surface transition ${
                draggingFiles
                  ? "border-accent bg-accent-soft"
                  : "border-separator focus-within:border-border"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDraggingFiles(true);
              }}
              onDragLeave={() => setDraggingFiles(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void handleFileDrop(event)}
            >
              {pendingFiles.length > 0 ? (
                <AttachmentGroup
                  aria-label="Files ready to send"
                  className="mb-2 px-1"
                  role="group"
                >
                  {pendingFiles.map((file, index) => (
                    <ChatAttachment
                      file={file}
                      key={`${file.filename ?? file.mediaType}-${index}`}
                      onRemove={() =>
                        setPendingFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      size="sm"
                    />
                  ))}
                </AttachmentGroup>
              ) : null}
              {preparingFiles ? (
                <Marker className="mb-2 px-2" role="status">
                  <MarkerIcon>
                    <Loader2 className="animate-spin" />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">
                    Preparing attachments
                  </MarkerContent>
                </Marker>
              ) : null}
              <TextArea
                aria-label="Message Relay"
                className="max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 outline-none placeholder:text-muted"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message Relay"
                ref={composerInputRef}
                rows={1}
                value={input}
              />
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-1">
                  <Button
                    className={`${iconButtonClass} h-9 w-9 rounded-full border-transparent bg-transparent`}
                    disabled={loading || preparingFiles}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    title="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    className={`${iconButtonClass} h-9 w-9 rounded-full border-transparent bg-transparent`}
                    disabled={loading}
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
                </div>
                {loading ? (
                  <Button
                    className={`${primaryButtonClass} h-9 w-9 rounded-full px-0`}
                    onClick={stopChat}
                    type="button"
                    title="Stop generating"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    className={`${primaryButtonClass} h-9 w-9 rounded-full px-0`}
                    disabled={
                      preparingFiles ||
                      (!input.trim() && pendingFiles.length === 0)
                    }
                    type="submit"
                    title="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {draggingFiles ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center rounded-[1.65rem] border border-dashed border-accent bg-surface/90 text-sm font-medium text-accent backdrop-blur-sm"
                >
                  Drop files to add them
                </div>
              ) : null}
            </div>
          </form>
          <p className="mt-2 hidden text-center text-[11px] leading-4 text-muted sm:block">
            Relay can make mistakes. Check important actions before approving
            them.
          </p>
        </div>
      </div>
    </section>
  );
}

void LegacyAgentConsole;

function ChatWelcomeSuggestions({
  runPrompt,
}: {
  runPrompt: (prompt: string) => void;
}) {
  const suggestions = [
    {
      icon: CalendarDays,
      label: "Plan my day",
      prompt: "Plan my day from my calendar and open tasks",
    },
    {
      icon: ListTodo,
      label: "Prioritize tasks",
      prompt: "Review and prioritize my open tasks",
    },
    {
      icon: Mail,
      label: "Draft an email",
      prompt: "Help me draft an email",
    },
    {
      icon: FolderOpen,
      label: "Find a file",
      prompt: "Help me find a file in Drive",
    },
  ];

  return (
    <div className="animate-fade-in px-2 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-balance text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
        What can I help you move forward?
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
        Plan work, search your connected tools, draft a response, or turn an
        idea into an action.
      </p>
      <div
        aria-label="Suggested prompts"
        className="mt-6 flex flex-wrap justify-center gap-2"
        role="group"
      >
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;

          return (
            <Button
              className="interactive-control inline-flex h-9 items-center gap-2 rounded-full border border-separator bg-surface px-3.5 text-sm font-normal text-foreground transition hover:border-border hover:bg-surface-secondary"
              key={suggestion.label}
              onClick={() => runPrompt(suggestion.prompt)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              {suggestion.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function AssistantThinkingCard({ messages }: { messages: Message[] }) {
  const steps = inferExecutionTrace(messages);

  return (
    <div className="px-2">
      <Marker role="status">
        <MarkerIcon>
          <Loader2 className="animate-spin text-accent" />
        </MarkerIcon>
        <MarkerContent className="shimmer font-medium text-foreground">
          Thinking...
        </MarkerContent>
      </Marker>
      <p className="mt-1 pl-6 text-xs text-muted">{steps[0]}</p>
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
  const [copied, setCopied] = useState(false);
  const messageContent = relayMessageText(message);
  const parsedContent = fromUser
    ? { markdown: messageContent, requests: [] as AssistantUiRequest[] }
    : parseAssistantUiRequests(messageContent);
  const visibleContent = fromUser ? messageContent : parsedContent.markdown;
  const files = relayMessageFiles(message);
  const activityParts = message.parts.filter(
    (part) =>
      part.type !== "text" &&
      part.type !== "file" &&
      part.type !== "source-url" &&
      part.type !== "source-document",
  );
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url" || part.type === "source-document",
  );
  const metadata = message.metadata;

  async function copyMessage() {
    if (!visibleContent || !navigator.clipboard) return;

    await navigator.clipboard.writeText(visibleContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function readMessageAloud() {
    if (!visibleContent || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(visibleContent));
  }

  return (
    <article
      className="group/message relative w-full animate-fade-in"
      data-role={fromUser ? "user" : "assistant"}
    >
      <div className={fromUser ? "ml-auto w-fit max-w-[85%]" : "w-full"}>
        {!fromUser && activityParts.length > 0 ? (
          <ChatActivity parts={activityParts} />
        ) : null}
        {files.length > 0 ? (
          <div className={fromUser ? "flex justify-end" : ""}>
            <AttachmentGroup
              aria-label={fromUser ? "Your attachments" : "Relay attachments"}
              className="mb-3"
              role="group"
            >
              {files.map((file, index) => (
                <ChatAttachment
                  file={file}
                  key={`${file.filename ?? file.mediaType}-${index}`}
                  size="sm"
                />
              ))}
            </AttachmentGroup>
          </div>
        ) : null}
        {visibleContent ? (
          <div
            className={
              fromUser
                ? "rounded-[1.3rem] rounded-br-md border border-separator bg-surface-secondary px-4 py-2.5 text-[15px] leading-6 text-foreground shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_5%,transparent)]"
                : "px-2 text-[15px] leading-7 text-foreground"
            }
          >
            {fromUser ? (
              <p className="whitespace-pre-wrap">{visibleContent}</p>
            ) : (
              <MarkdownMessage content={visibleContent} />
            )}
          </div>
        ) : null}
        {metadata?.surface &&
        metadata.surface !== "schedule" &&
        metadata.surface !== "task" &&
        metadata.surfaceStatus !== "done" ? (
          <GeneratedMessageSurface
            addMemory={addMemory}
            addTask={addTask}
            onComplete={(summary, link) =>
              completeSurfaceMessage(message.id, summary, link)
            }
            refreshWorkspace={refreshWorkspace}
            runPrompt={runPrompt}
            surface={metadata.surface}
            surfaceContext={metadata.surfaceContext}
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
        {!fromUser && sourceParts.length > 0 ? (
          <div className="mt-4 border-t border-separator pt-3">
            <p className="mb-2 text-xs font-medium text-muted">Sources</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {sourceParts.map((part, index) => (
                <ChatPartMarker
                  key={`${part.type}-${"id" in part ? (part.id ?? index) : index}`}
                  part={part}
                />
              ))}
            </div>
          </div>
        ) : null}
        {visibleContent ? (
          <div
            className={`relay-message-actions mt-2 flex min-h-7 items-center gap-1 text-muted opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 ${
              fromUser ? "justify-end" : "px-1"
            }`}
          >
            <span className="mr-1 text-[11px]">
              {metadata?.timestamp ?? "Now"}
            </span>
            <Button
              className="interactive-control grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface-secondary hover:text-foreground"
              onClick={() => void copyMessage()}
              type="button"
              title={copied ? "Copied" : "Copy message"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {!fromUser ? (
              <Button
                className="interactive-control grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface-secondary hover:text-foreground"
                onClick={readMessageAloud}
                type="button"
                title="Read aloud"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ChatActivity({ parts }: { parts: Message["parts"] }) {
  const visibleParts = parts.filter((part) => part.type !== "step-start");
  const running = visibleParts.some(isChatPartRunning);
  const failed = visibleParts.some(isChatPartFailed);
  const previousRunningRef = useRef(running);
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (previousRunningRef.current !== running) {
      setManualOpen(null);
      previousRunningRef.current = running;
    }
  }, [running]);

  if (visibleParts.length === 0) return null;

  const open = manualOpen ?? running;
  const label = running
    ? "Relay is working"
    : failed
      ? "Relay activity needs attention"
      : `Worked through ${visibleParts.length} ${
          visibleParts.length === 1 ? "step" : "steps"
        }`;

  return (
    <div className="mb-4 px-2">
      <button
        aria-expanded={open}
        className="group/activity inline-flex max-w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-muted transition hover:text-foreground"
        onClick={() => setManualOpen(!open)}
        type="button"
      >
        {running ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
        ) : failed ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
        ) : (
          <Brain className="h-4 w-4 shrink-0 text-accent" />
        )}
        <span
          className={
            running
              ? "shimmer truncate font-medium text-foreground"
              : "truncate font-medium"
          }
        >
          {label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div
          aria-busy={running}
          className="ml-2 mt-1 grid gap-2 border-l border-separator py-1 pl-5"
        >
          {visibleParts.map((part, index) => (
            <ChatPartMarker
              key={`${part.type}-${"id" in part ? (part.id ?? index) : index}`}
              part={part}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isChatPartRunning(part: Message["parts"][number]) {
  if (part.type === "reasoning") return part.state === "streaming";
  if (part.type === "data-activity") return part.data.state === "running";
  if (part.type === "tool-routeRequest" || part.type === "dynamic-tool") {
    return part.state === "input-streaming" || part.state === "input-available";
  }
  return false;
}

function isChatPartFailed(part: Message["parts"][number]) {
  if (part.type === "data-activity") return part.data.state === "error";
  if (part.type === "tool-routeRequest" || part.type === "dynamic-tool") {
    return part.state === "output-error";
  }
  return false;
}

function ChatPartMarker({ part }: { part: Message["parts"][number] }) {
  if (part.type === "step-start") {
    return (
      <Marker variant="separator">
        <MarkerContent>Relay activity</MarkerContent>
      </Marker>
    );
  }

  if (part.type === "reasoning") {
    const streaming = part.state === "streaming";
    return (
      <Marker role={streaming ? "status" : undefined}>
        <MarkerIcon>
          {streaming ? (
            <Loader2 className="animate-spin text-accent" />
          ) : (
            <Brain className="text-accent" />
          )}
        </MarkerIcon>
        <MarkerContent className={streaming ? "shimmer" : undefined}>
          {part.text}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "data-activity") {
    const running = part.data.state === "running";
    const failed = part.data.state === "error";
    return (
      <Marker role={running ? "status" : undefined}>
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : failed ? (
            <AlertCircle className="text-danger" />
          ) : (
            <Check className="text-success" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {part.data.label}
          {part.data.detail ? ` · ${part.data.detail}` : ""}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "tool-routeRequest") {
    const running =
      part.state === "input-streaming" || part.state === "input-available";
    const failed = part.state === "output-error";
    const mode =
      part.state === "output-available" ? part.output.mode : undefined;
    return (
      <Marker role={running ? "status" : undefined} variant="border">
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : failed ? (
            <AlertCircle className="text-danger" />
          ) : (
            <Zap className="text-accent" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {part.title ?? "Relay request router"}
          {mode
            ? ` · ${mode === "provider" ? "AI provider" : "local mode"}`
            : ""}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "dynamic-tool") {
    const running =
      part.state === "input-streaming" || part.state === "input-available";
    return (
      <Marker role={running ? "status" : undefined} variant="border">
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : (
            <Check className="text-success" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {part.title ?? part.toolName}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "source-url") {
    return (
      <Marker asChild>
        <a href={part.url} rel="noreferrer" target="_blank">
          <MarkerIcon>
            <ExternalLink />
          </MarkerIcon>
          <MarkerContent>{part.title ?? part.url}</MarkerContent>
        </a>
      </Marker>
    );
  }

  if (part.type === "source-document") {
    return (
      <Marker variant="border">
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>
          {part.title}
          {part.filename ? ` · ${part.filename}` : ""}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "reasoning-file") {
    return (
      <Marker variant="border">
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>
          Attached reasoning file · {part.mediaType}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "custom") {
    return (
      <Marker>
        <MarkerIcon>
          <Sparkles />
        </MarkerIcon>
        <MarkerContent>{part.kind}</MarkerContent>
      </Marker>
    );
  }

  return null;
}

function ChatAttachment({
  file,
  onRemove,
  size = "default",
}: {
  file: FileUIPart;
  onRemove?: () => void;
  size?: "default" | "sm" | "xs";
}) {
  const title = file.filename ?? "Attachment";
  const image = file.mediaType.startsWith("image/");

  return (
    <Attachment className="max-w-64" size={size} state="done">
      <AttachmentMedia variant={image ? "image" : "icon"}>
        {image ? (
          <Image alt="" height={80} src={file.url} unoptimized width={80} />
        ) : (
          <FileText />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{title}</AttachmentTitle>
        <AttachmentDescription>
          {formatAttachmentType(file.mediaType)}
        </AttachmentDescription>
      </AttachmentContent>
      {onRemove ? (
        <AttachmentActions>
          <AttachmentAction
            aria-label={`Remove ${title}`}
            onClick={onRemove}
            type="button"
          >
            <X />
          </AttachmentAction>
        </AttachmentActions>
      ) : null}
      <AttachmentTrigger asChild>
        <a
          aria-label={`Open ${title}`}
          href={file.url}
          rel="noreferrer"
          target="_blank"
        />
      </AttachmentTrigger>
    </Attachment>
  );
}

function formatAttachmentType(mediaType: string) {
  const [group, detail] = mediaType.split("/");
  if (!detail) return mediaType;
  if (group === "image") return `${detail.toUpperCase()} image`;
  return detail.replace(/[.+-]/g, " ").toUpperCase();
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
            tasks={tasks}
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
      title: openTasks[0]?.title ?? "Capture a task",
      detail: openTasks[0]
        ? "Google Tasks item"
        : "Start with one concrete next action.",
      icon: ListTodo,
      prompt: openTasks[0]
        ? `Plan the next step for ${openTasks[0].title}`
        : "add task ",
    },
    {
      title:
        recentFile?.name ??
        (signedInToGoogle ? "Review Drive" : "Connect Google"),
      detail: recentFile
        ? driveFileType(recentFile)
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
              {briefing?.focus?.title ?? "No Google focus task selected yet."}
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
          <MiniControl label="Tasks" value={`${openTasks.length} open`} />
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
  onOpenProject,
  onOpenTask,
  refreshWorkspace,
  tasks,
}: {
  briefing: Briefing | null;
  onOpenProject?: (projectId: string) => void;
  onOpenTask?: (task: RelayTask) => void;
  refreshWorkspace: () => Promise<void>;
  tasks: RelayTask[];
}) {
  const events = briefing?.calendar.events ?? [];
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [projectData, setProjectData] = useState<CalendarProjectData>(
    emptyCalendarProjectData,
  );
  const [loadingProjectData, setLoadingProjectData] = useState(true);
  const [calendarAction, setCalendarAction] = useState<CalendarAction | null>(
    null,
  );
  const [inspectedMonthDate, setInspectedMonthDate] = useState<Date | null>(
    null,
  );
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void readCalendarProjectData(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setProjectData(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProjectData(false);
      });
    return () => controller.abort();
  }, []);

  const deadlines = useMemo(
    () => buildCalendarDeadlines(projectData, tasks),
    [projectData, tasks],
  );
  const dayEvents = events.filter((event) =>
    sameCalendarDay(parseEventDate(event.start), selectedDate),
  );
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const monthDays = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);

  async function refreshCalendar() {
    setLoadingProjectData(true);
    try {
      const [, nextProjectData] = await Promise.all([
        refreshWorkspace(),
        readCalendarProjectData(),
      ]);
      setProjectData(nextProjectData);
    } finally {
      setLoadingProjectData(false);
    }
  }

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
    <div
      className="calendar-workspace relative flex min-h-0 flex-col gap-3 animate-fade-in"
      data-loading={loadingProjectData || undefined}
    >
      {loadingProjectData ? (
        <div
          aria-label="Refreshing calendar metadata"
          className="calendar-sync-progress"
          role="status"
        >
          <span />
        </div>
      ) : null}
      <section
        aria-label="Calendar controls"
        className={
          softPanelClass +
          " flex flex-col gap-3 p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:flex-nowrap"
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="Previous date range"
            className={iconButtonClass}
            onClick={() =>
              setSelectedDate(shiftCalendarDate(selectedDate, view, -1))
            }
            type="button"
            title="Previous"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <Button
            className="interactive-control min-w-0 rounded-xl px-2 py-1 text-left transition hover:bg-accent-soft sm:min-w-48"
            onClick={() => setSelectedDate(new Date())}
            type="button"
            title="Go to today"
          >
            <span className="block truncate text-sm font-semibold">
              {selectedDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="block truncate text-xs text-muted">
              {loadingProjectData
                ? "Loading task and project deadlines"
                : `${briefing?.calendar.ok ? "Google Calendar" : "Local calendar"} · ${deadlines.length} deadlines`}
            </span>
          </Button>
          <Button
            aria-label="Next date range"
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

        <div
          aria-label="Calendar view"
          className="grid grid-cols-3 rounded-xl border border-separator bg-surface p-1"
          role="group"
        >
          {(["day", "week", "month"] as const).map((option) => (
            <Button
              aria-pressed={view === option}
              className={`h-8 min-w-16 rounded-lg px-3 text-xs font-semibold transition ${
                view === option
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted hover:bg-accent-soft hover:text-accent"
              }`}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option[0].toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            aria-label="Refresh calendar"
            className={iconButtonClass}
            onClick={() => void refreshCalendar()}
            type="button"
            title="Refresh calendar"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
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
        </div>
      </section>

      <CalendarDeadlineLegend deadlines={deadlines} />

      {view === "day" ? (
        <CalendarDeadlineRail
          days={[selectedDate]}
          deadlines={deadlines}
          onOpenProject={onOpenProject}
          onOpenTask={onOpenTask}
        />
      ) : null}

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
          deadlines={deadlines}
          events={events}
          onEventClick={openEvent}
          onEventDrop={moveEvent}
          onOpenProject={onOpenProject}
          onOpenTask={onOpenTask}
          onSelectDate={setSelectedDate}
          onSlotClick={openSlot}
          selectedDate={selectedDate}
          weekDays={weekDays}
        />
      ) : null}

      {view === "month" ? (
        <MonthDeadlineCalendar
          deadlines={deadlines}
          events={events}
          monthDays={monthDays}
          onOpenProject={onOpenProject}
          onOpenTask={onOpenTask}
          onEventClick={openEvent}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setInspectedMonthDate(date);
          }}
          selectedDate={selectedDate}
        />
      ) : null}

      {inspectedMonthDate ? (
        <MonthDayInspector
          date={inspectedMonthDate}
          deadlines={deadlines.filter((deadline) =>
            sameCalendarDay(deadline.date, inspectedMonthDate),
          )}
          events={events.filter((event) =>
            sameCalendarDay(parseEventDate(event.start), inspectedMonthDate),
          )}
          onClose={() => setInspectedMonthDate(null)}
          onEventClick={(event) => {
            setInspectedMonthDate(null);
            openEvent(event);
          }}
          onOpenProject={onOpenProject}
          onOpenTask={onOpenTask}
        />
      ) : null}

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

function openCalendarDeadline(
  deadline: CalendarDeadline,
  onOpenProject?: (projectId: string) => void,
  onOpenTask?: (task: RelayTask) => void,
) {
  if (deadline.kind === "project" && deadline.projectId && onOpenProject) {
    onOpenProject(deadline.projectId);
    return;
  }
  if (deadline.sourceTask && onOpenTask) {
    onOpenTask(deadline.sourceTask);
    return;
  }
  if (deadline.projectId && onOpenProject) onOpenProject(deadline.projectId);
}

function CalendarDeadlineLegend({
  deadlines,
}: {
  deadlines: CalendarDeadline[];
}) {
  const taskCount = deadlines.filter(
    (deadline) => deadline.kind === "task",
  ).length;
  const projectCount = deadlines.filter(
    (deadline) => deadline.kind === "project",
  ).length;

  return (
    <section
      aria-label="Calendar deadline legend"
      className="calendar-deadline-legend flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-semibold text-muted"
    >
      <span className="inline-flex items-center gap-1.5">
        <ListTodo className="h-3.5 w-3.5 text-accent" />
        {taskCount} task {taskCount === 1 ? "deadline" : "deadlines"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Flag className="h-3.5 w-3.5 text-accent" />
        {projectCount} project {projectCount === 1 ? "deadline" : "deadlines"}
      </span>
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <span className="h-3 w-5 rounded border border-accent/30 bg-accent-soft" />
        Month highlights show each open task-to-project due interval
      </span>
    </section>
  );
}

function CalendarDeadlineRail({
  days,
  deadlines,
  onOpenProject,
  onOpenTask,
}: {
  days: Date[];
  deadlines: CalendarDeadline[];
  onOpenProject?: (projectId: string) => void;
  onOpenTask?: (task: RelayTask) => void;
}) {
  return (
    <section
      aria-label="Task and project deadlines"
      className={softPanelClass + " shrink-0 overflow-x-auto p-3"}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-xs font-semibold">Due on these days</h3>
        </div>
        <span className="text-[10px] text-muted">Tasks and projects</span>
      </div>
      <div
        className="calendar-deadline-rail-grid grid gap-1.5 overflow-x-auto"
        data-days={days.length}
        style={{
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
        }}
      >
        {days.map((day) => {
          const dayDeadlines = deadlines.filter((deadline) =>
            sameCalendarDay(deadline.date, day),
          );
          return (
            <div
              className="calendar-deadline-rail-day min-w-0 rounded-lg border border-separator bg-surface p-1.5"
              key={day.toISOString()}
            >
              <p className="mb-1 truncate px-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
                {days.length === 1
                  ? day.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                    })
                  : day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <div className="max-h-24 space-y-1 overflow-y-auto">
                {dayDeadlines.map((deadline) => (
                  <button
                    className="calendar-deadline-item flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left"
                    data-completed={deadline.completed || undefined}
                    key={deadline.id}
                    onClick={() =>
                      openCalendarDeadline(deadline, onOpenProject, onOpenTask)
                    }
                    style={
                      {
                        "--deadline-color": deadline.color,
                      } as CSSProperties
                    }
                    title={`${deadline.kind === "project" ? "Project" : "Task"}: ${deadline.title}${deadline.projectName ? ` · ${deadline.projectName}` : ""}`}
                    type="button"
                  >
                    <span className="calendar-deadline-item__signal" />
                    {deadline.kind === "project" ? (
                      <Flag className="h-3 w-3 shrink-0" />
                    ) : (
                      <ListTodo className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate text-[10px] font-semibold">
                      {deadline.title}
                    </span>
                  </button>
                ))}
                {dayDeadlines.length === 0 ? (
                  <span className="block px-1 py-1 text-[9px] text-muted/70">
                    No deadlines
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthDeadlineCalendar({
  deadlines,
  events,
  monthDays,
  onEventClick,
  onOpenProject,
  onOpenTask,
  onSelectDate,
  selectedDate,
}: {
  deadlines: CalendarDeadline[];
  events: CalendarEvent[];
  monthDays: Date[];
  onEventClick: (event: CalendarEvent) => void;
  onOpenProject?: (projectId: string) => void;
  onOpenTask?: (task: RelayTask) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}) {
  const intervalHighlightsByDay = useMemo(
    () => buildMonthIntervalHighlights(monthDays, deadlines),
    [deadlines, monthDays],
  );

  return (
    <section
      className={
        softPanelClass + " flex min-h-0 flex-1 flex-col overflow-auto p-3"
      }
    >
      <div className="month-deadline-weekdays mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-deadline-grid relative grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
        {monthDays.map((day) => {
          const dayEvents = events.filter((event) =>
            sameCalendarDay(parseEventDate(event.start), day),
          );
          const dayDeadlines = deadlines.filter((deadline) =>
            sameCalendarDay(deadline.date, day),
          );
          const currentMonth = day.getMonth() === selectedDate.getMonth();
          const isSelected = sameCalendarDay(day, selectedDate);
          const isToday = sameCalendarDay(day, new Date());
          const intervalHighlights =
            intervalHighlightsByDay.get(calendarDayNumber(day)) ?? [];

          return (
            <div
              className={`month-deadline-day relay-content-card relative z-0 flex min-h-0 flex-col overflow-hidden rounded-md border p-1.5 transition hover:border-[var(--accent)] ${
                isSelected
                  ? "border-[var(--accent)] bg-accent-soft"
                  : "border-separator bg-surface"
              } ${currentMonth ? "" : "opacity-45"}`}
              key={day.toISOString()}
            >
              {intervalHighlights.length > 0 ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  {intervalHighlights.map((highlight, index) => (
                    <span
                      className="month-interval-highlight"
                      key={highlight.id}
                      style={
                        {
                          "--interval-color": highlight.color,
                          "--interval-depth": Math.min(index, 4),
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              ) : null}
              <button
                aria-label={`Open ${day.toLocaleDateString()} details`}
                className="absolute inset-0 z-10 cursor-pointer rounded-md border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => onSelectDate(day)}
                type="button"
              />
              <button
                className="relative z-30 flex w-full shrink-0 items-center justify-between gap-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => onSelectDate(day)}
                type="button"
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                    isToday ? "bg-accent text-accent-foreground shadow-sm" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                <span className="flex items-center gap-1">
                  {intervalHighlights.length > 0 ? (
                    <span
                      aria-label={`${intervalHighlights.length} active project intervals`}
                      className="month-interval-swatches"
                    >
                      {intervalHighlights.slice(0, 4).map((highlight) => (
                        <span
                          className="month-interval-swatch"
                          key={highlight.id}
                          style={{ backgroundColor: highlight.color }}
                          title={`${highlight.projectName}: ${highlight.taskTitles.join(", ")}`}
                        />
                      ))}
                    </span>
                  ) : null}
                  {dayEvents.length > 0 ? (
                    <span
                      className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[8px] font-bold text-accent"
                      title={`${dayEvents.length} calendar events`}
                    >
                      {dayEvents.length}e
                    </span>
                  ) : null}
                  {isToday ? (
                    <span className="hidden text-[8px] font-semibold uppercase tracking-wide text-accent xl:inline">
                      Today
                    </span>
                  ) : null}
                </span>
              </button>

              <div className="relative z-30 mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {dayEvents.map((event) => (
                  <button
                    className="calendar-month-event flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-left"
                    key={event.id ?? `${event.title}-${event.start}`}
                    onClick={() => onEventClick(event)}
                    title={`Event: ${event.title} · ${formatEventTime(event.start)}`}
                    type="button"
                  >
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate text-[9px] font-semibold">
                      {event.title}
                    </span>
                    <span className="ml-auto shrink-0 text-[8px] opacity-75">
                      {formatEventTime(event.start)}
                    </span>
                  </button>
                ))}
                {dayDeadlines.map((deadline) => (
                  <button
                    className="calendar-deadline-item flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-left"
                    data-completed={deadline.completed || undefined}
                    key={deadline.id}
                    onClick={() =>
                      openCalendarDeadline(deadline, onOpenProject, onOpenTask)
                    }
                    style={
                      {
                        "--deadline-color": deadline.color,
                      } as CSSProperties
                    }
                    title={`${deadline.kind === "project" ? "Project due" : "Task due"}: ${deadline.title}${deadline.projectName ? ` · ${deadline.projectName}` : ""}`}
                    type="button"
                  >
                    <span className="calendar-deadline-item__signal" />
                    {deadline.kind === "project" ? (
                      <Flag className="h-2.5 w-2.5 shrink-0" />
                    ) : (
                      <ListTodo className="h-2.5 w-2.5 shrink-0" />
                    )}
                    <span className="truncate text-[9px] font-semibold">
                      {deadline.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthDayInspector({
  date,
  deadlines,
  events,
  onClose,
  onEventClick,
  onOpenProject,
  onOpenTask,
}: {
  date: Date;
  deadlines: CalendarDeadline[];
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onOpenProject?: (projectId: string) => void;
  onOpenTask?: (task: RelayTask) => void;
}) {
  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog
            className={`${panelClass} max-h-[min(760px,calc(100vh-2rem))] w-full overflow-y-auto p-5`}
          >
            <Modal.CloseTrigger />
            <div className="pr-8">
              <div className="mb-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Day overview
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  {date.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                    year: "numeric",
                  })}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {events.length} event{events.length === 1 ? "" : "s"} ·{" "}
                  {deadlines.length} deadline
                  {deadlines.length === 1 ? "" : "s"}
                </p>
              </div>

              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                  <CalendarDays className="h-3.5 w-3.5 text-accent" /> Events
                </div>
                <div className="space-y-2">
                  {events.map((event) => (
                    <button
                      className="calendar-inspector-event flex w-full items-center gap-3 rounded-xl border border-separator bg-surface-secondary p-3 text-left transition hover:border-accent"
                      key={event.id ?? `${event.title}-${event.start}`}
                      onClick={() => onEventClick(event)}
                      type="button"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {event.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {formatEventTime(event.start)} –{" "}
                          {formatEventTime(event.end)}
                        </span>
                      </span>
                      <Pencil className="h-3.5 w-3.5 text-muted" />
                    </button>
                  ))}
                  {events.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-separator p-4 text-center text-xs text-muted">
                      No calendar events on this day.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                  <ListTodo className="h-3.5 w-3.5 text-accent" /> Tasks and
                  project dates
                </div>
                <div className="space-y-2">
                  {deadlines.map((deadline) => (
                    <button
                      className="calendar-deadline-item flex w-full items-center gap-2 rounded-xl border border-separator bg-surface-secondary p-3 text-left"
                      data-completed={deadline.completed || undefined}
                      key={deadline.id}
                      onClick={() => {
                        onClose();
                        openCalendarDeadline(
                          deadline,
                          onOpenProject,
                          onOpenTask,
                        );
                      }}
                      style={
                        { "--deadline-color": deadline.color } as CSSProperties
                      }
                      type="button"
                    >
                      <span className="calendar-deadline-item__signal" />
                      {deadline.kind === "project" ? (
                        <Flag className="h-4 w-4 shrink-0" />
                      ) : (
                        <ListTodo className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {deadline.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted">
                          {deadline.kind === "project"
                            ? "Project due"
                            : deadline.projectName
                              ? `Task · ${deadline.projectName}`
                              : "Task due"}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted" />
                    </button>
                  ))}
                  {deadlines.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-separator p-4 text-center text-xs text-muted">
                      No tasks or project due dates on this day.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function WeekCalendar({
  deadlines,
  events,
  onEventClick,
  onEventDrop,
  onOpenProject,
  onOpenTask,
  onSelectDate,
  onSlotClick,
  selectedDate,
  weekDays,
}: {
  deadlines: CalendarDeadline[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (event: CalendarEvent, targetDate: Date, hour: number) => void;
  onOpenProject?: (projectId: string) => void;
  onOpenTask?: (task: RelayTask) => void;
  onSelectDate: (date: Date) => void;
  onSlotClick: (date: Date, hour: number) => void;
  selectedDate: Date;
  weekDays: Date[];
}) {
  const hours = Array.from(
    { length: calendarEndHour - calendarStartHour },
    (_, index) => index + calendarStartHour,
  );
  const calendarMinutes = (calendarEndHour - calendarStartHour) * 60;
  const now = new Date();
  const showNow = weekDays.some((day) => sameCalendarDay(day, now));
  const nowTopPercent =
    ((now.getHours() * 60 + now.getMinutes() - calendarStartHour * 60) /
      calendarMinutes) *
    100;

  return (
    <section
      className={
        softPanelClass + " flex min-h-0 flex-1 flex-col overflow-hidden p-3"
      }
    >
      <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-separator pb-2 sm:grid-cols-[52px_repeat(7,minmax(0,1fr))]">
        <span />
        {weekDays.map((day) => {
          const isSelected = sameCalendarDay(day, selectedDate);
          const isToday = sameCalendarDay(day, now);
          const dayDeadlines = deadlines.filter((deadline) =>
            sameCalendarDay(deadline.date, day),
          );

          return (
            <div
              className={`week-calendar-day-heading relay-content-card min-w-0 rounded-lg px-1 py-2 transition sm:px-2 ${
                isSelected ? "bg-accent-soft text-accent" : ""
              }`}
              key={day.toISOString()}
            >
              <button
                className="w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => onSelectDate(day)}
                type="button"
              >
                <span className="flex items-center justify-between gap-1 text-[9px] font-semibold uppercase text-muted sm:text-[10px]">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                  {isToday ? (
                    <span className="hidden text-[9px] text-accent md:inline">
                      Today
                    </span>
                  ) : null}
                </span>
                <span
                  className={`mt-1 grid h-7 w-7 place-items-center rounded-full text-base font-semibold sm:h-8 sm:w-8 sm:text-lg ${
                    isToday ? "bg-accent text-accent-foreground shadow-sm" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="mt-1 max-h-20 space-y-1 overflow-y-auto">
                {dayDeadlines.map((deadline) => (
                  <button
                    className="calendar-deadline-item flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-left"
                    data-completed={deadline.completed || undefined}
                    key={deadline.id}
                    onClick={() =>
                      openCalendarDeadline(deadline, onOpenProject, onOpenTask)
                    }
                    style={
                      { "--deadline-color": deadline.color } as CSSProperties
                    }
                    title={deadline.title}
                    type="button"
                  >
                    <span className="calendar-deadline-item__signal" />
                    {deadline.kind === "project" ? (
                      <Flag className="h-2.5 w-2.5 shrink-0" />
                    ) : (
                      <ListTodo className="h-2.5 w-2.5 shrink-0" />
                    )}
                    <span className="truncate text-[9px] font-semibold">
                      {deadline.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          className="grid h-full grid-cols-[40px_repeat(7,minmax(0,1fr))] sm:grid-cols-[52px_repeat(7,minmax(0,1fr))]"
          style={{
            gridTemplateRows: `repeat(${hours.length}, minmax(0, 1fr))`,
          }}
        >
          {hours.map((hour) => (
            <div className="contents" key={hour}>
              <div className="min-h-0 border-t border-separator pt-1 text-[10px] font-semibold text-muted">
                {formatHour(hour)}
              </div>
              {weekDays.map((day) => (
                <Button
                  className="relay-calendar-slot h-auto min-h-0 border-l border-t border-separator text-left transition hover:bg-accent-soft"
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
                  title={`Add event ${day.toLocaleDateString()} ${formatHour(hour)}`}
                  type="button"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-10 right-0 top-0 grid grid-cols-7 sm:left-[52px]">
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
                    key={event.id ?? `${event.title}-${event.start}`}
                    onClick={() => onEventClick(event)}
                  />
                ))}
            </div>
          ))}
        </div>
        {showNow && nowTopPercent >= 0 && nowTopPercent <= 100 ? (
          <div
            className="pointer-events-none absolute left-10 right-0 z-20 flex items-center sm:left-[52px]"
            style={{ top: `${nowTopPercent}%` }}
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
  onClick,
}: {
  event: CalendarEvent;
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
  const calendarMinutes = (calendarEndHour - calendarStartHour) * 60;
  const topPercent =
    ((startMinutes - calendarStartHour * 60) / calendarMinutes) * 100;
  const heightPercent = ((endMinutes - startMinutes) / calendarMinutes) * 100;

  return (
    <div
      className="calendar-event-position pointer-events-auto absolute left-1 right-1"
      style={{
        top: `${Math.max(0, topPercent)}%`,
        height: `max(22px, ${heightPercent}%)`,
      }}
    >
      <HoverPreview
        detail={`${formatEventTime(event.start)} - ${formatEventTime(event.end)}${event.hangoutLink ? " · Google Meet" : ""}`}
        meta={event.hangoutLink ? "Online meeting" : "Calendar event"}
        title={event.title}
      >
        <Button
          className="relay-event-card h-full w-full overflow-hidden rounded-md border border-[var(--accent)] bg-accent-soft px-1.5 py-0.5 text-left text-[10px] shadow-sm transition hover:-translate-y-0.5 hover:bg-surface sm:text-xs"
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
    <section className={softPanelClass + " min-h-0 flex-1 overflow-y-auto p-3"}>
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
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Notes
                </span>
                <RichTextEditor
                  ariaLabel="Event notes formatting"
                  className="task-rich-text--compact"
                  onChange={(_, plainText) =>
                    onChange({ ...action, notes: plainText })
                  }
                  placeholder="Agenda, prep notes, links, or context"
                  value={action.notes ?? ""}
                />
              </div>
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
  return (
    <div className="space-y-4 animate-fade-in">
      <TaskComposer addTask={addTask} refreshWorkspace={refreshWorkspace} />

      <section className={softPanelClass + " p-4"}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Open tasks</h3>
            <p className="text-xs text-muted">
              {tasks.length} Google total, {taskColumns.length} task lists,{" "}
              {openTasks.length} Google open
            </p>
          </div>
          <StatusBadge
            ready={Boolean(briefing?.googleTasks?.ok)}
            label={
              briefing?.googleTasks?.ok ? "Google ready" : "Connect Google"
            }
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
        </div>
        {openTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No open tasks"
            detail={
              briefing?.googleTasks?.reason ??
              "Create one from the task builder."
            }
          />
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
              <p className="whitespace-pre-wrap text-sm leading-5">
                {note.body}
              </p>
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
      <div className="mt-3 space-y-3">
        <label className="block max-w-40 space-y-1">
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
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Notes
          </span>
          <RichTextEditor
            ariaLabel="Task notes formatting"
            className="task-rich-text--compact"
            onChange={(_, plainText) => setNotes(plainText)}
            placeholder="Context, project, or reminder details"
            value={notes}
          />
        </div>
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
                <DriveFileGlyph className="h-4 w-4 text-accent" file={file} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted">
                    {driveFileType(file)} by {file.owner ?? "Unknown owner"}
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
      <RichTextEditor
        ariaLabel="Memory formatting"
        className="task-rich-text--compact"
        onChange={(_, plainText) => setMemory(plainText)}
        placeholder="Write the exact preference, project fact, contact note, or habit to remember."
        value={memory}
      />
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
        <div className="block space-y-1">
          <span className="text-xs font-semibold uppercase text-muted">
            Body
          </span>
          <RichTextEditor
            ariaLabel="Email body formatting"
            maxLength={20000}
            onChange={(_, plainText) => setBody(plainText)}
            placeholder="Write or ask the assistant to draft the email body."
            readOnly={!editing}
            value={body}
          />
        </div>
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
  onOpenProject,
  onOpenTask,
  refreshWorkspace,
  tasks,
}: {
  briefing: Briefing | null;
  onOpenProject: (projectId: string) => void;
  onOpenTask: (task: RelayTask) => void;
  refreshWorkspace: () => Promise<void>;
  tasks: RelayTask[];
}) {
  return (
    <div className="calendar-page animate-fade-in">
      <CalendarWorkspace
        briefing={briefing}
        onOpenProject={onOpenProject}
        onOpenTask={onOpenTask}
        refreshWorkspace={refreshWorkspace}
        tasks={tasks}
      />
    </div>
  );
}

function TaskMasterDetailView({
  briefing,
  initialTaskKey,
  repositories,
  repositoryAssignments,
  refreshWorkspace,
  setTaskRepository,
}: {
  briefing: Briefing | null;
  initialTaskKey: string | null;
  repositories: GithubRepository[];
  repositoryAssignments: TaskRepositoryAssignments;
  refreshWorkspace: () => Promise<void>;
  setTaskRepository: (
    taskKey: string,
    repositoryFullName: string | null,
  ) => void;
}) {
  const googleTasks = briefing?.googleTasks;
  const tasks = useMemo(() => googleTasks?.tasks ?? [], [googleTasks?.tasks]);
  const taskLists = useMemo(
    () => googleTasks?.taskLists ?? [],
    [googleTasks?.taskLists],
  );
  const {
    archivedTaskKeys,
    archiveTask: archiveTaskLocally,
    forgetTaskArchive,
    unarchiveTask: unarchiveTaskLocally,
  } = useTaskArchive();
  const { deleteRichDescription, richDescriptions, setRichDescription } =
    useTaskRichDescriptions();
  const { projectAssignments, projects, setTaskProject } =
    useTaskProjectLinks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialTaskKey ?? googleTaskKey(tasks[0] ?? null),
  );
  const [calendarFocusRequest, setCalendarFocusRequest] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [layoutSizes, setLayoutSizes] = useState(readStoredTaskLayout);
  const [activeResize, setActiveResize] = useState<"rail" | "calendar" | null>(
    null,
  );
  const taskLayoutRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{
    axis: "rail" | "calendar";
    pointerId: number;
    startCalendarHeight: number;
    startRailWidth: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskListModalOpen, setTaskListModalOpen] = useState(false);
  const [selectedTaskListId, setSelectedTaskListId] = useState(
    initialTaskKey?.split(":")[0] ?? taskLists[0]?.id ?? "@default",
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "done" | "archived"
  >("pending");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | GoogleTaskPriority
  >("all");
  const [dueFilter, setDueFilter] = useState<
    "all" | "overdue" | "today" | "week" | "none"
  >("all");
  const selectedTaskList =
    taskLists.find((taskList) => taskList.id === selectedTaskListId) ??
    taskLists[0] ??
    null;
  const selectedListId = selectedTaskList?.id ?? "@default";
  const taskListCounts = useMemo(
    () =>
      Object.fromEntries(
        taskLists.map((taskList) => {
          const listTasks = tasks.filter(
            (task) => task.taskListId === taskList.id,
          );
          return [
            taskList.id ?? "@default",
            {
              pending: listTasks.filter((task) => task.status !== "completed")
                .length,
              total: listTasks.length,
            },
          ];
        }),
      ) as Record<string, { pending: number; total: number }>,
    [taskLists, tasks],
  );
  const orderedTasks = useMemo(() => {
    const open = sortGoogleTasksByUrgency(
      tasks.filter(
        (task) =>
          task.taskListId === selectedListId && task.status !== "completed",
      ),
    );
    const completed = tasks
      .filter(
        (task) =>
          task.taskListId === selectedListId && task.status === "completed",
      )
      .sort(
        (left, right) =>
          new Date(right.completed ?? right.updated ?? 0).getTime() -
          new Date(left.completed ?? left.updated ?? 0).getTime(),
      );

    return [...open, ...completed];
  }, [selectedListId, tasks]);
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = addDays(today, 7);

    return orderedTasks.filter((task) => {
      const taskKey = googleTaskKey(task);
      const archived = taskKey ? archivedTaskKeys.has(taskKey) : false;
      const completed = task.status === "completed";
      if (statusFilter === "archived" && !archived) return false;
      if (statusFilter !== "archived" && archived) return false;
      if (statusFilter === "pending" && completed) return false;
      if (statusFilter === "done" && !completed) return false;
      if (
        priorityFilter !== "all" &&
        googleTaskPriority(task) !== priorityFilter
      ) {
        return false;
      }

      const dueDate = parseEventDate(task.due);
      if (dueFilter === "overdue" && !isOverdue(task.due)) return false;
      if (
        dueFilter === "today" &&
        (!dueDate || !sameCalendarDay(dueDate, today))
      ) {
        return false;
      }
      if (
        dueFilter === "week" &&
        (!dueDate || dueDate < today || dueDate > endOfWeek)
      ) {
        return false;
      }
      if (dueFilter === "none" && dueDate) return false;
      return true;
    });
  }, [archivedTaskKeys, dueFilter, orderedTasks, priorityFilter, statusFilter]);
  const selectedTask =
    filteredTasks.find((task) => googleTaskKey(task) === selectedTaskId) ??
    filteredTasks[0] ??
    null;
  const filtersActive =
    statusFilter !== "all" || priorityFilter !== "all" || dueFilter !== "all";

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      taskLayoutStorageKey,
      JSON.stringify(layoutSizes),
    );
  }, [layoutSizes]);

  function selectTask(task: GoogleTask) {
    setEditingTaskId(null);
    setSelectedTaskId(googleTaskKey(task));
  }

  function showTaskDueDate(task: GoogleTask) {
    if (!parseEventDate(task.due)) return;
    setCalendarFocusRequest((current) => current + 1);
    window.requestAnimationFrame(() => {
      document.getElementById("task-mini-calendar")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  function taskLayoutBounds() {
    const rect = taskLayoutRef.current?.getBoundingClientRect();
    return {
      maxCalendarHeight: Math.max(
        180,
        Math.min(420, (rect?.height ?? 720) - 280),
      ),
      maxRailWidth: Math.max(240, Math.min(480, (rect?.width ?? 1000) - 420)),
    };
  }

  function setRailWidth(nextWidth: number) {
    const { maxRailWidth } = taskLayoutBounds();
    setLayoutSizes((current) => ({
      ...current,
      railWidth: Math.min(maxRailWidth, Math.max(240, nextWidth)),
    }));
  }

  function setCalendarHeight(nextHeight: number) {
    const { maxCalendarHeight } = taskLayoutBounds();
    setLayoutSizes((current) => ({
      ...current,
      calendarHeight: Math.min(maxCalendarHeight, Math.max(180, nextHeight)),
    }));
  }

  function startTaskPanelResize(
    event: ReactPointerEvent<HTMLDivElement>,
    axis: "rail" | "calendar",
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStateRef.current = {
      axis,
      pointerId: event.pointerId,
      startCalendarHeight: layoutSizes.calendarHeight,
      startRailWidth: layoutSizes.railWidth,
      startX: event.clientX,
      startY: event.clientY,
    };
    setActiveResize(axis);
    document.body.style.cursor = axis === "rail" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }

  function moveTaskPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = resizeStateRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;

    if (resize.axis === "rail") {
      setRailWidth(resize.startRailWidth + event.clientX - resize.startX);
      return;
    }

    setCalendarHeight(
      resize.startCalendarHeight - (event.clientY - resize.startY),
    );
  }

  function finishTaskPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeStateRef.current = null;
    setActiveResize(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  async function runGoogleTaskAction(body: Record<string, unknown>) {
    const response = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      reason?: string;
      task?: GoogleTask;
      taskList?: { id?: string | null; title: string };
    };

    if (!response.ok || !data.ok) {
      throw new Error(data.reason ?? "Google Tasks could not be updated.");
    }

    await refreshWorkspace();
    return data;
  }

  async function createTask(input: GoogleTaskInput) {
    const result = await runGoogleTaskAction({
      action: "create",
      title: input.title,
      notes: input.notes ?? "",
      due: input.due,
      priority: input.priority,
      taskListId: input.taskListId,
    });
    const createdTask = result.task ?? null;
    const createdTaskKey = googleTaskKey(createdTask);
    if (createdTaskKey) {
      setTaskRepository(createdTaskKey, input.repositoryFullName ?? null);
      if (createdTask?.id) {
        await setTaskProject(createdTask.id, input.projectId);
      }
      if (input.richDescription) {
        setRichDescription(createdTaskKey, input.richDescription);
      }
      setSelectedTaskId(createdTaskKey);
    }
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
    const previousTaskKey = googleTaskKey(task);
    const targetTaskListId = input.taskListId ?? task.taskListId ?? "@default";
    if (task.taskListId && targetTaskListId !== task.taskListId) {
      const wasArchived = previousTaskKey
        ? archivedTaskKeys.has(previousTaskKey)
        : false;
      const moveResult = await runGoogleTaskAction({
        action: "move",
        id: task.id,
        sourceTaskListId: task.taskListId,
        targetTaskListId,
      });
      const movedTaskKey = googleTaskKey(moveResult.task ?? null);
      if (previousTaskKey && movedTaskKey) {
        setTaskRepository(previousTaskKey, null);
        setTaskRepository(
          movedTaskKey,
          input.repositoryFullName ??
            repositoryAssignments[previousTaskKey] ??
            null,
        );
        const richDescription =
          input.richDescription ?? richDescriptions[previousTaskKey];
        if (richDescription) setRichDescription(movedTaskKey, richDescription);
        deleteRichDescription(previousTaskKey);
        forgetTaskArchive(previousTaskKey);
        if (wasArchived) archiveTaskLocally(movedTaskKey);
        setSelectedTaskListId(targetTaskListId);
        setSelectedTaskId(movedTaskKey);
      }
      await setTaskProject(task.id, input.projectId);
      return;
    }

    if (previousTaskKey) {
      setTaskRepository(previousTaskKey, input.repositoryFullName ?? null);
      if (input.richDescription) {
        setRichDescription(previousTaskKey, input.richDescription);
      }
    }
    await setTaskProject(task.id, input.projectId);
  }

  async function completeTask(task: GoogleTask) {
    if (!task.id) throw new Error("This Google task has no completion ID.");
    await runGoogleTaskAction({
      action: "complete",
      id: task.id,
      taskListId: task.taskListId,
    });
  }

  async function reopenTask(task: GoogleTask) {
    if (!task.id) throw new Error("This Google task has no editable ID.");
    await runGoogleTaskAction({
      action: "update",
      id: task.id,
      status: "needsAction",
      taskListId: task.taskListId,
    });
  }

  async function deleteTask(task: GoogleTask) {
    if (!task.id) throw new Error("This Google task has no deletable ID.");
    await runGoogleTaskAction({
      action: "delete",
      id: task.id,
      taskListId: task.taskListId,
    });
    const taskKey = googleTaskKey(task);
    if (taskKey) {
      forgetTaskArchive(taskKey);
      setTaskRepository(taskKey, null);
      deleteRichDescription(taskKey);
    }
    await setTaskProject(task.id, null);
    setEditingTaskId(null);
  }

  function setTaskArchived(task: GoogleTask, archived: boolean) {
    const taskKey = googleTaskKey(task);
    if (!taskKey) return;
    if (archived) archiveTaskLocally(taskKey);
    else unarchiveTaskLocally(taskKey);
    setEditingTaskId(null);
  }

  return (
    <div
      className="task-resizable-layout grid min-h-[calc(100dvh-2rem)] gap-4 sm:min-h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-3rem)] lg:min-h-0 lg:gap-0 xl:h-[calc(100dvh-4rem)]"
      ref={taskLayoutRef}
      style={
        {
          "--task-calendar-height": `${layoutSizes.calendarHeight}px`,
          "--task-rail-width": `${layoutSizes.railWidth}px`,
        } as CSSProperties
      }
    >
      <section
        className={`${panelClass} flex min-h-[420px] flex-col overflow-hidden lg:h-full`}
      >
        <Disclosure
          className="task-filter-disclosure border-b border-separator"
          isExpanded={filtersExpanded}
          onExpandedChange={setFiltersExpanded}
        >
          <Disclosure.Heading className="flex items-start justify-between gap-3 bg-surface p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Google Tasks
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">
                {selectedTaskList?.title ?? "My Tasks"}
              </h2>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted">
                <span>
                  <strong className="font-semibold text-foreground">
                    {taskListCounts[selectedListId]?.pending ?? 0}
                  </strong>{" "}
                  pending
                </span>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-accent"
                />
                <span>
                  <strong className="font-semibold text-foreground">
                    {taskListCounts[selectedListId]?.total ?? 0}
                  </strong>{" "}
                  total
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Tooltip>
                <Button
                  aria-label="Manage Google task lists"
                  className={iconButtonClass}
                  onClick={() => setTaskListModalOpen(true)}
                  type="button"
                >
                  <ListTodo className="h-4 w-4" />
                </Button>
                <Tooltip.Content>Manage task lists</Tooltip.Content>
              </Tooltip>
              <Tooltip>
                <Button
                  aria-expanded={filtersExpanded}
                  aria-label={
                    filtersExpanded
                      ? "Collapse task filters"
                      : "Expand task filters"
                  }
                  className={`task-filter-trigger relative h-10 w-10 p-0 ${
                    filtersExpanded ? "is-expanded" : ""
                  }`}
                  slot="trigger"
                  type="button"
                  variant="secondary"
                >
                  <Filter className="h-4 w-4" />
                  {filtersActive ? (
                    <span
                      aria-hidden="true"
                      className="task-filter-active-dot absolute right-1.5 top-1.5"
                    />
                  ) : null}
                </Button>
                <Tooltip.Content>
                  {filtersExpanded ? "Hide filters" : "Filter tasks"}
                </Tooltip.Content>
              </Tooltip>
              <Tooltip>
                <Button
                  aria-label="Add task"
                  className="h-10 w-10 shrink-0 rounded-xl bg-accent p-0 text-accent-foreground shadow-sm hover:bg-accent-hover"
                  disabled={!googleTasks?.ok}
                  onClick={() => setTaskModalOpen(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Tooltip.Content>Add task</Tooltip.Content>
              </Tooltip>
            </div>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="task-filter-strip px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Showing {filteredTasks.length} tasks
                </span>
                {filtersActive ? (
                  <Button
                    className="h-7 px-2 text-[11px] text-muted"
                    onClick={() => {
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setDueFilter("all");
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Select
                  aria-label="Filter tasks by status"
                  className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-xs"
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | "pending"
                        | "done"
                        | "archived",
                    )
                  }
                  value={statusFilter}
                >
                  <option value="all">All active tasks</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                  <option value="archived">Archived</option>
                </Select>
                <Select
                  aria-label="Filter tasks by priority"
                  className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-xs"
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as "all" | GoogleTaskPriority,
                    )
                  }
                  value={priorityFilter}
                >
                  <option value="all">All priorities</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </Select>
                <Select
                  aria-label="Filter tasks by due date"
                  className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-xs"
                  onChange={(event) =>
                    setDueFilter(
                      event.target.value as
                        | "all"
                        | "overdue"
                        | "today"
                        | "week"
                        | "none",
                    )
                  }
                  value={dueFilter}
                >
                  <option value="all">Any due date</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due today</option>
                  <option value="week">Next 7 days</option>
                  <option value="none">No due date</option>
                </Select>
              </div>
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>

        <ScrollShadow
          className="min-h-0 flex-1 p-3"
          hideScrollBar={false}
          offset={8}
          size={56}
        >
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskListCard
                archived={archivedTaskKeys.has(googleTaskKey(task) ?? "")}
                key={googleTaskKey(task)}
                onArchiveToggle={() =>
                  setTaskArchived(
                    task,
                    !archivedTaskKeys.has(googleTaskKey(task) ?? ""),
                  )
                }
                onSelect={() => selectTask(task)}
                selected={googleTaskKey(selectedTask) === googleTaskKey(task)}
                task={task}
                toggleTask={
                  task.status === "completed" ? reopenTask : completeTask
                }
              />
            ))}
            {filteredTasks.length === 0 ? (
              <EmptyState
                detail={
                  filtersActive
                    ? "Clear or adjust the filters to see more Google tasks."
                    : (googleTasks?.reason ??
                      "Add a Google task to start building your working list.")
                }
                icon={ListTodo}
                title={
                  filtersActive
                    ? "No tasks match"
                    : googleTasks?.ok
                      ? "No Google tasks yet"
                      : "Connect Google Tasks"
                }
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>

      <TaskResizeHandle
        active={activeResize === "rail"}
        ariaLabel="Resize task rail"
        defaultValue={defaultTaskLayout.railWidth}
        max={480}
        min={240}
        onChange={setRailWidth}
        onPointerDown={(event) => startTaskPanelResize(event, "rail")}
        onPointerMove={moveTaskPanelResize}
        onPointerUp={finishTaskPanelResize}
        orientation="vertical"
        value={layoutSizes.railWidth}
      />

      <div className="task-resizable-stack grid min-h-0 gap-4 lg:gap-0">
        <TaskDetailPanel
          archived={
            selectedTask
              ? archivedTaskKeys.has(googleTaskKey(selectedTask) ?? "")
              : false
          }
          deleteTask={deleteTask}
          editing={
            Boolean(selectedTask) &&
            editingTaskId === googleTaskKey(selectedTask)
          }
          onEditingChange={(editing) =>
            setEditingTaskId(
              editing && selectedTask ? googleTaskKey(selectedTask) : null,
            )
          }
          onToggleArchive={(archived) =>
            selectedTask && setTaskArchived(selectedTask, archived)
          }
          onSave={updateTask}
          onShowDueDate={showTaskDueDate}
          projectId={
            selectedTask?.id
              ? (projectAssignments[selectedTask.id] ?? null)
              : null
          }
          projects={projects}
          repositories={repositories}
          taskLists={taskLists}
          repositoryFullName={
            selectedTask
              ? (repositoryAssignments[googleTaskKey(selectedTask) ?? ""] ??
                null)
              : null
          }
          richDescription={
            selectedTask
              ? (richDescriptions[googleTaskKey(selectedTask) ?? ""] ?? null)
              : null
          }
          task={selectedTask}
          toggleTask={
            selectedTask?.status === "completed" ? reopenTask : completeTask
          }
        />
        <TaskResizeHandle
          active={activeResize === "calendar"}
          ariaLabel="Resize task details and calendar"
          defaultValue={defaultTaskLayout.calendarHeight}
          max={420}
          min={180}
          onChange={setCalendarHeight}
          onPointerDown={(event) => startTaskPanelResize(event, "calendar")}
          onPointerMove={moveTaskPanelResize}
          onPointerUp={finishTaskPanelResize}
          orientation="horizontal"
          value={layoutSizes.calendarHeight}
        />
        <TaskMiniCalendar
          key={`${googleTaskKey(selectedTask) ?? "task-calendar"}-${calendarFocusRequest}`}
          onSelectTask={selectTask}
          selectedTask={selectedTask}
          tasks={tasks.filter((task) => task.taskListId === selectedListId)}
        />
      </div>

      {taskModalOpen ? (
        <GoogleTaskCreationModal
          initialTaskListId={selectedListId}
          onCreate={createTask}
          onClose={() => setTaskModalOpen(false)}
          projects={projects}
          repositories={repositories}
          taskLists={taskLists}
        />
      ) : null}
      {taskListModalOpen ? (
        <GoogleTaskListManagerModal
          onClose={() => setTaskListModalOpen(false)}
          onMutate={async (body) => {
            await runGoogleTaskAction(body);
          }}
          onSelect={(taskListId) => {
            setSelectedTaskListId(taskListId);
            setSelectedTaskId(null);
            setTaskListModalOpen(false);
          }}
          selectedTaskListId={selectedListId}
          taskListCounts={taskListCounts}
          taskLists={taskLists}
        />
      ) : null}
    </div>
  );
}

function TaskResizeHandle({
  active,
  ariaLabel,
  defaultValue,
  max,
  min,
  onChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  orientation,
  value,
}: {
  active: boolean;
  ariaLabel: string;
  defaultValue: number;
  max: number;
  min: number;
  onChange: (value: number) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  orientation: "horizontal" | "vertical";
  value: number;
}) {
  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 40 : 16;
    let nextValue: number | null = null;

    if (event.key === "Home") nextValue = min;
    if (event.key === "End") nextValue = max;
    if (orientation === "vertical") {
      if (event.key === "ArrowLeft") nextValue = value - step;
      if (event.key === "ArrowRight") nextValue = value + step;
    } else {
      if (event.key === "ArrowUp") nextValue = value + step;
      if (event.key === "ArrowDown") nextValue = value - step;
    }

    if (nextValue === null) return;
    event.preventDefault();
    onChange(Math.min(max, Math.max(min, nextValue)));
  }

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation={orientation}
      aria-valuemax={Math.round(max)}
      aria-valuemin={Math.round(min)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)} pixels`}
      className={`task-resize-handle task-resize-handle--${orientation} hidden lg:block`}
      data-resizing={active || undefined}
      onDoubleClick={() => onChange(defaultValue)}
      onKeyDown={resizeWithKeyboard}
      onLostPointerCapture={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="separator"
      tabIndex={0}
      title={`${ariaLabel}. Drag, use arrow keys, or double-click to reset.`}
    />
  );
}

function TaskListCard({
  archived,
  onArchiveToggle,
  onSelect,
  selected,
  task,
  toggleTask,
}: {
  archived: boolean;
  onArchiveToggle: () => void;
  onSelect: () => void;
  selected: boolean;
  task: GoogleTask;
  toggleTask: (task: GoogleTask) => Promise<void>;
}) {
  const completed = task.status === "completed";

  return (
    <article
      className={`task-rail-card flex items-start gap-2 rounded-xl border bg-surface p-2 pl-3 shadow-sm ${
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
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <PriorityTag priority={googleTaskPriority(task)} />
            {completed ? (
              <Chip color="success" size="sm" variant="soft">
                Complete
              </Chip>
            ) : null}
          </span>
          <span
            className={`mt-1 line-clamp-1 block text-[13px] font-semibold leading-[1.1rem] ${
              completed ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[10px] leading-4 text-muted">
            <span
              aria-label={
                task.due
                  ? `${formatRemainingDueDays(task.due)}. Due ${formatDueDate(task.due)}`
                  : "No due date"
              }
              className="inline-flex items-center gap-1.5"
              title={task.due ? formatDueDate(task.due) : "No due date"}
            >
              <CalendarDays className="h-3 w-3" />
              {formatRemainingDueDays(task.due)}
            </span>
          </span>
        </span>
      </Button>
      <span className="flex shrink-0 flex-col gap-1">
        <TaskCompletionButton compact task={task} toggleTask={toggleTask} />
        <Button
          aria-label={archived ? "Unarchive task" : "Archive task"}
          className="h-7 w-7 rounded-full p-0 text-muted hover:bg-accent-soft hover:text-accent"
          onClick={onArchiveToggle}
          title={archived ? "Unarchive task" : "Archive task"}
          type="button"
        >
          {archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
        </Button>
      </span>
    </article>
  );
}

function TaskCategoryBadge({ categories }: { categories: TaskCategory[] }) {
  const label = categories.map((category) => category.name).join(" / ");
  const CategoryIcon = taskCategoryIconMap[categories.at(-1)?.icon ?? "folder"];

  return (
    <span
      aria-label={`Category: ${label}`}
      className="task-category-badge inline-flex min-w-0 max-w-full items-center gap-0.5 overflow-hidden rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
      title={label}
    >
      <CategoryIcon className="mr-0.5 h-3 w-3 shrink-0" />
      {categories.map((category, index) => (
        <span className="inline-flex min-w-0 items-center" key={category.id}>
          {index > 0 ? (
            <ChevronRight className="mx-0.5 h-2.5 w-2.5 shrink-0 opacity-60" />
          ) : null}
          <span className="truncate">{category.name}</span>
        </span>
      ))}
    </span>
  );
}

function TaskCompletionButton({
  compact = false,
  disabled = false,
  task,
  toggleTask,
}: {
  compact?: boolean;
  disabled?: boolean;
  task: GoogleTask;
  toggleTask: (task: GoogleTask) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const completed = task.status === "completed";

  async function toggleCompletion() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await toggleTask(task);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      aria-label={completed ? "Undo task completion" : "Mark task done"}
      aria-pressed={completed}
      className={`${compact ? "h-7 w-7 rounded-lg" : "h-10 w-10 rounded-xl"} shrink-0 border p-0 transition ${
        completed
          ? "border-[var(--success)] bg-[var(--success)] text-white hover:bg-[var(--success)] hover:text-white hover:brightness-110"
          : "border-separator bg-surface-secondary text-[var(--success)] hover:border-[var(--success)] hover:bg-[var(--success-soft)] hover:text-[var(--success)]"
      }`}
      disabled={busy || disabled}
      onClick={() => void toggleCompletion()}
      title={
        disabled
          ? "Finish editing before changing completion"
          : completed
            ? "Undo task completion"
            : "Mark task done"
      }
      type="button"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} stroke-[2.5]`}
        />
      )}
    </Button>
  );
}

function TaskDetailPanel({
  archived,
  deleteTask,
  editing,
  onEditingChange,
  onSave,
  onShowDueDate,
  onToggleArchive,
  projectId,
  projects,
  repositories,
  repositoryFullName,
  richDescription,
  task,
  taskLists,
  toggleTask,
}: {
  archived: boolean;
  deleteTask: (task: GoogleTask) => Promise<void>;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSave: (task: GoogleTask, input: GoogleTaskInput) => Promise<void>;
  onShowDueDate: (task: GoogleTask) => void;
  onToggleArchive: (archived: boolean) => void;
  projectId: string | null;
  projects: RelayProject[];
  repositories: GithubRepository[];
  repositoryFullName: string | null;
  richDescription: TaskRichDocument | null;
  task: GoogleTask | null;
  taskLists: Array<{ id?: string | null; title: string }>;
  toggleTask: (task: GoogleTask) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(googleTaskNotes(task?.notes));
  const [priority, setPriority] = useState<GoogleTaskPriority>(
    googleTaskEditablePriority(task),
  );
  const [due, setDue] = useState<DateValue | null>(taskDateValue(task?.due));
  const [draftTaskListId, setDraftTaskListId] = useState(
    task?.taskListId ?? "@default",
  );
  const [draftRepositoryFullName, setDraftRepositoryFullName] = useState(
    repositoryFullName ?? "none",
  );
  const [draftProjectId, setDraftProjectId] = useState(projectId ?? "none");
  const [draftRichDescription, setDraftRichDescription] =
    useState<TaskRichDocument | null>(richDescription);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function resetDraft(nextTask: GoogleTask | null) {
    setTitle(nextTask?.title ?? "");
    setNotes(googleTaskNotes(nextTask?.notes));
    setPriority(googleTaskEditablePriority(nextTask));
    setDue(taskDateValue(nextTask?.due));
    setDraftTaskListId(nextTask?.taskListId ?? "@default");
    setDraftRepositoryFullName(repositoryFullName ?? "none");
    setDraftProjectId(projectId ?? "none");
    setDraftRichDescription(richDescription);
    setStatus(null);
  }

  if (!task) {
    return (
      <section className={`${panelClass} min-h-[360px] p-5 lg:min-h-0`}>
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
        taskListId: draftTaskListId,
        projectId: draftProjectId === "none" ? null : draftProjectId,
        repositoryFullName:
          draftRepositoryFullName === "none" ? null : draftRepositoryFullName,
        richDescription: draftRichDescription,
      });
      onEditingChange(false);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Task could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (
      deleting ||
      !window.confirm(
        `Delete "${activeTask.title}" from Google Tasks? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setStatus(null);
    try {
      await deleteTask(activeTask);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Task could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      className={`${panelClass} flex min-h-[360px] min-w-0 flex-col overflow-hidden lg:min-h-0`}
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
          {editing ? (
            <>
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
                disabled={saving}
                onClick={() => {
                  resetDraft(task);
                  onEditingChange(false);
                }}
                type="button"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              className={secondaryButtonClass}
              onClick={() => {
                resetDraft(task);
                onEditingChange(true);
              }}
              type="button"
            >
              <FileText className="h-4 w-4" />
              Edit
            </Button>
          )}
          {!editing ? (
            <>
              <Button
                aria-label={archived ? "Unarchive task" : "Archive task"}
                className={iconButtonClass}
                onClick={() => onToggleArchive(!archived)}
                title={archived ? "Unarchive task" : "Archive task"}
                type="button"
              >
                {archived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
              <Button
                aria-label="Delete task"
                className="h-10 w-10 rounded-xl border border-separator bg-surface-secondary p-0 text-muted hover:border-danger hover:bg-danger-soft hover:text-danger"
                disabled={deleting}
                onClick={() => void removeTask()}
                title="Delete task"
                type="button"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : null}
          <TaskCompletionButton
            disabled={editing}
            task={task}
            toggleTask={toggleTask}
          />
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

            <div className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase text-muted">
                Description
              </span>
              <TaskRichTextEditor
                defaultValue={draftRichDescription}
                fallbackText={notes}
                key={`${googleTaskKey(task)}-editor`}
                onChange={(document, plainText) => {
                  setDraftRichDescription(document);
                  setNotes(plainText);
                }}
              />
            </div>

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
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Google task list
                </span>
                <Select
                  aria-label="Move task to Google task list"
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setDraftTaskListId(event.target.value)}
                  value={draftTaskListId}
                >
                  {taskLists.map((taskList) => (
                    <option
                      key={taskList.id ?? taskList.title}
                      value={taskList.id ?? "@default"}
                    >
                      {taskList.title}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Relay project
                </span>
                <Select
                  aria-label="Linked Relay project"
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) => setDraftProjectId(event.target.value)}
                  value={draftProjectId}
                >
                  <option value="none">No project</option>
                  {projectId &&
                  !projects.some((project) => project.id === projectId) ? (
                    <option value={projectId}>Unavailable project</option>
                  ) : null}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  GitHub repository
                </span>
                <Select
                  aria-label="Assigned GitHub repository"
                  className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                  onChange={(event) =>
                    setDraftRepositoryFullName(event.target.value)
                  }
                  value={draftRepositoryFullName}
                >
                  <option value="none">No repository</option>
                  {repositoryFullName &&
                  !repositories.some(
                    (repository) => repository.fullName === repositoryFullName,
                  ) ? (
                    <option value={repositoryFullName}>
                      {repositoryFullName} (unavailable)
                    </option>
                  ) : null}
                  {repositories.map((repository) => (
                    <option key={repository.id} value={repository.fullName}>
                      {repository.fullName}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {status ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {status}
              </p>
            ) : null}
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
              {projectId ? (
                <Chip size="sm" variant="secondary">
                  <Folder className="h-3 w-3" />
                  {projects.find((project) => project.id === projectId)?.name ??
                    "Unavailable project"}
                </Chip>
              ) : null}
              {repositoryFullName ? (
                <Chip size="sm" variant="secondary">
                  <GitBranch className="h-3 w-3" />
                  {repositoryFullName}
                </Chip>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Description
              </p>
              <TaskRichTextEditor
                className="mt-2"
                defaultValue={richDescription}
                fallbackText={
                  googleTaskNotes(task.notes) ||
                  "No description has been added to this task."
                }
                key={`${googleTaskKey(task)}-viewer`}
                readOnly
              />
            </div>

            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="grid min-w-[480px] grid-cols-3 gap-3">
                <TaskDetailDatum
                  actionLabel={
                    task.due ? "Show due date in mini calendar" : undefined
                  }
                  icon={CalendarDays}
                  label="Due date"
                  onAction={task.due ? () => onShowDueDate(task) : undefined}
                  value={task.due ? formatDueDate(task.due) : "No due date"}
                />
                <TaskDetailDatum
                  icon={CheckCircle2}
                  label="Status"
                  value={task.status === "completed" ? "Done" : "Open"}
                />
                <TaskDetailDatum
                  icon={ListTodo}
                  label="Google task list"
                  value={task.taskListTitle ?? "Google Tasks"}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TaskMiniCalendar({
  onSelectTask,
  selectedTask,
  tasks,
}: {
  onSelectTask: (task: GoogleTask) => void;
  selectedTask: GoogleTask | null;
  tasks: GoogleTask[];
}) {
  const selectedDueDate = parseEventDate(selectedTask?.due);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchor = selectedDueDate ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );
    const gridStart = addDays(firstDay, -firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [visibleMonth]);
  const dueTaskCount = tasks.filter((task) =>
    Boolean(parseEventDate(task.due)),
  ).length;

  return (
    <section
      aria-label="Task due date overview"
      className={`${panelClass} task-mini-calendar flex min-h-[240px] flex-col overflow-hidden p-3.5 lg:min-h-[180px]`}
      id="task-mini-calendar"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            <h3 className="truncate text-sm font-semibold">
              {visibleMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>
          <p
            aria-live="polite"
            className="mt-0.5 truncate text-[10px] text-muted"
          >
            {selectedTask
              ? selectedDueDate
                ? `Selected · ${selectedDueDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}`
                : "Selected task has no due date"
              : `${dueTaskCount} dated task${dueTaskCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous month"
            className="h-7 w-7 rounded-lg border border-separator bg-surface-secondary p-0 text-muted"
            onClick={() =>
              setVisibleMonth(
                (month) =>
                  new Date(month.getFullYear(), month.getMonth() - 1, 1),
              )
            }
            type="button"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            aria-label="Next month"
            className="h-7 w-7 rounded-lg border border-separator bg-surface-secondary p-0 text-muted"
            onClick={() =>
              setVisibleMonth(
                (month) =>
                  new Date(month.getFullYear(), month.getMonth() + 1, 1),
              )
            }
            type="button"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-0.5">
        {calendarDays.map((day) => {
          const dayTasks = tasks.filter((task) =>
            sameCalendarDay(parseEventDate(task.due), day),
          );
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = sameCalendarDay(day, new Date());
          const selectedOnDay =
            selectedDueDate && sameCalendarDay(selectedDueDate, day);
          const dateLabel = day.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return (
            <button
              aria-label={`${dateLabel}${
                dayTasks.length
                  ? `, ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"} due`
                  : ""
              }`}
              className={`task-calendar-day ${
                isCurrentMonth ? "" : "is-outside"
              } ${isToday ? "is-today" : ""} ${
                selectedOnDay ? "is-selected-task" : ""
              }`}
              disabled={dayTasks.length === 0}
              key={day.toISOString()}
              onClick={() => dayTasks[0] && onSelectTask(dayTasks[0])}
              title={
                dayTasks.length > 0
                  ? dayTasks.map((task) => task.title).join("\n")
                  : dateLabel
              }
              type="button"
            >
              <span>{day.getDate()}</span>
              {dayTasks.length > 0 ? (
                <span className="task-calendar-dots" aria-hidden="true">
                  {dayTasks.slice(0, 3).map((task) => (
                    <span
                      className={
                        googleTaskKey(task) === googleTaskKey(selectedTask)
                          ? "is-selected"
                          : task.status === "completed"
                            ? "is-complete"
                            : ""
                      }
                      key={googleTaskKey(task)}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TaskCategoryTreePicker({
  categories,
  onChange,
  value,
}: {
  categories: TaskCategory[];
  onChange: (categoryId: string) => void;
  value: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedCategory = categories.find((category) => category.id === value);
  const selectedPath = selectedCategory
    ? taskCategoryPath(categories, selectedCategory.id)
    : [];
  const SelectedIcon = selectedCategory
    ? taskCategoryIconMap[selectedCategory.icon]
    : FolderTree;

  useDismissableDetails(detailsRef);

  function selectCategory(categoryId: string) {
    onChange(categoryId);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details className="task-category-picker group relative" ref={detailsRef}>
      <summary
        aria-label="Choose task category"
        className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none transition hover:border-[var(--accent)] focus-visible:border-[var(--accent)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate">
            {selectedPath.length > 0
              ? selectedPath.map((category) => category.name).join(" / ")
              : "No category"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="task-category-picker__panel absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-separator bg-overlay p-1.5 shadow-overlay">
        <Button
          aria-pressed={value === "none"}
          className={`mb-1 h-9 w-full justify-start rounded-lg px-2.5 text-sm ${
            value === "none"
              ? "bg-accent-soft text-accent"
              : "text-muted hover:bg-surface-tertiary hover:text-foreground"
          }`}
          onClick={() => selectCategory("none")}
          type="button"
          variant="ghost"
        >
          <FolderTree className="h-4 w-4" />
          No category
          {value === "none" ? <Check className="ml-auto h-4 w-4" /> : null}
        </Button>
        {categories.length > 0 ? (
          <TreeProvider
            defaultExpandedIds={categories.map((category) => category.id)}
            indent={22}
            onSelectionChange={(selectedIds) => {
              const nextId = selectedIds[0];
              if (nextId) selectCategory(nextId);
              else if (detailsRef.current) detailsRef.current.open = false;
            }}
            selectedIds={value === "none" ? [] : [value]}
            showLines
          >
            <TreeView className="p-0">
              <TaskCategoryPickerBranch
                categories={categories}
                parentId={null}
                selectedId={value}
              />
            </TreeView>
          </TreeProvider>
        ) : (
          <p className="px-2.5 py-3 text-xs text-muted">
            Create a category from the category manager first.
          </p>
        )}
      </div>
    </details>
  );
}

function TaskCategoryPickerBranch({
  categories,
  level = 0,
  parentId,
  parentPath = [],
  selectedId,
}: {
  categories: TaskCategory[];
  level?: number;
  parentId: string | null;
  parentPath?: boolean[];
  selectedId: string;
}) {
  const siblings = categories
    .filter((category) => category.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name));

  return siblings.map((category, index) => {
    const children = categories.filter(
      (candidate) => candidate.parentId === category.id,
    );
    const isLast = index === siblings.length - 1;
    const CategoryIcon = taskCategoryIconMap[category.icon];

    return (
      <TreeNode
        isLast={isLast}
        key={category.id}
        level={level}
        nodeId={category.id}
        parentPath={parentPath}
      >
        <TreeNodeTrigger className="py-1.5">
          <TreeExpander hasChildren={children.length > 0} />
          <TreeIcon
            hasChildren={children.length > 0}
            icon={<CategoryIcon className="h-4 w-4 text-accent" />}
          />
          <TreeLabel>{category.name}</TreeLabel>
          {selectedId === category.id ? (
            <Check className="h-4 w-4 shrink-0 text-accent" />
          ) : null}
        </TreeNodeTrigger>
        <TreeNodeContent hasChildren={children.length > 0}>
          <TaskCategoryPickerBranch
            categories={categories}
            level={level + 1}
            parentId={category.id}
            parentPath={[...parentPath, isLast]}
            selectedId={selectedId}
          />
        </TreeNodeContent>
      </TreeNode>
    );
  });
}

function TaskCategoryManagerModal({
  addCategory,
  categories,
  deleteCategory,
  onClose,
  renameCategory,
}: {
  addCategory: (
    name: string,
    parentId: string | null,
    icon: TaskCategoryIconName,
  ) => void;
  categories: TaskCategory[];
  deleteCategory: (categoryId: string) => void;
  onClose: () => void;
  renameCategory: (
    categoryId: string,
    name: string,
    icon: TaskCategoryIconName,
  ) => void;
}) {
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog
            className={`${panelClass} w-full max-w-xl animate-slide-up p-5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-semibold">Task categories</h3>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Add nested categories from any branch and give each one a
                  recognizable icon.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className={primaryButtonClass}
                  onClick={() => {
                    setEditingId(null);
                    setAddingParentId("root");
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add category
                </Button>
                <Button
                  className={iconButtonClass}
                  onClick={onClose}
                  title="Close"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 max-h-[520px] overflow-y-auto rounded-2xl border border-separator bg-surface-secondary/60 p-2">
              {addingParentId === "root" ? (
                <TaskCategoryForm
                  className="m-2"
                  label="New top-level category"
                  onCancel={() => setAddingParentId(null)}
                  onSave={(name, icon) => {
                    addCategory(name, null, icon);
                    setAddingParentId(null);
                  }}
                />
              ) : null}
              {categories.length > 0 ? (
                <TreeProvider
                  defaultExpandedIds={categories.map((category) => category.id)}
                  indent={22}
                  selectable={false}
                  showLines
                >
                  <TreeView className="p-1">
                    <TaskCategoryTreeBranch
                      addCategory={addCategory}
                      addingParentId={addingParentId}
                      categories={categories}
                      deleteCategory={deleteCategory}
                      editingId={editingId}
                      onAddingParentChange={setAddingParentId}
                      onEditingChange={setEditingId}
                      parentId={null}
                      renameCategory={renameCategory}
                    />
                  </TreeView>
                </TreeProvider>
              ) : (
                <EmptyState
                  detail="Use Add category to create the first branch."
                  icon={FolderTree}
                  title="Your category tree is empty"
                />
              )}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function TaskCategoryTreeBranch({
  addCategory,
  addingParentId,
  categories,
  deleteCategory,
  editingId,
  level = 0,
  onAddingParentChange,
  onEditingChange,
  parentId,
  parentPath = [],
  renameCategory,
}: {
  addCategory: (
    name: string,
    parentId: string | null,
    icon: TaskCategoryIconName,
  ) => void;
  addingParentId: string | null;
  categories: TaskCategory[];
  deleteCategory: (categoryId: string) => void;
  editingId: string | null;
  level?: number;
  onAddingParentChange: (categoryId: string | null) => void;
  onEditingChange: (categoryId: string | null) => void;
  parentId: string | null;
  parentPath?: boolean[];
  renameCategory: (
    categoryId: string,
    name: string,
    icon: TaskCategoryIconName,
  ) => void;
}) {
  const { expandedIds, toggleExpanded } = useTree();
  const siblings = categories
    .filter((category) => category.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name));

  return siblings.map((category, index) => {
    const children = categories.filter(
      (candidate) => candidate.parentId === category.id,
    );
    const isLast = index === siblings.length - 1;
    const hasChildren = children.length > 0 || addingParentId === category.id;
    const CategoryIcon = taskCategoryIconMap[category.icon];

    return (
      <TreeNode
        isLast={isLast}
        key={category.id}
        level={level}
        nodeId={category.id}
        parentPath={parentPath}
      >
        <TreeNodeTrigger>
          <TreeExpander hasChildren={hasChildren} />
          <TreeIcon
            hasChildren={hasChildren}
            icon={<CategoryIcon className="h-4 w-4 text-accent" />}
          />
          <TreeLabel>{category.name}</TreeLabel>
          <span className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
            <Button
              aria-label={`Add subcategory to ${category.name}`}
              className="h-7 w-7 rounded-lg p-0 text-muted hover:bg-accent-soft hover:text-accent"
              onClick={(event) => {
                event.stopPropagation();
                onEditingChange(null);
                onAddingParentChange(category.id);
                if (!expandedIds.has(category.id)) toggleExpanded(category.id);
              }}
              title={`Add subcategory to ${category.name}`}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              aria-label={`Edit ${category.name}`}
              className="h-7 w-7 rounded-lg p-0 text-muted hover:bg-accent-soft hover:text-accent"
              onClick={(event) => {
                event.stopPropagation();
                onAddingParentChange(null);
                onEditingChange(category.id);
              }}
              title={`Edit ${category.name}`}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              aria-label={`Delete ${category.name}`}
              className="h-7 w-7 rounded-lg p-0 text-muted hover:bg-danger-soft hover:text-danger"
              onClick={(event) => {
                event.stopPropagation();
                if (
                  window.confirm(
                    `Delete "${category.name}" and its nested categories? Tasks will remain, but their category assignment will be removed.`,
                  )
                ) {
                  deleteCategory(category.id);
                }
              }}
              title={`Delete ${category.name}`}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </span>
        </TreeNodeTrigger>
        {editingId === category.id ? (
          <TaskCategoryForm
            className="mb-1"
            initialIcon={category.icon}
            initialName={category.name}
            label={`Edit ${category.name}`}
            onCancel={() => onEditingChange(null)}
            onSave={(name, icon) => {
              renameCategory(category.id, name, icon);
              onEditingChange(null);
            }}
            style={{ marginLeft: `${level * 22 + 36}px` }}
          />
        ) : null}
        <TreeNodeContent hasChildren={hasChildren}>
          {addingParentId === category.id ? (
            <TaskCategoryForm
              className="mb-1"
              label={`New subcategory in ${category.name}`}
              onCancel={() => onAddingParentChange(null)}
              onSave={(name, icon) => {
                addCategory(name, category.id, icon);
                onAddingParentChange(null);
              }}
              style={{ marginLeft: `${(level + 1) * 22 + 18}px` }}
            />
          ) : null}
          <TaskCategoryTreeBranch
            addCategory={addCategory}
            addingParentId={addingParentId}
            categories={categories}
            deleteCategory={deleteCategory}
            editingId={editingId}
            level={level + 1}
            onAddingParentChange={onAddingParentChange}
            onEditingChange={onEditingChange}
            parentId={category.id}
            parentPath={[...parentPath, isLast]}
            renameCategory={renameCategory}
          />
        </TreeNodeContent>
      </TreeNode>
    );
  });
}

function TaskCategoryForm({
  className,
  initialIcon = "folder",
  initialName = "",
  label,
  onCancel,
  onSave,
  style,
}: {
  className?: string;
  initialIcon?: TaskCategoryIconName;
  initialName?: string;
  label: string;
  onCancel: () => void;
  onSave: (name: string, icon: TaskCategoryIconName) => void;
  style?: CSSProperties;
}) {
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState<TaskCategoryIconName>(initialIcon);
  const iconPickerRef = useRef<HTMLDetailsElement>(null);
  const SelectedIcon = taskCategoryIconMap[icon];

  useDismissableDetails(iconPickerRef);

  return (
    <div
      className={`rounded-xl border border-separator bg-surface p-3 shadow-sm ${className ?? ""}`}
      style={style}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <Input
        aria-label={label}
        autoFocus
        className="mt-2 h-9 w-full rounded-lg border border-separator bg-surface-secondary px-2.5 text-sm"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && name.trim()) {
            onSave(name.trim(), icon);
          }
          if (event.key === "Escape") onCancel();
        }}
        placeholder="Category name"
        value={name}
      />
      <details
        className="task-icon-picker group relative mt-2.5"
        ref={iconPickerRef}
      >
        <summary className="flex h-9 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary px-2.5 text-sm outline-none transition hover:border-[var(--accent)] focus-visible:border-[var(--accent)]">
          <span className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4 text-accent" />
            <span className="capitalize">{icon}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
        </summary>
        <div className="task-icon-picker__panel absolute left-0 top-[calc(100%+0.35rem)] z-40 grid w-[17rem] grid-cols-7 gap-1.5 rounded-xl border border-separator bg-overlay p-2.5 shadow-overlay">
          {Object.entries(taskCategoryIconMap).map(([iconName, Icon]) => (
            <button
              aria-label={`Use ${iconName} icon`}
              aria-pressed={icon === iconName}
              className="task-category-icon-option"
              key={iconName}
              onClick={() => {
                setIcon(iconName as TaskCategoryIconName);
                if (iconPickerRef.current) {
                  iconPickerRef.current.open = false;
                }
              }}
              title={iconName}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </details>
      <div className="mt-3 flex items-center gap-2">
        <Button
          className={primaryButtonClass}
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), icon)}
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
        <Button
          className={secondaryButtonClass}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function useDismissableDetails(ref: { current: HTMLDetailsElement | null }) {
  useEffect(() => {
    function dismissOnOutsidePress(event: MouseEvent) {
      const details = ref.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    function dismissOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector<HTMLElement>("summary")?.focus();
      }
    }

    document.addEventListener("mousedown", dismissOnOutsidePress);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("mousedown", dismissOnOutsidePress);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [ref]);
}

function useTaskCategories() {
  const [categories, setCategories] = useState<TaskCategory[]>(
    readStoredTaskCategories,
  );
  const [assignments, setAssignments] = useState<TaskCategoryAssignments>(
    readStoredTaskCategoryAssignments,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      taskCategoryStorageKey,
      JSON.stringify(categories),
    );
    window.localStorage.setItem(
      taskCategoryAssignmentStorageKey,
      JSON.stringify(assignments),
    );
  }, [assignments, categories]);

  function addCategory(
    name: string,
    parentId: string | null,
    icon: TaskCategoryIconName,
  ) {
    const id = `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCategories((current) => [...current, { icon, id, name, parentId }]);
  }

  function renameCategory(
    categoryId: string,
    name: string,
    icon: TaskCategoryIconName,
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId ? { ...category, icon, name } : category,
      ),
    );
  }

  function deleteCategory(categoryId: string) {
    setCategories((current) => {
      const removedIds = new Set([
        categoryId,
        ...taskCategoryDescendantIds(current, categoryId),
      ]);
      setAssignments((currentAssignments) =>
        Object.fromEntries(
          Object.entries(currentAssignments).filter(
            ([, assignedCategoryId]) => !removedIds.has(assignedCategoryId),
          ),
        ),
      );
      return current.filter((category) => !removedIds.has(category.id));
    });
  }

  function setTaskCategory(taskKey: string, categoryId: string | null) {
    setAssignments((current) => {
      if (!categoryId) {
        const next = { ...current };
        delete next[taskKey];
        return next;
      }
      return { ...current, [taskKey]: categoryId };
    });
  }

  return {
    assignments,
    categories,
    addCategory,
    deleteCategory,
    renameCategory,
    setTaskCategory,
  };
}

function useTaskArchive() {
  const [archivedKeys, setArchivedKeys] = useState<string[]>(
    readStoredTaskArchive,
  );
  const archivedTaskKeys = useMemo(() => new Set(archivedKeys), [archivedKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      taskArchiveStorageKey,
      JSON.stringify(archivedKeys),
    );
  }, [archivedKeys]);

  function archiveTask(taskKey: string) {
    setArchivedKeys((current) =>
      current.includes(taskKey) ? current : [...current, taskKey],
    );
  }

  function unarchiveTask(taskKey: string) {
    setArchivedKeys((current) => current.filter((key) => key !== taskKey));
  }

  return {
    archivedTaskKeys,
    archiveTask,
    forgetTaskArchive: unarchiveTask,
    unarchiveTask,
  };
}

function useTaskRichDescriptions() {
  const [richDescriptions, setRichDescriptions] =
    useState<TaskRichDescriptions>(readStoredTaskRichDescriptions);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      taskRichDescriptionStorageKey,
      JSON.stringify(richDescriptions),
    );
  }, [richDescriptions]);

  function setRichDescription(taskKey: string, document: TaskRichDocument) {
    setRichDescriptions((current) => ({
      ...current,
      [taskKey]: document,
    }));
  }

  function deleteRichDescription(taskKey: string) {
    setRichDescriptions((current) => {
      const next = { ...current };
      delete next[taskKey];
      return next;
    });
  }

  return {
    deleteRichDescription,
    richDescriptions,
    setRichDescription,
  };
}

function useTaskRepositoryAssignments() {
  const [repositoryAssignments, setRepositoryAssignments] =
    useState<TaskRepositoryAssignments>(readStoredTaskRepositoryAssignments);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      taskRepositoryAssignmentStorageKey,
      JSON.stringify(repositoryAssignments),
    );
  }, [repositoryAssignments]);

  function setTaskRepository(
    taskKey: string,
    repositoryFullName: string | null,
  ) {
    setRepositoryAssignments((current) => {
      const next = { ...current };
      if (repositoryFullName) next[taskKey] = repositoryFullName;
      else delete next[taskKey];
      return next;
    });
  }

  return { repositoryAssignments, setTaskRepository };
}

function useTaskProjectLinks() {
  const [projectRecord, setProjectRecord] = useState<ProjectRecord | null>(
    null,
  );
  const projectRecordRef = useRef<ProjectRecord | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      let nextRecord = readBrowserProjectRecord() ?? null;

      try {
        const response = await fetch("/api/projects", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          account?: unknown;
          record?: unknown;
        };
        const parsed = projectRecordSchema.safeParse(data.record);
        if (response.ok && data.account && parsed.success) {
          nextRecord = parsed.data;
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Project links are using local data.", error);
        }
      }

      if (controller.signal.aborted) return;
      projectRecordRef.current = nextRecord;
      setProjectRecord(nextRecord);
    }

    function applyProjectUpdate(event: Event) {
      const parsed = projectRecordSchema.safeParse(
        (event as CustomEvent<unknown>).detail,
      );
      if (!parsed.success) return;
      projectRecordRef.current = parsed.data;
      setProjectRecord(parsed.data);
    }

    void loadProjects();
    window.addEventListener(projectRecordUpdatedEvent, applyProjectUpdate);
    return () => {
      controller.abort();
      window.removeEventListener(projectRecordUpdatedEvent, applyProjectUpdate);
    };
  }, []);

  async function setTaskProject(taskId: string, projectId: string | null) {
    const current = projectRecordRef.current;
    if (!current) return;

    const taskAssignments = { ...current.store.taskAssignments };
    if (projectId) taskAssignments[taskId] = projectId;
    else delete taskAssignments[taskId];
    const nextRecord = projectRecordSchema.parse({
      ...current,
      store: { ...current.store, taskAssignments },
    });

    projectRecordRef.current = nextRecord;
    setProjectRecord(nextRecord);
    applyBrowserProjectRecord(nextRecord);

    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextRecord),
      });
    } catch (error) {
      console.warn("Project link account sync is unavailable.", error);
    }
  }

  return {
    projectAssignments: projectRecord?.store.taskAssignments ?? {},
    projects:
      projectRecord?.store.projects.filter((project) => !project.archived) ??
      [],
    setTaskProject,
  };
}

function readStoredTaskCategories() {
  if (typeof window === "undefined") return defaultTaskCategories;
  try {
    const saved = window.localStorage.getItem(taskCategoryStorageKey);
    if (!saved) return defaultTaskCategories;
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return defaultTaskCategories;
    return parsed.flatMap((item): TaskCategory[] => {
      if (
        !item ||
        typeof item !== "object" ||
        !("id" in item) ||
        typeof item.id !== "string" ||
        !("name" in item) ||
        typeof item.name !== "string" ||
        !("parentId" in item) ||
        (item.parentId !== null && typeof item.parentId !== "string")
      ) {
        return [];
      }
      const icon =
        "icon" in item && isTaskCategoryIconName(item.icon)
          ? item.icon
          : "folder";
      return [
        {
          icon,
          id: item.id,
          name: item.name,
          parentId: item.parentId,
        },
      ];
    });
  } catch {
    return defaultTaskCategories;
  }
}

function readStoredTaskArchive() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(taskArchiveStorageKey);
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function readStoredTaskRichDescriptions() {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(taskRichDescriptionStorageKey);
    const parsed = saved ? (JSON.parse(saved) as unknown) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        Boolean(
          value &&
          typeof value === "object" &&
          "type" in value &&
          value.type === "doc",
        ),
      ),
    ) as TaskRichDescriptions;
  } catch {
    return {};
  }
}

function readStoredTaskRepositoryAssignments(): TaskRepositoryAssignments {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(
      taskRepositoryAssignmentStorageKey,
    );
    const parsed = saved ? (JSON.parse(saved) as unknown) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([taskKey, repositoryFullName]) =>
          taskKey.length > 0 &&
          typeof repositoryFullName === "string" &&
          repositoryFullName.length > 0,
      ),
    ) as TaskRepositoryAssignments;
  } catch {
    return {};
  }
}

function isTaskCategoryIconName(value: unknown): value is TaskCategoryIconName {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(taskCategoryIconMap, value)
  );
}

function readStoredTaskCategoryAssignments() {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(taskCategoryAssignmentStorageKey);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string"),
    ) as TaskCategoryAssignments;
  } catch {
    return {};
  }
}

function readStoredTaskLayout() {
  if (typeof window === "undefined") return defaultTaskLayout;
  try {
    const saved = window.localStorage.getItem(taskLayoutStorageKey);
    if (!saved) return defaultTaskLayout;
    const parsed = JSON.parse(saved) as {
      calendarHeight?: unknown;
      railWidth?: unknown;
    };
    return {
      calendarHeight:
        typeof parsed.calendarHeight === "number"
          ? Math.min(420, Math.max(180, parsed.calendarHeight))
          : defaultTaskLayout.calendarHeight,
      railWidth:
        typeof parsed.railWidth === "number"
          ? Math.min(480, Math.max(240, parsed.railWidth))
          : defaultTaskLayout.railWidth,
    };
  } catch {
    return defaultTaskLayout;
  }
}

function flattenTaskCategories(
  categories: TaskCategory[],
  parentId: string | null = null,
  depth = 0,
  visited = new Set<string>(),
): Array<{ category: TaskCategory; depth: number }> {
  return categories
    .filter(
      (category) => category.parentId === parentId && !visited.has(category.id),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((category) => {
      const nextVisited = new Set(visited).add(category.id);
      return [
        { category, depth },
        ...flattenTaskCategories(
          categories,
          category.id,
          depth + 1,
          nextVisited,
        ),
      ];
    });
}

function taskCategoryPath(
  categories: TaskCategory[],
  categoryId?: string | null,
) {
  if (!categoryId) return [];
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: TaskCategory[] = [];
  const visited = new Set<string>();
  let currentId: string | null = categoryId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const category = byId.get(currentId);
    if (!category) break;
    path.unshift(category);
    currentId = category.parentId;
  }

  return path;
}

function taskCategoryDescendantIds(
  categories: TaskCategory[],
  categoryId: string,
) {
  const descendants: string[] = [];
  const pending = [categoryId];

  while (pending.length > 0) {
    const parentId = pending.shift();
    const children = categories.filter(
      (category) => category.parentId === parentId,
    );
    for (const child of children) {
      descendants.push(child.id);
      pending.push(child.id);
    }
  }

  return descendants;
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
      <DatePicker.Popover className="relay-themed-overlay rounded-2xl border border-separator bg-overlay p-3 shadow-overlay">
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
  actionLabel,
  icon: Icon,
  label,
  onAction,
  value,
}: {
  actionLabel?: string;
  icon: LucideIcon;
  label: string;
  onAction?: () => void;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-separator bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{value}</p>
        {onAction && actionLabel ? (
          <Button
            aria-label={actionLabel}
            className="h-7 w-7 shrink-0 rounded-lg border border-separator bg-surface p-0 text-muted hover:border-[var(--accent)] hover:bg-accent-soft hover:text-accent"
            onClick={onAction}
            title={actionLabel}
            type="button"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
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

function GoogleTaskListManagerModal({
  onClose,
  onMutate,
  onSelect,
  selectedTaskListId,
  taskListCounts,
  taskLists,
}: {
  onClose: () => void;
  onMutate: (body: Record<string, unknown>) => Promise<void>;
  onSelect: (taskListId: string) => void;
  selectedTaskListId: string;
  taskListCounts: Record<string, { pending: number; total: number }>;
  taskLists: Array<{ id?: string | null; title: string }>;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function mutate(body: Record<string, unknown>, busyKey: string) {
    setBusyId(busyKey);
    setStatus(null);
    try {
      await onMutate(body);
      setNewTitle("");
      setEditingId(null);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Task list could not be updated.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog
            className={`${panelClass} w-full max-w-xl animate-slide-up p-5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Google task lists</h3>
                <p className="mt-1 text-sm text-muted">
                  Select a list, or add, rename, and remove lists stored in
                  Google Tasks.
                </p>
              </div>
              <Button
                className={iconButtonClass}
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              className="mt-5 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (newTitle.trim()) {
                  void mutate(
                    { action: "create-list", title: newTitle.trim() },
                    "create",
                  );
                }
              }}
            >
              <Input
                aria-label="New task list name"
                className="h-10 min-w-0 flex-1 rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="New list name"
                value={newTitle}
              />
              <Button
                className={primaryButtonClass}
                disabled={!newTitle.trim() || busyId === "create"}
                type="submit"
              >
                {busyId === "create" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add list
              </Button>
            </form>

            <div className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {taskLists.map((taskList) => {
                const id = taskList.id ?? "@default";
                const counts = taskListCounts[id] ?? { pending: 0, total: 0 };
                const editing = editingId === id;
                return (
                  <div
                    className={`rounded-xl border p-3 ${
                      id === selectedTaskListId
                        ? "border-accent bg-accent-soft"
                        : "border-separator bg-surface-secondary"
                    }`}
                    key={id}
                  >
                    <div className="flex items-center gap-2">
                      {editing ? (
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-accent">
                            <ListTodo className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <Input
                              aria-label={`Rename ${taskList.title}`}
                              autoFocus
                              className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-sm"
                              onChange={(event) =>
                                setEditingTitle(event.target.value)
                              }
                              value={editingTitle}
                            />
                            <p className="mt-0.5 text-[10px] text-muted">
                              <span className="font-semibold text-foreground">
                                {counts.pending}
                              </span>{" "}
                              pending
                              {" · "}
                              <span className="font-semibold text-foreground">
                                {counts.total}
                              </span>{" "}
                              total
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          onClick={() => onSelect(id)}
                          type="button"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-accent">
                            <ListTodo className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {taskList.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-muted">
                              <span className="font-semibold text-foreground">
                                {counts.pending}
                              </span>{" "}
                              pending
                              {" · "}
                              <span className="font-semibold text-foreground">
                                {counts.total}
                              </span>{" "}
                              total
                            </span>
                          </span>
                          {id === selectedTaskListId ? (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </button>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        {editing ? (
                          <>
                            <Button
                              aria-label={`Save ${taskList.title}`}
                              className="h-8 w-8 rounded-lg p-0"
                              disabled={!editingTitle.trim() || busyId === id}
                              onClick={() =>
                                void mutate(
                                  {
                                    action: "rename-list",
                                    id,
                                    title: editingTitle.trim(),
                                  },
                                  id,
                                )
                              }
                              type="button"
                              variant="ghost"
                            >
                              {busyId === id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              aria-label="Cancel rename"
                              className="h-8 w-8 rounded-lg p-0"
                              onClick={() => setEditingId(null)}
                              type="button"
                              variant="ghost"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              aria-label={`Rename ${taskList.title}`}
                              className="h-8 w-8 rounded-lg p-0"
                              onClick={() => {
                                setEditingId(id);
                                setEditingTitle(taskList.title);
                              }}
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              aria-label={`Delete ${taskList.title}`}
                              className="h-8 w-8 rounded-lg p-0 text-muted hover:bg-danger-soft hover:text-danger"
                              disabled={taskLists.length <= 1 || busyId === id}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete “${taskList.title}” and all ${counts.total} tasks in it? This cannot be undone.`,
                                  )
                                ) {
                                  void mutate(
                                    { action: "delete-list", id },
                                    id,
                                  );
                                }
                              }}
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {status ? (
              <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                {status}
              </p>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function GoogleTaskCreationModal({
  initialTaskListId,
  onClose,
  onCreate,
  projects,
  repositories,
  taskLists,
}: {
  initialTaskListId: string;
  onClose: () => void;
  onCreate: (input: GoogleTaskInput) => Promise<void>;
  projects: RelayProject[];
  repositories: GithubRepository[];
  taskLists: Array<{ id?: string | null; title: string }>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [richDescription, setRichDescription] =
    useState<TaskRichDocument | null>(null);
  const [due, setDue] = useState<DateValue | null>(null);
  const [priority, setPriority] = useState<GoogleTaskPriority>("medium");
  const [taskListId, setTaskListId] = useState(initialTaskListId);
  const [projectId, setProjectId] = useState("none");
  const [repositoryFullName, setRepositoryFullName] = useState("none");
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
        projectId: projectId === "none" ? null : projectId,
        repositoryFullName:
          repositoryFullName === "none" ? null : repositoryFullName,
        richDescription,
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

              <div className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted">
                  Description
                </span>
                <TaskRichTextEditor
                  fallbackText={notes}
                  onChange={(document, plainText) => {
                    setRichDescription(document);
                    setNotes(plainText);
                  }}
                />
              </div>

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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Relay project
                  </span>
                  <Select
                    aria-label="Link to Relay project"
                    className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) => setProjectId(event.target.value)}
                    value={projectId}
                  >
                    <option value="none">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase text-muted">
                    GitHub repository
                  </span>
                  <Select
                    aria-label="Link to GitHub repository"
                    className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-[var(--accent)]"
                    onChange={(event) =>
                      setRepositoryFullName(event.target.value)
                    }
                    value={repositoryFullName}
                  >
                    <option value="none">No repository</option>
                    {repositories.map((repository) => (
                      <option key={repository.id} value={repository.fullName}>
                        {repository.fullName}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
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
  briefing,
  initialTaskKey,
  repositories,
  repositoryAssignments,
  refreshWorkspace,
  setTaskRepository,
}: {
  briefing: Briefing | null;
  initialTaskKey: string | null;
  repositories: GithubRepository[];
  repositoryAssignments: TaskRepositoryAssignments;
  refreshWorkspace: () => Promise<void>;
  setTaskRepository: (
    taskKey: string,
    repositoryFullName: string | null,
  ) => void;
}) {
  return (
    <TaskMasterDetailView
      briefing={briefing}
      initialTaskKey={initialTaskKey}
      repositories={repositories}
      repositoryAssignments={repositoryAssignments}
      refreshWorkspace={refreshWorkspace}
      setTaskRepository={setTaskRepository}
    />
  );
}

function FilesWorkspaceView({ briefing }: { briefing: Briefing | null }) {
  const gmailFiles = useMemo<DriveFile[]>(
    () =>
      (briefing?.gmail?.messages ?? []).flatMap((message) =>
        (message.attachments ?? []).map((attachment, index) => ({
          appProperties: {
            attachmentId: attachment.attachmentId ?? "",
            attachmentMimeType: attachment.mimeType,
            gmailMessageId: message.id ?? "",
            gmailSubject: message.subject || "No subject",
            source: "gmail",
          },
          id: `gmail:${message.id ?? message.threadId ?? "message"}:${attachment.attachmentId ?? index}`,
          mimeType: attachment.mimeType,
          modifiedTime: message.date,
          name: attachment.filename,
          owner: message.from ?? "Unknown sender",
          size: attachment.size,
          webViewLink: message.threadId
            ? `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(message.threadId)}`
            : null,
        })),
      ),
    [briefing?.gmail?.messages],
  );
  const initialFiles = useMemo(
    () => [...(briefing?.drive.files ?? []), ...gmailFiles],
    [briefing?.drive.files, gmailFiles],
  );
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<DriveFileFilter>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "type">("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const fileFiltersRef = useRef<HTMLDivElement>(null);
  const files = searchResults ?? initialFiles;
  const organizedFiles = useMemo(() => {
    const filtered =
      typeFilter === "all"
        ? files
        : files.filter((file) => driveFileKind(file) === typeFilter);

    return [...filtered].sort((left, right) => {
      if (sortBy === "name") return left.name.localeCompare(right.name);
      if (sortBy === "type") {
        return driveFileType(left).localeCompare(driveFileType(right));
      }

      return (
        new Date(right.modifiedTime ?? 0).getTime() -
        new Date(left.modifiedTime ?? 0).getTime()
      );
    });
  }, [files, sortBy, typeFilter]);
  const selectedFile =
    organizedFiles.find((file) => (file.id ?? file.name) === selectedFileId) ??
    organizedFiles[0] ??
    null;
  const filtersActive = typeFilter !== "all" || sortBy !== "recent";

  useEffect(() => {
    if (!filtersOpen) return;

    function closeFilters(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !fileFiltersRef.current?.contains(event.target)
      ) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeFilters);
    return () => document.removeEventListener("pointerdown", closeFilters);
  }, [filtersOpen]);

  async function searchFiles() {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/google/drive/files${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        files: DriveFile[];
      };
      const normalizedQuery = query.trim().toLowerCase();
      const matchingGmailFiles = gmailFiles.filter((file) =>
        `${file.name} ${file.owner ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      );
      const nextFiles = [...(data.files ?? []), ...matchingGmailFiles];
      setSearchResults(nextFiles);
      setSelectedFileId(
        nextFiles[0] ? (nextFiles[0].id ?? nextFiles[0].name) : null,
      );
      if (!response.ok || !data.ok) {
        setStatus(data.reason ?? "Drive search failed.");
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Drive search failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="files-page flex h-full min-h-0 flex-col gap-4 animate-fade-in">
      <section className={`${panelClass} relative z-40 shrink-0 p-4`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="min-w-0 xl:w-64 xl:shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Files</h1>
              <span
                className={`h-2 w-2 rounded-full ${
                  briefing?.google.connected ? "bg-success" : "bg-muted"
                }`}
              />
            </div>
            <p className="mt-1 truncate text-sm text-muted">
              {briefing?.google.connected
                ? `${files.length} recent Workspace items`
                : "Connect Google to browse files"}
            </p>
          </div>

          <form
            className="file-search-control flex h-11 min-w-0 flex-1 items-center rounded-xl border border-separator bg-surface-secondary transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-soft"
            onSubmit={(event) => {
              event.preventDefault();
              void searchFiles();
            }}
          >
            <input
              aria-label="Search files"
              className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground outline-none placeholder:text-muted"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files, attachments, or senders"
              value={query}
            />
            {searchResults ? (
              <button
                aria-label="Clear file search"
                className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-tertiary hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  setSearchResults(null);
                  setStatus(null);
                }}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <Button
              aria-label="Search files"
              className="mr-1 h-9 w-9 shrink-0 rounded-lg bg-accent p-0 text-accent-foreground hover:bg-accent-hover"
              disabled={loading}
              title="Search files"
              type="submit"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="relative shrink-0" ref={fileFiltersRef}>
            <Button
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? "Close file filters" : "Filter files"}
              className={`task-filter-trigger relative h-10 w-10 p-0 ${
                filtersOpen ? "is-expanded" : ""
              }`}
              onClick={() => setFiltersOpen((current) => !current)}
              title="Filter files"
              type="button"
              variant="secondary"
            >
              <Filter className="h-4 w-4" />
              {filtersActive ? (
                <span
                  aria-hidden="true"
                  className="task-filter-active-dot absolute right-1.5 top-1.5"
                />
              ) : null}
            </Button>
            {filtersOpen ? (
              <div className="file-filter-popover task-filter-strip absolute right-0 top-[calc(100%+0.55rem)] z-[100] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-separator p-3 shadow-overlay">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      File filters
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Showing {organizedFiles.length} of {files.length}
                    </p>
                  </div>
                  {filtersActive ? (
                    <Button
                      className="h-7 px-2 text-[11px] text-muted"
                      onClick={() => {
                        setTypeFilter("all");
                        setSortBy("recent");
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Select
                    aria-label="Filter files by source or type"
                    className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-xs"
                    onChange={(event) =>
                      setTypeFilter(event.target.value as DriveFileFilter)
                    }
                    value={typeFilter}
                  >
                    <option value="all">All sources and types</option>
                    {workspaceFileKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {driveFileKindMeta[kind].label}
                      </option>
                    ))}
                    {storageFileKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {driveFileKindMeta[kind].label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Sort files"
                    className="h-9 w-full rounded-lg border border-separator bg-surface px-2.5 text-xs"
                    onChange={(event) =>
                      setSortBy(
                        event.target.value as "recent" | "name" | "type",
                      )
                    }
                    value={sortBy}
                  >
                    <option value="recent">Recently modified</option>
                    <option value="name">Name A–Z</option>
                    <option value="type">File type</option>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="relative z-0 grid min-h-0 flex-1 grid-rows-[minmax(0,0.65fr)_minmax(0,1.45fr)_minmax(0,0.9fr)] gap-4 lg:grid-cols-[230px_minmax(0,1fr)_320px] lg:grid-rows-1 2xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <section
          className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-separator px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Browse by source</h2>
              <p className="mt-0.5 text-xs text-muted">
                Apps and Drive storage
              </p>
            </div>
            <FolderTree className="h-4 w-4 text-accent" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <FileSourceTree
              files={files}
              onSelect={setTypeFilter}
              selected={typeFilter}
            />
          </div>
        </section>

        <section
          className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-separator px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {typeFilter === "all"
                  ? "All files"
                  : driveFileKindMeta[typeFilter].label}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {organizedFiles.length}{" "}
                {organizedFiles.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {status ? (
              <p className="m-3 rounded-lg border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
                {status}
              </p>
            ) : null}
            {organizedFiles.length > 0 ? (
              <table className="w-full min-w-[620px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-16" />
                  <col />
                  <col className="w-[180px]" />
                  <col className="w-[126px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-surface-secondary">
                  <tr className="border-b border-separator">
                    <th aria-label="File icon" className="px-4 py-2" />
                    <th
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.13em] text-muted"
                      scope="col"
                    >
                      Name
                    </th>
                    <th
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.13em] text-muted"
                      scope="col"
                    >
                      Source / type
                    </th>
                    <th
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.13em] text-muted"
                      scope="col"
                    >
                      Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizedFiles.map((file) => (
                    <tr
                      aria-label={`Select ${file.name}`}
                      aria-selected={selectedFile === file}
                      className={`file-browser-row cursor-pointer border-b border-separator text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                        selectedFile === file
                          ? "is-selected bg-accent-soft"
                          : "bg-surface hover:bg-surface-secondary"
                      }`}
                      key={file.id ?? file.name}
                      onClick={() => setSelectedFileId(file.id ?? file.name)}
                      onDoubleClick={() => {
                        const destination = driveFileDestination(file);
                        if (destination.href) {
                          window.open(
                            destination.href,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedFileId(file.id ?? file.name);
                        }
                      }}
                      tabIndex={0}
                      title={`Select ${file.name}. Double-click to open.`}
                    >
                      <td
                        className={`border-l-[3px] px-4 py-3 ${
                          selectedFile === file
                            ? "border-l-accent"
                            : "border-l-transparent"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-xl ${driveFileKindMeta[driveFileKind(file)].badgeClass}`}
                        >
                          <DriveFileGlyph className="h-4.5 w-4.5" file={file} />
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-3 align-middle">
                        <span className="block truncate text-sm font-semibold">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                          {file.owner ?? "Unknown owner"}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <FileTypeBadge file={file} />
                      </td>
                      <td className="px-3 py-3 align-middle text-xs font-normal text-muted">
                        {formatFileTime(file.modifiedTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <EmptyState
                  detail={
                    files.length > 0
                      ? "Choose another branch in the file tree."
                      : (status ??
                        briefing?.drive.reason ??
                        "Search Drive or connect Google.")
                  }
                  icon={FolderOpen}
                  title={
                    files.length > 0
                      ? "No files in this source"
                      : briefing?.google.connected
                        ? "No Drive files found"
                        : "Drive not connected"
                  }
                />
              </div>
            )}
          </div>
        </section>

        <section
          className={`${panelClass} flex min-h-0 flex-col overflow-hidden`}
        >
          <div className="shrink-0 border-b border-separator px-4 py-3">
            <h2 className="text-sm font-semibold">File details</h2>
            <p className="mt-0.5 text-xs text-muted">
              Source, route, and file context
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {selectedFile ? (
              <FilesWorkspacePreview file={selectedFile} />
            ) : (
              <EmptyState
                detail="Select a file to see its actions."
                icon={FileText}
                title="No file selected"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const workspaceFileKinds: DriveFileKind[] = [
  "sheets",
  "docs",
  "slides",
  "aistudio",
  "gmail",
];

const storageFileKinds: DriveFileKind[] = ["folder", "pdf", "image", "drive"];

function FileSourceTree({
  files,
  onSelect,
  selected,
}: {
  files: DriveFile[];
  onSelect: (filter: DriveFileFilter) => void;
  selected: DriveFileFilter;
}) {
  function countFor(kind: DriveFileKind) {
    return files.filter((file) => driveFileKind(file) === kind).length;
  }

  return (
    <TreeProvider
      defaultExpandedIds={["workspace-apps", "drive-storage"]}
      indent={20}
      onSelectionChange={(selectedIds) => {
        const next = selectedIds[0];
        if (
          next === "all" ||
          workspaceFileKinds.includes(next as DriveFileKind) ||
          storageFileKinds.includes(next as DriveFileKind)
        ) {
          onSelect(next as DriveFileFilter);
        }
      }}
      selectedIds={[selected]}
      showLines
    >
      <TreeView className="p-0">
        <TreeNode isLast={false} nodeId="all">
          <TreeNodeTrigger className="py-2">
            <TreeExpander hasChildren={false} />
            <TreeIcon
              hasChildren={false}
              icon={<FolderOpen className="h-4 w-4 text-accent" />}
            />
            <TreeLabel>All files</TreeLabel>
            <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-semibold text-muted">
              {files.length}
            </span>
          </TreeNodeTrigger>
        </TreeNode>

        <TreeNode isLast={false} nodeId="workspace-apps">
          <TreeNodeTrigger className="py-2">
            <TreeExpander hasChildren />
            <TreeIcon
              hasChildren
              icon={<Sparkles className="h-4 w-4 text-violet-500" />}
            />
            <TreeLabel>Workspace apps</TreeLabel>
          </TreeNodeTrigger>
          <TreeNodeContent hasChildren>
            {workspaceFileKinds.map((kind, index) => (
              <FileSourceTreeLeaf
                count={countFor(kind)}
                isLast={index === workspaceFileKinds.length - 1}
                key={kind}
                kind={kind}
              />
            ))}
          </TreeNodeContent>
        </TreeNode>

        <TreeNode isLast nodeId="drive-storage">
          <TreeNodeTrigger className="py-2">
            <TreeExpander hasChildren />
            <TreeIcon
              hasChildren
              icon={<Cloud className="h-4 w-4 text-sky-500" />}
            />
            <TreeLabel>Drive storage</TreeLabel>
          </TreeNodeTrigger>
          <TreeNodeContent hasChildren>
            {storageFileKinds.map((kind, index) => (
              <FileSourceTreeLeaf
                count={countFor(kind)}
                isLast={index === storageFileKinds.length - 1}
                key={kind}
                kind={kind}
              />
            ))}
          </TreeNodeContent>
        </TreeNode>
      </TreeView>
    </TreeProvider>
  );
}

function FileSourceTreeLeaf({
  count,
  isLast,
  kind,
}: {
  count: number;
  isLast: boolean;
  kind: DriveFileKind;
}) {
  const meta = driveFileKindMeta[kind];
  const Glyph = meta.icon;

  return (
    <TreeNode isLast={isLast} level={1} nodeId={kind}>
      <TreeNodeTrigger className="py-1.5">
        <TreeExpander hasChildren={false} />
        <TreeIcon hasChildren={false} icon={<Glyph className="h-4 w-4" />} />
        <TreeLabel>{meta.label}</TreeLabel>
        <span className="text-[10px] font-semibold tabular-nums text-muted">
          {count}
        </span>
      </TreeNodeTrigger>
    </TreeNode>
  );
}

function FilesWorkspacePreview({ file }: { file: DriveFile }) {
  const kind = driveFileKind(file);
  const meta = driveFileKindMeta[kind];
  const destination = driveFileDestination(file);
  const openBehavior = driveFileOpenBehavior(file);
  const sourceContext =
    kind === "gmail" && file.appProperties?.gmailSubject
      ? `Attached to "${file.appProperties.gmailSubject}"`
      : kind === "folder"
        ? "A folder in your Drive workspace"
        : `Stored in ${meta.label}`;
  const downloadUrl =
    file.id &&
    !file.mimeType.includes("application/vnd.google-apps") &&
    kind !== "aistudio" &&
    kind !== "folder" &&
    kind !== "gmail"
      ? `https://drive.google.com/uc?id=${encodeURIComponent(file.id)}&export=download`
      : null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="rounded-2xl border border-separator bg-surface-secondary p-4">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${meta.badgeClass}`}
          >
            <DriveFileGlyph className="h-5 w-5" file={file} />
          </span>
          <div className="min-w-0 flex-1">
            <FileTypeBadge file={file} />
            <h3 className="mt-2 break-words text-base font-semibold leading-6">
              {file.name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">{sourceContext}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-separator bg-surface-secondary p-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent-soft text-accent">
            <ExternalLink className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">
              Opens with
            </p>
            <p className="mt-1 text-sm font-semibold">{openBehavior.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {openBehavior.detail}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FileDetailMetric
          label={kind === "gmail" ? "From" : "Owner"}
          value={file.owner ?? "Unknown"}
        />
        <FileDetailMetric label="Format" value={driveFileFormat(file)} />
        <FileDetailMetric
          label="Modified"
          value={formatFileTime(file.modifiedTime)}
        />
        <FileDetailMetric label="Size" value={formatFileSize(file.size)} />
      </div>

      <div
        className={`grid gap-2 ${
          downloadUrl
            ? "grid-cols-3"
            : destination.href
              ? "grid-cols-2"
              : "grid-cols-1"
        }`}
      >
        {destination.href ? (
          <Link
            aria-label={destination.label}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-2 text-xs font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover"
            href={destination.href}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Link>
        ) : (
          <Button
            className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-2 text-xs font-semibold text-accent-foreground"
            isDisabled
            type="button"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        )}
        {destination.href ? (
          <Button
            className="interactive-control inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-separator bg-surface-secondary px-2 text-xs font-semibold text-foreground transition hover:border-border-secondary hover:bg-surface-tertiary"
            onClick={() => {
              void navigator.clipboard
                .writeText(destination.href ?? "")
                .then(() =>
                  toast.success("Link copied", { description: file.name }),
                )
                .catch(() =>
                  toast.warning("Link could not be copied", {
                    description: "Open the file and copy its URL instead.",
                  }),
                );
            }}
            type="button"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </Button>
        ) : null}
        {downloadUrl ? (
          <Link
            className="interactive-control inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-separator bg-surface-secondary px-2 text-xs font-semibold text-foreground transition hover:border-border-secondary hover:bg-surface-tertiary"
            href={downloadUrl}
            rel="noreferrer"
            target="_blank"
          >
            <UploadCloud className="h-4 w-4 rotate-180" />
            Download
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function FileDetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-separator bg-surface-secondary px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-foreground">
        {value}
      </p>
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
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {note.body}
                </p>
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
  addMemory,
  aiStatus,
  connectGithub,
  connectGoogle,
  disconnectGithub,
  disconnectGoogle,
  githubConfigured,
  googleConfigured,
  notes,
  oauthStatus,
  setTheme,
  signedInToGithub,
  signedInToGoogle,
  theme,
}: {
  addMemory: (body: string) => Promise<void>;
  aiStatus: AiStatus | null;
  connectGithub: () => void;
  connectGoogle: () => void;
  disconnectGithub: () => void;
  disconnectGoogle: () => void;
  githubConfigured: boolean;
  googleConfigured: boolean;
  notes: RelayNote[];
  oauthStatus: OAuthStatus | null;
  setTheme: (theme: ThemeMode) => void;
  signedInToGithub: boolean;
  signedInToGoogle: boolean;
  theme: ThemeMode;
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
    <div className="space-y-7 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Workspace configuration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Manage your AI provider, security posture, and connected services in
          one place.
        </p>
      </div>

      <section
        aria-labelledby="appearance-settings-title"
        className={`${panelClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h2
              className="text-lg font-semibold"
              id="appearance-settings-title"
            >
              Appearance
            </h2>
            <p className="mt-1 text-sm text-muted">
              {theme === "dark" ? "Dark theme" : "Light theme"} is active.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-separator bg-surface-secondary px-3 py-2 sm:justify-start">
          <span className="text-sm font-semibold text-foreground">
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </span>
          <AnimatedThemeToggler
            className="border border-separator bg-surface text-muted shadow-surface hover:text-foreground"
            duration={500}
            onThemeChange={setTheme}
            theme={theme}
            variant="circle"
          />
        </div>
      </section>

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
            <SettingRow
              label="Regional fallback"
              value="Gemini when available"
            />
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
                oauthStatus?.hasDirectGoogleToken
                  ? "Connected"
                  : "Not connected"
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

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Connections
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Integrations
          </h2>
          <p className="mt-2 text-sm text-muted">
            Connect the services Relay can read from and act on.
          </p>
        </div>
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
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Personalization
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Memory</h2>
          <p className="mt-2 text-sm text-muted">
            Review and add the context Relay may remember across conversations.
          </p>
        </div>
        <MemoryView addMemory={addMemory} notes={notes} />
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
  const files = (briefing?.drive.files ?? []).slice(0, 4);

  return (
    <section className={`${panelClass} p-5`}>
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
                  <DriveFileGlyph className="h-5 w-5" file={file} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {driveFileType(file)} by {file.owner ?? "Unknown owner"}
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

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <BrandSymbol />
      <div>
        <p className="brand-wordmark text-base font-semibold leading-5">
          Relay
        </p>
        <p className="text-xs text-muted">Personal Workspace</p>
      </div>
    </div>
  );
}

function BrandSymbol({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand-symbol grid shrink-0 place-items-center transition-[width,height] duration-300 ${
        compact ? "h-9 w-9" : "h-11 w-11"
      }`}
    >
      <Image
        alt=""
        aria-hidden="true"
        className={`brand-symbol-image object-contain transition-transform duration-300 ${
          compact ? "h-8 w-8 scale-90" : "h-11 w-11 scale-100"
        }`}
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
        className="auth-input h-11 w-full rounded-xl px-3 text-sm outline-none transition placeholder:text-muted"
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
      className="inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold"
      color={priorityColor(priority)}
      size="sm"
      variant="soft"
    >
      {priorityLabel(priority)}
    </Chip>
  );
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

function formatRemainingDueDays(value?: string | null) {
  if (!value) return "No due date";

  const dateOnly = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = match
    ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : (() => {
        const parsed = parseEventDate(value);
        return parsed
          ? Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
          : Number.NaN;
      })();

  if (Number.isNaN(due)) return "No due date";
  const remainingDays = Math.round((due - today) / 86_400_000);
  if (remainingDays === 0) return "Today";
  if (remainingDays === 1) return "1 day left";
  if (remainingDays > 1) return `${remainingDays} days left`;
  if (remainingDays === -1) return "1 day overdue";
  return `${Math.abs(remainingDays)} days overdue`;
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

function inferExecutionTrace(messages: Message[]) {
  const latestMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latest = latestMessage
    ? relayMessageText(latestMessage).toLowerCase()
    : "";

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

function parseDeadlineDate(value?: string | null) {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
        12,
      )
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDayNumber(date: Date) {
  return Math.round(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

function buildCalendarDeadlines(
  projectData: CalendarProjectData,
  tasks: RelayTask[],
) {
  const projectsById = new Map(
    projectData.projects.map((project) => [project.id, project]),
  );
  const deadlines: CalendarDeadline[] = [];

  for (const project of projectData.projects) {
    const date = parseDeadlineDate(project.dueDate);
    if (!date || project.archived) continue;
    deadlines.push({
      color: project.color,
      completed: project.status === "completed",
      date,
      id: `project:${project.id}`,
      kind: "project",
      projectId: project.id,
      projectName: project.name,
      sourceTask: null,
      title: project.name,
    });
  }

  for (const task of tasks) {
    const date = parseDeadlineDate(task.due);
    if (!date) continue;
    const projectId = projectData.taskAssignments[task.id] ?? null;
    const project = projectId ? projectsById.get(projectId) : null;
    deadlines.push({
      color: project?.color ?? "var(--accent)",
      completed: task.completed,
      date,
      id: `task:${task.id}`,
      kind: "task",
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      sourceTask: task,
      title: task.title,
    });
  }

  for (const task of projectData.localTasks) {
    const date = parseDeadlineDate(task.dueDate);
    if (!date) continue;
    const project = projectsById.get(task.projectId);
    deadlines.push({
      color: project?.color ?? "var(--accent)",
      completed: task.completed,
      date,
      id: `local-task:${task.id}`,
      kind: "task",
      projectId: project?.id ?? task.projectId,
      projectName: project?.name ?? null,
      sourceTask: null,
      title: task.title,
    });
  }

  return deadlines.sort((left, right) => {
    const dateDifference = left.date.getTime() - right.date.getTime();
    if (dateDifference) return dateDifference;
    if (left.kind !== right.kind) return left.kind === "project" ? -1 : 1;
    return left.title.localeCompare(right.title);
  });
}

function buildMonthIntervalHighlights(
  monthDays: Date[],
  deadlines: CalendarDeadline[],
) {
  const highlightsByDay = new Map<number, MonthIntervalHighlight[]>();
  const projects = new Map(
    deadlines
      .filter(
        (deadline): deadline is CalendarDeadline & { projectId: string } =>
          deadline.kind === "project" && Boolean(deadline.projectId),
      )
      .map((deadline) => [deadline.projectId, deadline]),
  );
  const visibleDays = monthDays.map((day) => calendarDayNumber(day));

  for (const task of deadlines) {
    if (task.kind !== "task" || task.completed || !task.projectId) continue;
    const project = projects.get(task.projectId);
    if (!project) continue;
    const taskDay = calendarDayNumber(task.date);
    const projectDay = calendarDayNumber(project.date);
    const rangeStart = Math.min(taskDay, projectDay);
    const rangeEnd = Math.max(taskDay, projectDay);

    for (const dayNumber of visibleDays) {
      if (dayNumber < rangeStart || dayNumber > rangeEnd) continue;
      const dayHighlights = highlightsByDay.get(dayNumber) ?? [];
      const existing = dayHighlights.find(
        (highlight) => highlight.id === project.id,
      );
      if (existing) {
        if (!existing.taskTitles.includes(task.title)) {
          existing.taskTitles.push(task.title);
        }
      } else {
        dayHighlights.push({
          color: project.color,
          id: project.id,
          projectName: project.title,
          taskTitles: [task.title],
        });
        dayHighlights.sort((left, right) =>
          left.projectName.localeCompare(right.projectName),
        );
        highlightsByDay.set(dayNumber, dayHighlights);
      }
    }
  }

  return highlightsByDay;
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
