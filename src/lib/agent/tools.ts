import { defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";

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
  getUpcomingCalendarEvents,
  labelGmailMessageForUser,
  listGmailMessagesForUser,
  listGoogleContactsForUser,
  listGoogleTasksForUser,
  moveDriveFileForUser,
  readDriveFileTextForUser,
  readSpreadsheetRange,
  renameDriveFileForUser,
  replyToGmailMessageForUser,
  restoreGmailMessageForUser,
  sendGmailMessageForUser,
  starGmailMessageForUser,
  trashGmailMessageForUser,
  searchDriveFiles,
  setDriveFileTrashedForUser,
  shareDriveFileForUser,
  unarchiveGmailMessageForUser,
  updateCalendarEventForUser,
  updateGoogleContactForUser,
  updateGoogleTaskForUser,
} from "@/lib/google/workspace";
import { toolCatalog } from "@/lib/tools/catalog";

const gmailEmailParameters = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().nullable().optional(),
});

export const agentTools = [
  defineTool({
    name: "get_workspace_setup_status",
    description:
      "Inspect which backend systems, Google credentials, and tool categories are ready.",
    parameters: z.object({}),
    execute: async () => ({
      google: getGoogleSetupStatus(),
      github: getGithubSetupStatus(),
      tools: toolCatalog.map(({ name, status, detail }) => ({
        name,
        status,
        detail,
      })),
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      inngestConfigured: Boolean(
        process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY,
      ),
    }),
  }),
  defineTool({
    name: "list_upcoming_calendar_events",
    description:
      "List upcoming Google Calendar events. Requires configured Google OAuth credentials and tokens.",
    parameters: z.object({
      maxResults: z.number().int().min(1).max(25).default(10),
    }),
    execute: async ({ maxResults }) => getUpcomingCalendarEvents(maxResults),
  }),
  defineTool({
    name: "create_calendar_event",
    description: "Create a Google Calendar event for the connected browser user.",
    parameters: z.object({
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
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Calendar is not connected in this browser session." };
      }

      return createCalendarEventForUser(tokens, event);
    },
  }),
  defineTool({
    name: "update_calendar_event",
    description: "Edit a Google Calendar event only after explicit user confirmation.",
    parameters: z.object({
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
      if (!confirmed) return { ok: false, reason: "Editing a calendar event requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Calendar is not connected in this browser session." };
      }

      return updateCalendarEventForUser(tokens, event);
    },
  }),
  defineTool({
    name: "delete_calendar_event",
    description: "Delete a Google Calendar event only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Deleting a calendar event requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Calendar is not connected in this browser session." };
      }

      return deleteCalendarEventForUser(tokens, { id });
    },
  }),
  defineTool({
    name: "search_drive_files",
    description:
      "Search Google Drive files by name. Requires configured Google OAuth credentials and tokens.",
    parameters: z.object({
      query: z.string().min(1),
      maxResults: z.number().int().min(1).max(25).default(10),
    }),
    execute: async ({ query, maxResults }) => searchDriveFiles(query, maxResults),
  }),
  defineTool({
    name: "read_drive_file",
    description: "Read Google Drive file metadata by id.",
    parameters: z.object({ id: z.string().min(1) }),
    execute: async ({ id }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return getDriveFileForUser(tokens, id);
    },
  }),
  defineTool({
    name: "read_drive_file_text",
    description: "Extract text from a Google Drive document or text-compatible file.",
    parameters: z.object({
      id: z.string().min(1),
      maxCharacters: z.number().int().min(500).max(20000).default(6000),
    }),
    execute: async (input) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return readDriveFileTextForUser(tokens, input);
    },
  }),
  defineTool({
    name: "rename_drive_file",
    description: "Rename a Google Drive file only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...input }) => {
      if (!confirmed) return { ok: false, reason: "Renaming a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return renameDriveFileForUser(tokens, input);
    },
  }),
  defineTool({
    name: "move_drive_file",
    description: "Move a Google Drive file only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      folderId: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...input }) => {
      if (!confirmed) return { ok: false, reason: "Moving a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return moveDriveFileForUser(tokens, input);
    },
  }),
  defineTool({
    name: "duplicate_drive_file",
    description: "Duplicate a Google Drive file only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      name: z.string().optional(),
      folderId: z.string().nullable().optional(),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...input }) => {
      if (!confirmed) return { ok: false, reason: "Duplicating a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return copyDriveFileForUser(tokens, input);
    },
  }),
  defineTool({
    name: "trash_drive_file",
    description: "Move a Google Drive file to trash only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Trashing a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return setDriveFileTrashedForUser(tokens, { id, trashed: true });
    },
  }),
  defineTool({
    name: "restore_drive_file",
    description: "Restore a Google Drive file from trash only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Restoring a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return setDriveFileTrashedForUser(tokens, { id, trashed: false });
    },
  }),
  defineTool({
    name: "delete_drive_file",
    description: "Permanently delete a Google Drive file only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Permanent Drive deletion requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return deleteDriveFileForUser(tokens, id);
    },
  }),
  defineTool({
    name: "share_drive_file",
    description: "Share a Google Drive file only after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      role: z.enum(["reader", "commenter", "writer"]),
      type: z.enum(["user", "group", "domain", "anyone"]),
      emailAddress: z.string().email().optional(),
      domain: z.string().optional(),
      allowFileDiscovery: z.boolean().optional(),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...input }) => {
      if (!confirmed) return { ok: false, reason: "Sharing a Drive file requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Drive is not connected in this browser session." };
      }

      return shareDriveFileForUser(tokens, input);
    },
  }),
  defineTool({
    name: "read_sheet_range",
    description:
      "Read values from a Google Sheet range. Requires Sheets scope and configured tokens.",
    parameters: z.object({
      spreadsheetId: z.string().min(1),
      range: z.string().min(1).describe("A1 notation, for example Sheet1!A1:D20"),
    }),
    execute: async ({ spreadsheetId, range }) =>
      readSpreadsheetRange(spreadsheetId, range),
  }),
  defineTool({
    name: "list_google_tasks",
    description:
      "List Google Tasks for the connected browser user.",
    parameters: z.object({
      maxResults: z.number().int().min(1).max(25).default(20),
    }),
    execute: async ({ maxResults }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return {
          ok: false,
          reason: "Google Tasks is not connected in this browser session.",
        };
      }

      return listGoogleTasksForUser(tokens, maxResults);
    },
  }),
  defineTool({
    name: "create_google_task",
    description:
      "Create a Google Task for the connected browser user.",
    parameters: z.object({
      title: z.string().min(1),
      notes: z.string().optional(),
      due: z.string().datetime().nullable().optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      taskListId: z.string().nullable().optional(),
    }),
    execute: async (task) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return {
          ok: false,
          reason: "Google Tasks is not connected in this browser session.",
        };
      }

      return createGoogleTaskForUser(tokens, task);
    },
  }),
  defineTool({
    name: "update_google_task",
    description:
      "Edit a Google Task for the connected browser user.",
    parameters: z.object({
      id: z.string().min(1),
      title: z.string().min(1).optional(),
      notes: z.string().optional(),
      due: z.string().datetime().nullable().optional(),
      status: z.enum(["needsAction", "completed"]).optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      taskListId: z.string().nullable().optional(),
    }),
    execute: async (task) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return {
          ok: false,
          reason: "Google Tasks is not connected in this browser session.",
        };
      }

      return updateGoogleTaskForUser(tokens, task);
    },
  }),
  defineTool({
    name: "complete_google_task",
    description:
      "Mark a Google Task complete for the connected browser user.",
    parameters: z.object({
      id: z.string().min(1),
      taskListId: z.string().nullable().optional(),
    }),
    execute: async (task) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return {
          ok: false,
          reason: "Google Tasks is not connected in this browser session.",
        };
      }

      return completeGoogleTaskForUser(tokens, task);
    },
  }),
  defineTool({
    name: "delete_google_task",
    description:
      "Delete a Google Task after explicit approval.",
    parameters: z.object({
      id: z.string().min(1),
      taskListId: z.string().nullable().optional(),
    }),
    execute: async (task) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return {
          ok: false,
          reason: "Google Tasks is not connected in this browser session.",
        };
      }

      return deleteGoogleTaskForUser(tokens, task);
    },
  }),
  defineTool({
    name: "list_google_contacts",
    description: "List or search saved Google Contacts for the connected browser user.",
    parameters: z.object({
      query: z.string().optional(),
      maxResults: z.number().int().min(1).max(100).default(25),
    }),
    execute: async ({ query, maxResults }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Contacts is not connected in this browser session." };
      }

      return listGoogleContactsForUser(tokens, { query, maxResults });
    },
  }),
  defineTool({
    name: "read_google_contact",
    description: "Read a single saved Google Contact by resourceName.",
    parameters: z.object({
      resourceName: z.string().min(1),
    }),
    execute: async ({ resourceName }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Contacts is not connected in this browser session." };
      }

      return getGoogleContactForUser(tokens, resourceName);
    },
  }),
  defineTool({
    name: "create_google_contact",
    description: "Create a Google Contact only after explicit user confirmation.",
    parameters: z.object({
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
      if (!confirmed) return { ok: false, reason: "Creating a Google Contact requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Contacts is not connected in this browser session." };
      }

      return createGoogleContactForUser(tokens, contact);
    },
  }),
  defineTool({
    name: "update_google_contact",
    description: "Edit a Google Contact only after explicit user confirmation.",
    parameters: z.object({
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
      if (!confirmed) return { ok: false, reason: "Editing a Google Contact requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Contacts is not connected in this browser session." };
      }

      return updateGoogleContactForUser(tokens, contact);
    },
  }),
  defineTool({
    name: "delete_google_contact",
    description: "Delete a Google Contact only after explicit user confirmation.",
    parameters: z.object({
      resourceName: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ resourceName, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Deleting a Google Contact requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Google Contacts is not connected in this browser session." };
      }

      return deleteGoogleContactForUser(tokens, resourceName);
    },
  }),
  defineTool({
    name: "list_gmail_messages",
    description: "List or search Gmail messages for the connected browser user.",
    parameters: z.object({
      query: z.string().optional(),
      maxResults: z.number().int().min(1).max(20).default(10),
    }),
    execute: async ({ query, maxResults }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return listGmailMessagesForUser(tokens, { query, maxResults });
    },
  }),
  defineTool({
    name: "create_gmail_draft",
    description: "Create a Gmail draft for the connected browser user.",
    parameters: gmailEmailParameters,
    execute: async (email) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return createGmailDraftForUser(tokens, email);
    },
  }),
  defineTool({
    name: "send_gmail_message",
    description: "Send Gmail only after explicit user confirmation.",
    parameters: gmailEmailParameters.extend({
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...email }) => {
      if (!confirmed) return { ok: false, reason: "Sending email requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return sendGmailMessageForUser(tokens, email);
    },
  }),
  defineTool({
    name: "reply_gmail_message",
    description: "Reply to Gmail only after explicit user confirmation.",
    parameters: z.object({
      messageId: z.string().min(1),
      body: z.string().min(1),
      to: z.string().optional(),
      subject: z.string().optional(),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...reply }) => {
      if (!confirmed) return { ok: false, reason: "Replying requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return replyToGmailMessageForUser(tokens, reply);
    },
  }),
  defineTool({
    name: "archive_gmail_message",
    description: "Archive a Gmail message after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Archiving requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return archiveGmailMessageForUser(tokens, id);
    },
  }),
  defineTool({
    name: "unarchive_gmail_message",
    description: "Restore an archived Gmail message to the inbox after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Restoring email to inbox requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return unarchiveGmailMessageForUser(tokens, id);
    },
  }),
  defineTool({
    name: "label_gmail_message",
    description: "Apply a Gmail label to a message.",
    parameters: z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }),
    execute: async (input) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return labelGmailMessageForUser(tokens, input);
    },
  }),
  defineTool({
    name: "star_gmail_message",
    description: "Star or unstar a Gmail message.",
    parameters: z.object({
      id: z.string().min(1),
      starred: z.boolean().default(true),
    }),
    execute: async ({ id, starred }) => {
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return starGmailMessageForUser(tokens, id, starred);
    },
  }),
  defineTool({
    name: "trash_gmail_message",
    description: "Move Gmail message to trash after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Trashing requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return trashGmailMessageForUser(tokens, id);
    },
  }),
  defineTool({
    name: "restore_gmail_message",
    description: "Restore a Gmail message from trash after explicit user confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Restoring email from trash requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return restoreGmailMessageForUser(tokens, id);
    },
  }),
  defineTool({
    name: "delete_gmail_message",
    description: "Permanently delete Gmail message after explicit confirmation.",
    parameters: z.object({
      id: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ id, confirmed }) => {
      if (!confirmed) return { ok: false, reason: "Permanent deletion requires confirmation." };
      const tokens = await getDirectGoogleTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        return { ok: false, reason: "Gmail is not connected in this browser session." };
      }

      return deleteGmailMessageForUser(tokens, id);
    },
  }),
  defineTool({
    name: "list_github_repositories",
    description: "List recently updated GitHub repositories for the connected browser user.",
    parameters: z.object({
      maxResults: z.number().int().min(1).max(50).default(12),
    }),
    execute: async ({ maxResults }) => {
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      return listGithubRepositoriesForUser(tokens, maxResults);
    },
  }),
  defineTool({
    name: "list_github_issues",
    description: "List open GitHub issues for the connected browser user.",
    parameters: z.object({
      maxResults: z.number().int().min(1).max(50).default(12),
      filter: z.enum(["assigned", "created", "mentioned", "subscribed", "all"]).default("assigned"),
    }),
    execute: async ({ maxResults, filter }) => {
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      return listGithubIssuesForUser(tokens, maxResults, filter);
    },
  }),
  defineTool({
    name: "list_github_pull_requests",
    description:
      "List open GitHub pull requests. Provide owner and repo for a specific repository, or omit them for recent PRs from recently updated repos.",
    parameters: z.object({
      owner: z.string().optional(),
      repo: z.string().optional(),
      maxResults: z.number().int().min(1).max(50).default(10),
      state: z.enum(["open", "closed", "all"]).default("open"),
    }),
    execute: async ({ owner, repo, maxResults, state }) => {
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      if (owner && repo) {
        return listGithubPullRequestsForRepository(tokens, owner, repo, maxResults, state);
      }

      return listRecentGithubPullRequests(tokens, maxResults);
    },
  }),
  defineTool({
    name: "create_github_issue",
    description: "Create a GitHub issue only after explicit user confirmation.",
    parameters: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      title: z.string().min(1),
      body: z.string().optional(),
      labels: z.array(z.string()).optional(),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...issue }) => {
      if (!confirmed) return { ok: false, reason: "Creating a GitHub issue requires confirmation." };
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      return createGithubIssueForRepository(tokens, issue);
    },
  }),
  defineTool({
    name: "update_github_issue",
    description: "Edit a GitHub issue title, body, labels, or state only after explicit user confirmation.",
    parameters: z.object({
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
      if (!confirmed) return { ok: false, reason: "Editing a GitHub issue requires confirmation." };
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      return updateGithubIssueForRepository(tokens, issue);
    },
  }),
  defineTool({
    name: "comment_github_issue",
    description: "Comment on a GitHub issue or pull request only after explicit user confirmation.",
    parameters: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      issueNumber: z.number().int().min(1),
      body: z.string().min(1),
      confirmed: z.boolean().default(false),
    }),
    execute: async ({ confirmed, ...comment }) => {
      if (!confirmed) return { ok: false, reason: "Commenting on GitHub requires confirmation." };
      const tokens = await getDirectGithubTokens();
      if (!tokens?.accessToken) {
        return { ok: false, reason: "GitHub is not connected in this browser session." };
      }

      return commentOnGithubIssue(tokens, comment);
    },
  }),
] as const;
