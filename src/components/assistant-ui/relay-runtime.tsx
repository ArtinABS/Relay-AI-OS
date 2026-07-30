"use client";

import {
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  WebSpeechDictationAdapter,
  WebSpeechSynthesisAdapter,
  useAui,
  useRemoteThreadListRuntime,
  type MessageStorageEntry,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { createAssistantStream } from "assistant-stream";
import { useMemo, type PropsWithChildren } from "react";

import {
  RelayChatTransport,
  type RelayChatMessage,
} from "@/lib/ai/relay-chat";

const threadIndexStorageKey = "relay.assistant-ui.threads.v1";
const threadMessagesStoragePrefix = "relay.assistant-ui.messages.v1";
const threadHeadStoragePrefix = "relay.assistant-ui.head.v1";

type StoredThread = {
  id: string;
  status: "regular" | "archived";
  title?: string;
  lastMessageAt?: string;
};

type StoredMessageRow = MessageStorageEntry<Record<string, unknown>>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to persist Relay conversation data for "${key}".`, error);
  }
}

function readThreads() {
  return readJson<StoredThread[]>(threadIndexStorageKey, []);
}

function writeThreads(threads: StoredThread[]) {
  writeJson(threadIndexStorageKey, threads);
}

function ensureInitialThreadId() {
  if (typeof window === "undefined") return undefined;

  const existing = readThreads().find(
    (thread) => thread.status === "regular",
  );
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  writeThreads([
    {
      id,
      status: "regular",
      lastMessageAt: new Date().toISOString(),
      title: "New conversation",
    },
  ]);
  return id;
}

function threadMessagesStorageKey(threadId: string) {
  return `${threadMessagesStoragePrefix}.${threadId}`;
}

function threadHeadStorageKey(threadId: string) {
  return `${threadHeadStoragePrefix}.${threadId}`;
}

function readMessageRows(threadId: string) {
  return readJson<StoredMessageRow[]>(
    threadMessagesStorageKey(threadId),
    [],
  );
}

function writeMessageRows(threadId: string, rows: StoredMessageRow[]) {
  writeJson(threadMessagesStorageKey(threadId), rows);
}

function readHeadId(threadId: string) {
  return readJson<string | null>(threadHeadStorageKey(threadId), null);
}

function resolveHeadId(
  rows: StoredMessageRow[],
  preferredId: string | null = null,
) {
  const parentIds = new Set(
    rows
      .map((row) => row.parent_id)
      .filter((parentId): parentId is string => Boolean(parentId)),
  );
  const leafRows = rows.filter((row) => !parentIds.has(row.id));

  if (preferredId && leafRows.some((row) => row.id === preferredId)) {
    return preferredId;
  }
  return leafRows.at(-1)?.id ?? null;
}

function orderRowsForHistory(rows: StoredMessageRow[]) {
  const remaining = [...rows];
  const ordered: StoredMessageRow[] = [];
  const availableIds = new Set(rows.map((row) => row.id));
  const resolvedIds = new Set<string>();

  while (remaining.length > 0) {
    const nextIndex = remaining.findIndex(
      (row) =>
        !row.parent_id ||
        !availableIds.has(row.parent_id) ||
        resolvedIds.has(row.parent_id),
    );
    if (nextIndex < 0) {
      ordered.push(...remaining);
      break;
    }

    const [nextRow] = remaining.splice(nextIndex, 1);
    ordered.push(nextRow);
    resolvedIds.add(nextRow.id);
  }

  return ordered;
}

function writeHistory(
  threadId: string,
  rows: StoredMessageRow[],
  preferredHeadId: string | null = null,
) {
  const headId = resolveHeadId(
    rows,
    preferredHeadId ?? readHeadId(threadId),
  );
  writeMessageRows(threadId, rows);
  writeJson(threadHeadStorageKey(threadId), headId);
}

function updateStoredThread(
  threadId: string,
  update: Partial<Omit<StoredThread, "id">>,
) {
  const threads = readThreads();
  const index = threads.findIndex((thread) => thread.id === threadId);
  if (index < 0) return;

  threads[index] = { ...threads[index], ...update };
  writeThreads(threads);
}

function threadTitle(messages: readonly ThreadMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text =
    firstUserMessage?.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim() ?? "";

  if (!text) return "New conversation";
  return text.length > 48 ? `${text.slice(0, 47).trimEnd()}…` : text;
}

function storedUserMessageTitle(row: StoredMessageRow) {
  const content = row.content;
  if (
    !content ||
    typeof content !== "object" ||
    !("role" in content) ||
    content.role !== "user" ||
    !("parts" in content) ||
    !Array.isArray(content.parts)
  ) {
    return null;
  }

  const text = content.parts
    .filter(
      (part): part is { type: "text"; text: string } =>
        Boolean(
          part &&
            typeof part === "object" &&
            "type" in part &&
            part.type === "text" &&
            "text" in part &&
            typeof part.text === "string",
        ),
    )
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  return text.length > 48 ? `${text.slice(0, 47).trimEnd()}…` : text;
}

function RelayThreadHistoryProvider({ children }: PropsWithChildren) {
  const aui = useAui();
  const history = useMemo<ThreadHistoryAdapter>(
    () => ({
      async load() {
        return { headId: null, messages: [] };
      },
      async append() {},
      withFormat: (formatAdapter) => {
        async function resolveThreadId() {
          const remoteId = aui.threadListItem.getState().remoteId;
          if (remoteId) return remoteId;
          return (await aui.threadListItem.initialize()).remoteId;
        }

        function encodedRow(
          item: Parameters<typeof formatAdapter.encode>[0],
        ): StoredMessageRow {
          return {
            id: formatAdapter.getId(item.message),
            parent_id: item.parentId,
            format: formatAdapter.format,
            content: formatAdapter.encode(item),
          };
        }

        async function upsert(
          item: Parameters<typeof formatAdapter.encode>[0],
        ) {
          const threadId = await resolveThreadId();
          const nextRow = encodedRow(item);
          const rows = readMessageRows(threadId);
          const index = rows.findIndex((row) => row.id === nextRow.id);

          if (index >= 0) rows[index] = nextRow;
          else rows.push(nextRow);

          writeHistory(threadId, rows, nextRow.id);
          updateStoredThread(threadId, {
            lastMessageAt: new Date().toISOString(),
          });

          const currentThread = readThreads().find(
            (thread) => thread.id === threadId,
          );
          const title = storedUserMessageTitle(nextRow);
          if (
            title &&
            (!currentThread?.title ||
              currentThread.title === "New conversation")
          ) {
            await aui.threadListItem.rename(title);
          }
        }

        return {
          async load() {
            const threadId = aui.threadListItem.getState().remoteId;
            if (!threadId) return { headId: null, messages: [] };

            const rows = readMessageRows(threadId).filter(
              (row) => row.format === formatAdapter.format,
            );
            const headId = resolveHeadId(rows, readHeadId(threadId));
            const orderedRows = orderRowsForHistory(rows);
            writeJson(threadHeadStorageKey(threadId), headId);
            return {
              headId,
              messages: orderedRows.map((row) =>
                formatAdapter.decode(
                  row as MessageStorageEntry<
                    ReturnType<typeof formatAdapter.encode>
                  >,
                ),
              ),
            };
          },
          append: upsert,
          update: async (item) => upsert(item),
          async delete(items) {
            const threadId = await resolveThreadId();
            const deletedIds = new Set(
              items.map((item) => formatAdapter.getId(item.message)),
            );
            writeHistory(
              threadId,
              readMessageRows(threadId).filter(
                (row) => !deletedIds.has(row.id),
              ),
            );
          },
        };
      },
    }),
    [aui],
  );

  return (
    <RuntimeAdapterProvider adapters={{ history }}>
      {children}
    </RuntimeAdapterProvider>
  );
}

const relayThreadListAdapter: RemoteThreadListAdapter = {
  async list() {
    return {
      threads: readThreads().map((thread) => ({
        remoteId: thread.id,
        status: thread.status,
        title: thread.title,
        lastMessageAt: thread.lastMessageAt
          ? new Date(thread.lastMessageAt)
          : undefined,
      })),
    };
  },
  async initialize() {
    const remoteId = crypto.randomUUID();
    writeThreads([
      {
        id: remoteId,
        status: "regular",
        lastMessageAt: new Date().toISOString(),
      },
      ...readThreads(),
    ]);
    return { remoteId };
  },
  async rename(remoteId, title) {
    updateStoredThread(remoteId, { title });
  },
  async archive(remoteId) {
    updateStoredThread(remoteId, { status: "archived" });
  },
  async unarchive(remoteId) {
    updateStoredThread(remoteId, { status: "regular" });
  },
  async delete(remoteId) {
    writeThreads(readThreads().filter((thread) => thread.id !== remoteId));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(threadMessagesStorageKey(remoteId));
      window.localStorage.removeItem(threadHeadStorageKey(remoteId));
    }
  },
  async fetch(remoteId) {
    const thread = readThreads().find((item) => item.id === remoteId);
    if (!thread) throw new Error("Conversation not found.");

    return {
      remoteId: thread.id,
      status: thread.status,
      title: thread.title,
      lastMessageAt: thread.lastMessageAt
        ? new Date(thread.lastMessageAt)
        : undefined,
    };
  },
  async generateTitle(remoteId, messages) {
    const title = threadTitle(messages);
    updateStoredThread(remoteId, { title });

    return createAssistantStream((controller) => {
      controller.appendText(title);
    });
  },
  unstable_Provider: RelayThreadHistoryProvider,
};

function useRelayThreadRuntime() {
  const transport = useMemo(() => new RelayChatTransport(), []);
  const speech = useMemo(() => new WebSpeechSynthesisAdapter(), []);
  const dictation = useMemo(() => new WebSpeechDictationAdapter(), []);

  return useChatRuntime<RelayChatMessage>({
    transport,
    adapters: { dictation, speech },
    joinStrategy: "none",
  });
}

export function RelayAssistantRuntimeProvider({
  children,
}: PropsWithChildren) {
  const initialThreadId = useMemo(() => ensureInitialThreadId(), []);
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useRelayThreadRuntime,
    adapter: relayThreadListAdapter,
    initialThreadId,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
