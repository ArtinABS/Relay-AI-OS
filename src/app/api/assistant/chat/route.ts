import { generateText, stepCountIs, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { workAgentPrompt } from "@/lib/agent/prompt";
import { getAssistantModelConfig } from "@/lib/ai/provider";
import { getGithubSetupStatus } from "@/lib/github/client";
import { getDirectGithubTokens } from "@/lib/github/direct-session";
import {
  commentOnGithubIssue,
  createGithubIssueForRepository,
  listGithubIssuesForUser,
  listGithubPullRequestsForRepository,
  listGithubRepositoriesForUser,
  listRecentGithubPullRequests,
  updateGithubIssueForRepository,
} from "@/lib/github/workspace";
import { getGoogleSetupStatus } from "@/lib/google/client";
import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  archiveGmailMessageForUser,
  completeGoogleTaskForUser,
  copyDriveFileForUser,
  createCalendarEventForUser,
  createGoogleContactForUser,
  createGoogleTaskForUser,
  createGmailDraftForUser,
  deleteCalendarEventForUser,
  deleteDriveFileForUser,
  deleteGoogleContactForUser,
  deleteGmailMessageForUser,
  deleteGoogleTaskForUser,
  getDriveFileForUser,
  getGoogleContactForUser,
  getUpcomingCalendarEventsForUser,
  labelGmailMessageForUser,
  listGmailMessagesForUser,
  listGoogleContactsForUser,
  listGoogleTasksForUser,
  listRecentDriveFilesForUser,
  moveDriveFileForUser,
  readDriveFileTextForUser,
  readGmailMessageForUser,
  renameDriveFileForUser,
  replyToGmailMessageForUser,
  restoreGmailMessageForUser,
  sendGmailMessageForUser,
  setDriveFileTrashedForUser,
  shareDriveFileForUser,
  starGmailMessageForUser,
  trashGmailMessageForUser,
  unarchiveGmailMessageForUser,
  updateCalendarEventForUser,
  updateGoogleContactForUser,
  updateGoogleTaskForUser,
} from "@/lib/google/workspace";
import { calculateExpression } from "@/lib/local-tools/calculator";
import { addNote, listNotes, searchNotes } from "@/lib/local-store/notes";
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
  projectRecordSchema,
  type ProjectRecord,
} from "@/lib/projects/model";
import {
  readAccountProjectRecord,
  writeAccountProjectRecord,
} from "@/lib/projects/persistence";

const requestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
  projectRecord: projectRecordSchema.optional(),
});

const emailToolSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().nullable().optional(),
});

