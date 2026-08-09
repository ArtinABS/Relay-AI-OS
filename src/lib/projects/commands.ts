import { z } from "zod";

import {
  makeProjectEntityId,
  projectCategoryDescendantIds,
  projectCategoryIconSchema,
  projectColorSchema,
  projectMilestoneStatusSchema,
  projectNoteSectionSchema,
  projectPrioritySchema,
  projectStatusSchema,
  type LocalProjectTask,
  type Project,
  type ProjectCategory,
  type ProjectMilestone,
  type ProjectNote,
  type ProjectRecord,
} from "@/lib/projects/model";

export const inspectProjectWorkspaceSchema = z.object({
  projectRef: z
    .string()
    .optional()
    .describe("Optional exact project id or name to inspect in detail."),
  query: z
    .string()
    .optional()
    .describe("Optional text filter for project name or summary."),
  includeArchived: z.boolean().default(false),
});

export const manageProjectSchema = z.object({
  action: z.enum([
    "create",
    "update",
    "delete",
    "set_favorite",
    "set_archived",
    "reorder",
    "update_layout",
  ]),
  projectRef: z.string().optional(),
  targetProjectRef: z.string().optional(),
  name: z.string().min(1).max(80).optional(),
  summary: z.string().max(500).optional(),
  status: projectStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  categoryRef: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  color: projectColorSchema.optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  calendarExpanded: z.boolean().optional(),
  calendarHeight: z.number().min(170).max(400).optional(),
  categoryWidth: z.number().min(170).max(320).optional(),
  projectRailWidth: z.number().min(220).max(420).optional(),
  confirmed: z.boolean().default(false),
});

export const manageProjectCategorySchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  categoryRef: z.string().optional(),
  parentCategoryRef: z.string().nullable().optional(),
  name: z.string().min(1).max(80).optional(),
  icon: projectCategoryIconSchema.optional(),
  confirmed: z.boolean().default(false),
});

export const manageProjectNoteSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  projectRef: z.string().optional(),
  noteRef: z.string().optional(),
  section: projectNoteSectionSchema.optional(),
  body: z.string().min(1).optional(),
  confirmed: z.boolean().default(false),
});

export const manageProjectMilestoneSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  projectRef: z.string().optional(),
  milestoneRef: z.string().optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  targetDate: z.string().nullable().optional(),
  status: projectMilestoneStatusSchema.optional(),
  confirmed: z.boolean().default(false),
});

export const manageProjectTaskSchema = z.object({
  action: z.enum([
    "create_local",
    "update_local",
    "delete_local",
    "link_existing",
    "unlink_existing",
  ]),
  projectRef: z.string().optional(),
  taskRef: z.string().optional(),
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  priority: projectPrioritySchema.optional(),
  confirmed: z.boolean().default(false),
});

export const manageProjectRepositorySchema = z.object({
  action: z.enum(["assign", "unassign"]),
  projectRef: z.string(),
  repositoryFullName: z
    .string()
    .min(3)
    .describe("GitHub repository in owner/name form."),
});

type CommandResult = {
  ok: boolean;
  reason?: string;
  changed?: string;
  entity?: unknown;
  candidates?: Array<{ id: string; name: string }>;
};

export type ProjectCommandOutcome = {
  changed: boolean;
  record: ProjectRecord;
  result: CommandResult;
};

type NamedEntity = { id: string; name?: string; title?: string; body?: string };
type ResolvedEntity<T> =
  | { entity: T }
  | {
      error: string;
      candidates: Array<{ id: string; name: string }>;
    };

function displayName(item: NamedEntity) {
  return item.name ?? item.title ?? item.body?.slice(0, 80) ?? item.id;
}

