import {
  assertGoogleToolReady,
  createGoogleOAuthClient,
  googleServices,
  type GoogleTokenSet,
} from "./client";

export async function getUpcomingCalendarEvents(maxResults = 10) {
  const readiness = assertGoogleToolReady();
  if (!readiness.ok) return readiness;

  const response = await googleServices.calendar().events.list({
    calendarId: "primary",
    maxResults,
    orderBy: "startTime",
    singleEvents: true,
    timeMin: new Date().toISOString(),
  });

  return {
    ok: true,
    events:
      response.data.items?.map((event) => ({
        id: event.id,
        title: event.summary ?? "Untitled event",
        start: event.start?.dateTime ?? event.start?.date,
        end: event.end?.dateTime ?? event.end?.date,
        hangoutLink: event.hangoutLink,
      })) ?? [],
  };
}

export async function getUpcomingCalendarEventsForUser(
  tokens: GoogleTokenSet,
  maxResults = 10,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "You are signed in, but the server did not receive a Google access or refresh token.",
    };
  }

  const calendar = googleServices.calendar();
  const auth = createGoogleOAuthClient(tokens);
  const response = await calendar.events.list({
    auth,
    calendarId: "primary",
    maxResults,
    orderBy: "startTime",
    singleEvents: true,
    timeMin: new Date().toISOString(),
  });

  return {
    ok: true,
    events:
      response.data.items?.map((event) => ({
        id: event.id,
        title: event.summary ?? "Untitled event",
        start: event.start?.dateTime ?? event.start?.date,
        end: event.end?.dateTime ?? event.end?.date,
        hangoutLink: event.hangoutLink,
      })) ?? [],
  };
}