type ChatResponse = {
  role: "assistant";
  content: string;
  provider: string;
  modelId: string;
  aiUsed: boolean;
  projectRecord?: ProjectRecord;
};

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content: "I could not read that request. Please send a JSON body with a message.",
        provider: "local",
        modelId: "none",
        aiUsed: false,
      },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content: "Send me a message first, then I can help.",
        provider: "local",
        modelId: "none",
        aiUsed: false,
      },
      { status: 400 },
    );
  }

  const config = getAssistantModelConfig();

  if (!config.configured) {
    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content:
          "The AI provider is not configured yet, so I am falling back to local mode.",
        provider: config.provider,
        modelId: config.modelId,
        aiUsed: false,
      },
      { status: 412 },
    );
  }

  const directTokens = await getDirectGoogleTokens();
  const githubTokens = await getDirectGithubTokens();
  const googleTaskSnapshot =
    directTokens?.accessToken || directTokens?.refreshToken
      ? await listGoogleTasksForUser(directTokens, 25).catch(() => ({
          ok: false,
          taskLists: [],
          tasks: [],
        }))
      : { ok: false, taskLists: [], tasks: [] };
  const notes = await listNotes();
  const persistedProjects = await readAccountProjectRecord();
  let activeProjectRecord = structuredClone(
    persistedProjects.record ??
      parsed.data.projectRecord ??
      defaultProjectRecord,
  );
  let projectRecordChanged = false;

  function applyProjectOutcome(outcome: ProjectCommandOutcome) {
    if (outcome.changed) {
      activeProjectRecord = outcome.record;
      projectRecordChanged = true;
    }
    return outcome.result;
  }

  async function persistActiveProjectRecord() {
    if (!projectRecordChanged || !persistedProjects.account) return;
    try {
      await writeAccountProjectRecord(activeProjectRecord);
    } catch (error) {
      console.error("Project agent sync failed", error);
    }
  }

  try {
    const result = await generateText({
      model: config.model,
      system: [
        workAgentPrompt,
        "",
        "You are currently running inside Relay's main chat surface, not a demo.",
        "For every new user message, start from a neutral intent analysis. Do not stay locked into the previous toolset; choose tools, panels, and generated UI from the current request plus recent conversation context.",
        "Perform that analysis silently. The user should receive the useful answer or outcome, not narration of internal planning, routing, tool selection, or hidden context.",
        "Before choosing UI, analyze the request as a workflow: identify existing objects referenced, extract provided fields, decide which read/search tools are needed, execute safe reads first, and only then ask for missing fields.",
        "Use lifecycle tools, not just creation tools. For any supported object, prefer read/search before update/delete/move/share when identity is ambiguous.",
        "Do not ask for information the user already provided. If generated UI appears, it is for missing or confirmation-only fields and should be prefilled from the user's request.",
        "If the user says they finished/did/completed something, search/list matching tasks before creating follow-up work. Ask for confirmation before marking, deleting, moving, or otherwise changing the existing object.",
        "Use the available tools when the user asks about projects, project categories, project notes, milestones, project tasks, project repositories, tasks, notes, schedule, calendar, OAuth, Gmail, Drive, Contacts, GitHub, repositories, issues, pull requests, or calculations.",
        "The project tools cover the complete Projects workspace. Inspect projects before ambiguous edits. You can create/edit/archive/favorite/reorder/delete projects; manage nested categories and icons; manage project notes and milestones; create or edit local project tasks; link/unlink Google Tasks; and assign/unassign GitHub repositories.",
        "For a new Google Task that belongs to a project, prefer create_project_google_task so creation and linking happen together. For existing Google Tasks, list them first and then use manage_project_task with link_existing or unlink_existing.",
        "When missing details can be collected through generated UI, acknowledge briefly and rely on the UI instead of asking a numbered plain-text questionnaire.",
        "Never output XML-like control tags such as <need-more-info> or <ui-component>. Use Markdown only; the client renders any needed interactive UI.",
        "For scheduling, task, reminder, file, memory, and email workflows, be concise and let the application surface collect structured details.",
        "Format final assistant responses as GitHub-flavored Markdown. Use short headings, bullet lists, checklists, tables, code spans, and links when they improve scanability. Do not return raw plain-text paragraphs for multi-part answers.",
        "Keep Markdown compact and professional. Avoid over-formatting simple one-sentence confirmations.",
        "Lead with the direct answer or verified result. After tool use, report what changed, the important returned values, and any blocker; do not dump raw tool output or claim success unless the tool confirmed it.",
        "Adapt the response to the user's requested depth and tone. Prefer specific, actionable language over generic advice, repeated context, or closing offers that add no value.",
        "If a user asks for tomorrow's schedule, call the calendar tool. If Google Calendar is unavailable, say exactly what permission or OAuth step is missing.",
        "For contacts, use Google Contacts tools to find people, emails, phone numbers, organizations, and birthdays. Creating, editing, or deleting contacts requires explicit confirmation.",
        "Never pretend to complete Google, Gmail, Calendar, Drive, Contacts, GitHub, or destructive actions if the tool result says they are blocked.",
        "For GitHub, reading repositories/issues/pull requests is allowed when connected. Creating issues or comments requires explicit confirmation.",
        "For long-term memory, ask for permission before storing unless the user explicitly says to remember/save it.",
        "",
        `Current date/time: ${new Date().toLocaleString()}`,
        `Known open Google Tasks: ${JSON.stringify(
          googleTaskSnapshot.tasks
            .filter((task) => task.status !== "completed")
            .slice(0, 12),
        )}`,
        `Known recent notes: ${JSON.stringify(notes.slice(0, 8))}`,
        `Current Projects index: ${JSON.stringify({
          categories: activeProjectRecord.store.categories.map(
            ({ id, name, parentId, icon }) => ({ id, name, parentId, icon }),
          ),
          projects: activeProjectRecord.store.projects.map(
            ({ id, name, status, archived, categoryId }) => ({
              id,
              name,
              status,
              archived,
              categoryId,
            }),
          ),
        })}`,
        `Google signed in: ${Boolean(directTokens?.accessToken || directTokens?.refreshToken)}`,
        `Google email: ${directTokens?.email ?? "not connected"}`,
        `GitHub signed in: ${Boolean(githubTokens?.accessToken)}`,
        `GitHub login: ${githubTokens?.login ?? "not connected"}`,
        `Recent chat memory: ${JSON.stringify(parsed.data.history?.slice(-16) ?? [])}`,
      ].join("\n"),
      prompt: parsed.data.message,
      temperature: 0.35,
      stopWhen: stepCountIs(12),
      tools: {
        get_workspace_setup_status: tool({
          description:
            "Inspect current AI, Google OAuth, and Workspace readiness.",
          inputSchema: z.object({}),
          execute: async () => ({
            ai: {
              provider: config.provider,
              modelId: config.modelId,
              configured: config.configured,
            },
            google: getGoogleSetupStatus(),
            googleSession: {
              connected: Boolean(
                directTokens?.accessToken || directTokens?.refreshToken,
              ),
              email: directTokens?.email ?? null,
            },
            github: getGithubSetupStatus(),
            githubSession: {
              connected: Boolean(githubTokens?.accessToken),
              login: githubTokens?.login ?? null,
            },
          }),
        }),
        list_notes: tool({
          description: "List recent local Relay notes and memories.",
          inputSchema: z.object({
            query: z.string().optional(),
          }),
          execute: async ({ query }) =>
            query ? searchNotes(query) : (await listNotes()).slice(0, 20),
        }),
        remember_note: tool({
          description:
            "Store a local note only when the user has explicitly asked to remember/save it.",
          inputSchema: z.object({
            body: z.string().min(1),
          }),
          execute: async ({ body }) => addNote(body),
        }),
        calculate: tool({
          description: "Evaluate a safe arithmetic expression.",
          inputSchema: z.object({
            expression: z.string().min(1),
          }),
          execute: async ({ expression }) =>
            calculateExpression(`calculate ${expression}`),
        }),
        inspect_project_workspace: tool({
          description:
            "Read the Projects workspace. With no projectRef, list projects, nested categories, ids, settings, and item counts. With a project id or name, return its full settings, notes, local tasks, linked Google Task ids, milestones, and assigned repositories. Use this before ambiguous project changes.",
          inputSchema: inspectProjectWorkspaceSchema,
          execute: async (input) => {
            const result = inspectProjectWorkspace(activeProjectRecord, input);
            if (
              !result.ok ||
              !("project" in result) ||
              !result.project ||
              !result.linkedTaskIds
            ) {
              return result;
            }
            return {
              ...result,
              linkedTasks: result.linkedTaskIds.map((taskId) => ({
                taskId,
                task:
                  googleTaskSnapshot.tasks.find((task) => task.id === taskId) ??
                  null,
              })),
            };
          },
        }),
        manage_project: tool({
          description:
            "Create or fully edit a Relay project, set favorite/archive state, reorder projects, update Projects layout preferences, or delete a project. Project fields include name, summary, status, priority, nested category, due date, and six-digit hex color. update_layout can change calendarExpanded, calendarHeight, categoryWidth, and projectRailWidth within their validated ranges. Resolve ids with inspect_project_workspace first. Delete requires confirmed=true after explicit approval.",
          inputSchema: manageProjectSchema,
          execute: async (input) =>
            applyProjectOutcome(manageProject(activeProjectRecord, input)),
        }),
        manage_project_category: tool({
          description:
            "Create a top-level or nested Project category, edit its name/icon, or delete it and its descendants. Available icons are book, briefcase, code, fitness, folder, globe, heart, home, palette, plane, rocket, shopping, sparkles, target, and users. Delete requires confirmed=true after explicit approval.",
          inputSchema: manageProjectCategorySchema,
          execute: async (input) =>
            applyProjectOutcome(
              manageProjectCategory(activeProjectRecord, input),
            ),
        }),
        manage_project_note: tool({
          description:
            "Create, edit, move between sections, or delete a note inside a project. Note sections are brief, research, decisions, and updates. Inspect the project first to obtain note ids. Delete requires confirmed=true after explicit approval.",
          inputSchema: manageProjectNoteSchema,
          execute: async (input) =>
            applyProjectOutcome(manageProjectNote(activeProjectRecord, input)),
        }),
        manage_project_milestone: tool({
          description:
            "Create, edit, change status, reschedule, or delete a project roadmap milestone. Statuses are planned, in-progress, and completed. Inspect the project first to obtain milestone ids. Delete requires confirmed=true after explicit approval.",
          inputSchema: manageProjectMilestoneSchema,
          execute: async (input) =>
            applyProjectOutcome(
              manageProjectMilestone(activeProjectRecord, input),
            ),
        }),
        manage_project_task: tool({
          description:
            "Manage tasks inside Projects. Use link_existing with a Google Task id and projectRef to link an existing task, or unlink_existing to unlink it without deleting the Google Task. Local project tasks can also be created, edited/completed, or deleted. Prefer create_project_google_task for a new synced task. Local deletion requires confirmed=true.",
          inputSchema: manageProjectTaskSchema,
          execute: async (input) =>
            applyProjectOutcome(manageProjectTask(activeProjectRecord, input)),
        }),
        create_project_google_task: tool({
          description:
            "Create a synced Google Task and immediately link it to a Relay project. Use this instead of separate create/link calls when the user asks to add a new task inside a project.",
          inputSchema: z.object({
            projectRef: z.string().min(1),
            title: z.string().min(1),
            notes: z.string().optional(),
            due: z.string().datetime().nullable().optional(),
            priority: projectPrioritySchema.optional(),
            taskListId: z.string().nullable().optional(),
          }),
          execute: async ({ projectRef, ...taskInput }) => {
            const projectResult = inspectProjectWorkspace(activeProjectRecord, {
              includeArchived: true,
              projectRef,
            });
            if (
              !projectResult.ok ||
              !("project" in projectResult) ||
              !projectResult.project
            ) {
              return projectResult;
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google Tasks is not connected in this browser session. Connect Google before creating a synced project task.",
              };
            }
            const created = await createGoogleTaskForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              taskInput,
            );
            if (!created.ok || !created.task?.id) return created;
            const linked = applyProjectOutcome(
              manageProjectTask(activeProjectRecord, {
                action: "link_existing",
                confirmed: false,
                projectRef: projectResult.project.id,
                taskRef: created.task.id,
              }),
            );
            return { ...created, projectLink: linked };
          },
        }),
        manage_project_repository: tool({
          description:
            "Assign or unassign a GitHub repository in owner/name form to a Relay project. Use list_github_repositories first if the exact repository name is unknown.",
          inputSchema: manageProjectRepositorySchema,
          execute: async (input) =>
            applyProjectOutcome(
              manageProjectRepository(activeProjectRecord, input),
            ),
        }),
        list_upcoming_calendar_events: tool({
          description:
            "List upcoming Google Calendar events for the connected user.",
          inputSchema: z.object({
            maxResults: z.number().int().min(1).max(20).default(10),
          }),
          execute: async ({ maxResults }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return getUpcomingCalendarEventsForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              maxResults,
            );
          },
        }),
        create_calendar_event: tool({
          description:
            "Create a Google Calendar event when the details are clear or generated UI has collected them.",
          inputSchema: z.object({
            summary: z.string().min(1),
            startDateTime: z.string().datetime(),
            endDateTime: z.string().datetime(),
            timeZone: z.string().min(1),
            description: z.string().optional(),
            location: z.string().optional(),
            attendees: z.array(z.string().email()).optional(),
            conferenceData: z.boolean().default(false),
            reminderMinutes: z.number().int().min(0).max(40320).nullable().optional(),
          }),
          execute: async (event) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return createCalendarEventForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              event,
            );
          },
        }),
        update_calendar_event: tool({
          description:
            "Edit a Google Calendar event after explicit user confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            summary: z.string().min(1).optional(),
            startDateTime: z.string().datetime().optional(),
            endDateTime: z.string().datetime().optional(),
            timeZone: z.string().min(1).optional(),
            description: z.string().optional(),
            location: z.string().optional(),
            attendees: z.array(z.string().email()).optional(),
            reminderMinutes: z.number().int().min(0).max(40320).nullable().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...event }) => {
            if (!confirmed) {
              return { ok: false, reason: "Editing a calendar event requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return updateCalendarEventForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              event,
            );
          },
        }),
        delete_calendar_event: tool({
          description:
            "Delete a Google Calendar event only after explicit user confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Deleting a calendar event requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return deleteCalendarEventForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              { id },
            );
          },
        }),
        list_recent_drive_files: tool({
          description:
            "List recent Google Drive files for the connected user.",
          inputSchema: z.object({
            maxResults: z.number().int().min(1).max(20).default(10),
          }),
          execute: async ({ maxResults }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return listRecentDriveFilesForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              maxResults,
            );
          },
        }),
        read_drive_file: tool({
          description: "Read Google Drive file metadata by file id.",
          inputSchema: z.object({
            id: z.string().min(1),
          }),
          execute: async ({ id }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return getDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        read_drive_file_text: tool({
          description:
            "Extract text from a Google Drive document or text-compatible file for summarization or Q&A.",
          inputSchema: z.object({
            id: z.string().min(1),
            maxCharacters: z.number().int().min(500).max(20000).default(6000),
          }),
          execute: async (input) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return readDriveFileTextForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        rename_drive_file: tool({
          description: "Rename a Google Drive file after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...input }) => {
            if (!confirmed) {
              return { ok: false, reason: "Renaming a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return renameDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        move_drive_file: tool({
          description: "Move a Google Drive file into another folder after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            folderId: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...input }) => {
            if (!confirmed) {
              return { ok: false, reason: "Moving a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return moveDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        duplicate_drive_file: tool({
          description: "Duplicate a Google Drive file after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            name: z.string().optional(),
            folderId: z.string().nullable().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...input }) => {
            if (!confirmed) {
              return { ok: false, reason: "Duplicating a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return copyDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        trash_drive_file: tool({
          description: "Move a Google Drive file to trash after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Trashing a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return setDriveFileTrashedForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              { id, trashed: true },
            );
          },
        }),
        restore_drive_file: tool({
          description: "Restore a Google Drive file from trash after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Restoring a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return setDriveFileTrashedForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              { id, trashed: false },
            );
          },
        }),
        delete_drive_file: tool({
          description: "Permanently delete a Google Drive file only after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Permanent Drive deletion requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return deleteDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        share_drive_file: tool({
          description: "Share a Google Drive file after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            role: z.enum(["reader", "commenter", "writer"]),
            type: z.enum(["user", "group", "domain", "anyone"]),
            emailAddress: z.string().email().optional(),
            domain: z.string().optional(),
            allowFileDiscovery: z.boolean().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...input }) => {
            if (!confirmed) {
              return { ok: false, reason: "Sharing a Drive file requires confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return shareDriveFileForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        list_google_tasks: tool({
          description: "List Google Tasks for the connected user.",
          inputSchema: z.object({
            maxResults: z.number().int().min(1).max(25).default(20),
          }),
          execute: async ({ maxResults }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return listGoogleTasksForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              maxResults,
            );
          },
        }),
        create_google_task: tool({
          description:
            "Create a Google Task. Use this only when the task details are clear or the generated UI has collected them.",
          inputSchema: z.object({
            title: z.string().min(1),
            notes: z.string().optional(),
            due: z.string().datetime().nullable().optional(),
            priority: z.enum(["high", "medium", "low"]).optional(),
            taskListId: z.string().nullable().optional(),
          }),
          execute: async (task) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return createGoogleTaskForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              task,
            );
          },
        }),
        update_google_task: tool({
          description: "Edit a Google Task title, notes, due date, status, or priority.",
          inputSchema: z.object({
            id: z.string().min(1),
            title: z.string().min(1).optional(),
            notes: z.string().optional(),
            due: z.string().datetime().nullable().optional(),
            status: z.enum(["needsAction", "completed"]).optional(),
            priority: z.enum(["high", "medium", "low"]).optional(),
            taskListId: z.string().nullable().optional(),
          }),
          execute: async (task) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return updateGoogleTaskForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              task,
            );
          },
        }),
        complete_google_task: tool({
          description: "Mark a Google Task complete.",
          inputSchema: z.object({
            id: z.string().min(1),
            taskListId: z.string().nullable().optional(),
          }),
          execute: async (task) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return completeGoogleTaskForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              task,
            );
          },
        }),
        delete_google_task: tool({
          description:
            "Delete a Google Task after the user has clearly approved deletion.",
          inputSchema: z.object({
            id: z.string().min(1),
            taskListId: z.string().nullable().optional(),
          }),
          execute: async (task) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return deleteGoogleTaskForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              task,
            );
          },
        }),
        list_google_contacts: tool({
          description:
            "List or search saved Google Contacts for the connected user. Use for contacts, people, invitees, phone numbers, organizations, or birthdays.",
          inputSchema: z.object({
            query: z.string().optional(),
            maxResults: z.number().int().min(1).max(100).default(25),
          }),
          execute: async ({ query, maxResults }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return listGoogleContactsForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              { query, maxResults },
            );
          },
        }),
        read_google_contact: tool({
          description: "Read one Google Contact by resourceName.",
          inputSchema: z.object({
            resourceName: z.string().min(1),
          }),
          execute: async ({ resourceName }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return getGoogleContactForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              resourceName,
            );
          },
        }),
        create_google_contact: tool({
          description:
            "Create a saved Google Contact only after explicit user confirmation.",
          inputSchema: z.object({
            displayName: z.string().optional(),
            givenName: z.string().optional(),
            familyName: z.string().optional(),
            email: z.string().email().optional(),
            phoneNumber: z.string().optional(),
            organization: z.string().optional(),
            jobTitle: z.string().optional(),
            birthday: z.string().regex(/^(\d{4}-)?\d{2}-\d{2}$/).optional(),
            notes: z.string().optional(),
            address: z.string().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...contact }) => {
            if (!confirmed) {
              return { ok: false, reason: "Creating a Google Contact requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return createGoogleContactForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              contact,
            );
          },
        }),
        update_google_contact: tool({
          description:
            "Edit a saved Google Contact only after explicit user confirmation.",
          inputSchema: z.object({
            resourceName: z.string().min(1),
            displayName: z.string().optional(),
            givenName: z.string().optional(),
            familyName: z.string().optional(),
            email: z.string().email().optional(),
            phoneNumber: z.string().optional(),
            organization: z.string().optional(),
            jobTitle: z.string().optional(),
            birthday: z.string().regex(/^(\d{4}-)?\d{2}-\d{2}$/).optional(),
            notes: z.string().optional(),
            address: z.string().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...contact }) => {
            if (!confirmed) {
              return { ok: false, reason: "Editing a Google Contact requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return updateGoogleContactForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              contact,
            );
          },
        }),
        delete_google_contact: tool({
          description:
            "Delete a saved Google Contact only after explicit user confirmation.",
          inputSchema: z.object({
            resourceName: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, resourceName }) => {
            if (!confirmed) {
              return { ok: false, reason: "Deleting a Google Contact requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return deleteGoogleContactForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              resourceName,
            );
          },
        }),
        list_gmail_messages: tool({
          description: "List or search Gmail messages for the connected user.",
          inputSchema: z.object({
            query: z.string().optional(),
            maxResults: z.number().int().min(1).max(20).default(10),
          }),
          execute: async ({ query, maxResults }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return listGmailMessagesForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              { query, maxResults },
            );
          },
        }),
        read_gmail_message: tool({
          description: "Read a Gmail message body by id.",
          inputSchema: z.object({
            id: z.string().min(1),
          }),
          execute: async ({ id }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return readGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        create_gmail_draft: tool({
          description: "Create a Gmail draft. Prefer drafting before sending.",
          inputSchema: emailToolSchema,
          execute: async (email) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return createGmailDraftForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              email,
            );
          },
        }),
        send_gmail_message: tool({
          description:
            "Send a Gmail message only after explicit user confirmation in the current conversation.",
          inputSchema: emailToolSchema.extend({
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...email }) => {
            if (!confirmed) {
              return { ok: false, reason: "Sending email requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return sendGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              email,
            );
          },
        }),
        reply_gmail_message: tool({
          description:
            "Reply to a Gmail message only after explicit user confirmation.",
          inputSchema: z.object({
            messageId: z.string().min(1),
            body: z.string().min(1),
            to: z.string().optional(),
            subject: z.string().optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...reply }) => {
            if (!confirmed) {
              return { ok: false, reason: "Replying requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return replyToGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              reply,
            );
          },
        }),
        archive_gmail_message: tool({
          description: "Archive a Gmail message after explicit user confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Archiving email requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return archiveGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        unarchive_gmail_message: tool({
          description: "Restore an archived Gmail message to the inbox after explicit user confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Restoring email to inbox requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return unarchiveGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        label_gmail_message: tool({
          description: "Apply a Gmail label to a message.",
          inputSchema: z.object({
            id: z.string().min(1),
            label: z.string().min(1),
          }),
          execute: async (input) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return labelGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              input,
            );
          },
        }),
        star_gmail_message: tool({
          description: "Star or unstar a Gmail message.",
          inputSchema: z.object({
            id: z.string().min(1),
            starred: z.boolean().default(true),
          }),
          execute: async ({ id, starred }) => {
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return starGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
              starred,
            );
          },
        }),
        trash_gmail_message: tool({
          description: "Move a Gmail message to trash after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Moving email to trash requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return trashGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        restore_gmail_message: tool({
          description: "Restore a Gmail message from trash after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Restoring email from trash requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return restoreGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        delete_gmail_message: tool({
          description:
            "Permanently delete a Gmail message only after explicit confirmation.",
          inputSchema: z.object({
            id: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ id, confirmed }) => {
            if (!confirmed) {
              return { ok: false, reason: "Permanent deletion requires explicit confirmation." };
            }
            if (!directTokens?.accessToken && !directTokens?.refreshToken) {
              return {
                ok: false,
                reason:
                  "Google is not connected in this browser session. Ask the user to connect Google first.",
              };
            }

            return deleteGmailMessageForUser(
              {
                accessToken: directTokens.accessToken,
                refreshToken: directTokens.refreshToken,
              },
              id,
            );
          },
        }),
        list_github_repositories: tool({
          description: "List recently updated GitHub repositories for the connected user.",
          inputSchema: z.object({
            maxResults: z.number().int().min(1).max(50).default(12),
          }),
          execute: async ({ maxResults }) => {
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return listGithubRepositoriesForUser(githubTokens, maxResults);
          },
        }),
        list_github_issues: tool({
          description: "List open GitHub issues for the connected user.",
          inputSchema: z.object({
            maxResults: z.number().int().min(1).max(50).default(12),
            filter: z
              .enum(["assigned", "created", "mentioned", "subscribed", "all"])
              .default("assigned"),
          }),
          execute: async ({ maxResults, filter }) => {
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return listGithubIssuesForUser(githubTokens, maxResults, filter);
          },
        }),
        list_github_pull_requests: tool({
          description:
            "List open GitHub pull requests. Provide owner and repo for a specific repository, or omit them for recent PRs from recently updated repositories.",
          inputSchema: z.object({
            owner: z.string().optional(),
            repo: z.string().optional(),
            maxResults: z.number().int().min(1).max(50).default(10),
            state: z.enum(["open", "closed", "all"]).default("open"),
          }),
          execute: async ({ owner, repo, maxResults, state }) => {
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            if (owner && repo) {
              return listGithubPullRequestsForRepository(
                githubTokens,
                owner,
                repo,
                maxResults,
                state,
              );
            }

            return listRecentGithubPullRequests(githubTokens, maxResults);
          },
        }),
        create_github_issue: tool({
          description:
            "Create a GitHub issue only after explicit user confirmation in the current conversation.",
          inputSchema: z.object({
            owner: z.string().min(1),
            repo: z.string().min(1),
            title: z.string().min(1),
            body: z.string().optional(),
            labels: z.array(z.string()).optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...issue }) => {
            if (!confirmed) {
              return { ok: false, reason: "Creating a GitHub issue requires explicit confirmation." };
            }
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return createGithubIssueForRepository(githubTokens, issue);
          },
        }),
        update_github_issue: tool({
          description:
            "Edit a GitHub issue title, body, labels, or state only after explicit user confirmation.",
          inputSchema: z.object({
            owner: z.string().min(1),
            repo: z.string().min(1),
            issueNumber: z.number().int().min(1),
            title: z.string().min(1).optional(),
            body: z.string().optional(),
            labels: z.array(z.string()).optional(),
            state: z.enum(["open", "closed"]).optional(),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...issue }) => {
            if (!confirmed) {
              return { ok: false, reason: "Editing a GitHub issue requires explicit confirmation." };
            }
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return updateGithubIssueForRepository(githubTokens, issue);
          },
        }),
        close_github_issue: tool({
          description: "Close a GitHub issue only after explicit user confirmation.",
          inputSchema: z.object({
            owner: z.string().min(1),
            repo: z.string().min(1),
            issueNumber: z.number().int().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...issue }) => {
            if (!confirmed) {
              return { ok: false, reason: "Closing a GitHub issue requires explicit confirmation." };
            }
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return updateGithubIssueForRepository(githubTokens, {
              ...issue,
              state: "closed",
            });
          },
        }),
        reopen_github_issue: tool({
          description: "Reopen a GitHub issue only after explicit user confirmation.",
          inputSchema: z.object({
            owner: z.string().min(1),
            repo: z.string().min(1),
            issueNumber: z.number().int().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...issue }) => {
            if (!confirmed) {
              return { ok: false, reason: "Reopening a GitHub issue requires explicit confirmation." };
            }
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return updateGithubIssueForRepository(githubTokens, {
              ...issue,
              state: "open",
            });
          },
        }),
        comment_github_issue: tool({
          description:
            "Comment on a GitHub issue or pull request only after explicit user confirmation.",
          inputSchema: z.object({
            owner: z.string().min(1),
            repo: z.string().min(1),
            issueNumber: z.number().int().min(1),
            body: z.string().min(1),
            confirmed: z.boolean().default(false),
          }),
          execute: async ({ confirmed, ...comment }) => {
            if (!confirmed) {
              return { ok: false, reason: "Commenting on GitHub requires explicit confirmation." };
            }
            if (!githubTokens?.accessToken) {
              return {
                ok: false,
                reason:
                  "GitHub is not connected in this browser session. Ask the user to connect GitHub first.",
              };
            }

            return commentOnGithubIssue(githubTokens, comment);
          },
        }),
      },
    });

    await persistActiveProjectRecord();

    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content:
        result.text.trim() ||
        "I completed the tool call, but the model did not return a final message.",
      provider: config.provider,
      modelId: config.modelId,
      aiUsed: true,
      ...(projectRecordChanged
        ? { projectRecord: activeProjectRecord }
        : {}),
    });
  } catch (error) {
    console.error("AI assistant chat failed", error);
    await persistActiveProjectRecord();

    return NextResponse.json<ChatResponse>(
      {
        role: "assistant",
        content:
          error instanceof Error
            ? `The configured AI provider failed: ${error.message}`
            : "The configured AI provider failed.",
        provider: config.provider,
        modelId: config.modelId,
        aiUsed: false,
        ...(projectRecordChanged
          ? { projectRecord: activeProjectRecord }
          : {}),
      },
      { status: 502 },
    );
  }
}