function resolveEntity<T extends NamedEntity>(
  items: T[],
  ref: string | undefined,
  label: string,
): ResolvedEntity<T> {
  if (!ref?.trim()) {
    return {
      error: `A ${label} id or name is required.`,
      candidates: [],
    };
  }
  const normalized = ref.trim().toLowerCase();
  const byId = items.find((item) => item.id === ref.trim());
  if (byId) return { entity: byId };
  const exact = items.filter(
    (item) => displayName(item).trim().toLowerCase() === normalized,
  );
  if (exact.length === 1) return { entity: exact[0]! };
  const partial = items.filter((item) =>
    displayName(item).toLowerCase().includes(normalized),
  );
  if (partial.length === 1) return { entity: partial[0]! };
  const candidates = (exact.length ? exact : partial).map((item) => ({
    id: item.id,
    name: displayName(item),
  }));
  return {
    error: candidates.length
      ? `That ${label} reference is ambiguous.`
      : `No ${label} matched "${ref}".`,
    candidates,
  };
}

function unchanged(record: ProjectRecord, reason: string, candidates?: CommandResult["candidates"]): ProjectCommandOutcome {
  return { changed: false, record, result: { ok: false, reason, candidates } };
}

function updated(
  record: ProjectRecord,
  changed: string,
  entity?: unknown,
): ProjectCommandOutcome {
  return {
    changed: true,
    record,
    result: { ok: true, changed, entity },
  };
}

function resolveProject(record: ProjectRecord, ref?: string) {
  return resolveEntity(record.store.projects, ref, "project");
}

function resolveCategory(
  record: ProjectRecord,
  ref?: string | null,
): ResolvedEntity<ProjectCategory | null> {
  if (ref === null) return { entity: null };
  return resolveEntity(record.store.categories, ref, "project category");
}

export function inspectProjectWorkspace(
  record: ProjectRecord,
  input: z.infer<typeof inspectProjectWorkspaceSchema>,
) {
  if (input.projectRef) {
    const resolved = resolveProject(record, input.projectRef);
    if (!("entity" in resolved)) {
      return { ok: false, reason: resolved.error, candidates: resolved.candidates };
    }
    const project = resolved.entity;
    return {
      ok: true,
      project,
      category:
        record.store.categories.find((item) => item.id === project.categoryId) ??
        null,
      notes: record.store.notes.filter((item) => item.projectId === project.id),
      localTasks: record.store.localTasks.filter(
        (item) => item.projectId === project.id,
      ),
      linkedTaskIds: Object.entries(record.store.taskAssignments)
        .filter(([, projectId]) => projectId === project.id)
        .map(([taskId]) => taskId),
      repositories: record.store.repositoryAssignments[project.id] ?? [],
      milestones: record.store.milestones.filter(
        (item) => item.projectId === project.id,
      ),
    };
  }

  const query = input.query?.trim().toLowerCase() ?? "";
  const projects = record.store.projects.filter(
    (project) =>
      (input.includeArchived || !project.archived) &&
      (!query ||
        `${project.name} ${project.summary}`.toLowerCase().includes(query)),
  );
  return {
    ok: true,
    categories: record.store.categories,
    layout: record.layout,
    projects: projects.map((project) => ({
      ...project,
      localTaskCount: record.store.localTasks.filter(
        (item) => item.projectId === project.id,
      ).length,
      linkedTaskCount: Object.values(record.store.taskAssignments).filter(
        (projectId) => projectId === project.id,
      ).length,
      milestoneCount: record.store.milestones.filter(
        (item) => item.projectId === project.id,
      ).length,
      noteCount: record.store.notes.filter(
        (item) => item.projectId === project.id,
      ).length,
      repositoryCount:
        record.store.repositoryAssignments[project.id]?.length ?? 0,
    })),
  };
}

