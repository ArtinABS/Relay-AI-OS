import { NextResponse } from "next/server";

import { getGithubSetupStatus } from "@/lib/github/client";
import { getDirectGithubTokens } from "@/lib/github/direct-session";
import {
  listGithubIssuesForUser,
  listGithubRepositoriesForUser,
  listRecentGithubPullRequests,
} from "@/lib/github/workspace";
import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { getGoogleSetupStatus } from "@/lib/google/client";
import {
  getUpcomingCalendarEventsForUser,
  listGoogleContactsForUser,
  listGmailDraftsForUser,
  listGmailMessagesForUser,
  listGoogleTasksForUser,
  listRecentDriveFilesForUser,
} from "@/lib/google/workspace";
import { listScheduledEmails } from "@/lib/local-store/scheduled-emails";
import { listNotes } from "@/lib/local-store/notes";
import { listTasks } from "@/lib/local-store/tasks";

export async function GET() {
  const [tasks, notes, directTokens, githubTokens, scheduledEmails] = await Promise.all([
    listTasks(),
    listNotes(),
    getDirectGoogleTokens(),
    getDirectGithubTokens(),
    listScheduledEmails(),
  ]);
  const google = getGoogleSetupStatus();
  const github = getGithubSetupStatus();
  const openTasks = tasks.filter((task) => !task.completed);
  const connected = Boolean(directTokens?.accessToken || directTokens?.refreshToken);
  const githubConnected = Boolean(githubTokens?.accessToken);
  const [calendar, drive, googleTasks, gmail, gmailDrafts, contacts] = directTokens && connected
    ? await Promise.all([
        getUpcomingCalendarEventsForUser(directTokens, 10).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read Google Calendar events.",
          events: [],
        })),
        listRecentDriveFilesForUser(directTokens, 10).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
            : "Unable to read Google Drive files.",
          files: [],
        })),
        listGoogleTasksForUser(directTokens, 25).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read Google Tasks.",
          taskLists: [],
          tasks: [],
        })),
        listGmailMessagesForUser(directTokens, {
          query: "in:inbox newer_than:14d",
          maxResults: 8,
        }).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read Gmail inbox.",
          messages: [],
        })),
        listGmailDraftsForUser(directTokens, 5).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read Gmail drafts.",
          drafts: [],
        })),
        listGoogleContactsForUser(directTokens, { maxResults: 20 }).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read Google Contacts.",
          contacts: [],
        })),
      ])
    : [
        {
          ok: false,
          reason: "Google Calendar is not connected.",
          events: [],
        },
        {
          ok: false,
          reason: "Google Drive is not connected.",
          files: [],
        },
        {
          ok: false,
          reason: "Google Tasks is not connected.",
          taskLists: [],
          tasks: [],
        },
        {
          ok: false,
          reason: "Gmail is not connected.",
          messages: [],
        },
        {
          ok: false,
          reason: "Gmail is not connected.",
          drafts: [],
        },
        {
          ok: false,
          reason: "Google Contacts is not connected.",
          contacts: [],
        },
      ];
  const [githubRepositories, githubIssues, githubPullRequests] = githubTokens && githubConnected
    ? await Promise.all([
        listGithubRepositoriesForUser(githubTokens, 8).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read GitHub repositories.",
          repositories: [],
        })),
        listGithubIssuesForUser(githubTokens, 8).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read GitHub issues.",
          issues: [],
        })),
        listRecentGithubPullRequests(githubTokens, 8).catch((error) => ({
          ok: false,
          reason:
            error instanceof Error
              ? error.message
              : "Unable to read GitHub pull requests.",
          pullRequests: [],
        })),
      ])
    : [
        {
          ok: false,
          reason: "GitHub is not connected.",
          repositories: [],
        },
        {
          ok: false,
          reason: "GitHub is not connected.",
          issues: [],
        },
        {
          ok: false,
          reason: "GitHub is not connected.",
          pullRequests: [],
        },
      ];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    localTime: new Date().toLocaleString(),
    focus: openTasks[0] ?? null,
    openTasks: openTasks.slice(0, 5),
    recentNotes: notes.slice(0, 5),
    counts: {
      openTasks: openTasks.length,
      completedTasks: tasks.length - openTasks.length,
      notes: notes.length,
    },
    google: {
      configured: google.hasOAuthApp,
      connected,
      email: directTokens?.email ?? null,
    },
    github: {
      configured: github.hasOAuthApp,
      connected: githubConnected,
      login: githubTokens?.login ?? null,
      name: githubTokens?.name ?? null,
      email: githubTokens?.email ?? null,
    },
    calendar,
    drive,
    googleTasks,
    gmail,
    gmailDrafts,
    contacts,
    githubRepositories,
    githubIssues,
    githubPullRequests,
    scheduledEmails: scheduledEmails.filter((email) => email.status === "scheduled").slice(0, 5),
  });
}
