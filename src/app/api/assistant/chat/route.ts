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
} from "@/lib/github/workspace";
import { getGoogleSetupStatus } from "@/lib/google/client";
import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import {
  archiveGmailMessageForUser,
  completeGoogleTaskForUser,
  createGoogleContactForUser,
  createGoogleTaskForUser,
  createGmailDraftForUser,
  deleteGoogleContactForUser,
  deleteGmailMessageForUser,
  deleteGoogleTaskForUser,
  getGoogleContactForUser,
  getUpcomingCalendarEventsForUser,
  labelGmailMessageForUser,
  listGmailMessagesForUser,
  listGoogleContactsForUser,
  listGoogleTasksForUser,
  listRecentDriveFilesForUser,
  readGmailMessageForUser,
  replyToGmailMessageForUser,
  sendGmailMessageForUser,
  starGmailMessageForUser,
  trashGmailMessageForUser,
  updateGoogleContactForUser,
  updateGoogleTaskForUser,
} from "@/lib/google/workspace";
import { calculateExpression } from "@/lib/local-tools/calculator";
import { addNote, listNotes, searchNotes } from "@/lib/local-store/notes";
import {
  addTask,
  clearCompletedTasks,
  completeTask,
  listTasks,
} from "@/lib/local-store/tasks";

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
  const tasks = await listTasks();
  const notes = await listNotes();

  try {
    const result = await generateText({
      model: config.model,
      system: [
        workAgentPrompt,
        "",
        "You are currently running inside Relay's main chat surface, not a demo.",
        "For every new user message, start from a neutral intent analysis. Do not stay locked into the previous toolset; choose tools, panels, and generated UI from the current request plus recent conversation context.",
        "Use the available tools when the user asks about tasks, notes, schedule, calendar, OAuth, Gmail, Drive, GitHub, repositories, issues, pull requests, or calculations.",
        "When missing details can be collected through generated UI, acknowledge briefly and rely on the UI instead of asking a numbered plain-text questionnaire.",
        "For scheduling, task, reminder, file, memory, and email workflows, be concise and let the application surface collect structured details.",
        "Format final assistant responses as GitHub-flavored Markdown. Use short headings, bullet lists, checklists, tables, code spans, and links when they improve scanability. Do not return raw plain-text paragraphs for multi-part answers.",
        "Keep Markdown compact and professional. Avoid over-formatting simple one-sentence confirmations.",
        "If a user asks for tomorrow's schedule, call the calendar tool. If Google Calendar is unavailable, say exactly what permission or OAuth step is missing.",
        "For contacts, use Google Contacts tools to find people, emails, phone numbers, organizations, and birthdays. Creating, editing, or deleting contacts requires explicit confirmation.",
        "Never pretend to complete Google, Gmail, Calendar, Drive, Contacts, or destructive actions if the tool result says they are blocked.",
        "For GitHub, reading repositories/issues/pull requests is allowed when connected. Creating issues or comments requires explicit confirmation.",
        "For long-term memory, ask for permission before storing unless the user explicitly says to remember/save it.",
        "",
        `Current date/time: ${new Date().toLocaleString()}`,
        `Known open tasks: ${JSON.stringify(
          tasks.filter((task) => !task.completed).slice(0, 12),
        )}`,
        `Known recent notes: ${JSON.stringify(notes.slice(0, 8))}`,
        `Google signed in: ${Boolean(directTokens?.accessToken || directTokens?.refreshToken)}`,
        `Google email: ${directTokens?.email ?? "not connected"}`,
        `GitHub signed in: ${Boolean(githubTokens?.accessToken)}`,
        `GitHub login: ${githubTokens?.login ?? "not connected"}`,
        `Recent chat memory: ${JSON.stringify(parsed.data.history?.slice(-16) ?? [])}`,
      ].join("\n"),
      prompt: parsed.data.message,
      temperature: 0.35,
      stopWhen: stepCountIs(5),
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
        list_tasks: tool({
          description: "List local Relay tasks.",
          inputSchema: z.object({
            includeCompleted: z.boolean().default(false),
          }),
          execute: async ({ includeCompleted }) => {
            const allTasks = await listTasks();
            return includeCompleted
              ? allTasks
              : allTasks.filter((task) => !task.completed);
          },
        }),
        create_task: tool({
          description: "Create a local Relay task.",
          inputSchema: z.object({
            title: z.string().min(1),
          }),
          execute: async ({ title }) => addTask(title),
        }),
        complete_task: tool({
          description:
            "Complete a local Relay task by id, list number, or title fragment.",
          inputSchema: z.object({
            identifier: z.string().min(1),
          }),
          execute: async ({ identifier }) => completeTask(identifier),
        }),
        clear_completed_tasks: tool({
          description: "Clear completed local Relay tasks.",
          inputSchema: z.object({}),
          execute: async () => clearCompletedTasks(),
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

    return NextResponse.json<ChatResponse>({
      role: "assistant",
      content:
        result.text.trim() ||
        "I completed the tool call, but the model did not return a final message.",
      provider: config.provider,
      modelId: config.modelId,
      aiUsed: true,
    });
  } catch (error) {
    console.error("AI assistant chat failed", error);

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
      },
      { status: 502 },
    );
  }
}