export function manageProject(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectSchema>,
): ProjectCommandOutcome {
  const next = structuredClone(record);
  if (input.action === "update_layout") {
    next.layout = {
      ...next.layout,
      ...(input.calendarExpanded !== undefined
        ? { calendarExpanded: input.calendarExpanded }
        : {}),
      ...(input.calendarHeight !== undefined
        ? { calendarHeight: input.calendarHeight }
        : {}),
      ...(input.categoryWidth !== undefined
        ? { categoryWidth: input.categoryWidth }
        : {}),
      ...(input.projectRailWidth !== undefined
        ? { projectRailWidth: input.projectRailWidth }
        : {}),
    };
    return updated(next, "Updated the Projects workspace layout.", next.layout);
  }
  if (input.action === "create") {
    if (!input.name) return unchanged(record, "A project name is required.");
    const category = resolveCategory(record, input.categoryRef ?? null);
    if (!("entity" in category)) {
      return unchanged(record, category.error, category.candidates);
    }
    const now = new Date().toISOString();
    const project: Project = {
      archived: input.archived ?? false,
      categoryId: category.entity?.id ?? null,
      color: input.color ?? "#20c8e8",
      createdAt: now,
      dueDate: input.dueDate ?? null,
      favorite: input.favorite ?? false,
      id: makeProjectEntityId("project"),
      name: input.name.trim(),
      priority: input.priority ?? "medium",
      status: input.status ?? "planning",
      summary: input.summary?.trim() ?? "",
      updatedAt: now,
    };
    next.store.projects.unshift(project);
    return updated(next, `Created project "${project.name}".`, project);
  }

  const resolved = resolveProject(record, input.projectRef);
  if (!("entity" in resolved)) {
    return unchanged(record, resolved.error, resolved.candidates);
  }
  const project = resolved.entity;

  if (input.action === "delete") {
    if (!input.confirmed) {
      return unchanged(record, "Deleting a project requires explicit confirmation.");
    }
    next.store.projects = next.store.projects.filter((item) => item.id !== project.id);
    next.store.notes = next.store.notes.filter((item) => item.projectId !== project.id);
    next.store.localTasks = next.store.localTasks.filter(
      (item) => item.projectId !== project.id,
    );
    next.store.milestones = next.store.milestones.filter(
      (item) => item.projectId !== project.id,
    );
    next.store.taskAssignments = Object.fromEntries(
      Object.entries(next.store.taskAssignments).filter(
        ([, projectId]) => projectId !== project.id,
      ),
    );
    delete next.store.repositoryAssignments[project.id];
    return updated(next, `Deleted project "${project.name}".`);
  }

  if (input.action === "reorder") {
    const target = resolveProject(record, input.targetProjectRef);
    if (!("entity" in target)) {
      return unchanged(record, target.error, target.candidates);
    }
    const sourceIndex = next.store.projects.findIndex(
      (item) => item.id === project.id,
    );
    const targetIndex = next.store.projects.findIndex(
      (item) => item.id === target.entity.id,
    );
    [next.store.projects[sourceIndex], next.store.projects[targetIndex]] = [
      next.store.projects[targetIndex],
      next.store.projects[sourceIndex],
    ];
    return updated(next, `Reordered "${project.name}" and "${target.entity.name}".`);
  }

  const category =
    input.categoryRef === undefined
      ? undefined
      : resolveCategory(record, input.categoryRef);
  if (category && !("entity" in category)) {
    return unchanged(record, category.error, category.candidates);
  }
  const now = new Date().toISOString();
  next.store.projects = next.store.projects.map((item) => {
    if (item.id !== project.id) return item;
    if (input.action === "set_favorite") {
      return { ...item, favorite: input.favorite ?? !item.favorite, updatedAt: now };
    }
    if (input.action === "set_archived") {
      return { ...item, archived: input.archived ?? !item.archived, updatedAt: now };
    }
    return {
      ...item,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.summary !== undefined
        ? { summary: input.summary.trim() }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(category !== undefined
        ? { categoryId: category.entity?.id ?? null }
        : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      updatedAt: now,
    };
  });
  const entity = next.store.projects.find((item) => item.id === project.id);
  return updated(next, `Updated project "${project.name}".`, entity);
}

export function manageProjectCategory(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectCategorySchema>,
): ProjectCommandOutcome {
  const next = structuredClone(record);
  if (input.action === "create") {
    if (!input.name) return unchanged(record, "A category name is required.");
    const parent = resolveCategory(record, input.parentCategoryRef ?? null);
    if (!("entity" in parent)) {
      return unchanged(record, parent.error, parent.candidates);
    }
    const category: ProjectCategory = {
      icon: input.icon ?? "folder",
      id: makeProjectEntityId("project-category"),
      name: input.name.trim(),
      parentId: parent.entity?.id ?? null,
    };
    next.store.categories.push(category);
    return updated(next, `Created project category "${category.name}".`, category);
  }
  const resolved = resolveCategory(record, input.categoryRef);
  if (!("entity" in resolved) || !resolved.entity) {
    return unchanged(
      record,
      "error" in resolved ? resolved.error : "A category is required.",
      "candidates" in resolved ? resolved.candidates : undefined,
    );
  }
  const category = resolved.entity;
  if (input.action === "delete") {
    if (!input.confirmed) {
      return unchanged(record, "Deleting a project category requires explicit confirmation.");
    }
    const removedIds = projectCategoryDescendantIds(
      category.id,
      next.store.categories,
    );
    next.store.categories = next.store.categories.filter(
      (item) => !removedIds.has(item.id),
    );
    const now = new Date().toISOString();
    next.store.projects = next.store.projects.map((project) =>
      project.categoryId && removedIds.has(project.categoryId)
        ? { ...project, categoryId: null, updatedAt: now }
        : project,
    );
    return updated(
      next,
      `Deleted category "${category.name}" and ${removedIds.size - 1} nested categories.`,
    );
  }
  next.store.categories = next.store.categories.map((item) =>
    item.id === category.id
      ? {
          ...item,
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
        }
      : item,
  );
  return updated(
    next,
    `Updated project category "${category.name}".`,
    next.store.categories.find((item) => item.id === category.id),
  );
}

export function manageProjectNote(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectNoteSchema>,
): ProjectCommandOutcome {
  const next = structuredClone(record);
  if (input.action === "create") {
    const project = resolveProject(record, input.projectRef);
    if (!("entity" in project)) {
      return unchanged(record, project.error, project.candidates);
    }
    if (!input.body) return unchanged(record, "A note body is required.");
    const now = new Date().toISOString();
    const note: ProjectNote = {
      body: input.body.trim(),
      createdAt: now,
      id: makeProjectEntityId("project-note"),
      projectId: project.entity.id,
      section: input.section ?? "updates",
      updatedAt: now,
    };
    next.store.notes.push(note);
    return updated(next, `Added a note to "${project.entity.name}".`, note);
  }
  const resolved = resolveEntity(record.store.notes, input.noteRef, "project note");
  if (!("entity" in resolved)) {
    return unchanged(record, resolved.error, resolved.candidates);
  }
  const note = resolved.entity;
  if (input.action === "delete") {
    if (!input.confirmed) {
      return unchanged(record, "Deleting a project note requires explicit confirmation.");
    }
    next.store.notes = next.store.notes.filter((item) => item.id !== note.id);
    return updated(next, "Deleted the project note.");
  }
  next.store.notes = next.store.notes.map((item) =>
    item.id === note.id
      ? {
          ...item,
          ...(input.body !== undefined ? { body: input.body.trim() } : {}),
          ...(input.section !== undefined ? { section: input.section } : {}),
          updatedAt: new Date().toISOString(),
        }
      : item,
  );
  return updated(next, "Updated the project note.", next.store.notes.find((item) => item.id === note.id));
}

export function manageProjectMilestone(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectMilestoneSchema>,
): ProjectCommandOutcome {
  const next = structuredClone(record);
  if (input.action === "create") {
    const project = resolveProject(record, input.projectRef);
    if (!("entity" in project)) {
      return unchanged(record, project.error, project.candidates);
    }
    if (!input.title) return unchanged(record, "A milestone title is required.");
    const now = new Date().toISOString();
    const milestone: ProjectMilestone = {
      createdAt: now,
      description: input.description?.trim() ?? "",
      id: makeProjectEntityId("milestone"),
      projectId: project.entity.id,
      status: input.status ?? "planned",
      targetDate: input.targetDate ?? null,
      title: input.title.trim(),
      updatedAt: now,
    };
    next.store.milestones.push(milestone);
    return updated(next, `Added milestone "${milestone.title}".`, milestone);
  }
  const resolved = resolveEntity(
    record.store.milestones,
    input.milestoneRef,
    "project milestone",
  );
  if (!("entity" in resolved)) {
    return unchanged(record, resolved.error, resolved.candidates);
  }
  const milestone = resolved.entity;
  if (input.action === "delete") {
    if (!input.confirmed) {
      return unchanged(record, "Deleting a milestone requires explicit confirmation.");
    }
    next.store.milestones = next.store.milestones.filter(
      (item) => item.id !== milestone.id,
    );
    return updated(next, `Deleted milestone "${milestone.title}".`);
  }
  next.store.milestones = next.store.milestones.map((item) =>
    item.id === milestone.id
      ? {
          ...item,
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description.trim() }
            : {}),
          ...(input.targetDate !== undefined
            ? { targetDate: input.targetDate }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date().toISOString(),
        }
      : item,
  );
  return updated(
    next,
    `Updated milestone "${milestone.title}".`,
    next.store.milestones.find((item) => item.id === milestone.id),
  );
}

