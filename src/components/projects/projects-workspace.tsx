"use client";

import { Calendar, DateField, DatePicker, Label, Tabs } from "@heroui/react";
import { parseDate, type DateValue } from "@internationalized/date";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Code2,
  Dumbbell,
  ExternalLink,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderTree,
  GitBranch,
  Globe2,
  GripVertical,
  Home,
  Heart,
  Inbox,
  Lightbulb,
  Link2,
  Loader2,
  Milestone,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Pencil,
  Plus,
  Plane,
  Rocket,
  Search,
  Sparkles,
  Star,
  ShoppingBag,
  Target,
  Trash2,
  Unlink,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultGithubWorkspaceLayout,
  GithubRepositoryExplorer,
} from "@/components/github/github-repository-explorer";
import { Button, Input, Select } from "@/components/ui/relay-ui";
import { RichTextEditor } from "@/components/ui/task-rich-text-editor";
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
import {
  projectRecordSchema,
  projectRecordUpdatedEvent,
} from "@/lib/projects/model";

type ProjectStatus = "planning" | "active" | "on-hold" | "completed";
type ProjectPriority = "low" | "medium" | "high";
type ProjectNoteSection = "brief" | "research" | "decisions" | "updates";
type ProjectCategoryIconName =
  | "book"
  | "briefcase"
  | "code"
  | "fitness"
  | "folder"
  | "globe"
  | "heart"
  | "home"
  | "palette"
  | "plane"
  | "rocket"
  | "shopping"
  | "sparkles"
  | "target"
  | "users";

export type ProjectTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  due?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
  taskListId?: string | null;
  taskListTitle?: string | null;
};

export type ProjectRepository = {
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

type ProjectRepositoryTask = {
  completed?: string | null;
  due?: string | null;
  id?: string | null;
  repositoryFullName?: string | null;
  status?: string | null;
  taskListTitle?: string | null;
  title: string;
  updated?: string | null;
};

type Project = {
  id: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  categoryId: string | null;
  dueDate: string | null;
  color: string;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProjectCategory = {
  id: string;
  icon: ProjectCategoryIconName;
  name: string;
  parentId: string | null;
};

type ProjectNote = {
  id: string;
  projectId: string;
  section: ProjectNoteSection;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type LocalProjectTask = {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: ProjectPriority;
  createdAt: string;
};

type ProjectMilestoneStatus = "planned" | "in-progress" | "completed";

type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: ProjectMilestoneStatus;
  createdAt: string;
  updatedAt: string;
};

type ProjectStore = {
  projects: Project[];
  categories: ProjectCategory[];
  notes: ProjectNote[];
  localTasks: LocalProjectTask[];
  taskAssignments: Record<string, string>;
  repositoryAssignments: Record<string, string[]>;
  milestones: ProjectMilestone[];
};

type ProjectDraft = Pick<
  Project,
  | "name"
  | "summary"
  | "status"
  | "priority"
  | "categoryId"
  | "dueDate"
  | "color"
>;

type ProjectTab = "overview" | "roadmap" | "tasks" | "notes" | "repositories";

const projectStorageKey = "relay.projects.v1";
const projectLayoutStorageKey = "relay.project-layout.v1";
const defaultProjectLayout = {
  calendarExpanded: true,
  calendarHeight: 210,
  categoryWidth: 210,
  projectRailWidth: 270,
};

function projectColumnShare(value: number, defaultValue: number) {
  return (value / defaultValue) * 20;
}

const projectColors = [
  "#20c8e8",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#7c9cff",
  "#6366f1",
  "#b18cff",
  "#d946ef",
  "#ec4899",
  "#4fd1a1",
  "#f0a45d",
  "#f97316",
  "#ee7183",
  "#ef4444",
  "#64748b",
];
const defaultCategories: ProjectCategory[] = [
  { id: "work", icon: "briefcase", name: "Work", parentId: null },
  { id: "work-internal", icon: "target", name: "Internal", parentId: "work" },
  { id: "personal", icon: "home", name: "Personal", parentId: null },
];
const emptyStore: ProjectStore = {
  projects: [],
  categories: defaultCategories,
  notes: [],
  localTasks: [],
  taskAssignments: {},
  repositoryAssignments: {},
  milestones: [],
};

const statusMeta: Record<ProjectStatus, { label: string; className: string }> =
  {
    planning: {
      label: "Planning",
      className: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
    },
    active: { label: "Active", className: "bg-accent-soft text-accent" },
    "on-hold": { label: "On hold", className: "bg-warning-soft text-warning" },
    completed: {
      label: "Completed",
      className: "bg-success-soft text-success",
    },
  };

const projectCategoryIconMap: Record<ProjectCategoryIconName, LucideIcon> = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  code: Code2,
  fitness: Dumbbell,
  folder: Folder,
  globe: Globe2,
  heart: Heart,
  home: Home,
  palette: Palette,
  plane: Plane,
  rocket: Rocket,
  shopping: ShoppingBag,
  sparkles: Sparkles,
  target: Target,
  users: Users,
};

const projectCategoryIconLabels: Record<ProjectCategoryIconName, string> = {
  book: "Learn",
  briefcase: "Work",
  code: "Build",
  fitness: "Fitness",
  folder: "General",
  globe: "World",
  heart: "Personal",
  home: "Home",
  palette: "Creative",
  plane: "Travel",
  rocket: "Launch",
  shopping: "Shopping",
  sparkles: "Ideas",
  target: "Goals",
  users: "Team",
};

const projectTabsListClassName = [
  "mx-4 my-3 min-w-max rounded-xl border border-accent/10 bg-accent-soft/30 p-1",
  "**:data-[slot=tabs-tab]:rounded-lg",
  "**:data-[slot=tabs-tab]:bg-transparent",
  "**:data-[slot=tabs-tab]:text-muted",
  "**:data-[slot=tabs-tab]:opacity-100",
  "**:data-[slot=tabs-tab]:transition-colors",
  "**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:bg-accent-soft",
  "**:data-[slot=tabs-tab]:data-[selected=true]:font-medium",
  "**:data-[slot=tabs-tab]:data-[selected=true]:text-accent-foreground",
  "**:data-[slot=tabs-tab]:shadow-none",
  "**:data-[slot=tabs-indicator]:rounded-lg",
  "**:data-[slot=tabs-indicator]:bg-accent",
  "**:data-[slot=tabs-indicator]:shadow-none",
].join(" ");

const noteSectionMeta: Record<
  ProjectNoteSection,
  { label: string; detail: string; icon: typeof FileText }
> = {
  brief: {
    label: "Brief",
    detail: "Intent, scope, and constraints",
    icon: FileText,
  },
  research: {
    label: "Research",
    detail: "Findings and useful references",
    icon: Lightbulb,
  },
  decisions: {
    label: "Decisions",
    detail: "Choices and their reasoning",
    icon: GitBranch,
  },
  updates: {
    label: "Updates",
    detail: "Progress notes and handoffs",
    icon: Sparkles,
  },
};

function makeId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function safeProjectStore(value: unknown): ProjectStore {
  if (!value || typeof value !== "object") return emptyStore;
  const candidate = value as Partial<ProjectStore>;
  return {
    projects: Array.isArray(candidate.projects) ? candidate.projects : [],
    categories: Array.isArray(candidate.categories)
      ? candidate.categories.map((category) => ({
          ...category,
          icon:
            "icon" in category &&
            typeof category.icon === "string" &&
            category.icon in projectCategoryIconMap
              ? (category.icon as ProjectCategoryIconName)
              : "folder",
        }))
      : defaultCategories,
    notes: Array.isArray(candidate.notes) ? candidate.notes : [],
    localTasks: Array.isArray(candidate.localTasks) ? candidate.localTasks : [],
    taskAssignments:
      candidate.taskAssignments && typeof candidate.taskAssignments === "object"
        ? candidate.taskAssignments
        : {},
    repositoryAssignments:
      candidate.repositoryAssignments &&
      typeof candidate.repositoryAssignments === "object"
        ? candidate.repositoryAssignments
        : {},
    milestones: Array.isArray(candidate.milestones)
      ? candidate.milestones.filter(
          (milestone): milestone is ProjectMilestone =>
            Boolean(
              milestone &&
              typeof milestone.id === "string" &&
              typeof milestone.projectId === "string" &&
              typeof milestone.title === "string" &&
              typeof milestone.description === "string" &&
              (milestone.targetDate === null ||
                typeof milestone.targetDate === "string") &&
              ["planned", "in-progress", "completed"].includes(
                milestone.status,
              ) &&
              typeof milestone.createdAt === "string" &&
              typeof milestone.updatedAt === "string",
            ),
        )
      : [],
  };
}

function formatProjectDate(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function relativeProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) return "Today";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    days,
    "day",
  );
}

function categoryPath(
  categoryId: string | null,
  categories: ProjectCategory[],
) {
  if (!categoryId) return "Uncategorized";
  const path: string[] = [];
  const visited = new Set<string>();
  let current = categories.find((category) => category.id === categoryId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parentId
      ? categories.find((category) => category.id === current?.parentId)
      : undefined;
  }
  return path.join(" / ") || "Uncategorized";
}

function categoryDescendants(
  categoryId: string,
  categories: ProjectCategory[],
) {
  const result = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (
        category.parentId &&
        result.has(category.parentId) &&
        !result.has(category.id)
      ) {
        result.add(category.id);
        changed = true;
      }
    }
  }
  return result;
}

function projectProgress(
  projectId: string,
  localTasks: LocalProjectTask[],
  tasks: ProjectTask[],
  assignments: Record<string, string>,
) {
  const projectLocalTasks = localTasks.filter(
    (task) => task.projectId === projectId,
  );
  const linkedTasks = tasks.filter(
    (task) => assignments[task.id] === projectId,
  );
  const total = projectLocalTasks.length + linkedTasks.length;
  const completed =
    projectLocalTasks.filter((task) => task.completed).length +
    linkedTasks.filter((task) => task.completed).length;
  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[160] grid place-items-center bg-backdrop p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        aria-label={title}
        aria-modal="true"
        className="project-modal max-h-[min(88dvh,760px)] w-full max-w-xl overflow-y-auto rounded-2xl border border-separator bg-overlay p-5 text-overlay-foreground shadow-overlay sm:p-6"
        role="dialog"
      >
        {children}
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

    document.addEventListener("pointerdown", dismissOnOutsidePress);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePress);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [ref]);
}

