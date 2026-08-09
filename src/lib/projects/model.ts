import { z } from "zod";

export const projectStorageKey = "relay.projects.v1";
export const projectLayoutStorageKey = "relay.project-layout.v1";
export const projectRecordUpdatedEvent = "relay:project-record-updated";

export const projectStatuses = [
  "planning",
  "active",
  "on-hold",
  "completed",
] as const;
export const projectPriorities = ["low", "medium", "high"] as const;
export const projectNoteSections = [
  "brief",
  "research",
  "decisions",
  "updates",
] as const;
export const projectMilestoneStatuses = [
  "planned",
  "in-progress",
  "completed",
] as const;
export const projectCategoryIcons = [
  "book",
  "briefcase",
  "code",
  "fitness",
  "folder",
  "globe",
  "heart",
  "home",
  "palette",
  "plane",
  "rocket",
  "shopping",
  "sparkles",
  "target",
  "users",
] as const;

export const projectColors = [
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
] as const;

export const projectStatusSchema = z.enum(projectStatuses);
export const projectPrioritySchema = z.enum(projectPriorities);
export const projectNoteSectionSchema = z.enum(projectNoteSections);
export const projectMilestoneStatusSchema = z.enum(projectMilestoneStatuses);
export const projectCategoryIconSchema = z.enum(projectCategoryIcons);
export const projectColorSchema = z.string().regex(/^#[\da-f]{6}$/i);

export const projectSchema = z.object({
  archived: z.boolean(),
  categoryId: z.string().nullable(),
  color: projectColorSchema,
  createdAt: z.string(),
  dueDate: z.string().nullable(),
  favorite: z.boolean(),
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  priority: projectPrioritySchema,
  status: projectStatusSchema,
  summary: z.string().max(500),
  updatedAt: z.string(),
});

export const projectCategorySchema = z.object({
  icon: projectCategoryIconSchema,
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  parentId: z.string().nullable(),
});

export const projectNoteSchema = z.object({
  body: z.string().min(1),
  createdAt: z.string(),
  id: z.string().min(1),
  projectId: z.string().min(1),
  section: projectNoteSectionSchema,
  updatedAt: z.string(),
});

export const localProjectTaskSchema = z.object({
  completed: z.boolean(),
  createdAt: z.string(),
  dueDate: z.string().nullable(),
  id: z.string().min(1),
  priority: projectPrioritySchema,
  projectId: z.string().min(1),
  title: z.string().min(1),
});

export const projectMilestoneSchema = z.object({
  createdAt: z.string(),
  description: z.string().max(500),
  id: z.string().min(1),
  projectId: z.string().min(1),
  status: projectMilestoneStatusSchema,
  targetDate: z.string().nullable(),
  title: z.string().min(1).max(120),
  updatedAt: z.string(),
});

export const projectStoreSchema = z.object({
  projects: z.array(projectSchema),
  categories: z.array(projectCategorySchema),
  notes: z.array(projectNoteSchema),
  localTasks: z.array(localProjectTaskSchema),
  taskAssignments: z.record(z.string(), z.string()),
  repositoryAssignments: z
    .record(z.string(), z.array(z.string()))
    .optional()
    .default({}),
  milestones: z.array(projectMilestoneSchema).optional().default([]),
});

export const projectLayoutSchema = z.object({
  calendarExpanded: z.boolean().optional().default(true),
  calendarHeight: z.number().min(170).max(400),
  categoryWidth: z.number().min(170).max(320),
  projectRailWidth: z.number().min(220).max(420),
});

export const projectRecordSchema = z.object({
  store: projectStoreSchema,
  layout: projectLayoutSchema,
  version: z.literal(1),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectCategory = z.infer<typeof projectCategorySchema>;
export type ProjectCategoryIconName = z.infer<
  typeof projectCategoryIconSchema
>;
export type ProjectLayout = z.infer<typeof projectLayoutSchema>;
export type ProjectMilestone = z.infer<typeof projectMilestoneSchema>;
export type ProjectMilestoneStatus = z.infer<
  typeof projectMilestoneStatusSchema
>;
export type ProjectNote = z.infer<typeof projectNoteSchema>;
export type ProjectNoteSection = z.infer<typeof projectNoteSectionSchema>;
export type ProjectPriority = z.infer<typeof projectPrioritySchema>;
export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectStore = z.infer<typeof projectStoreSchema>;
export type LocalProjectTask = z.infer<typeof localProjectTaskSchema>;

export const defaultProjectLayout: ProjectLayout = {
  calendarExpanded: true,
  calendarHeight: 210,
  categoryWidth: 210,
  projectRailWidth: 270,
};

export const defaultProjectCategories: ProjectCategory[] = [
  { id: "work", icon: "briefcase", name: "Work", parentId: null },
  { id: "work-internal", icon: "target", name: "Internal", parentId: "work" },
  { id: "personal", icon: "home", name: "Personal", parentId: null },
];

export const emptyProjectStore: ProjectStore = {
  projects: [],
  categories: defaultProjectCategories,
  notes: [],
  localTasks: [],
  taskAssignments: {},
  repositoryAssignments: {},
  milestones: [],
};

export const defaultProjectRecord: ProjectRecord = {
  layout: defaultProjectLayout,
  store: emptyProjectStore,
  version: 1,
};

export function parseProjectStore(value: unknown): ProjectStore {
  const parsed = projectStoreSchema.safeParse(value);
  return parsed.success ? parsed.data : structuredClone(emptyProjectStore);
}

export function parseProjectRecord(value: unknown): ProjectRecord {
  const parsed = projectRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : structuredClone(defaultProjectRecord);
}

export function makeProjectEntityId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function projectCategoryDescendantIds(
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