export async function createCalendarEventForUser(
  tokens: GoogleTokenSet,
  event: {
    summary: string;
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
    description?: string;
    location?: string;
    attendees?: string[];
    conferenceData?: boolean;
    reminderMinutes?: number | null;
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google is not connected in this browser session. Connect Google before creating calendar events.",
    };
  }

  const calendar = googleServices.calendar();
  const auth = createGoogleOAuthClient(tokens);
  const response = await calendar.events.insert({
    auth,
    calendarId: "primary",
    conferenceDataVersion: event.conferenceData ? 1 : 0,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      attendees: event.attendees?.map((email) => ({ email })),
      start: {
        dateTime: event.startDateTime,
        timeZone: event.timeZone,
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: event.timeZone,
      },
      reminders:
        typeof event.reminderMinutes === "number"
          ? {
              useDefault: false,
              overrides: [{ method: "popup", minutes: event.reminderMinutes }],
            }
          : undefined,
      conferenceData: event.conferenceData
        ? {
            createRequest: {
              requestId:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `relay-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    },
  });

  return {
    ok: true,
    event: {
      id: response.data.id,
      title: response.data.summary ?? event.summary,
      start: response.data.start?.dateTime ?? response.data.start?.date,
      end: response.data.end?.dateTime ?? response.data.end?.date,
      htmlLink: response.data.htmlLink,
      hangoutLink: response.data.hangoutLink,
    },
  };
}

export async function updateCalendarEventForUser(
  tokens: GoogleTokenSet,
  event: {
    id: string;
    summary?: string;
    startDateTime?: string;
    endDateTime?: string;
    timeZone?: string;
    description?: string;
    location?: string;
    attendees?: string[];
    reminderMinutes?: number | null;
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Calendar is not connected in this browser session. Connect Google before editing calendar events.",
    };
  }

  const calendar = googleServices.calendar();
  const auth = createGoogleOAuthClient(tokens);
  const response = await calendar.events.patch({
    auth,
    calendarId: "primary",
    eventId: event.id,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      attendees: event.attendees?.map((email) => ({ email })),
      start: event.startDateTime
        ? {
            dateTime: event.startDateTime,
            timeZone: event.timeZone,
          }
        : undefined,
      end: event.endDateTime
        ? {
            dateTime: event.endDateTime,
            timeZone: event.timeZone,
          }
        : undefined,
      reminders:
        typeof event.reminderMinutes === "number"
          ? {
              useDefault: false,
              overrides: [{ method: "popup", minutes: event.reminderMinutes }],
            }
          : undefined,
    },
  });

  return {
    ok: true,
    event: {
      id: response.data.id,
      title: response.data.summary ?? event.summary ?? "Untitled event",
      start: response.data.start?.dateTime ?? response.data.start?.date,
      end: response.data.end?.dateTime ?? response.data.end?.date,
      htmlLink: response.data.htmlLink,
      hangoutLink: response.data.hangoutLink,
    },
  };
}

export async function listRecentDriveFilesForUser(
  tokens: GoogleTokenSet,
  maxResults = 10,
  query?: string,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Drive is not connected in this browser session. Connect Google before listing files.",
    };
  }

  const drive = googleServices.drive();
  const auth = createGoogleOAuthClient(tokens);
  const response = await drive.files.list({
    auth,
    pageSize: maxResults,
    q: [
      "trashed = false",
      query ? `name contains '${query.replaceAll("'", "\\'")}'` : null,
    ]
      .filter(Boolean)
      .join(" and "),
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,webViewLink,modifiedTime,owners(displayName,emailAddress))",
  });

  return {
    ok: true,
    files:
      response.data.files?.map((file) => ({
        id: file.id,
        name: file.name ?? "Untitled file",
        mimeType: file.mimeType ?? "application/octet-stream",
        webViewLink: file.webViewLink ?? null,
        modifiedTime: file.modifiedTime ?? null,
        owner:
          file.owners?.[0]?.displayName ??
          file.owners?.[0]?.emailAddress ??
          "Unknown owner",
      })) ?? [],
  };
}

export async function listGoogleTaskListsForUser(tokens: GoogleTokenSet) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Tasks is not connected in this browser session. Connect Google before listing task lists.",
      taskLists: [],
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.tasks().tasklists.list({
    auth,
    maxResults: 20,
  });

  return {
    ok: true,
    taskLists:
      response.data.items?.map((taskList) => ({
        id: taskList.id,
        title: taskList.title ?? "Untitled task list",
      })) ?? [],
  };
}

async function resolveGoogleTaskListId(
  tokens: GoogleTokenSet,
  taskListId?: string | null,
) {
  if (taskListId && taskListId !== "@default") return taskListId;

  const lists = await listGoogleTaskListsForUser(tokens);
  if (!lists.ok) return "@default";

  return lists.taskLists[0]?.id ?? "@default";
}

export async function listGoogleTasksForUser(
  tokens: GoogleTokenSet,
  maxResults = 20,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Tasks is not connected in this browser session. Connect Google before listing tasks.",
      taskLists: [],
      tasks: [],
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const taskListsResult = await listGoogleTaskListsForUser(tokens);
  const taskLists = taskListsResult.ok ? taskListsResult.taskLists : [];
  const listsToRead = taskLists.length > 0 ? taskLists.slice(0, 5) : [{ id: "@default", title: "Default" }];

  const taskGroups = await Promise.all(
    listsToRead.map(async (taskList) => {
      const response = await googleServices.tasks().tasks.list({
        auth,
        tasklist: taskList.id ?? "@default",
        maxResults,
        showCompleted: true,
        showDeleted: false,
        showHidden: false,
      });

      return (
        response.data.items?.map((task) => ({
          id: task.id,
          title: task.title ?? "Untitled task",
          notes: task.notes ?? null,
          due: task.due ?? null,
          status: task.status ?? null,
          completed: task.completed ?? null,
          updated: task.updated ?? null,
          taskListId: taskList.id ?? null,
          taskListTitle: taskList.title,
        })) ?? []
      );
    }),
  );

  return {
    ok: true,
    taskLists,
    tasks: taskGroups.flat(),
  };
}

export async function createGoogleTaskForUser(
  tokens: GoogleTokenSet,
  task: {
    title: string;
    notes?: string;
    due?: string | null;
    taskListId?: string | null;
    priority?: "high" | "medium" | "low";
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Tasks is not connected in this browser session. Connect Google before creating tasks.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const tasklist = await resolveGoogleTaskListId(tokens, task.taskListId);
  const notes = [task.priority ? `Priority: ${task.priority}` : null, task.notes]
    .filter(Boolean)
    .join("\n\n");
  const response = await googleServices.tasks().tasks.insert({
    auth,
    tasklist,
    requestBody: {
      title: task.title,
      notes: notes || undefined,
      due: task.due ?? undefined,
    },
  });

  return {
    ok: true,
    task: {
      id: response.data.id,
      title: response.data.title ?? task.title,
      notes: response.data.notes ?? null,
      due: response.data.due ?? null,
      status: response.data.status ?? null,
      completed: response.data.completed ?? null,
      updated: response.data.updated ?? null,
      taskListId: tasklist,
    },
  };
}

export async function updateGoogleTaskForUser(
  tokens: GoogleTokenSet,
  task: {
    id: string;
    taskListId?: string | null;
    title?: string;
    notes?: string;
    due?: string | null;
    status?: "needsAction" | "completed";
    priority?: "high" | "medium" | "low";
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Tasks is not connected in this browser session. Connect Google before editing tasks.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const tasklist = await resolveGoogleTaskListId(tokens, task.taskListId);
  const notes = [task.priority ? `Priority: ${task.priority}` : null, task.notes]
    .filter(Boolean)
    .join("\n\n");
  const response = await googleServices.tasks().tasks.patch({
    auth,
    task: task.id,
    tasklist,
    requestBody: {
      title: task.title,
      notes: notes || undefined,
      due: task.due ?? undefined,
      status: task.status,
      completed: task.status === "completed" ? new Date().toISOString() : undefined,
    },
  });

  return {
    ok: true,
    task: {
      id: response.data.id,
      title: response.data.title ?? task.title ?? "Untitled task",
      notes: response.data.notes ?? null,
      due: response.data.due ?? null,
      status: response.data.status ?? null,
      completed: response.data.completed ?? null,
      updated: response.data.updated ?? null,
      taskListId: tasklist,
    },
  };
}

export async function completeGoogleTaskForUser(
  tokens: GoogleTokenSet,
  task: { id: string; taskListId?: string | null },
) {
  return updateGoogleTaskForUser(tokens, {
    id: task.id,
    taskListId: task.taskListId,
    status: "completed",
  });
}

export async function deleteGoogleTaskForUser(
  tokens: GoogleTokenSet,
  task: { id: string; taskListId?: string | null },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Google Tasks is not connected in this browser session. Connect Google before deleting tasks.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const tasklist = await resolveGoogleTaskListId(tokens, task.taskListId);
  await googleServices.tasks().tasks.delete({
    auth,
    task: task.id,
    tasklist,
  });

  return { ok: true, id: task.id, taskListId: tasklist };
}

function getGmailHeader(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string,
) {
  return (
    headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? null
  );
}

function sanitizeMimeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value?: string | null) {
  if (!value) return "";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractTextFromGmailPayload(payload?: {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: Array<{
    mimeType?: string | null;
    body?: { data?: string | null } | null;
    parts?: unknown;
  }> | null;
}): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts ?? [];
  for (const part of parts) {
    const text = extractTextFromGmailPayload(part as Parameters<typeof extractTextFromGmailPayload>[0]);
    if (text) return text;
  }

  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

function createRawEmail(input: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  from?: string;
  inReplyTo?: string | null;
  references?: string | null;
}) {
  const headers = [
    input.from ? `From: ${sanitizeMimeHeader(input.from)}` : null,
    `To: ${sanitizeMimeHeader(input.to)}`,
    input.cc ? `Cc: ${sanitizeMimeHeader(input.cc)}` : null,
    input.bcc ? `Bcc: ${sanitizeMimeHeader(input.bcc)}` : null,
    `Subject: ${sanitizeMimeHeader(input.subject)}`,
    input.inReplyTo ? `In-Reply-To: ${sanitizeMimeHeader(input.inReplyTo)}` : null,
    input.references ? `References: ${sanitizeMimeHeader(input.references)}` : null,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
  ].filter(Boolean);

  return encodeBase64Url(`${headers.join("\r\n")}\r\n\r\n${input.body}`);
}

function mapGmailMessage(message: {
  id?: string | null;
  threadId?: string | null;
  snippet?: string | null;
  labelIds?: string[] | null;
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }> | null;
  } | null;
  internalDate?: string | null;
}) {
  const headers = message.payload?.headers ?? [];

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getGmailHeader(headers, "Subject") ?? "(No subject)",
    from: getGmailHeader(headers, "From"),
    to: getGmailHeader(headers, "To"),
    date:
      getGmailHeader(headers, "Date") ??
      (message.internalDate
        ? new Date(Number(message.internalDate)).toISOString()
        : null),
    snippet: message.snippet ?? null,
    labelIds: message.labelIds ?? [],
  };
}

export async function listGmailMessagesForUser(
  tokens: GoogleTokenSet,
  options: { query?: string; maxResults?: number } = {},
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before reading email.",
      messages: [],
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const gmail = googleServices.gmail();
  const list = await gmail.users.messages.list({
    auth,
    userId: "me",
    maxResults: options.maxResults ?? 10,
    q: options.query || undefined,
  });
  const messages = await Promise.all(
    (list.data.messages ?? []).map(async (message) => {
      const response = await gmail.users.messages.get({
        auth,
        userId: "me",
        id: message.id ?? "",
        format: "metadata",
        metadataHeaders: ["Subject", "From", "To", "Date"],
      });

      return mapGmailMessage(response.data);
    }),
  );

  return { ok: true, messages };
}

export async function listGmailDraftsForUser(
  tokens: GoogleTokenSet,
  maxResults = 5,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before reading drafts.",
      drafts: [],
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const gmail = googleServices.gmail();
  const list = await gmail.users.drafts.list({
    auth,
    userId: "me",
    maxResults,
  });
  const drafts = await Promise.all(
    (list.data.drafts ?? []).map(async (draft) => {
      const response = await gmail.users.drafts.get({
        auth,
        userId: "me",
        id: draft.id ?? "",
        format: "metadata",
      });
      const message = mapGmailMessage(response.data.message ?? {});

      return {
        id: response.data.id,
        messageId: response.data.message?.id,
        threadId: response.data.message?.threadId ?? null,
        subject: message.subject,
        to: message.to ?? null,
        date: message.date ?? null,
        snippet: message.snippet ?? null,
      };
    }),
  );

  return { ok: true, drafts };
}

export async function readGmailMessageForUser(
  tokens: GoogleTokenSet,
  id: string,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before reading email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.gmail().users.messages.get({
    auth,
    userId: "me",
    id,
    format: "full",
  });

  return {
    ok: true,
    message: {
      ...mapGmailMessage(response.data),
      body: extractTextFromGmailPayload(response.data.payload),
    },
  };
}

export async function createGmailDraftForUser(
  tokens: GoogleTokenSet,
  email: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string | null;
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before drafting email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.gmail().users.drafts.create({
    auth,
    userId: "me",
    requestBody: {
      message: {
        raw: createRawEmail(email),
        threadId: email.threadId ?? undefined,
      },
    },
  });

  return {
    ok: true,
    draft: {
      id: response.data.id,
      messageId: response.data.message?.id,
      threadId: response.data.message?.threadId ?? email.threadId ?? null,
      subject: email.subject,
      to: email.to,
    },
  };
}

export async function sendGmailMessageForUser(
  tokens: GoogleTokenSet,
  email: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string | null;
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before sending email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.gmail().users.messages.send({
    auth,
    userId: "me",
    requestBody: {
      raw: createRawEmail(email),
      threadId: email.threadId ?? undefined,
    },
  });

  return {
    ok: true,
    message: {
      id: response.data.id,
      threadId: response.data.threadId,
      subject: email.subject,
      to: email.to,
    },
  };
}

export async function replyToGmailMessageForUser(
  tokens: GoogleTokenSet,
  reply: {
    messageId: string;
    body: string;
    to?: string;
    subject?: string;
  },
) {
  const original = await readGmailMessageForUser(tokens, reply.messageId);
  if (!original.ok || !("message" in original)) return original;

  const message = original.message;
  if (!message) return { ok: false, reason: "Original Gmail message could not be read." };

  return sendGmailMessageForUser(tokens, {
    to: reply.to ?? message.from ?? "",
    subject: reply.subject ?? (message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`),
    body: reply.body,
    threadId: message.threadId ?? undefined,
  });
}

