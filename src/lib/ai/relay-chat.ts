import { createChat } from "@shadcn/helpers/ai-sdk";
import type {
  ChatTransport,
  FileUIPart,
  UIMessage,
  UIMessagePart,
} from "ai";

import {
  applyBrowserProjectRecord,
  readBrowserProjectRecord,
} from "@/lib/projects/client";
import type { ProjectRecord } from "@/lib/projects/model";

export type RelayChatMetadata = {
  timestamp?: string;
  surface?: "schedule" | "task" | "files" | "memory" | "email";
  surfaceContext?: {
    task?: {
      title?: string;
      due?: string;
      notes?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      relatedCompletionHint?: string;
    };
  };
  surfaceStatus?: "active" | "done";
  toolSummary?: string;
  toolLink?: string | null;
};

export type RelayChatDataParts = {
  activity: {
    label: string;
    state: "running" | "complete" | "error";
    detail?: string;
  };
};

export type RelayChatTools = {
  routeRequest: {
    input: {
      request: string;
      attachments: number;
    };
    output: {
      mode: "provider" | "local";
      ok: boolean;
    };
  };
};

export type RelayChatMessage = UIMessage<
  RelayChatMetadata,
  RelayChatDataParts,
  RelayChatTools
>;

export type RelayResponseStyle = "auto" | "concise" | "detailed";

let relayResponseStyle: RelayResponseStyle = "auto";

export function getRelayResponseStyle() {
  return relayResponseStyle;
}

export function setRelayResponseStyle(style: RelayResponseStyle) {
  relayResponseStyle = style;
}

function responseStyleContext(style: RelayResponseStyle) {
  if (style === "concise") {
    return "\n\nResponse preference: Be concise and lead with the answer.";
  }
  if (style === "detailed") {
    return "\n\nResponse preference: Give a thorough answer with useful context and clear structure.";
  }
  return "";
}

type AssistantEndpointResponse = {
  role?: "assistant";
  content?: string;
  aiUsed?: boolean;
  projectRecord?: ProjectRecord;
};

export const initialRelayChatMessages: RelayChatMessage[] = [];

export function relayMessageText(message: RelayChatMessage) {
  return message.parts
    .filter(
      (
        part,
      ): part is Extract<
        UIMessagePart<RelayChatDataParts, RelayChatTools>,
        { type: "text" }
      > => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

export function relayMessageFiles(message: RelayChatMessage): FileUIPart[] {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file",
  );
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Keeps Relay's existing provider and local-agent endpoints while adapting
 * their responses into the real AI SDK UI-message stream lifecycle. The
 * shadcn helper supplies deterministic reasoning, data, tool, and text parts
 * after the endpoint result is known.
 */
export class RelayChatTransport
  implements ChatTransport<RelayChatMessage>
{
  async sendMessages(
    options: Parameters<ChatTransport<RelayChatMessage>["sendMessages"]>[0],
  ) {
    const latestUser = [...options.messages]
      .reverse()
      .find((message) => message.role === "user");
    const requestText = latestUser ? relayMessageText(latestUser).trim() : "";
    const attachedFiles = latestUser ? relayMessageFiles(latestUser) : [];

    if (!requestText && attachedFiles.length === 0) {
      throw new Error("Send a message or attach a file first.");
    }

    const attachmentContext =
      attachedFiles.length > 0
        ? `\n\nAttached files: ${attachedFiles
            .map((file) => file.filename ?? file.mediaType)
            .join(", ")}.`
        : "";
    const requestWithContext = `${requestText || "Review the attached files."}${attachmentContext}${responseStyleContext(getRelayResponseStyle())}`;
    const history = options.messages
      .filter(
        (
          message,
        ): message is RelayChatMessage & {
          role: "user" | "assistant";
        } => message.role === "user" || message.role === "assistant",
      )
      .slice(-15)
      .map((message) => ({
        role: message.role,
        content: relayMessageText(message).slice(0, 4000),
      }));

    let providerResponse: Response | null = null;
    let providerData: AssistantEndpointResponse | null = null;

    try {
      providerResponse = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: requestWithContext,
          history,
          projectRecord: readBrowserProjectRecord(),
        }),
        signal: options.abortSignal,
      });
      providerData =
        await readJsonResponse<AssistantEndpointResponse>(providerResponse);
      if (providerData?.projectRecord) {
        applyBrowserProjectRecord(providerData.projectRecord);
      }
    } catch (error) {
      if (options.abortSignal?.aborted) throw error;
      providerData = {
        content:
          error instanceof Error
            ? `AI endpoint request failed: ${error.message}`
            : "AI endpoint request failed before it returned a response.",
        aiUsed: false,
      };
    }

    let content = providerData?.content?.trim() ?? "";
    let mode: "provider" | "local" =
      providerResponse?.ok && providerData?.aiUsed !== false
        ? "provider"
        : "local";

    if (
      !providerResponse?.ok ||
      providerData?.aiUsed === false ||
      !providerData?.content
    ) {
      const fallbackResponse = await fetch("/api/local-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestWithContext }),
        signal: options.abortSignal,
      });
      const fallbackData =
        await readJsonResponse<AssistantEndpointResponse>(fallbackResponse);

      if (!fallbackResponse.ok || !fallbackData?.content) {
        throw new Error(
          fallbackData?.content ??
            `Local fallback failed with HTTP ${fallbackResponse.status}.`,
        );
      }

      content = [
        providerData?.content
          ? `Provider status: ${providerData.content}`
          : "Provider status: The configured AI endpoint did not return a response.",
        `Local fallback: ${fallbackData.content}`,
      ].join("\n\n");
      mode = "local";
    }

    const responseChat = createChat<
      RelayChatMetadata,
      RelayChatDataParts,
      RelayChatTools
    >({
      messages: options.messages,
      messageIdPrefix: "relay",
      toolCallIdPrefix: "relay-tool",
      now: new Date(),
    }).assistant(
      ({ writer }) => {
        writer.reasoning("Selecting workspace context and the safest route.", {
          mode: "instant",
        });
        writer.data({
          type: "data-activity",
          id: "relay-activity",
          data: {
            label:
              mode === "provider"
                ? "Routing through the configured provider"
                : "Switching to Relay local mode",
            state: "running",
          },
        });
        writer
          .tool("routeRequest", {
            title: "Relay request router",
            input: {
              request: requestText || "Review attached files",
              attachments: attachedFiles.length,
            },
          })
          .sleep(160)
          .output({ mode, ok: true });
        writer.data({
          type: "data-activity",
          id: "relay-activity",
          data: {
            label:
              mode === "provider"
                ? "Provider response ready"
                : "Local response ready",
            state: "complete",
          },
        });
        writer.text(content);
      },
      {
        metadata: { timestamp: nowLabel() },
      },
    );

    return responseChat
      .transport({ delayMs: 18 })
      .sendMessages(options);
  }

  async reconnectToStream() {
    return null;
  }
}