export function manageProjectTask(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectTaskSchema>,
): ProjectCommandOutcome {
  const next = structuredClone(record);
  if (input.action === "link_existing") {
    const project = resolveProject(record, input.projectRef);
    if (!("entity" in project)) {
      return unchanged(record, project.error, project.candidates);
    }
    if (!input.taskRef) return unchanged(record, "A Relay/Google task id is required.");
    next.store.taskAssignments[input.taskRef] = project.entity.id;
    return updated(next, `Linked task ${input.taskRef} to "${project.entity.name}".`);
  }
  if (input.action === "unlink_existing") {
    if (!input.taskRef) return unchanged(record, "A Relay/Google task id is required.");
    if (!next.store.taskAssignments[input.taskRef]) {
      return unchanged(record, `Task ${input.taskRef} is not linked to a project.`);
    }
    delete next.store.taskAssignments[input.taskRef];
    return updated(next, `Unlinked task ${input.taskRef}.`);
  }
  if (input.action === "create_local") {
    const project = resolveProject(record, input.projectRef);
    if (!("entity" in project)) {
      return unchanged(record, project.error, project.candidates);
    }
    if (!input.title) return unchanged(record, "A task title is required.");
    const task: LocalProjectTask = {
      completed: input.completed ?? false,
      createdAt: new Date().toISOString(),
      dueDate: input.dueDate ?? null,
      id: makeProjectEntityId("project-task"),
      priority: input.priority ?? "medium",
      projectId: project.entity.id,
      title: input.title.trim(),
    };
    next.store.localTasks.push(task);
    return updated(next, `Created local task "${task.title}".`, task);
  }
  const resolved = resolveEntity(
    record.store.localTasks,
    input.taskRef,
    "local project task",
  );
  if (!("entity" in resolved)) {
    return unchanged(record, resolved.error, resolved.candidates);
  }
  const task = resolved.entity;
  if (input.action === "delete_local") {
    if (!input.confirmed) {
      return unchanged(record, "Deleting a project task requires explicit confirmation.");
    }
    next.store.localTasks = next.store.localTasks.filter(
      (item) => item.id !== task.id,
    );
    return updated(next, `Deleted local task "${task.title}".`);
  }
  next.store.localTasks = next.store.localTasks.map((item) =>
    item.id === task.id
      ? {
          ...item,
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.completed !== undefined
            ? { completed: input.completed }
            : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
        }
      : item,
  );
  return updated(
    next,
    `Updated local task "${task.title}".`,
    next.store.localTasks.find((item) => item.id === task.id),
  );
}

export function manageProjectRepository(
  record: ProjectRecord,
  input: z.infer<typeof manageProjectRepositorySchema>,
): ProjectCommandOutcome {
  const project = resolveProject(record, input.projectRef);
  if (!("entity" in project)) {
    return unchanged(record, project.error, project.candidates);
  }
  const next = structuredClone(record);
  const assigned = next.store.repositoryAssignments[project.entity.id] ?? [];
  if (input.action === "assign") {
    if (!assigned.includes(input.repositoryFullName)) {
      next.store.repositoryAssignments[project.entity.id] = [
        ...assigned,
        input.repositoryFullName,
      ];
    }
    return updated(
      next,
      `Assigned ${input.repositoryFullName} to "${project.entity.name}".`,
    );
  }
  next.store.repositoryAssignments[project.entity.id] = assigned.filter(
    (name) => name !== input.repositoryFullName,
  );
  return updated(
    next,
    `Unassigned ${input.repositoryFullName} from "${project.entity.name}".`,
  );
}