export async function modifyGmailMessageForUser(
  tokens: GoogleTokenSet,
  change: {
    id: string;
    addLabelIds?: string[];
    removeLabelIds?: string[];
  },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before modifying email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.gmail().users.messages.modify({
    auth,
    userId: "me",
    id: change.id,
    requestBody: {
      addLabelIds: change.addLabelIds,
      removeLabelIds: change.removeLabelIds,
    },
  });

  return { ok: true, message: mapGmailMessage(response.data) };
}

export async function archiveGmailMessageForUser(
  tokens: GoogleTokenSet,
  id: string,
) {
  return modifyGmailMessageForUser(tokens, {
    id,
    removeLabelIds: ["INBOX"],
  });
}

export async function starGmailMessageForUser(
  tokens: GoogleTokenSet,
  id: string,
  starred = true,
) {
  return modifyGmailMessageForUser(tokens, {
    id,
    addLabelIds: starred ? ["STARRED"] : undefined,
    removeLabelIds: starred ? undefined : ["STARRED"],
  });
}

export async function trashGmailMessageForUser(
  tokens: GoogleTokenSet,
  id: string,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before trashing email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  const response = await googleServices.gmail().users.messages.trash({
    auth,
    userId: "me",
    id,
  });

  return { ok: true, message: mapGmailMessage(response.data) };
}

