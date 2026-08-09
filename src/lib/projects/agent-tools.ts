import { defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { createGoogleTaskForUser } from "@/lib/google/workspace";
import {
  inspectProjectWorkspace,
  inspectProjectWorkspaceSchema,
  manageProject,
  manageProjectCategory,
  manageProjectCategorySchema,
  manageProjectMilestone,
  manageProjectMilestoneSchema,
  manageProjectNote,
  manageProjectNoteSchema,
  manageProjectRepository,
  manageProjectRepositorySchema,
  manageProjectSchema,
  manageProjectTask,
  manageProjectTaskSchema,
  type ProjectCommandOutcome,
} from "@/lib/projects/commands";
import {
  defaultProjectRecord,
  projectPrioritySchema,
} from "@/lib/projects/model";
import {
  readAccountProjectRecord,
  writeAccountProjectRecord,
} from "@/lib/projects/persistence";

async function loadProjects() {
  const persisted = await readAccountProjectRecord();
  return {
    ...persisted,
    record: persisted.record ?? structuredClone(defaultProjectRecord),
  };
}

async function saveOutcome(
  account: Awaited<ReturnType<typeof readAccountProjectRecord>>["account"],
  outcome: ProjectCommandOutcome,
) {
  if (!outcome.changed) return outcome.result;
  if (!account) {
    return {
      ok: false,
      reason:
        "Sign in to Relay before changing Projects through this agent runtime.",
    };
  }
  await writeAccountProjectRecord(outcome.record);
  return outcome.result;
}

export const projectAgentTools = [
  defineTool({
    name: "inspect_project_workspace",
    description:
      "Read projects and categories, or inspect one project's settings, notes, tasks, milestones, and repositories in full.",
    parameters: inspectProjectWorkspaceSchema,
    execute: async (input) => {
      const { record } = await loadProjects();
      return inspectProjectWorkspace(record, input);
    },
  }),
  defineTool({
    name: "manage_project",
    description:
      "Create/edit/favorite/archive/reorder/delete projects or update Projects layout. Delete requires explicit confirmation.",
    parameters: manageProjectSchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProject(record, input));
    },
  }),
  defineTool({
    name: "manage_project_category",
    description:
      "Create nested project categories, edit their names/icons, or delete category trees after confirmation.",
    parameters: manageProjectCategorySchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProjectCategory(record, input));
    },
  }),
  defineTool({
    name: "manage_project_note",
    description:
      "Create, edit, recategorize, or delete notes inside a Relay project.",
    parameters: manageProjectNoteSchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProjectNote(record, input));
    },
  }),
  defineTool({
    name: "manage_project_milestone",
    description:
      "Create, edit, reschedule, change status, or delete project milestones.",
    parameters: manageProjectMilestoneSchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProjectMilestone(record, input));
    },
  }),
  defineTool({
    name: "manage_project_task",
    description:
      "Create/edit/delete local project tasks or link/unlink existing Google Tasks by id.",
    parameters: manageProjectTaskSchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProjectTask(record, input));
    },
  }),
  defineTool({
    name: "create_project_google_task",
    description:
      "Create a Google Task and immediately link it to a Relay project.",
    parameters: z.object({
      projectRef: z.string().min(1),
      title: z.string().min(1),
      notes: z.string().optional(),
      due: z.string().datetime().nullable().optional(),
      priority: projectPrioritySchema.optional(),
      taskListId: z.string().nullable().optional(),
    }),
    execute: async ({ projectRef, ...taskInput }) => {
      const { account, record } = await loadProjects();
      const project = inspectProjectWorkspace(record, {
        includeArchived: true,
        projectRef,
      });
      if (!project.ok || !("project" in project) || !project.project) {
        return project;
      }
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Tasks is not connected." };
      }
      const created = await createGoogleTaskForUser(tokens, taskInput);
      if (!created.ok || !created.task?.id) return created;
      const linked = await saveOutcome(
        account,
        manageProjectTask(record, {
          action: "link_existing",
          confirmed: false,
          projectRef: project.project.id,
          taskRef: created.task.id,
        }),
      );
      return { ...created, projectLink: linked };
    },
  }),
  defineTool({
    name: "manage_project_repository",
    description:
      "Assign or unassign a GitHub repository in owner/name form to a project.",
    parameters: manageProjectRepositorySchema,
    execute: async (input) => {
      const { account, record } = await loadProjects();
      return saveOutcome(account, manageProjectRepository(record, input));
    },
  }),
] as const;
