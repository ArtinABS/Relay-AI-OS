import {
  CalendarDays,
  Calculator,
  Database,
  FileText,
  GitBranch,
  ListTodo,
  Mail,
  ShieldCheck,
  StickyNote,
  Table2,
  Video,
} from "lucide-react";

export const toolCatalog = [
  {
    name: "Daily briefing",
    status: "ready",
    icon: CalendarDays,
    detail: "Plan the day from calendar, tasks, notes, and recent workspace activity.",
  },
  {
    name: "Tasks",
    status: "ready",
    icon: ListTodo,
    detail: "Create, list, complete, and clear local tasks without an API key.",
  },
  {
    name: "Notes",
    status: "ready",
    icon: StickyNote,
    detail: "Store and search local notes that persist across server restarts.",
  },
  {
    name: "Calculator",
    status: "ready",
    icon: Calculator,
    detail: "Evaluate safe arithmetic expressions directly in the local agent.",
  },
  {
    name: "Calendar",
    status: "google-auth",
    icon: CalendarDays,
    detail: "Read, create, update, and cancel events with approval gates.",
  },
  {
    name: "Drive and Docs",
    status: "google-auth",
    icon: FileText,
    detail: "Search, summarize, organize, draft, and update documents.",
  },
  {
    name: "Sheets",
    status: "google-auth",
    icon: Table2,
    detail: "Read ranges, update tables, generate formulas, and produce charts.",
  },
  {
    name: "Gmail",
    status: "approval-required",
    icon: Mail,
    detail: "Draft, classify, summarize, and send email only after confirmation.",
  },
  {
    name: "GitHub",
    status: "approval-required",
    icon: GitBranch,
    detail: "Read repositories, issues, and pull requests. Creating issues or comments requires approval.",
  },
  {
    name: "Meet",
    status: "google-auth",
    icon: Video,
    detail: "Create meetings and inspect recordings, transcripts, and participants.",
  },
  {
    name: "Memory",
    status: "database",
    icon: Database,
    detail: "Store durable preferences, tasks, approvals, run logs, and audit trails.",
  },
  {
    name: "Approvals",
    status: "ready",
    icon: ShieldCheck,
    detail: "Require human confirmation before high-impact actions are executed.",
  },
] as const;

export type ToolCatalogItem = (typeof toolCatalog)[number];