export async function deleteGmailMessageForUser(
  tokens: GoogleTokenSet,
  id: string,
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before deleting email.",
    };
  }

  const auth = createGoogleOAuthClient(tokens);
  await googleServices.gmail().users.messages.delete({
    auth,
    userId: "me",
    id,
  });

  return { ok: true, id };
}

async function ensureGmailLabelIdForUser(tokens: GoogleTokenSet, labelName: string) {
  const auth = createGoogleOAuthClient(tokens);
  const gmail = googleServices.gmail();
  const labels = await gmail.users.labels.list({ auth, userId: "me" });
  const existing = labels.data.labels?.find(
    (label) => label.name?.toLowerCase() === labelName.toLowerCase(),
  );
  if (existing?.id) return existing.id;

  const created = await gmail.users.labels.create({
    auth,
    userId: "me",
    requestBody: {
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
      name: labelName,
    },
  });

  return created.data.id ?? labelName;
}

export async function labelGmailMessageForUser(
  tokens: GoogleTokenSet,
  input: { id: string; label: string },
) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      ok: false,
      reason:
        "Gmail is not connected in this browser session. Connect Google before labeling email.",
    };
  }

  const labelId = await ensureGmailLabelIdForUser(tokens, input.label);
  return modifyGmailMessageForUser(tokens, {
    id: input.id,
    addLabelIds: [labelId],
  });
}

export async function searchDriveFiles(query: string, maxResults = 10) {
  const readiness = assertGoogleToolReady();
  if (!readiness.ok) return readiness;

  const escapedQuery = query.replace(/'/g, "\\'");
  const response = await googleServices.drive().files.list({
    pageSize: maxResults,
    q: `name contains '${escapedQuery}' and trashed = false`,
    fields: "files(id,name,mimeType,webViewLink,modifiedTime)",
  });

  return {
    ok: true,
    files: response.data.files ?? [],
  };
}

export async function readSpreadsheetRange(spreadsheetId: string, range: string) {
  const readiness = assertGoogleToolReady();
  if (!readiness.ok) return readiness;

  const response = await googleServices.sheets().spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return {
    ok: true,
    range: response.data.range,
    values: response.data.values ?? [],
  };
}