function ProjectCategoryTreePicker({
  categories,
  onChange,
  value,
}: {
  categories: ProjectCategory[];
  onChange: (categoryId: string | null) => void;
  value: string | null;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedCategory = categories.find((category) => category.id === value);
  const SelectedIcon = selectedCategory
    ? projectCategoryIconMap[selectedCategory.icon]
    : FolderTree;

  useDismissableDetails(detailsRef);

  function selectCategory(categoryId: string | null) {
    onChange(categoryId);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details
      className="project-category-picker group relative"
      ref={detailsRef}
    >
      <summary
        aria-label="Choose project category"
        className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none transition hover:border-accent focus-visible:border-accent"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate">
            {selectedCategory
              ? categoryPath(selectedCategory.id, categories)
              : "No category"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 max-h-72 overflow-y-auto rounded-xl border border-separator bg-overlay p-1.5 shadow-overlay">
        <Button
          aria-pressed={!value}
          className={`mb-1 h-9 w-full justify-start rounded-lg px-2.5 text-sm ${
            !value
              ? "bg-accent-soft text-accent"
              : "text-muted hover:bg-surface-tertiary hover:text-foreground"
          }`}
          onClick={() => selectCategory(null)}
          type="button"
          variant="ghost"
        >
          <FolderTree className="h-4 w-4" />
          No category
          {!value ? <Check className="ml-auto h-4 w-4" /> : null}
        </Button>
        {categories.length ? (
          <TreeProvider
            defaultExpandedIds={categories.map((category) => category.id)}
            indent={22}
            onSelectionChange={(selectedIds) =>
              selectCategory(selectedIds[0] ?? null)
            }
            selectedIds={value ? [value] : []}
            showLines
          >
            <TreeView className="p-0">
              <ProjectCategoryPickerBranch
                categories={categories}
                parentId={null}
                selectedId={value}
              />
            </TreeView>
          </TreeProvider>
        ) : (
          <p className="px-2.5 py-3 text-xs text-muted">
            Create a category from the project category panel first.
          </p>
        )}
      </div>
    </details>
  );
}

function ProjectCategoryPickerBranch({
  categories,
  level = 0,
  parentId,
  parentPath = [],
  selectedId,
}: {
  categories: ProjectCategory[];
  level?: number;
  parentId: string | null;
  parentPath?: boolean[];
  selectedId: string | null;
}) {
  const siblings = categories
    .filter((category) => category.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name));

  return siblings.map((category, index) => {
    const children = categories.filter(
      (candidate) => candidate.parentId === category.id,
    );
    const isLast = index === siblings.length - 1;
    const CategoryIcon = projectCategoryIconMap[category.icon];
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
          <ProjectCategoryPickerBranch
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

function ProjectDueDatePicker({
  ariaLabel = "Choose project due date",
  label = "Due date",
  onChange,
  value,
}: {
  ariaLabel?: string;
  label?: string;
  onChange: (value: string | null) => void;
  value: string | null;
}) {
  let dateValue: DateValue | null = null;
  if (value) {
    try {
      dateValue = parseDate(value.slice(0, 10));
    } catch {
      dateValue = null;
    }
  }

  return (
    <DatePicker
      className="grid gap-1.5"
      onChange={(date) => onChange(date?.toString() ?? null)}
      value={dateValue}
    >
      <Label className="text-sm font-medium">{label}</Label>
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
        <Calendar aria-label={ariaLabel}>
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

function ProjectForm({
  categories,
  initial,
  onClose,
  onSave,
}: {
  categories: ProjectCategory[];
  initial?: Project;
  onClose: () => void;
  onSave: (draft: ProjectDraft) => void;
}) {
  const [draft, setDraft] = useState<ProjectDraft>({
    name: initial?.name ?? "",
    summary: initial?.summary ?? "",
    status: initial?.status ?? "planning",
    priority: initial?.priority ?? "medium",
    categoryId: initial?.categoryId ?? null,
    dueDate: initial?.dueDate ?? null,
    color: initial?.color ?? projectColors[0],
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      summary: draft.summary.trim(),
    });
  }

  return (
    <ModalShell
      onClose={onClose}
      title={initial ? "Edit project" : "Create project"}
    >
      <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              {initial ? "Project settings" : "New project"}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {initial ? "Edit project" : "Give the work a home"}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-secondary hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Project name
            <input
              autoFocus
              className="h-11 rounded-xl border border-separator bg-field-background px-3.5 text-sm text-field-foreground outline-none transition placeholder:text-field-placeholder focus:border-accent focus:ring-3 focus:ring-accent-soft"
              maxLength={80}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Launch the portfolio"
              required
              value={draft.name}
            />
          </label>
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Status
              <Select
                aria-label="Project status"
                className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-accent"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as ProjectStatus,
                  }))
                }
                value={draft.status}
              >
                {Object.entries(statusMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Priority
              <Select
                aria-label="Project priority"
                className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none focus:border-accent"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as ProjectPriority,
                  }))
                }
                value={draft.priority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 text-sm font-medium">
              <span>Category</span>
              <ProjectCategoryTreePicker
                categories={categories}
                onChange={(categoryId) =>
                  setDraft((current) => ({ ...current, categoryId }))
                }
                value={draft.categoryId}
              />
            </div>
            <ProjectDueDatePicker
              onChange={(dueDate) =>
                setDraft((current) => ({ ...current, dueDate }))
              }
              value={draft.dueDate}
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Project color</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {projectColors.map((color) => (
                <button
                  aria-label={`Use color ${color}`}
                  aria-pressed={draft.color === color}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 transition hover:scale-105"
                  key={color}
                  onClick={() => setDraft((current) => ({ ...current, color }))}
                  style={{
                    backgroundColor: color,
                    borderColor:
                      draft.color === color
                        ? "var(--foreground)"
                        : "transparent",
                  }}
                  type="button"
                >
                  {draft.color === color ? (
                    <Check className="h-4 w-4 text-slate-950" />
                  ) : null}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <button
            className="h-10 rounded-xl px-4 text-sm font-semibold text-muted transition hover:bg-surface-secondary hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
            type="submit"
          >
            {initial ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ProjectCategoryInlineForm({
  className,
  initialIcon = "folder",
  initialName = "",
  label,
  onCancel,
  onSave,
  style,
}: {
  className?: string;
  initialIcon?: ProjectCategoryIconName;
  initialName?: string;
  label: string;
  onCancel: () => void;
  onSave: (name: string, icon: ProjectCategoryIconName) => void;
  style?: CSSProperties;
}) {
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState<ProjectCategoryIconName>(initialIcon);
  const iconPickerRef = useRef<HTMLDetailsElement>(null);
  const SelectedIcon = projectCategoryIconMap[icon];

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
          if (event.key === "Enter" && name.trim()) onSave(name.trim(), icon);
          if (event.key === "Escape") onCancel();
        }}
        placeholder="Category name"
        value={name}
      />
      <details
        className="project-category-icon-picker group mt-2.5"
        ref={iconPickerRef}
      >
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-separator bg-surface-secondary px-3 text-sm outline-none transition hover:border-accent focus-visible:border-accent">
          <span className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft text-accent">
              <SelectedIcon className="h-4 w-4" />
            </span>
            <span>{projectCategoryIconLabels[icon]}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
        </summary>
        <div className="mt-2 rounded-xl border border-separator bg-surface-secondary/70 p-2.5 shadow-inner">
          <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Choose a symbol
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(projectCategoryIconMap).map(([iconName, Icon]) => (
              <button
                aria-label={`Use ${projectCategoryIconLabels[iconName as ProjectCategoryIconName]} icon`}
                aria-pressed={icon === iconName}
                className="project-category-icon-option"
                key={iconName}
                onClick={() => {
                  setIcon(iconName as ProjectCategoryIconName);
                  if (iconPickerRef.current) iconPickerRef.current.open = false;
                }}
                title={
                  projectCategoryIconLabels[iconName as ProjectCategoryIconName]
                }
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>
                  {
                    projectCategoryIconLabels[
                      iconName as ProjectCategoryIconName
                    ]
                  }
                </span>
              </button>
            ))}
          </div>
        </div>
      </details>
      <div className="mt-3 flex items-center gap-2">
        <Button
          className="h-9 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), icon)}
          type="button"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </Button>
        <Button
          className="h-9 rounded-lg border border-separator bg-surface-secondary px-3 text-xs font-semibold"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ProjectCategoryTreeBranch({
  addingParentId,
  categories,
  compact = false,
  editingId,
  level = 0,
  onAdd,
  onAddingParentChange,
  onDelete,
  onEditingChange,
  onRename,
  onSelect,
  parentId,
  parentPath = [],
  projects,
  selectedId,
}: {
  addingParentId: string | null;
  categories: ProjectCategory[];
  compact?: boolean;
  editingId: string | null;
  level?: number;
  onAdd: (
    name: string,
    parentId: string | null,
    icon: ProjectCategoryIconName,
  ) => void;
  onAddingParentChange: (id: string | null) => void;
  onDelete: (id: string) => void;
  onEditingChange: (id: string | null) => void;
  onRename: (id: string, name: string, icon: ProjectCategoryIconName) => void;
  onSelect: (id: string) => void;
  parentId: string | null;
  parentPath?: boolean[];
  projects: Project[];
  selectedId: string | null;
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
    const CategoryIcon = projectCategoryIconMap[category.icon];
    const descendants = categoryDescendants(category.id, categories);
    const count = projects.filter(
      (project) => project.categoryId && descendants.has(project.categoryId),
    ).length;

    return (
      <TreeNode
        isLast={isLast}
        key={category.id}
        level={level}
        nodeId={category.id}
        parentPath={parentPath}
      >
        <TreeNodeTrigger
          aria-label={compact ? category.name : undefined}
          className={
            selectedId === category.id ? "bg-accent-soft text-accent" : ""
          }
          onClick={() => onSelect(category.id)}
          title={compact ? category.name : undefined}
        >
          <TreeExpander hasChildren={hasChildren} />
          <TreeIcon
            hasChildren={hasChildren}
            icon={<CategoryIcon className="h-4 w-4 text-accent" />}
          />
          {!compact ? <TreeLabel>{category.name}</TreeLabel> : null}
          {!compact ? (
            <span className="text-[10px] tabular-nums text-muted">{count}</span>
          ) : null}
          {!compact ? (
            <span className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
              <Button
                aria-label={`Add subcategory to ${category.name}`}
                className="h-7 w-7 rounded-lg p-0 text-muted hover:bg-accent-soft hover:text-accent"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditingChange(null);
                  onAddingParentChange(category.id);
                  if (!expandedIds.has(category.id))
                    toggleExpanded(category.id);
                }}
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
                      `Delete "${category.name}" and its nested categories? Projects will remain and become uncategorized.`,
                    )
                  ) {
                    onDelete(category.id);
                  }
                }}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </span>
          ) : null}
        </TreeNodeTrigger>
        {!compact && editingId === category.id ? (
          <ProjectCategoryInlineForm
            className="mb-1"
            initialIcon={category.icon}
            initialName={category.name}
            label={`Edit ${category.name}`}
            onCancel={() => onEditingChange(null)}
            onSave={(name, icon) => {
              onRename(category.id, name, icon);
              onEditingChange(null);
            }}
            style={{ marginLeft: `${level * 22 + 36}px` }}
          />
        ) : null}
        <TreeNodeContent hasChildren={hasChildren}>
          {!compact && addingParentId === category.id ? (
            <ProjectCategoryInlineForm
              className="mb-1"
              label={`New subcategory in ${category.name}`}
              onCancel={() => onAddingParentChange(null)}
              onSave={(name, icon) => {
                onAdd(name, category.id, icon);
                onAddingParentChange(null);
              }}
              style={{ marginLeft: `${(level + 1) * 22 + 18}px` }}
            />
          ) : null}
          <ProjectCategoryTreeBranch
            addingParentId={addingParentId}
            categories={categories}
            compact={compact}
            editingId={editingId}
            level={level + 1}
            onAdd={onAdd}
            onAddingParentChange={onAddingParentChange}
            onDelete={onDelete}
            onEditingChange={onEditingChange}
            onRename={onRename}
            onSelect={onSelect}
            parentId={category.id}
            parentPath={[...parentPath, isLast]}
            projects={projects}
            selectedId={selectedId}
          />
        </TreeNodeContent>
      </TreeNode>
    );
  });
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[28rem] flex-1 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-separator bg-surface-secondary text-accent shadow-surface">
          <FolderOpen className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">
          Create your first project
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Keep tasks, decisions, repositories, and progress together without
          changing how the rest of Relay works.
        </p>
        <button
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          onClick={onCreate}
          type="button"
        >
          <Plus className="h-4 w-4" /> Create project
        </button>
      </div>
    </div>
  );
}

function ProjectTaskCreationModal({
  onClose,
  onCreate,
  taskLists,
}: {
  onClose: () => void;
  onCreate: (input: {
    title: string;
    notes?: string | null;
    due?: string | null;
    priority?: ProjectPriority;
    columnId?: string | null;
  }) => Promise<void>;
  taskLists: Array<{ id: string; title: string }>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [taskListId, setTaskListId] = useState(taskLists[0]?.id ?? "@default");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      await onCreate({
        title: title.trim(),
        notes: notes.trim() || null,
        due: due
          ? new Date(`${due.slice(0, 10)}T23:59:00`).toISOString()
          : null,
        priority,
        columnId: taskListId || "@default",
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
    <ModalShell onClose={onClose} title="Add Google task">
      <form onSubmit={(event) => void save(event)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Add Google task</h2>
            <p className="mt-1 text-sm text-muted">
              Save it to Google Tasks and link it to this project.
            </p>
          </div>
          <Button
            aria-label="Close"
            className="h-10 w-10 rounded-xl border border-separator bg-surface-secondary p-0 text-muted"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Title
            <Input
              autoFocus
              className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <div className="grid gap-1.5 text-sm font-medium">
            Notes
            <RichTextEditor
              ariaLabel="Project task notes formatting"
              className="task-rich-text--compact"
              onChange={(_, plainText) => setNotes(plainText)}
              placeholder="Add context, links, decisions, or a checklist..."
              value={notes}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ProjectDueDatePicker
              ariaLabel="Choose task due date"
              label="Due date"
              onChange={setDue}
              value={due}
            />
            <label className="grid gap-1.5 text-sm font-medium">
              Priority
              <Select
                className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
                onChange={(event) =>
                  setPriority(event.target.value as ProjectPriority)
                }
                value={priority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </label>
          </div>
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Google task list
              <Select
                className="h-11 w-full rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
                onChange={(event) => setTaskListId(event.target.value)}
                value={taskListId}
              >
                {taskLists.length ? (
                  taskLists.map((taskList) => (
                    <option key={taskList.id} value={taskList.id}>
                      {taskList.title}
                    </option>
                  ))
                ) : (
                  <option value="@default">Default</option>
                )}
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
            className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
            disabled={!title.trim() || saving}
            type="submit"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add task
          </Button>
          <Button
            className="h-10 rounded-xl border border-separator bg-surface-secondary px-4 text-sm font-semibold"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function TaskPanel({
  project,
  store,
  tasks,
  onStoreChange,
  onCompleteLinkedTask,
  onCreateTask,
  onOpenLinkedTask,
  taskLists,
}: {
  project: Project;
  store: ProjectStore;
  tasks: ProjectTask[];
  onStoreChange: (update: (current: ProjectStore) => ProjectStore) => void;
  onCompleteLinkedTask: (task: ProjectTask) => Promise<void>;
  onCreateTask: (input: {
    title: string;
    notes?: string | null;
    due?: string | null;
    priority?: ProjectPriority;
    columnId?: string | null;
  }) => Promise<ProjectTask>;
  onOpenLinkedTask: (task: ProjectTask) => void;
  taskLists: Array<{ id: string; title: string }>;
}) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(
    null,
  );
  const celebrationTimerRef = useRef<number | null>(null);
  const localTasks = store.localTasks.filter(
    (task) => task.projectId === project.id,
  );
  const linkedTasks = tasks.filter(
    (task) => store.taskAssignments[task.id] === project.id,
  );
  const availableTasks = tasks.filter(
    (task) =>
      !store.taskAssignments[task.id] &&
      task.title.toLowerCase().includes(linkQuery.trim().toLowerCase()),
  );

  useEffect(
    () => () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    },
    [],
  );

  function celebrateCompletion(taskId: string) {
    if (celebrationTimerRef.current) {
      window.clearTimeout(celebrationTimerRef.current);
    }
    setCelebratingTaskId(taskId);
    celebrationTimerRef.current = window.setTimeout(() => {
      setCelebratingTaskId(null);
      celebrationTimerRef.current = null;
    }, 680);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Tasks sync to Google Tasks and stay linked to this project.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
            onClick={() => setTaskModalOpen(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-separator bg-surface-secondary px-3 text-xs font-semibold hover:bg-surface-tertiary"
            onClick={() => setLinking(true)}
            type="button"
          >
            <Link2 className="h-3.5 w-3.5" /> Link existing
          </button>
        </div>
      </div>

      {localTasks.length || linkedTasks.length ? (
        <div className="overflow-hidden rounded-xl border border-separator">
          {localTasks.map((task) => (
            <div
              className="group flex items-center gap-3 border-b border-separator px-3 py-3 last:border-b-0"
              key={task.id}
            >
              <button
                aria-label={
                  task.completed
                    ? `Mark ${task.title} incomplete`
                    : `Complete ${task.title}`
                }
                className={`project-task-completion grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${task.completed ? "border-success bg-success text-success-foreground" : "border-border text-transparent hover:border-accent hover:text-accent"}`}
                data-celebrating={
                  celebratingTaskId === task.id ? "true" : undefined
                }
                onClick={() => {
                  if (!task.completed) celebrateCompletion(task.id);
                  onStoreChange((current) => ({
                    ...current,
                    localTasks: current.localTasks.map((item) =>
                      item.id === task.id
                        ? { ...item, completed: !item.completed }
                        : item,
                    ),
                  }));
                }}
                type="button"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${task.completed ? "text-muted line-through" : "font-medium"}`}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">Project task</p>
              </div>
              <button
                aria-label={`Delete ${task.title}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted opacity-0 hover:bg-danger-soft hover:text-danger group-hover:opacity-100 group-focus-within:opacity-100"
                onClick={() =>
                  onStoreChange((current) => ({
                    ...current,
                    localTasks: current.localTasks.filter(
                      (item) => item.id !== task.id,
                    ),
                  }))
                }
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {linkedTasks.map((task) => (
            <div
              className="group flex items-center gap-3 border-b border-separator px-3 py-3 last:border-b-0"
              key={task.id}
            >
              <button
                aria-label={
                  task.completed
                    ? `${task.title} is complete`
                    : `Complete ${task.title}`
                }
                className={`project-task-completion grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${task.completed ? "border-success bg-success text-success-foreground" : "border-border hover:border-accent"}`}
                data-celebrating={
                  celebratingTaskId === task.id ? "true" : undefined
                }
                disabled={task.completed || busyTaskId === task.id}
                onClick={async () => {
                  celebrateCompletion(task.id);
                  setBusyTaskId(task.id);
                  try {
                    await onCompleteLinkedTask(task);
                  } finally {
                    setBusyTaskId(null);
                  }
                }}
                type="button"
              >
                {task.completed || busyTaskId === task.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3 text-transparent" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${task.completed ? "text-muted line-through" : "font-medium"}`}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Linked from {task.taskListTitle ?? "Tasks"}
                </p>
              </div>
              <div className="flex shrink-0 opacity-70 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  aria-label={`Open ${task.title} in Tasks`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
                  onClick={() => onOpenLinkedTask(task)}
                  title="Open in Tasks"
                  type="button"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label={`Unlink ${task.title}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
                  onClick={() =>
                    onStoreChange((current) => {
                      const next = { ...current.taskAssignments };
                      delete next[task.id];
                      return { ...current, taskAssignments: next };
                    })
                  }
                  type="button"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-separator px-5 py-10 text-center">
          <ClipboardList className="mx-auto h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-medium">No project tasks yet</p>
          <p className="mt-1 text-xs text-muted">
            Add the next concrete action or link an existing task.
          </p>
        </div>
      )}

      {linking ? (
        <ModalShell
          onClose={() => setLinking(false)}
          title="Link existing tasks"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                Task connection
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Link an existing task
              </h2>
            </div>
            <button
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-secondary"
              onClick={() => setLinking(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              className="h-11 w-full rounded-xl border border-separator bg-field-background pl-10 pr-3 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-soft"
              onChange={(event) => setLinkQuery(event.target.value)}
              placeholder="Search open and completed tasks"
              value={linkQuery}
            />
          </div>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-separator">
            {availableTasks.length ? (
              availableTasks.map((task) => (
                <button
                  className="flex w-full items-center gap-3 border-b border-separator px-3 py-3 text-left last:border-b-0 hover:bg-surface-secondary"
                  key={task.id}
                  onClick={() => {
                    onStoreChange((current) => ({
                      ...current,
                      taskAssignments: {
                        ...current.taskAssignments,
                        [task.id]: project.id,
                      },
                    }));
                    setLinking(false);
                  }}
                  type="button"
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${task.completed ? "border-success bg-success-soft text-success" : "border-border text-muted"}`}
                  >
                    {task.completed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {task.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {task.taskListTitle ?? "Google Tasks"}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <Inbox className="mx-auto h-5 w-5 text-muted" />
                <p className="mt-3 text-sm font-medium">
                  No unlinked tasks found
                </p>
                <p className="mt-1 text-xs text-muted">
                  Create one in Tasks, or add a project task here.
                </p>
              </div>
            )}
          </div>
        </ModalShell>
      ) : null}
      {taskModalOpen ? (
        <ProjectTaskCreationModal
          onClose={() => setTaskModalOpen(false)}
          onCreate={async (input) => {
            const createdTask = await onCreateTask(input);
            onStoreChange((current) => ({
              ...current,
              taskAssignments: {
                ...current.taskAssignments,
                [createdTask.id]: project.id,
              },
            }));
          }}
          taskLists={taskLists}
        />
      ) : null}
    </div>
  );
}

function RepositoryPanel({
  onStoreChange,
  project,
  repositories,
  store,
}: {
  onStoreChange: (update: (current: ProjectStore) => ProjectStore) => void;
  project: Project;
  repositories: ProjectRepository[];
  store: ProjectStore;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loadedRepositories, setLoadedRepositories] = useState<
    ProjectRepository[]
  >([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const repositoryCatalog = useMemo(
    () =>
      Array.from(
        new Map(
          [...repositories, ...loadedRepositories].map((repository) => [
            repository.fullName,
            repository,
          ]),
        ).values(),
      ),
    [loadedRepositories, repositories],
  );
  const assignedNames = store.repositoryAssignments[project.id] ?? [];
  const assignedRepositories = assignedNames.map((fullName) => ({
    fullName,
    repository:
      repositoryCatalog.find((item) => item.fullName === fullName) ?? null,
  }));
  const visibleRepositories = repositoryCatalog.filter((repository) =>
    `${repository.fullName} ${repository.description ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  function openRepositoryPicker() {
    setRepositoryError(null);
    setRepositoriesLoading(true);
    setPickerOpen(true);
  }

  useEffect(() => {
    if (!pickerOpen) return;
    const controller = new AbortController();
    fetch("/api/github/repos?maxResults=50", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          reason?: string;
          repositories?: ProjectRepository[];
        };
        if (!response.ok) {
          throw new Error(data.reason ?? "Unable to load GitHub repositories.");
        }
        setLoadedRepositories(data.repositories ?? []);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRepositoryError(
          error instanceof Error
            ? error.message
            : "Unable to load GitHub repositories.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setRepositoriesLoading(false);
      });
    return () => controller.abort();
  }, [pickerOpen]);

  function toggleRepository(fullName: string) {
    onStoreChange((current) => {
      const assigned = current.repositoryAssignments[project.id] ?? [];
      const next = assigned.includes(fullName)
        ? assigned.filter((name) => name !== fullName)
        : [...assigned, fullName];
      return {
        ...current,
        repositoryAssignments: {
          ...current.repositoryAssignments,
          [project.id]: next,
        },
      };
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Project repositories</h3>
          <p className="mt-1 text-xs text-muted">
            Connect one or more repositories that contain this project’s work.
          </p>
        </div>
        <Button
          className="h-9 shrink-0 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground"
          onClick={openRepositoryPicker}
          type="button"
        >
          <Plus className="h-3.5 w-3.5" />
          Assign repos
        </Button>
      </div>

      {assignedRepositories.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {assignedRepositories.map(({ fullName, repository }) => (
            <article
              className="group rounded-xl border border-separator bg-surface-secondary p-4"
              key={fullName}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-separator bg-surface text-accent">
                  <GitBranch className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {repository?.description ??
                      "Repository metadata will refresh when GitHub is connected."}
                  </p>
                </div>
                <div className="flex shrink-0">
                  {repository?.htmlUrl ? (
                    <a
                      aria-label={`Open ${fullName} on GitHub`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
                      href={repository.htmlUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <Button
                    aria-label={`Unassign ${fullName}`}
                    className="h-8 w-8 rounded-lg p-0 text-muted hover:bg-danger-soft hover:text-danger"
                    onClick={() => toggleRepository(fullName)}
                    type="button"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {repository ? (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-separator pt-3 text-[10px] text-muted">
                  <span>{repository.language ?? "No language"}</span>
                  <span>{repository.openIssues} open issues</span>
                  <span>{repository.stars} stars</span>
                  <span>{repository.forks} forks</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <button
          className="rounded-xl border border-dashed border-separator px-5 py-10 text-center hover:border-accent hover:bg-accent-soft"
          onClick={openRepositoryPicker}
          type="button"
        >
          <GitBranch className="mx-auto h-5 w-5 text-muted" />
          <span className="mt-3 block text-sm font-medium">
            No repositories assigned
          </span>
          <span className="mt-1 block text-xs text-muted">
            Choose repositories from your connected GitHub account.
          </span>
        </button>
      )}

      {pickerOpen ? (
        <ModalShell
          onClose={() => setPickerOpen(false)}
          title="Assign repositories"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                GitHub connection
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Assign repositories
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select any repository that belongs to {project.name}.
              </p>
            </div>
            <Button
              aria-label="Close"
              className="h-9 w-9 rounded-lg p-0 text-muted"
              onClick={() => setPickerOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              autoFocus
              className="h-11 w-full rounded-xl border border-separator bg-surface-secondary pl-10 pr-3 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repositories"
              value={query}
            />
          </div>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-separator">
            {visibleRepositories.length ? (
              visibleRepositories.map((repository) => {
                const selected = assignedNames.includes(repository.fullName);
                return (
                  <button
                    aria-pressed={selected}
                    className="flex w-full items-center gap-3 border-b border-separator px-3 py-3 text-left last:border-b-0 hover:bg-surface-secondary"
                    key={repository.id}
                    onClick={() => toggleRepository(repository.fullName)}
                    type="button"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-separator text-transparent"}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {repository.fullName}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {repository.description ??
                          repository.language ??
                          "GitHub repository"}
                      </span>
                    </span>
                    {repository.private ? (
                      <span className="rounded-full bg-warning-soft px-2 py-1 text-[9px] font-semibold text-warning">
                        Private
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted">
                {repositoriesLoading
                  ? "Loading repositories…"
                  : (repositoryError ??
                    "No connected repositories match this search.")}
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
              onClick={() => setPickerOpen(false)}
              type="button"
            >
              Done
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function NotesPanel({
  project,
  store,
  onStoreChange,
}: {
  project: Project;
  store: ProjectStore;
  onStoreChange: (update: (current: ProjectStore) => ProjectStore) => void;
}) {
  const [composer, setComposer] = useState<ProjectNoteSection | null>(null);
  const [editing, setEditing] = useState<ProjectNote | null>(null);
  const [body, setBody] = useState("");

  function openComposer(section: ProjectNoteSection) {
    setComposer(section);
    setEditing(null);
    setBody("");
  }

  function saveNote(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || (!composer && !editing)) return;
    const now = new Date().toISOString();
    onStoreChange((current) => ({
      ...current,
      notes: editing
        ? current.notes.map((note) =>
            note.id === editing.id
              ? { ...note, body: trimmed, updatedAt: now }
              : note,
          )
        : [
            ...current.notes,
            {
              id: makeId("project-note"),
              projectId: project.id,
              section: composer!,
              body: trimmed,
              createdAt: now,
              updatedAt: now,
            },
          ],
    }));
    setComposer(null);
    setEditing(null);
    setBody("");
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        {(Object.keys(noteSectionMeta) as ProjectNoteSection[]).map(
          (section) => {
            const meta = noteSectionMeta[section];
            const Icon = meta.icon;
            const notes = store.notes.filter(
              (note) =>
                note.projectId === project.id && note.section === section,
            );
            return (
              <section
                className="min-h-52 rounded-xl border border-separator bg-surface-secondary/45 p-4"
                key={section}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-accent shadow-surface">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{meta.label}</h3>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {meta.detail}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={`Add ${meta.label} note`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-separator bg-surface text-muted hover:border-border hover:text-accent"
                    onClick={() => openComposer(section)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4 grid gap-2">
                  {notes.length ? (
                    notes.map((note) => (
                      <article
                        className="group rounded-lg border border-separator bg-surface p-3"
                        key={note.id}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {note.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted">
                          <span>{relativeProjectDate(note.updatedAt)}</span>
                          <div className="flex opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                            <button
                              aria-label="Edit note"
                              className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-secondary hover:text-foreground"
                              onClick={() => {
                                setEditing(note);
                                setComposer(null);
                                setBody(note.body);
                              }}
                              type="button"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              aria-label="Delete note"
                              className="grid h-7 w-7 place-items-center rounded-md hover:bg-danger-soft hover:text-danger"
                              onClick={() =>
                                onStoreChange((current) => ({
                                  ...current,
                                  notes: current.notes.filter(
                                    (item) => item.id !== note.id,
                                  ),
                                }))
                              }
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <button
                      className="rounded-lg border border-dashed border-separator px-3 py-5 text-xs text-muted hover:border-accent hover:bg-accent-soft hover:text-accent"
                      onClick={() => openComposer(section)}
                      type="button"
                    >
                      Add the first note
                    </button>
                  )}
                </div>
              </section>
            );
          },
        )}
      </div>

      {composer || editing ? (
        <ModalShell
          onClose={() => {
            setComposer(null);
            setEditing(null);
          }}
          title={editing ? "Edit note" : "Add note"}
        >
          <form onSubmit={saveNote}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                  {editing
                    ? noteSectionMeta[editing.section].label
                    : noteSectionMeta[composer!].label}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {editing ? "Edit note" : "Add a project note"}
                </h2>
              </div>
              <button
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-secondary"
                onClick={() => {
                  setComposer(null);
                  setEditing(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RichTextEditor
              ariaLabel="Project note formatting"
              autoFocus
              className="mt-5 task-rich-text--tall"
              onChange={(_, plainText) => setBody(plainText)}
              placeholder="Capture enough context for future you..."
              value={body}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-surface-secondary"
                onClick={() => {
                  setComposer(null);
                  setEditing(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
                type="submit"
              >
                Save note
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

function ProjectMilestoneSummary({
  milestones,
  onOpenRoadmap,
  project,
}: {
  milestones: ProjectMilestone[];
  onOpenRoadmap: () => void;
  project: Project;
}) {
  const orderedMilestones = [...milestones].sort((left, right) => {
    if (left.targetDate && right.targetDate) {
      const difference = left.targetDate.localeCompare(right.targetDate);
      if (difference) return difference;
    }
    if (left.targetDate) return -1;
    if (right.targetDate) return 1;
    return left.createdAt.localeCompare(right.createdAt);
  });
  const completed = orderedMilestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;
  const inProgress = orderedMilestones.filter(
    (milestone) => milestone.status === "in-progress",
  ).length;
  const timelineProgress = orderedMilestones.length
    ? Math.min(
        100,
        ((completed + inProgress * 0.5) / orderedMilestones.length) * 100,
      )
    : 0;

  return (
    <section className="project-milestone-summary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Milestone summary</h3>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {orderedMilestones.length
              ? `${completed} of ${orderedMilestones.length} levels reached`
              : "Map the levels that move this project forward"}
          </p>
        </div>
        <button
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
          onClick={onOpenRoadmap}
          type="button"
        >
          {orderedMilestones.length ? "Open roadmap" : "Build roadmap"}
        </button>
      </div>

      {orderedMilestones.length ? (
        <div className="project-milestone-summary__viewport">
          <ol
            className="project-milestone-summary__track"
            style={
              {
                "--milestone-color": project.color,
                "--milestone-progress": `${timelineProgress}%`,
              } as CSSProperties
            }
          >
            {orderedMilestones.map((milestone, index) => (
              <li
                className="project-milestone-summary__step"
                data-status={milestone.status}
                key={milestone.id}
              >
                <span className="project-milestone-summary__node">
                  {milestone.status === "completed" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="project-milestone-summary__label">
                  <p className="truncate text-xs font-semibold">
                    {milestone.title}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] capitalize text-muted">
                    {milestone.targetDate
                      ? formatProjectDate(milestone.targetDate)
                      : milestone.status.replace("-", " ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <button
          className="project-milestone-summary__empty"
          onClick={onOpenRoadmap}
          type="button"
        >
          <span />
          <span />
          <span />
          <span className="text-[10px] font-semibold text-muted">
            Add the first milestone
          </span>
        </button>
      )}
    </section>
  );
}

function ProjectRoadmapPanel({
  onStoreChange,
  project,
  store,
}: {
  onStoreChange: (update: (current: ProjectStore) => ProjectStore) => void;
  project: Project;
  store: ProjectStore;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const milestones = store.milestones
    .filter((milestone) => milestone.projectId === project.id)
    .sort((left, right) => {
      if (left.targetDate && right.targetDate) {
        const dateDifference = left.targetDate.localeCompare(right.targetDate);
        if (dateDifference) return dateDifference;
      }
      if (left.targetDate) return -1;
      if (right.targetDate) return 1;
      return left.createdAt.localeCompare(right.createdAt);
    });
  const completedCount = milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;
  const roadmapPercent =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;

  function addMilestone(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const now = new Date().toISOString();
    onStoreChange((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        {
          createdAt: now,
          description: description.trim(),
          id: makeId("milestone"),
          projectId: project.id,
          status: "planned",
          targetDate: targetDate || null,
          title: trimmedTitle,
          updatedAt: now,
        },
      ],
    }));
    setTitle("");
    setDescription("");
    setTargetDate("");
    setAdding(false);
  }

  function advanceMilestone(milestone: ProjectMilestone) {
    const status: ProjectMilestoneStatus =
      milestone.status === "planned"
        ? "in-progress"
        : milestone.status === "in-progress"
          ? "completed"
          : "planned";
    onStoreChange((current) => ({
      ...current,
      milestones: current.milestones.map((item) =>
        item.id === milestone.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  }

  return (
    <div className="project-roadmap">
      <div className="project-roadmap__header">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Project roadmap</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Define the levels that move {project.name} forward.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground transition hover:bg-accent-hover"
          onClick={() => setAdding((current) => !current)}
          type="button"
        >
          <Plus className="h-3.5 w-3.5" />
          Add milestone
        </button>
      </div>

      <div className="project-roadmap__progress">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span>{completedCount} levels completed</span>
          <span className="text-accent">{roadmapPercent}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-default">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              backgroundColor: project.color,
              width: `${roadmapPercent}%`,
            }}
          />
        </div>
      </div>

      {adding ? (
        <form className="project-roadmap__composer" onSubmit={addMilestone}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Milestone
              <input
                autoFocus
                className="h-10 rounded-xl border border-separator bg-field-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-3 focus:ring-accent-soft"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Private beta"
                required
                value={title}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Target date
              <input
                className="h-10 rounded-xl border border-separator bg-field-background px-3 text-sm text-foreground outline-none focus:border-accent"
                onChange={(event) => setTargetDate(event.target.value)}
                type="date"
                value={targetDate}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-1.5 text-xs font-semibold text-muted">
            What changes at this level?
            <RichTextEditor
              ariaLabel="Roadmap milestone description formatting"
              className="task-rich-text--compact"
              maxLength={500}
              onChange={(_, plainText) => setDescription(plainText)}
              placeholder="Define the outcome or exit criteria."
              value={description}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="h-9 rounded-xl px-3 text-xs font-semibold text-muted hover:bg-surface-secondary"
              onClick={() => setAdding(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-9 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground"
              type="submit"
            >
              Add to roadmap
            </button>
          </div>
        </form>
      ) : null}

      {milestones.length > 0 ? (
        <ol className="project-roadmap__timeline">
          {milestones.map((milestone, index) => {
            const actionLabel =
              milestone.status === "planned"
                ? "Start"
                : milestone.status === "in-progress"
                  ? "Complete"
                  : "Reopen";
            return (
              <li
                className="project-roadmap__level"
                data-status={milestone.status}
                key={milestone.id}
                style={{ "--milestone-color": project.color } as CSSProperties}
              >
                <span className="project-roadmap__node">
                  {milestone.status === "completed" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="project-roadmap__card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                        Level {index + 1} · {milestone.status.replace("-", " ")}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold">
                        {milestone.title}
                      </h4>
                      {milestone.description ? (
                        <p className="mt-1.5 text-xs leading-5 text-muted">
                          {milestone.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-muted">
                      {milestone.targetDate
                        ? formatProjectDate(milestone.targetDate)
                        : "No target"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="h-8 rounded-lg bg-accent-soft px-3 text-[11px] font-semibold text-accent transition hover:bg-accent-soft-hover"
                      onClick={() => advanceMilestone(milestone)}
                      type="button"
                    >
                      {actionLabel}
                    </button>
                    <button
                      aria-label={`Delete ${milestone.title}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
                      onClick={() =>
                        onStoreChange((current) => ({
                          ...current,
                          milestones: current.milestones.filter(
                            (item) => item.id !== milestone.id,
                          ),
                        }))
                      }
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="project-roadmap__empty">
          <Milestone className="h-5 w-5 text-accent" />
          <p className="mt-2 text-sm font-semibold">No milestones yet</p>
          <p className="mt-1 text-xs text-muted">
            Add the next meaningful level, not every small task.
          </p>
        </div>
      )}
    </div>
  );
}

function readStoredProjectLayout() {
  if (typeof window === "undefined") return defaultProjectLayout;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(projectLayoutStorageKey) ?? "null",
    ) as Partial<typeof defaultProjectLayout> | null;
    return {
      calendarExpanded:
        typeof saved?.calendarExpanded === "boolean"
          ? saved.calendarExpanded
          : defaultProjectLayout.calendarExpanded,
      calendarHeight:
        typeof saved?.calendarHeight === "number"
          ? saved.calendarHeight
          : defaultProjectLayout.calendarHeight,
      categoryWidth:
        typeof saved?.categoryWidth === "number"
          ? saved.categoryWidth
          : defaultProjectLayout.categoryWidth,
      projectRailWidth:
        typeof saved?.projectRailWidth === "number"
          ? saved.projectRailWidth
          : defaultProjectLayout.projectRailWidth,
    };
  } catch {
    return defaultProjectLayout;
  }
}

function ProjectResizeHandle({
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
  function resizeWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
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
      className={`task-resize-handle task-resize-handle--${orientation} hidden md:block`}
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

function parseProjectCalendarDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(
    value.length <= 10 ? `${value.slice(0, 10)}T12:00:00` : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameProjectCalendarDay(left: Date | null, right: Date) {
  return Boolean(
    left &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

function ProjectMiniCalendar({
  localTasks,
  onOpenTask,
  project,
  tasks,
}: {
  localTasks: LocalProjectTask[];
  onOpenTask: (task: ProjectTask) => void;
  project: Project;
  tasks: ProjectTask[];
}) {
  const projectDueDate = parseProjectCalendarDate(project.dueDate);
  const firstTaskDueDate = tasks
    .map((task) => parseProjectCalendarDate(task.due))
    .find(Boolean);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchor = projectDueDate ?? firstTaskDueDate ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });
  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
  const datedTaskCount =
    tasks.filter((task) => parseProjectCalendarDate(task.due)).length +
    localTasks.filter((task) => parseProjectCalendarDate(task.dueDate)).length;

  return (
    <section
      aria-label={`${project.name} schedule`}
      className="task-mini-calendar relay-panel flex min-h-[170px] flex-col overflow-hidden p-3.5"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays
              className="h-4 w-4"
              style={{ color: project.color }}
            />
            <h3 className="truncate text-sm font-semibold">
              {visibleMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: project.color }}
              />
              Project due
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {datedTaskCount} dated {datedTaskCount === 1 ? "task" : "tasks"}
            </span>
          </div>
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
            sameProjectCalendarDay(parseProjectCalendarDate(task.due), day),
          );
          const dayLocalTasks = localTasks.filter((task) =>
            sameProjectCalendarDay(parseProjectCalendarDate(task.dueDate), day),
          );
          const isProjectDue = sameProjectCalendarDay(projectDueDate, day);
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = sameProjectCalendarDay(new Date(), day);
          const interactive = dayTasks.length > 0;
          return (
            <button
              aria-label={`${day.toLocaleDateString()}${isProjectDue ? `, ${project.name} due` : ""}${dayTasks.length + dayLocalTasks.length ? `, ${dayTasks.length + dayLocalTasks.length} tasks due` : ""}`}
              className={`task-calendar-day ${isCurrentMonth ? "" : "is-outside"} ${isToday ? "is-today" : ""}`}
              disabled={!interactive}
              key={day.toISOString()}
              onClick={() => dayTasks[0] && onOpenTask(dayTasks[0])}
              title={[
                isProjectDue ? `${project.name} due` : "",
                ...dayTasks.map((task) => task.title),
                ...dayLocalTasks.map((task) => task.title),
              ]
                .filter(Boolean)
                .join("\n")}
              type="button"
            >
              <span>{day.getDate()}</span>
              <span
                className="flex items-center justify-center gap-0.5"
                aria-hidden="true"
              >
                {isProjectDue ? (
                  <span
                    className="h-1.5 w-1.5 rounded-[2px]"
                    style={{ backgroundColor: project.color }}
                  />
                ) : null}
                {[...dayTasks, ...dayLocalTasks].slice(0, 3).map((task) => (
                  <span
                    className={`h-1 w-1 rounded-full ${task.completed ? "bg-success" : "bg-accent"}`}
                    key={task.id}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProjectsWorkspaceSkeleton() {
  return (
    <div
      aria-label="Loading projects and account metadata"
      aria-live="polite"
      className="projects-workspace project-workspace-loading flex min-h-full flex-col md:h-full md:min-h-0"
      role="status"
    >
      <div className="project-workspace-tabs h-14 shrink-0 animate-pulse" />
      <div className="project-workspace-panel grid min-h-0 flex-1 md:grid-cols-[20fr_1px_20fr_1px_60fr]">
        <div className="animate-pulse" />
        <div className="bg-separator" />
        <div className="animate-pulse" />
        <div className="bg-separator" />
        <div className="overflow-hidden p-5">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-secondary" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                className="h-28 animate-pulse rounded-xl bg-surface-secondary"
                key={item}
              />
            ))}
          </div>
          <div className="mt-5 h-48 animate-pulse rounded-xl bg-surface-secondary" />
        </div>
      </div>
      <span className="sr-only">Loading projects</span>
    </div>
  );
}

export function ProjectsWorkspace({
  initialProjectId,
  repositories,
  repositoryError,
  repositoryTasks,
  signedInToGithub,
  taskLists,
  tasks,
  onCompleteTask,
  onCreateTask,
  onOpenTask,
}: {
  initialProjectId?: string | null;
  repositories: ProjectRepository[];
  repositoryError?: string;
  repositoryTasks: ProjectRepositoryTask[];
  signedInToGithub: boolean;
  taskLists: Array<{ id: string; title: string }>;
  tasks: ProjectTask[];
  onCompleteTask: (task: ProjectTask) => Promise<void>;
  onCreateTask: (input: {
    title: string;
    notes?: string | null;
    due?: string | null;
    priority?: ProjectPriority;
    columnId?: string | null;
  }) => Promise<ProjectTask>;
  onOpenTask: (task: ProjectTask) => void;
}) {
  const [store, setStore] = useState<ProjectStore>(emptyStore);
  const [workspaceTab, setWorkspaceTab] = useState<"relay" | "github">("relay");
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [accountPersistence, setAccountPersistence] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [projectFiltersExpanded, setProjectFiltersExpanded] = useState(false);
  const [githubLayout, setGithubLayout] = useState(
    defaultGithubWorkspaceLayout,
  );
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [projectForm, setProjectForm] = useState<"new" | "edit" | null>(null);
  const [addingCategoryParentId, setAddingCategoryParentId] = useState<
    string | null
  >(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null,
  );
  const [layoutSizes, setLayoutSizes] = useState(readStoredProjectLayout);
  const [activeResize, setActiveResize] = useState<
    "calendar" | "categories" | "projects" | null
  >(null);
  const projectLayoutRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{
    axis: "calendar" | "categories" | "projects";
    pointerId: number;
    startCalendarHeight: number;
    startCategoryWidth: number;
    startProjectRailWidth: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function hydrateProjects() {
      let localStore = emptyStore;
      let localLayout = readStoredProjectLayout();
      try {
        const saved = window.localStorage.getItem(projectStorageKey);
        if (saved) localStore = safeProjectStore(JSON.parse(saved));
      } catch {
        // A malformed local value should never block the workspace.
      }

      try {
        const response = await fetch("/api/projects", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          account?: { label?: string } | null;
          record?: {
            layout?: Partial<typeof defaultProjectLayout>;
            store?: unknown;
          } | null;
        };
        if (controller.signal.aborted) return;
        if (response.ok && data.account) {
          setAccountPersistence(true);
          setAccountLabel(data.account.label ?? "your account");
          if (data.record?.store)
            localStore = safeProjectStore(data.record.store);
          if (data.record?.layout) {
            localLayout = {
              calendarExpanded:
                typeof data.record.layout.calendarExpanded === "boolean"
                  ? data.record.layout.calendarExpanded
                  : localLayout.calendarExpanded,
              calendarHeight:
                typeof data.record.layout.calendarHeight === "number"
                  ? data.record.layout.calendarHeight
                  : localLayout.calendarHeight,
              categoryWidth:
                typeof data.record.layout.categoryWidth === "number"
                  ? data.record.layout.categoryWidth
                  : localLayout.categoryWidth,
              projectRailWidth:
                typeof data.record.layout.projectRailWidth === "number"
                  ? data.record.layout.projectRailWidth
                  : localLayout.projectRailWidth,
            };
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Project account sync is unavailable.", error);
      }

      setStore(localStore);
      setLayoutSizes(localLayout);
      setHydrated(true);
    }

    void hydrateProjects();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function applyAgentProjectUpdate(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      const parsed = projectRecordSchema.safeParse(detail);
      if (!parsed.success) return;
      setStore(parsed.data.store);
      setLayoutSizes(parsed.data.layout);
      setHydrated(true);
      setSaveState(accountPersistence ? "saved" : "idle");
    }

    window.addEventListener(projectRecordUpdatedEvent, applyAgentProjectUpdate);
    return () =>
      window.removeEventListener(
        projectRecordUpdatedEvent,
        applyAgentProjectUpdate,
      );
  }, [accountPersistence]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(projectStorageKey, JSON.stringify(store));
    window.localStorage.setItem(
      projectLayoutStorageKey,
      JSON.stringify(layoutSizes),
    );
    if (!accountPersistence) return;

    const saveTimer = window.setTimeout(() => {
      setSaveState("saving");
      fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: layoutSizes,
          store,
          version: 1,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Project sync failed.");
          setSaveState("saved");
        })
        .catch(() => setSaveState("error"));
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [accountPersistence, hydrated, layoutSizes, store]);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryIds = selectedCategoryId
      ? categoryDescendants(selectedCategoryId, store.categories)
      : null;
    return store.projects
      .filter((project) => project.archived === showArchived)
      .filter(
        (project) => statusFilter === "all" || project.status === statusFilter,
      )
      .filter(
        (project) =>
          !categoryIds ||
          (project.categoryId && categoryIds.has(project.categoryId)),
      )
      .filter(
        (project) =>
          !normalizedQuery ||
          `${project.name} ${project.summary}`
            .toLowerCase()
            .includes(normalizedQuery),
      );
  }, [
    query,
    selectedCategoryId,
    showArchived,
    statusFilter,
    store.categories,
    store.projects,
  ]);

  const selectedProject =
    store.projects.find((project) => project.id === selectedProjectId) ??
    visibleProjects[0] ??
    null;

  function updateStore(update: (current: ProjectStore) => ProjectStore) {
    setStore(update);
  }

  function saveProject(draft: ProjectDraft) {
    const now = new Date().toISOString();
    if (projectForm === "edit" && selectedProject) {
      updateStore((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === selectedProject.id
            ? { ...project, ...draft, updatedAt: now }
            : project,
        ),
      }));
    } else {
      const project: Project = {
        id: makeId("project"),
        ...draft,
        favorite: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      updateStore((current) => ({
        ...current,
        projects: [project, ...current.projects],
      }));
      setSelectedProjectId(project.id);
      setShowArchived(false);
      setSelectedCategoryId(null);
    }
    setProjectForm(null);
  }

  function removeCategory(categoryId: string) {
    const removedIds = categoryDescendants(categoryId, store.categories);
    updateStore((current) => ({
      ...current,
      categories: current.categories.filter((item) => !removedIds.has(item.id)),
      projects: current.projects.map((project) =>
        project.categoryId && removedIds.has(project.categoryId)
          ? {
              ...project,
              categoryId: null,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    }));
    if (selectedCategoryId && removedIds.has(selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }

  function swapProjects(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    updateStore((current) => {
      const sourceIndex = current.projects.findIndex(
        (project) => project.id === sourceId,
      );
      const targetIndex = current.projects.findIndex(
        (project) => project.id === targetId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const projects = [...current.projects];
      [projects[sourceIndex], projects[targetIndex]] = [
        projects[targetIndex],
        projects[sourceIndex],
      ];
      return { ...current, projects };
    });
  }

  function projectLayoutBounds() {
    const rect = projectLayoutRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 1200;
    const height = rect?.height ?? 720;
    return {
      maxCalendarHeight: Math.max(210, Math.min(400, height - 330)),
      width,
    };
  }

  function setCategoryWidth(nextWidth: number) {
    setLayoutSizes((current) => ({
      ...current,
      categoryWidth: Math.min(320, Math.max(170, nextWidth)),
    }));
  }

  function setProjectRailWidth(nextWidth: number) {
    setLayoutSizes((current) => ({
      ...current,
      projectRailWidth: Math.min(420, Math.max(220, nextWidth)),
    }));
  }

  function setCalendarHeight(nextHeight: number) {
    const { maxCalendarHeight } = projectLayoutBounds();
    setLayoutSizes((current) => ({
      ...current,
      calendarHeight: Math.min(maxCalendarHeight, Math.max(170, nextHeight)),
    }));
  }

  function startProjectResize(
    event: ReactPointerEvent<HTMLDivElement>,
    axis: "calendar" | "categories" | "projects",
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStateRef.current = {
      axis,
      pointerId: event.pointerId,
      startCalendarHeight: layoutSizes.calendarHeight,
      startCategoryWidth: layoutSizes.categoryWidth,
      startProjectRailWidth: layoutSizes.projectRailWidth,
      startX: event.clientX,
      startY: event.clientY,
    };
    setActiveResize(axis);
    document.body.style.cursor =
      axis === "calendar" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }

  function moveProjectResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = resizeStateRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    if (resize.axis === "categories") {
      const { width } = projectLayoutBounds();
      const virtualDelta =
        ((event.clientX - resize.startX) / width) *
        defaultProjectLayout.categoryWidth *
        5;
      setCategoryWidth(resize.startCategoryWidth + virtualDelta);
      return;
    }
    if (resize.axis === "projects") {
      const { width } = projectLayoutBounds();
      const virtualDelta =
        ((event.clientX - resize.startX) / width) *
        defaultProjectLayout.projectRailWidth *
        5;
      setProjectRailWidth(resize.startProjectRailWidth + virtualDelta);
      return;
    }
    setCalendarHeight(
      resize.startCalendarHeight - (event.clientY - resize.startY),
    );
  }

  function finishProjectResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeStateRef.current = null;
    setActiveResize(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  if (!hydrated) return <ProjectsWorkspaceSkeleton />;

  const totalActive = store.projects.filter(
    (project) => !project.archived && project.status === "active",
  ).length;
  const totalCompleted = store.projects.filter(
    (project) => !project.archived && project.status === "completed",
  ).length;
  const totalOpenTasks = store.projects
    .filter((project) => !project.archived)
    .reduce((count, project) => {
      const progress = projectProgress(
        project.id,
        store.localTasks,
        tasks,
        store.taskAssignments,
      );
      return count + progress.total - progress.completed;
    }, 0);
  const projectFiltersActive =
    query.trim().length > 0 || statusFilter !== "all";
  const categoryColumnShare = projectColumnShare(
    layoutSizes.categoryWidth,
    defaultProjectLayout.categoryWidth,
  );
  const projectRailColumnShare = projectColumnShare(
    layoutSizes.projectRailWidth,
    defaultProjectLayout.projectRailWidth,
  );

  function handleWorkspaceTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    let nextTab: "relay" | "github" | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      nextTab = workspaceTab === "relay" ? "github" : "relay";
    }
    if (event.key === "Home") nextTab = "relay";
    if (event.key === "End") nextTab = "github";
    if (!nextTab) return;

    event.preventDefault();
    setWorkspaceTab(nextTab);
    window.requestAnimationFrame(() => {
      document
        .getElementById(
          nextTab === "relay"
            ? "project-management-tab"
            : "github-projects-tab",
        )
        ?.focus();
    });
  }

  return (
    <div className="projects-workspace flex min-h-full flex-col gap-0 animate-fade-in md:h-full md:min-h-0">
      <header className="project-workspace-tabs shrink-0 px-3 pt-2">
        <div
          aria-label="Project workspaces"
          className="flex min-w-0 items-end gap-1"
          role="tablist"
        >
          <button
            aria-controls="project-management-panel"
            aria-selected={workspaceTab === "relay"}
            className="project-workspace-tab"
            data-active={workspaceTab === "relay" || undefined}
            id="project-management-tab"
            onClick={() => setWorkspaceTab("relay")}
            onKeyDown={handleWorkspaceTabKeyDown}
            role="tab"
            tabIndex={workspaceTab === "relay" ? 0 : -1}
            type="button"
          >
            <Folder className="h-4 w-4" />
            <span>Project management</span>
            <span className="project-workspace-tab__count">
              {store.projects.filter((project) => !project.archived).length}
            </span>
          </button>
          <button
            aria-controls="github-projects-panel"
            aria-selected={workspaceTab === "github"}
            className="project-workspace-tab"
            data-active={workspaceTab === "github" || undefined}
            id="github-projects-tab"
            onClick={() => setWorkspaceTab("github")}
            onKeyDown={handleWorkspaceTabKeyDown}
            role="tab"
            tabIndex={workspaceTab === "github" ? 0 : -1}
            type="button"
          >
            <GitBranch className="h-4 w-4" />
            <span>GitHub projects</span>
            <span className="project-workspace-tab__count">
              {repositories.length}
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2 pb-2 pl-2">
            {workspaceTab === "relay" ? (
              <>
                <span
                  className={`hidden text-[10px] font-medium sm:inline ${saveState === "error" ? "text-danger" : accountPersistence ? "text-muted" : "text-warning"}`}
                  title={
                    accountPersistence
                      ? `Project data is synced to ${accountLabel ?? "your account"}.`
                      : "Sign in to sync project data."
                  }
                >
                  {accountPersistence
                    ? saveState === "saving"
                      ? "Saving…"
                      : saveState === "error"
                        ? "Sync paused"
                        : "Account saved"
                    : "Local only"}
                </span>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
                  onClick={() => setProjectForm("new")}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New project</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {workspaceTab === "github" ? (
        <div
          aria-labelledby="github-projects-tab"
          className="project-github-workspace project-workspace-panel min-h-0 flex-1 overflow-hidden"
          id="github-projects-panel"
          role="tabpanel"
        >
          <GithubRepositoryExplorer
            githubLayout={githubLayout}
            repositories={repositories}
            repositoryError={repositoryError}
            setGithubLayout={setGithubLayout}
            signedIn={signedInToGithub}
            tasks={repositoryTasks}
          />
        </div>
      ) : (
        <>
          <div
            aria-labelledby="project-management-tab"
            className="project-workspace-panel project-resizable-layout grid min-h-0 min-w-0 flex-1 gap-0 overflow-hidden"
            data-categories-collapsed={categoriesCollapsed || undefined}
            id="project-management-panel"
            ref={projectLayoutRef}
            role="tabpanel"
            style={
              {
                "--project-calendar-height": `${layoutSizes.calendarHeight}px`,
                "--project-category-width": `${categoryColumnShare}%`,
                "--project-rail-width": `${projectRailColumnShare}%`,
              } as CSSProperties
            }
          >
            <aside
              className="project-spine project-workspace-pane relative flex h-80 min-h-0 min-w-0 flex-col overflow-hidden md:h-auto"
              data-collapsed={categoriesCollapsed || undefined}
            >
              <div className="border-b border-separator p-3">
                <div
                  className={`flex items-center ${categoriesCollapsed ? "flex-col gap-1" : "gap-1"}`}
                >
                  <button
                    aria-label="All projects"
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${selectedCategoryId === null ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-secondary hover:text-foreground"}`}
                    onClick={() => setSelectedCategoryId(null)}
                    title={categoriesCollapsed ? "All projects" : undefined}
                    type="button"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    {!categoriesCollapsed ? <span>All projects</span> : null}
                    {!categoriesCollapsed ? (
                      <span className="ml-auto text-[11px] tabular-nums">
                        {
                          store.projects.filter(
                            (project) => project.archived === showArchived,
                          ).length
                        }
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
              <div
                className={`min-h-0 flex-1 overflow-y-auto ${categoriesCollapsed ? "px-1 py-3" : "p-3"}`}
              >
                <div className="mb-2 flex items-center justify-between px-2">
                  {!categoriesCollapsed ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Categories
                    </p>
                  ) : null}
                  {!categoriesCollapsed ? (
                    <button
                      aria-label="Add category"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-secondary hover:text-accent"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setAddingCategoryParentId("root");
                      }}
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                {addingCategoryParentId === "root" ? (
                  <ProjectCategoryInlineForm
                    className="mb-2"
                    label="New top-level category"
                    onCancel={() => setAddingCategoryParentId(null)}
                    onSave={(name, icon) => {
                      updateStore((current) => ({
                        ...current,
                        categories: [
                          ...current.categories,
                          {
                            id: makeId("project-category"),
                            icon,
                            name,
                            parentId: null,
                          },
                        ],
                      }));
                      setAddingCategoryParentId(null);
                    }}
                  />
                ) : null}
                {store.categories.length ? (
                  <TreeProvider
                    defaultExpandedIds={store.categories.map(
                      (category) => category.id,
                    )}
                    indent={categoriesCollapsed ? 10 : 22}
                    selectable={false}
                    showLines
                  >
                    <TreeView className="p-0">
                      <ProjectCategoryTreeBranch
                        addingParentId={addingCategoryParentId}
                        categories={store.categories}
                        compact={categoriesCollapsed}
                        editingId={editingCategoryId}
                        onAdd={(name, parentId, icon) =>
                          updateStore((current) => ({
                            ...current,
                            categories: [
                              ...current.categories,
                              {
                                id: makeId("project-category"),
                                icon,
                                name,
                                parentId,
                              },
                            ],
                          }))
                        }
                        onAddingParentChange={setAddingCategoryParentId}
                        onDelete={removeCategory}
                        onEditingChange={setEditingCategoryId}
                        onRename={(id, name, icon) =>
                          updateStore((current) => ({
                            ...current,
                            categories: current.categories.map((category) =>
                              category.id === id
                                ? { ...category, icon, name }
                                : category,
                            ),
                          }))
                        }
                        onSelect={setSelectedCategoryId}
                        parentId={null}
                        projects={store.projects.filter(
                          (project) => project.archived === showArchived,
                        )}
                        selectedId={selectedCategoryId}
                      />
                    </TreeView>
                  </TreeProvider>
                ) : (
                  <p className="rounded-lg border border-dashed border-separator px-3 py-5 text-center text-xs text-muted">
                    Add a category to start the tree.
                  </p>
                )}
              </div>
              <div
                className={`border-t border-separator ${categoriesCollapsed ? "p-2" : "p-3"}`}
              >
                {categoriesCollapsed ? (
                  <button
                    aria-label="Expand project categories"
                    className="grid h-9 w-full place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-accent"
                    onClick={() => {
                      setCategoriesCollapsed(false);
                      setAddingCategoryParentId(null);
                      setEditingCategoryId(null);
                    }}
                    title="Expand categories"
                    type="button"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <button
                        aria-label={
                          showArchived
                            ? "Back to projects"
                            : "Archived projects"
                        }
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${showArchived ? "bg-surface-secondary text-foreground" : "text-muted hover:bg-surface-secondary hover:text-foreground"}`}
                        onClick={() => {
                          setShowArchived((current) => !current);
                          setSelectedCategoryId(null);
                        }}
                        type="button"
                      >
                        <Archive className="h-4 w-4 shrink-0" />
                        <span>
                          {showArchived ? "Back to projects" : "Archived"}
                        </span>
                      </button>
                      <button
                        aria-label="Collapse project categories"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-accent"
                        onClick={() => {
                          setCategoriesCollapsed(true);
                          setAddingCategoryParentId(null);
                          setEditingCategoryId(null);
                        }}
                        title="Collapse categories"
                        type="button"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-2 text-center">
                      <div>
                        <p className="text-sm font-semibold tabular-nums">
                          {totalActive}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-muted">
                          Active
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold tabular-nums">
                          {totalOpenTasks}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-muted">
                          Open
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold tabular-nums">
                          {totalCompleted}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-muted">
                          Done
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>

            <ProjectResizeHandle
              active={activeResize === "categories"}
              ariaLabel="Resize project categories"
              defaultValue={defaultProjectLayout.categoryWidth}
              max={320}
              min={170}
              onChange={setCategoryWidth}
              onPointerDown={(event) => startProjectResize(event, "categories")}
              onPointerMove={moveProjectResize}
              onPointerUp={finishProjectResize}
              orientation="vertical"
              value={layoutSizes.categoryWidth}
            />

            <section className="project-workspace-pane flex h-[28rem] min-h-0 min-w-0 flex-col overflow-hidden md:h-auto">
              <div className="border-b border-separator p-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {showArchived
                        ? "Archived projects"
                        : selectedCategoryId
                          ? categoryPath(selectedCategoryId, store.categories)
                          : "All projects"}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {visibleProjects.length}{" "}
                      {visibleProjects.length === 1 ? "project" : "projects"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Project rail options"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
                      title="Project rail options"
                      type="button"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      aria-expanded={projectFiltersExpanded}
                      aria-label={
                        projectFiltersExpanded
                          ? "Hide project filters"
                          : "Show project filters"
                      }
                      className={`relative grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-accent ${projectFiltersExpanded ? "bg-accent-soft text-accent" : ""}`}
                      onClick={() =>
                        setProjectFiltersExpanded((current) => !current)
                      }
                      title={
                        projectFiltersExpanded ? "Hide filters" : "Show filters"
                      }
                      type="button"
                    >
                      <Filter className="h-4 w-4" />
                      {projectFiltersActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                        />
                      ) : null}
                    </button>
                  </div>
                </div>
                {projectFiltersExpanded ? (
                  <div className="mt-3 grid gap-2">
                    <div className="relative min-w-0">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                      <input
                        aria-label="Search projects"
                        className="h-9 w-full rounded-lg border border-separator bg-surface-secondary pl-9 pr-3 text-xs outline-none placeholder:text-muted focus:border-accent"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search projects"
                        value={query}
                      />
                    </div>
                    <Select
                      aria-label="Filter project status"
                      className="h-9 w-full rounded-lg border border-separator bg-surface-secondary px-2.5 text-xs outline-none focus:border-accent"
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as ProjectStatus | "all",
                        )
                      }
                      value={statusFilter}
                    >
                      <option value="all">All statuses</option>
                      {Object.entries(statusMeta).map(([value, meta]) => (
                        <option key={value} value={value}>
                          {meta.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {visibleProjects.length ? (
                  visibleProjects.map((project) => {
                    const progress = projectProgress(
                      project.id,
                      store.localTasks,
                      tasks,
                      store.taskAssignments,
                    );
                    return (
                      <button
                        className={`project-list-card relative mb-2 w-full overflow-hidden rounded-xl border p-3 text-left transition ${
                          selectedProject?.id === project.id
                            ? "bg-accent-soft shadow-surface"
                            : "border-transparent hover:border-separator hover:bg-surface-secondary"
                        } ${draggedProjectId === project.id ? "opacity-45" : ""} ${
                          dragOverProjectId === project.id
                            ? "translate-y-0.5"
                            : ""
                        }`}
                        draggable
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setTab("overview");
                        }}
                        onDragEnd={() => {
                          setDraggedProjectId(null);
                          setDragOverProjectId(null);
                        }}
                        onDragOver={(
                          event: ReactDragEvent<HTMLButtonElement>,
                        ) => {
                          event.preventDefault();
                          if (
                            draggedProjectId &&
                            draggedProjectId !== project.id
                          ) {
                            setDragOverProjectId(project.id);
                          }
                        }}
                        onDragStart={(
                          event: ReactDragEvent<HTMLButtonElement>,
                        ) => {
                          setDraggedProjectId(project.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", project.id);
                        }}
                        onDrop={(event: ReactDragEvent<HTMLButtonElement>) => {
                          event.preventDefault();
                          const sourceId =
                            event.dataTransfer.getData("text/plain") ||
                            draggedProjectId;
                          if (sourceId) swapProjects(sourceId, project.id);
                          setDraggedProjectId(null);
                          setDragOverProjectId(null);
                        }}
                        style={
                          selectedProject?.id === project.id
                            ? { borderColor: project.color }
                            : undefined
                        }
                        type="button"
                      >
                        <span
                          className="absolute inset-y-3 left-0 w-0.5 rounded-r-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface shadow-surface"
                            style={{ color: project.color }}
                          >
                            <Folder className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate text-sm font-semibold">
                                {project.name}
                              </h3>
                              {project.favorite ? (
                                <Star className="h-3 w-3 shrink-0 fill-warning text-warning" />
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-[11px] text-muted">
                              {categoryPath(
                                project.categoryId,
                                store.categories,
                              )}
                            </p>
                          </div>
                          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted/55 active:cursor-grabbing" />
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
                              <span>
                                {progress.completed}/{progress.total} tasks
                              </span>
                              <span>{progress.percent}%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-default">
                              <div
                                className="h-full rounded-full transition-[width]"
                                style={{
                                  backgroundColor: project.color,
                                  width: `${progress.percent}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-semibold ${statusMeta[project.status].className}`}
                          >
                            {statusMeta[project.status].label}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Search className="mx-auto h-5 w-5 text-muted" />
                    <p className="mt-3 text-sm font-medium">No projects here</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Try another category or status, or create a project.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <ProjectResizeHandle
              active={activeResize === "projects"}
              ariaLabel="Resize project rail"
              defaultValue={defaultProjectLayout.projectRailWidth}
              max={420}
              min={220}
              onChange={setProjectRailWidth}
              onPointerDown={(event) => startProjectResize(event, "projects")}
              onPointerMove={moveProjectResize}
              onPointerUp={finishProjectResize}
              orientation="vertical"
              value={layoutSizes.projectRailWidth}
            />

            <section className="project-workspace-pane flex min-h-[36rem] min-w-0 flex-col overflow-hidden md:min-h-0">
              {selectedProject ? (
                (() => {
                  const progress = projectProgress(
                    selectedProject.id,
                    store.localTasks,
                    tasks,
                    store.taskAssignments,
                  );
                  const projectNotes = store.notes.filter(
                    (note) => note.projectId === selectedProject.id,
                  );
                  const projectRepositories =
                    store.repositoryAssignments[selectedProject.id] ?? [];
                  const projectMilestones = store.milestones.filter(
                    (milestone) => milestone.projectId === selectedProject.id,
                  );
                  const projectLocalTasks = store.localTasks.filter(
                    (task) => task.projectId === selectedProject.id,
                  );
                  const linkedProjectTasks = tasks.filter(
                    (task) =>
                      store.taskAssignments[task.id] === selectedProject.id,
                  );
                  const openProjectTasks = progress.total - progress.completed;
                  return (
                    <>
                      <div className="shrink-0 border-b border-separator px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-4">
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-secondary"
                            style={{ color: selectedProject.color }}
                          >
                            <FolderOpen className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-semibold sm:text-xl">
                                {selectedProject.name}
                              </h2>
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta[selectedProject.status].className}`}
                              >
                                {statusMeta[selectedProject.status].label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {categoryPath(
                                selectedProject.categoryId,
                                store.categories,
                              )}{" "}
                              · Updated{" "}
                              {relativeProjectDate(selectedProject.updatedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              aria-expanded={layoutSizes.calendarExpanded}
                              aria-label={
                                layoutSizes.calendarExpanded
                                  ? "Collapse project calendar"
                                  : "Expand project calendar"
                              }
                              className={`relative grid h-9 w-9 place-items-center rounded-lg transition hover:bg-surface-secondary ${layoutSizes.calendarExpanded ? "text-accent" : "text-muted"}`}
                              onClick={() =>
                                setLayoutSizes((current) => ({
                                  ...current,
                                  calendarExpanded: !current.calendarExpanded,
                                }))
                              }
                              title={
                                layoutSizes.calendarExpanded
                                  ? "Collapse calendar"
                                  : "Expand calendar"
                              }
                              type="button"
                            >
                              <CalendarDays className="h-4 w-4" />
                              <ChevronDown
                                className={`absolute bottom-1 right-1 h-2.5 w-2.5 transition-transform ${layoutSizes.calendarExpanded ? "" : "-rotate-90"}`}
                              />
                            </button>
                            <button
                              aria-label={
                                selectedProject.favorite
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                              className={`grid h-9 w-9 place-items-center rounded-lg transition hover:bg-surface-secondary ${selectedProject.favorite ? "text-warning" : "text-muted"}`}
                              onClick={() =>
                                updateStore((current) => ({
                                  ...current,
                                  projects: current.projects.map((project) =>
                                    project.id === selectedProject.id
                                      ? {
                                          ...project,
                                          favorite: !project.favorite,
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : project,
                                  ),
                                }))
                              }
                              type="button"
                            >
                              <Star
                                className={`h-4 w-4 ${selectedProject.favorite ? "fill-current" : ""}`}
                              />
                            </button>
                            <button
                              aria-label="Edit project"
                              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
                              onClick={() => setProjectForm("edit")}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              aria-label={
                                selectedProject.archived
                                  ? "Restore project"
                                  : "Archive project"
                              }
                              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
                              onClick={() =>
                                updateStore((current) => ({
                                  ...current,
                                  projects: current.projects.map((project) =>
                                    project.id === selectedProject.id
                                      ? {
                                          ...project,
                                          archived: !project.archived,
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : project,
                                  ),
                                }))
                              }
                              type="button"
                            >
                              {selectedProject.archived ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              aria-label="Delete project"
                              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                              onClick={() => setDeleteProject(selectedProject)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        className="project-detail-stack grid min-h-0 min-w-0 flex-1 md:gap-0"
                        data-calendar-collapsed={
                          !layoutSizes.calendarExpanded || undefined
                        }
                      >
                        <Tabs
                          className="flex min-h-0 flex-col overflow-hidden"
                          onSelectionChange={(key) => setTab(key as ProjectTab)}
                          selectedKey={tab}
                        >
                          <Tabs.ListContainer className="project-tabs-list-container shrink-0 rounded-none border-b border-separator bg-surface">
                            <Tabs.List
                              aria-label={`${selectedProject.name} sections`}
                              className={projectTabsListClassName}
                            >
                              <Tabs.Tab id="overview">
                                Overview
                                <Tabs.Indicator />
                              </Tabs.Tab>
                              <Tabs.Tab id="roadmap">
                                Roadmap
                                <span className="project-tab-badge">
                                  {projectMilestones.length}
                                </span>
                                <Tabs.Indicator />
                              </Tabs.Tab>
                              <Tabs.Tab id="tasks">
                                Tasks
                                <span className="project-tab-badge">
                                  {progress.total}
                                </span>
                                <Tabs.Indicator />
                              </Tabs.Tab>
                              <Tabs.Tab id="notes">
                                Notes
                                <span className="project-tab-badge">
                                  {projectNotes.length}
                                </span>
                                <Tabs.Indicator />
                              </Tabs.Tab>
                              <Tabs.Tab id="repositories">
                                Repositories
                                <span className="project-tab-badge">
                                  {projectRepositories.length}
                                </span>
                                <Tabs.Indicator />
                              </Tabs.Tab>
                            </Tabs.List>
                          </Tabs.ListContainer>
                          <Tabs.Panel
                            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                            id="overview"
                          >
                            <div className="grid gap-5">
                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-separator p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted">
                                      Progress
                                    </span>
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  </div>
                                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                                    {progress.percent}%
                                  </p>
                                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-default">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        backgroundColor: selectedProject.color,
                                        width: `${progress.percent}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="rounded-xl border border-separator p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted">
                                      Open tasks
                                    </span>
                                    <ClipboardList className="h-4 w-4 text-accent" />
                                  </div>
                                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                                    {openProjectTasks}
                                  </p>
                                  <p className="mt-2 text-[11px] text-muted">
                                    {progress.completed} completed
                                  </p>
                                </div>
                                <div className="rounded-xl border border-separator p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted">
                                      Due date
                                    </span>
                                    <CalendarDays className="h-4 w-4 text-warning" />
                                  </div>
                                  <p className="mt-3 text-sm font-semibold">
                                    {formatProjectDate(selectedProject.dueDate)}
                                  </p>
                                  <p className="mt-2 text-[11px] capitalize text-muted">
                                    {selectedProject.priority} priority
                                  </p>
                                </div>
                              </div>
                              <ProjectMilestoneSummary
                                milestones={projectMilestones}
                                onOpenRoadmap={() => setTab("roadmap")}
                                project={selectedProject}
                              />
                              <div className="grid gap-4 xl:grid-cols-2">
                                <section className="rounded-xl border border-separator p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-sm font-semibold">
                                        Next actions
                                      </h3>
                                      <p className="mt-0.5 text-[11px] text-muted">
                                        What moves this project now
                                      </p>
                                    </div>
                                    <button
                                      className="text-xs font-semibold text-accent hover:underline"
                                      onClick={() => setTab("tasks")}
                                      type="button"
                                    >
                                      View tasks
                                    </button>
                                  </div>
                                  <div className="mt-4 grid gap-2">
                                    {[
                                      ...store.localTasks.filter(
                                        (task) =>
                                          task.projectId === selectedProject.id,
                                      ),
                                      ...tasks.filter(
                                        (task) =>
                                          store.taskAssignments[task.id] ===
                                          selectedProject.id,
                                      ),
                                    ]
                                      .filter((task) => !task.completed)
                                      .slice(0, 4)
                                      .map((task) => (
                                        <div
                                          className="flex items-center gap-2.5 rounded-lg bg-surface-secondary px-3 py-2.5"
                                          key={task.id}
                                        >
                                          <Circle className="h-3.5 w-3.5 shrink-0 text-accent" />
                                          <p className="min-w-0 flex-1 truncate text-xs font-medium">
                                            {task.title}
                                          </p>
                                        </div>
                                      ))}
                                    {openProjectTasks === 0 ? (
                                      <div className="rounded-lg border border-dashed border-separator px-3 py-6 text-center text-xs text-muted">
                                        No open tasks
                                      </div>
                                    ) : null}
                                  </div>
                                </section>
                                <section className="rounded-xl border border-separator p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-sm font-semibold">
                                        Recent notes
                                      </h3>
                                      <p className="mt-0.5 text-[11px] text-muted">
                                        Context worth keeping close
                                      </p>
                                    </div>
                                    <button
                                      className="text-xs font-semibold text-accent hover:underline"
                                      onClick={() => setTab("notes")}
                                      type="button"
                                    >
                                      View notes
                                    </button>
                                  </div>
                                  <div className="mt-4 grid gap-2">
                                    {projectNotes
                                      .sort(
                                        (left, right) =>
                                          new Date(right.updatedAt).getTime() -
                                          new Date(left.updatedAt).getTime(),
                                      )
                                      .slice(0, 3)
                                      .map((note) => (
                                        <div
                                          className="rounded-lg bg-surface-secondary px-3 py-2.5"
                                          key={note.id}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                                              {
                                                noteSectionMeta[note.section]
                                                  .label
                                              }
                                            </p>
                                            <span className="text-[9px] text-muted">
                                              {relativeProjectDate(
                                                note.updatedAt,
                                              )}
                                            </span>
                                          </div>
                                          <p className="mt-1 line-clamp-2 text-xs leading-5">
                                            {note.body}
                                          </p>
                                        </div>
                                      ))}
                                    {projectNotes.length === 0 ? (
                                      <div className="rounded-lg border border-dashed border-separator px-3 py-6 text-center text-xs text-muted">
                                        No notes captured yet
                                      </div>
                                    ) : null}
                                  </div>
                                </section>
                              </div>
                            </div>
                          </Tabs.Panel>
                          <Tabs.Panel
                            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                            id="roadmap"
                          >
                            <ProjectRoadmapPanel
                              onStoreChange={updateStore}
                              project={selectedProject}
                              store={store}
                            />
                          </Tabs.Panel>
                          <Tabs.Panel
                            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                            id="tasks"
                          >
                            <TaskPanel
                              onCompleteLinkedTask={onCompleteTask}
                              onCreateTask={onCreateTask}
                              onOpenLinkedTask={onOpenTask}
                              onStoreChange={updateStore}
                              project={selectedProject}
                              store={store}
                              taskLists={taskLists}
                              tasks={tasks}
                            />
                          </Tabs.Panel>
                          <Tabs.Panel
                            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                            id="notes"
                          >
                            <NotesPanel
                              onStoreChange={updateStore}
                              project={selectedProject}
                              store={store}
                            />
                          </Tabs.Panel>
                          <Tabs.Panel
                            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                            id="repositories"
                          >
                            <RepositoryPanel
                              onStoreChange={updateStore}
                              project={selectedProject}
                              repositories={repositories}
                              store={store}
                            />
                          </Tabs.Panel>
                        </Tabs>
                        {layoutSizes.calendarExpanded ? (
                          <ProjectResizeHandle
                            active={activeResize === "calendar"}
                            ariaLabel="Resize project details and calendar"
                            defaultValue={defaultProjectLayout.calendarHeight}
                            max={400}
                            min={170}
                            onChange={setCalendarHeight}
                            onPointerDown={(event) =>
                              startProjectResize(event, "calendar")
                            }
                            onPointerMove={moveProjectResize}
                            onPointerUp={finishProjectResize}
                            orientation="horizontal"
                            value={layoutSizes.calendarHeight}
                          />
                        ) : null}
                        {layoutSizes.calendarExpanded ? (
                          <ProjectMiniCalendar
                            key={`${selectedProject.id}-calendar`}
                            localTasks={projectLocalTasks}
                            onOpenTask={onOpenTask}
                            project={selectedProject}
                            tasks={linkedProjectTasks}
                          />
                        ) : null}
                      </div>
                    </>
                  );
                })()
              ) : (
                <EmptyProjects onCreate={() => setProjectForm("new")} />
              )}
            </section>
          </div>

          {projectForm ? (
            <ProjectForm
              categories={store.categories}
              initial={
                projectForm === "edit"
                  ? (selectedProject ?? undefined)
                  : undefined
              }
              onClose={() => setProjectForm(null)}
              onSave={saveProject}
            />
          ) : null}
          {deleteProject ? (
            <ModalShell
              onClose={() => setDeleteProject(null)}
              title="Delete project"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">
                    Delete {deleteProject.name}?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    This removes its project tasks and notes. Linked Relay tasks
                    will stay in Tasks.
                  </p>
                </div>
              </div>
              <div className="mt-7 flex justify-end gap-2">
                <button
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-surface-secondary"
                  onClick={() => setDeleteProject(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-10 rounded-xl bg-danger px-4 text-sm font-semibold text-danger-foreground hover:opacity-90"
                  onClick={() => {
                    const id = deleteProject.id;
                    updateStore((current) => {
                      const repositoryAssignments = {
                        ...current.repositoryAssignments,
                      };
                      delete repositoryAssignments[id];
                      return {
                        ...current,
                        projects: current.projects.filter(
                          (project) => project.id !== id,
                        ),
                        notes: current.notes.filter(
                          (note) => note.projectId !== id,
                        ),
                        localTasks: current.localTasks.filter(
                          (task) => task.projectId !== id,
                        ),
                        milestones: current.milestones.filter(
                          (milestone) => milestone.projectId !== id,
                        ),
                        taskAssignments: Object.fromEntries(
                          Object.entries(current.taskAssignments).filter(
                            ([, projectId]) => projectId !== id,
                          ),
                        ),
                        repositoryAssignments,
                      };
                    });
                    setDeleteProject(null);
                    setSelectedProjectId(null);
                  }}
                  type="button"
                >
                  Delete project
                </button>
              </div>
            </ModalShell>
          ) : null}
        </>
      )}
    </div>
  );
}
