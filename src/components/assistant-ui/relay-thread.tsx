"use client";

import {
  ActionBarPrimitive,
  AttachmentPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
  type FileMessagePartProps,
  type ImageMessagePartProps,
  type PartState,
  type SourceMessagePartProps,
  type TextMessagePartProps,
} from "@assistant-ui/react";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Mic,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Square,
  Trash2,
  Volume2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker";
import { Button, Input } from "@/components/ui/relay-ui";
import {
  getRelayResponseStyle,
  setRelayResponseStyle,
  type RelayResponseStyle,
} from "@/lib/ai/relay-chat";

type RelayThreadProps = {
  assistantExtras?: ReactNode;
  onPrompt: (prompt: string) => void;
  onRunEnd?: () => void;
};

type ActivityData = {
  label?: string;
  state?: "running" | "complete" | "error";
  detail?: string;
};

const iconButtonClass =
  "interactive-control inline-grid h-8 w-8 place-items-center rounded-lg border border-transparent bg-transparent text-muted transition hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40";

const primaryIconButtonClass =
  "interactive-control inline-grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40";

export function RelayThread({
  assistantExtras,
  onPrompt,
  onRunEnd,
}: RelayThreadProps) {
  const isEmpty = useAuiState((state) => state.thread.messages.length === 0);
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const isLoading = useAuiState((state) => state.thread.isLoading);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const wasRunning = useRef(false);

  useEffect(() => {
    if (wasRunning.current && !isRunning) onRunEnd?.();
    wasRunning.current = isRunning;
  }, [isRunning, onRunEnd]);

  function toggleHistory() {
    setHistoryCollapsed((current) => !current);
  }

  const desktopLayout = historyCollapsed
    ? "md:grid-cols-[0_minmax(0,1fr)]"
    : "md:grid-cols-[13rem_minmax(0,1fr)]";

  if (isLoading) {
    return (
      <section
        className={`grid h-full min-h-0 gap-2 overflow-hidden bg-[var(--chat-rail)] py-2 pr-2 transition-[grid-template-columns] duration-200 motion-reduce:transition-none ${desktopLayout}`}
      >
        <RelayConversationRail collapsed={historyCollapsed} />
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-separator bg-[var(--background)] shadow-surface">
          <RelayDesktopThreadHeader
            collapsed={historyCollapsed}
            onToggle={toggleHistory}
          />
          <RelayMobileConversationRail />
          <div
            aria-label="Loading conversation"
            className="grid min-h-0 flex-1 place-items-center"
            role="status"
          >
            <Marker>
              <MarkerIcon>
                <Loader2 className="animate-spin text-accent" />
              </MarkerIcon>
              <MarkerContent className="shimmer">
                Loading conversation
              </MarkerContent>
            </Marker>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`grid h-full min-h-0 gap-2 overflow-hidden bg-[var(--chat-rail)] py-2 pr-2 transition-[grid-template-columns] duration-200 motion-reduce:transition-none ${desktopLayout}`}
    >
      <RelayConversationRail collapsed={historyCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-separator bg-[var(--background)] shadow-surface">
        <RelayDesktopThreadHeader
          collapsed={historyCollapsed}
          onToggle={toggleHistory}
        />
        <RelayMobileConversationRail />
        <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ThreadPrimitive.Viewport
            className="relay-chat-viewport relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth"
            turnAnchor="top"
          >
            {isEmpty ? (
              <div className="mx-auto flex w-full max-w-[50rem] flex-1 items-center justify-center px-4 pb-[8vh] sm:px-6">
                <RelayWelcome onPrompt={onPrompt} />
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[48rem] flex-1 flex-col px-4 pt-5 sm:px-6 sm:pt-8">
                <Marker className="mb-8" variant="separator">
                  <MarkerContent>Today</MarkerContent>
                </Marker>
                <div className="mb-12 flex flex-col gap-8 sm:gap-10">
                  <ThreadPrimitive.Messages>
                    {({ message }) => {
                      if (message.composer.isEditing) {
                        return <RelayEditComposer />;
                      }
                      if (message.role === "user") {
                        return <RelayUserMessage />;
                      }
                      if (message.role === "assistant") {
                        return (
                          <RelayAssistantMessage
                            assistantExtras={assistantExtras}
                          />
                        );
                      }
                      return null;
                    }}
                  </ThreadPrimitive.Messages>
                </div>

                <ThreadPrimitive.ViewportFooter className="sticky bottom-0 z-10 mt-auto flex flex-col bg-[linear-gradient(to_top,var(--background)_78%,transparent)] pb-3 pt-8 sm:pb-5">
                  <ThreadPrimitive.ScrollToBottom asChild>
                    <Button
                      aria-label="Scroll to the latest message"
                      className={`${iconButtonClass} absolute -top-4 left-1/2 z-20 h-9 w-9 -translate-x-1/2 rounded-full border-separator bg-surface shadow-surface disabled:invisible`}
                      title="Scroll to bottom"
                      type="button"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </ThreadPrimitive.ScrollToBottom>
                  <RelayComposer />
                  <p className="mt-2 hidden text-center text-[11px] leading-4 text-muted sm:block">
                    Relay can make mistakes. Check important actions before
                    approving them.
                  </p>
                </ThreadPrimitive.ViewportFooter>
              </div>
            )}
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </div>
    </section>
  );
}

function RelayConversationRail({
  collapsed,
}: {
  collapsed: boolean;
}) {
  return (
    <aside
      aria-label="Chat history"
      aria-hidden={collapsed}
      className={`relative hidden min-h-0 min-w-0 flex-col overflow-hidden transition-opacity duration-150 motion-reduce:transition-none md:flex ${
        collapsed ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex h-14 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">
          Chat history
        </span>
      </div>
      <RelayConversationList />
    </aside>
  );
}

function RelayDesktopThreadHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const currentTitle = useAuiState((state) => {
    const current = state.threads.threadItems.find(
      (thread) => thread.id === state.threads.mainThreadId,
    );
    const title = current?.title ?? "New conversation";
    return title === "New conversation" ? "New chat" : title;
  });

  return (
    <header className="hidden h-14 shrink-0 items-center gap-2 border-b border-separator/60 px-3 md:flex">
        <Button
          aria-label={
            collapsed ? "Expand chat history" : "Collapse chat history"
          }
          aria-expanded={!collapsed}
          className={`${iconButtonClass} h-9 w-9 rounded-xl hover:bg-surface`}
          onClick={onToggle}
          title={collapsed ? "Expand chat history" : "Collapse chat history"}
          type="button"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        {currentTitle}
      </span>
    </header>
  );
}

function RelayMobileConversationRail() {
  const currentTitle = useAuiState((state) => {
    const current = state.threads.threadItems.find(
      (thread) => thread.id === state.threads.mainThreadId,
    );
    return current?.title ?? "New conversation";
  });

  return (
    <details className="group border-b border-separator bg-surface/55 md:hidden">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
        <MessageSquare className="h-4 w-4 text-accent" />
        <span className="min-w-0 flex-1 truncate">{currentTitle}</span>
        <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="max-h-64 overflow-y-auto border-t border-separator p-2">
        <RelayConversationList compact />
      </div>
    </details>
  );
}

function RelayConversationList({ compact = false }: { compact?: boolean }) {
  return (
    <ThreadListPrimitive.Root
      className={`flex min-h-0 flex-col ${compact ? "" : "h-full px-2 pb-3"}`}
    >
      <ThreadListPrimitive.New asChild>
        <Button
          className="interactive-control flex h-9 w-full items-center justify-start gap-2 rounded-lg bg-surface-secondary px-2.5 text-sm font-medium text-foreground transition hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          type="button"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </ThreadListPrimitive.New>

      <div
        aria-label="Conversation history"
        className={`mt-3 min-h-0 ${compact ? "" : "flex-1 overflow-y-auto"}`}
      >
        <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">
          Today
        </p>
        <ThreadListPrimitive.Items>
          {() => <RelayConversationItem />}
        </ThreadListPrimitive.Items>

        <details className="group/archive mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-surface-secondary hover:text-foreground">
            <ChevronRight className="h-3 w-3 transition group-open/archive:rotate-90" />
            Archived
          </summary>
          <div className="mt-1">
            <ThreadListPrimitive.Items archived>
              {() => <RelayConversationItem archived />}
            </ThreadListPrimitive.Items>
          </div>
        </details>
      </div>
    </ThreadListPrimitive.Root>
  );
}

function RelayConversationItem({ archived = false }: { archived?: boolean }) {
  const aui = useAui();
  const title = useAuiState(
    (state) => state.threadListItem.title ?? "New conversation",
  );
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  function saveTitle() {
    const nextTitle = draftTitle.trim();
    if (nextTitle && nextTitle !== title) {
      aui.threadListItem.rename(nextTitle);
    } else {
      setDraftTitle(title);
    }
    setEditing(false);
  }

  function handleAction(
    action: "rename" | "archive" | "restore" | "delete",
  ) {
    if (action === "rename") {
      setDraftTitle(title);
      setEditing(true);
      return;
    }
    if (action === "archive") {
      aui.threadListItem.archive();
      return;
    }
    if (action === "restore") {
      aui.threadListItem.unarchive();
      return;
    }
    if (
      action === "delete" &&
      window.confirm(
        `Delete "${title}"? This conversation cannot be recovered.`,
      )
    ) {
      aui.threadListItem.delete();
    }
  }

  return (
    <ThreadListItemPrimitive.Root className="group/thread relative mb-0.5 flex min-w-0 items-center rounded-md transition hover:bg-surface-secondary data-[active]:bg-accent-soft">
      {editing ? (
        <Input
          aria-label="Conversation title"
          autoFocus
          className="m-1 h-7 min-w-0 flex-1 rounded-md border border-accent bg-surface px-2 text-xs text-foreground outline-none"
          onBlur={saveTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveTitle();
            if (event.key === "Escape") {
              setDraftTitle(title);
              setEditing(false);
            }
          }}
          value={draftTitle}
        />
      ) : (
        <ThreadListItemPrimitive.Trigger
          className="min-w-0 flex-1 truncate rounded-md py-2 pl-2.5 pr-10 text-left text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <ThreadListItemPrimitive.Title fallback="New conversation" />
        </ThreadListItemPrimitive.Trigger>
      )}

      {!editing ? (
        <div className="absolute right-1 flex items-center">
          <details
            className="group/actions relative"
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              ) {
                event.currentTarget.removeAttribute("open");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.removeAttribute("open");
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary
              aria-label={`Actions for ${title}`}
              className={`${iconButtonClass} h-7 w-7 cursor-pointer list-none rounded-md opacity-60 group-open/actions:bg-surface group-hover/thread:opacity-100`}
              title={`Actions for ${title}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </summary>
            <div
              aria-label={`Conversation actions for ${title}`}
              className="relay-themed-overlay absolute right-0 top-8 z-50 grid min-w-40 gap-0.5 rounded-xl border border-separator bg-overlay p-1 shadow-overlay"
              role="menu"
            >
              {!archived ? (
                <button
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={(event) => {
                    handleAction("rename");
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted" />
                  Rename
                </button>
              ) : null}
              <button
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={(event) => {
                  handleAction(archived ? "restore" : "archive");
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
                role="menuitem"
                type="button"
              >
                {archived ? (
                  <ArchiveRestore className="h-3.5 w-3.5 text-muted" />
                ) : (
                  <Archive className="h-3.5 w-3.5 text-muted" />
                )}
                {archived ? "Restore" : "Archive"}
              </button>
              <button
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-danger transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                onClick={(event) => {
                  handleAction("delete");
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
                role="menuitem"
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </details>
        </div>
      ) : null}
    </ThreadListItemPrimitive.Root>
  );
}

function RelayWelcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const suggestions: Array<{
    icon: LucideIcon;
    label: string;
    prompt: string;
  }> = [
    {
      icon: Check,
      label: "Plan my day",
      prompt: "Plan my day from my calendar and open tasks",
    },
    {
      icon: Search,
      label: "Find",
      prompt: "Help me find the most relevant file or information for my work",
    },
    {
      icon: Pencil,
      label: "Write",
      prompt: "Help me draft an email",
    },
    {
      icon: Zap,
      label: "Analyze",
      prompt: "Analyze my current tasks and tell me what needs attention",
    },
    {
      icon: Brain,
      label: "Brainstorm",
      prompt: "Brainstorm practical next steps for my current work",
    },
  ];

  return (
    <div className="w-full animate-fade-in text-center">
      <h1 className="text-balance text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
        How can I help you today?
      </h1>
      <div className="mt-6">
        <RelayComposer />
      </div>
      <div
        aria-label="Suggested prompts"
        className="mt-3 flex flex-wrap justify-center gap-2"
        role="group"
      >
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Button
              className="interactive-control inline-flex h-9 items-center gap-2 rounded-full border border-separator bg-transparent px-3.5 text-sm font-normal text-foreground transition hover:border-border hover:bg-surface-secondary"
              key={suggestion.label}
              onClick={() => onPrompt(suggestion.prompt)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              {suggestion.label}
            </Button>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] leading-4 text-muted">
        Relay can make mistakes. Check important actions before approving them.
      </p>
    </div>
  );
}

const responseStyleLabels: Record<RelayResponseStyle, string> = {
  auto: "Auto",
  concise: "Concise",
  detailed: "Detailed",
};

function RelayResponseStylePicker() {
  const [responseStyle, setResponseStyle] = useState<RelayResponseStyle>(
    () => getRelayResponseStyle(),
  );

  return (
    <label className="interactive-control relative inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-foreground transition hover:bg-surface">
      <Zap className="pointer-events-none h-3.5 w-3.5 text-accent" />
      <select
        aria-label="Response style"
        className="cursor-pointer appearance-none rounded-md bg-transparent pr-4 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        onChange={(event) => {
          const nextStyle = event.target.value as RelayResponseStyle;
          setResponseStyle(nextStyle);
          setRelayResponseStyle(nextStyle);
        }}
        value={responseStyle}
      >
        {(
          Object.entries(responseStyleLabels) as Array<
            [RelayResponseStyle, string]
          >
        ).map(([style, label]) => (
          <option key={style} value={style}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted" />
    </label>
  );
}

function RelayComposer() {
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const dictating = useAuiState(
    (state) => state.composer.dictation != null,
  );
  const canDictate = useAuiState(
    (state) => state.thread.capabilities.dictation,
  );

  return (
    <ComposerPrimitive.Root className="relative w-full">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div className="relay-chat-composer relative flex flex-col gap-2 rounded-[1.65rem] border border-separator bg-surface-secondary p-2 shadow-surface transition focus-within:border-border data-[dragging=true]:border-dashed data-[dragging=true]:border-accent data-[dragging=true]:bg-accent-soft">
          <ComposerPrimitive.Attachments>
            {() => <RelayAttachment removable />}
          </ComposerPrimitive.Attachments>
          <ComposerPrimitive.Input
            aria-label="Message Relay"
            autoFocus
            className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted"
            enterKeyHint="send"
            placeholder="Ask Relay anything"
            rows={1}
          />
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1">
              <ComposerPrimitive.AddAttachment asChild>
                <Button
                  aria-label="Attach files"
                  className={`${iconButtonClass} h-9 w-9 rounded-full`}
                  title="Attach files"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </ComposerPrimitive.AddAttachment>
              <RelayResponseStylePicker />
            </div>
            <div className="flex items-center gap-1">
              {canDictate && !dictating ? (
                <ComposerPrimitive.Dictate asChild>
                  <Button
                    aria-label="Start voice input"
                    className={`${iconButtonClass} h-9 w-9 rounded-full`}
                    title="Voice input"
                    type="button"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </ComposerPrimitive.Dictate>
              ) : null}
              {canDictate && dictating ? (
                <ComposerPrimitive.StopDictation asChild>
                  <Button
                    aria-label="Stop voice input"
                    className={`${iconButtonClass} h-9 w-9 rounded-full text-danger`}
                    title="Stop voice input"
                    type="button"
                  >
                    <Square className="h-3.5 w-3.5 animate-pulse fill-current" />
                  </Button>
                </ComposerPrimitive.StopDictation>
              ) : null}
              {isRunning ? (
                <ComposerPrimitive.Cancel asChild>
                  <Button
                    aria-label="Stop generating"
                    className={`${primaryIconButtonClass} h-9 w-9`}
                    title="Stop generating"
                    type="button"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </Button>
                </ComposerPrimitive.Cancel>
              ) : (
                <ComposerPrimitive.Send asChild>
                  <Button
                    aria-label="Send message"
                    className={`${primaryIconButtonClass} h-9 w-9`}
                    title="Send message"
                    type="button"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </ComposerPrimitive.Send>
              )}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden place-items-center rounded-[1.65rem] border border-dashed border-accent bg-surface/90 text-sm font-medium text-accent backdrop-blur-sm group-data-[dragging=true]:grid"
          >
            Drop files to add them
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
}

function RelayUserMessage() {
  return (
    <MessagePrimitive.Root
      className="group/message relative w-full animate-fade-in"
      data-role="user"
    >
      <div className="ml-auto w-fit max-w-[88%]">
        <MessagePrimitive.Attachments>
          {() => <RelayAttachment />}
        </MessagePrimitive.Attachments>
        <div className="rounded-[1.3rem] rounded-br-md border border-separator bg-surface-secondary px-4 py-2.5 text-[15px] leading-6 text-foreground shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
          <MessagePrimitive.Parts
            components={{
              Text: RelayUserText,
              Image: () => null,
              File: () => null,
              data: { Fallback: () => null },
            }}
          />
        </div>
        <div className="mt-2 flex min-h-7 items-center justify-end">
          <RelayBranchPicker />
          <ActionBarPrimitive.Root
            autohide="never"
            className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100"
            hideWhenRunning
          >
            <ActionBarPrimitive.Edit asChild>
              <Button
                aria-label="Edit message"
                className={iconButtonClass}
                title="Edit message"
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </ActionBarPrimitive.Edit>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function RelayAssistantMessage({
  assistantExtras,
}: {
  assistantExtras?: ReactNode;
}) {
  const parts = useAuiState((state) => state.message.parts);

  return (
    <MessagePrimitive.Root
      className="group/message relative w-full animate-fade-in"
      data-role="assistant"
    >
      <RelayActivityDisclosure parts={parts} />
      <div className="px-2 text-[15px] leading-7 text-foreground">
        <MessagePrimitive.Parts
          components={{
            Text: RelayAssistantText,
            Reasoning: () => null,
            Source: RelaySourcePart,
            Image: RelayImagePart,
            File: RelayFilePart,
            Empty: RelayAssistantWorking,
            data: { Fallback: () => null },
            tools: { Override: () => null },
          }}
        />
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root
            className="mt-3 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Relay could not finish this reply</p>
                <ErrorPrimitive.Message className="mt-1 line-clamp-3 text-xs leading-5" />
              </div>
            </div>
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
        {assistantExtras}
      </div>
      <div className="mt-2 flex min-h-7 items-center gap-1 px-1 text-muted">
        <RelayBranchPicker />
        <RelayAssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
}

function RelayAssistantActionBar() {
  const speaking = useAuiState((state) => {
    const type = state.message.speech?.status.type;
    return type === "starting" || type === "running";
  });

  return (
    <ActionBarPrimitive.Root
      autohide="never"
      className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100"
      hideWhenRunning
    >
      <ActionBarPrimitive.Copy asChild>
        <Button
          aria-label="Copy response"
          className={iconButtonClass}
          title="Copy response"
          type="button"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <Button
          aria-label="Regenerate response"
          className={iconButtonClass}
          title="Regenerate response"
          type="button"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      </ActionBarPrimitive.Reload>
      {speaking ? (
        <ActionBarPrimitive.StopSpeaking asChild>
          <Button
            aria-label="Stop reading response"
            className={iconButtonClass}
            title="Stop reading"
            type="button"
          >
            <Square className="h-3 w-3 fill-current" />
          </Button>
        </ActionBarPrimitive.StopSpeaking>
      ) : (
        <ActionBarPrimitive.Speak asChild>
          <Button
            aria-label="Read response aloud"
            className={iconButtonClass}
            title="Read aloud"
            type="button"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </Button>
        </ActionBarPrimitive.Speak>
      )}
    </ActionBarPrimitive.Root>
  );
}

function RelayBranchPicker() {
  return (
    <BranchPickerPrimitive.Root
      className="mr-1 inline-flex items-center text-[11px] text-muted"
      hideWhenSingleBranch
    >
      <BranchPickerPrimitive.Previous asChild>
        <Button
          aria-label="Previous response branch"
          className={`${iconButtonClass} h-7 w-7`}
          title="Previous branch"
          type="button"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </BranchPickerPrimitive.Previous>
      <span className="px-1 font-medium tabular-nums">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <Button
          aria-label="Next response branch"
          className={`${iconButtonClass} h-7 w-7`}
          title="Next branch"
          type="button"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}

function RelayEditComposer() {
  return (
    <MessagePrimitive.Root className="flex w-full animate-fade-in flex-col px-2">
      <ComposerPrimitive.Root className="ml-auto flex w-full max-w-[88%] flex-col rounded-[1.3rem] border border-accent bg-surface-secondary shadow-surface">
        <ComposerPrimitive.Input
          aria-label="Edit message"
          autoFocus
          className="min-h-20 w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[15px] leading-6 text-foreground outline-none"
        />
        <div className="m-2 flex items-center justify-end gap-2">
          <ComposerPrimitive.Cancel asChild>
            <Button
              className="interactive-control h-8 rounded-full px-3 text-xs text-muted transition hover:bg-surface hover:text-foreground"
              type="button"
            >
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button
              className="interactive-control h-8 rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground transition hover:brightness-105"
              type="button"
            >
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function RelayUserText({ text }: TextMessagePartProps) {
  return <p className="whitespace-pre-wrap">{text}</p>;
}

function RelayAssistantText({ text }: TextMessagePartProps) {
  const visibleText = text
    .replace(
      /<need-more-info>[\s\S]*?<\/need-more-info>/gi,
      "",
    )
    .replace(
      /<ui-component(?:\s+[^>]*)?>[\s\S]*?<\/ui-component>/gi,
      "",
    )
    .replace(/<\/?(?:need-more-info|ui-component)(?:\s+[^>]*)?>/gi, "")
    .trim();

  if (!visibleText) return null;

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{visibleText}</ReactMarkdown>
    </div>
  );
}

function RelayAssistantWorking({
  status,
}: {
  status: { type: "running" | "complete" | "incomplete" };
}) {
  if (status.type !== "running") return null;

  return (
    <Marker role="status">
      <MarkerIcon>
        <Loader2 className="animate-spin text-accent" />
      </MarkerIcon>
      <MarkerContent className="shimmer font-medium text-foreground">
        Thinking...
      </MarkerContent>
    </Marker>
  );
}

function RelayActivityDisclosure({ parts }: { parts: readonly PartState[] }) {
  const activityParts = parts.filter(
    (part) =>
      part.type === "reasoning" ||
      part.type === "tool-call" ||
      (part.type === "data" && part.name === "activity"),
  );
  const running = activityParts.some(isActivityRunning);
  const failed = activityParts.some(isActivityFailed);
  const previousRunning = useRef(running);
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (previousRunning.current !== running) {
      setManualOpen(null);
      previousRunning.current = running;
    }
  }, [running]);

  if (activityParts.length === 0) return null;

  const open = manualOpen ?? running;
  const label = running
    ? "Relay is working"
    : failed
      ? "Relay activity needs attention"
      : `Worked through ${activityParts.length} ${
          activityParts.length === 1 ? "step" : "steps"
        }`;

  return (
    <div className="mb-4 px-2">
      <button
        aria-expanded={open}
        className="interactive-control inline-flex max-w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={() => setManualOpen(!open)}
        type="button"
      >
        {running ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
        ) : failed ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
        ) : (
          <Brain className="h-4 w-4 shrink-0 text-accent" />
        )}
        <span
          className={
            running
              ? "shimmer truncate font-medium text-foreground"
              : "truncate font-medium"
          }
        >
          {label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div
          aria-busy={running}
          className="ml-2 mt-1 grid gap-2 border-l border-separator py-1 pl-5"
        >
          {activityParts.map((part, index) => (
            <RelayActivityMarker
              key={`${part.type}-${"toolCallId" in part ? part.toolCallId : index}`}
              part={part}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isActivityRunning(part: PartState) {
  if (part.status.type === "running" || part.status.type === "requires-action") {
    return true;
  }
  if (part.type === "data" && part.name === "activity") {
    return (part.data as ActivityData | undefined)?.state === "running";
  }
  return false;
}

function isActivityFailed(part: PartState) {
  if (part.status.type === "incomplete") return true;
  if (part.type === "tool-call" && part.isError) return true;
  if (part.type === "data" && part.name === "activity") {
    return (part.data as ActivityData | undefined)?.state === "error";
  }
  return false;
}

function RelayActivityMarker({ part }: { part: PartState }) {
  const running = isActivityRunning(part);
  const failed = isActivityFailed(part);

  if (part.type === "reasoning") {
    return (
      <Marker role={running ? "status" : undefined}>
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : (
            <Brain className="text-accent" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {part.text || "Reasoning through the request"}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "data" && part.name === "activity") {
    const data = part.data as ActivityData;
    return (
      <Marker role={running ? "status" : undefined}>
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : failed ? (
            <AlertCircle className="text-danger" />
          ) : (
            <Check className="text-success" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {data.label ?? "Relay activity"}
          {data.detail ? ` · ${data.detail}` : ""}
        </MarkerContent>
      </Marker>
    );
  }

  if (part.type === "tool-call") {
    const result =
      part.result && typeof part.result === "object"
        ? (part.result as { mode?: string })
        : undefined;
    return (
      <Marker
        role={running ? "status" : undefined}
        variant="border"
      >
        <MarkerIcon>
          {running ? (
            <Loader2 className="animate-spin text-accent" />
          ) : failed ? (
            <AlertCircle className="text-danger" />
          ) : (
            <Zap className="text-accent" />
          )}
        </MarkerIcon>
        <MarkerContent className={running ? "shimmer" : undefined}>
          {humanizeToolName(part.toolName)}
          {result?.mode
            ? ` · ${result.mode === "provider" ? "AI provider" : "local mode"}`
            : ""}
        </MarkerContent>
      </Marker>
    );
  }

  return null;
}

function RelaySourcePart(part: SourceMessagePartProps) {
  if (part.sourceType === "url") {
    return (
      <Marker asChild className="mt-3">
        <a href={part.url} rel="noreferrer" target="_blank">
          <MarkerIcon>
            <ExternalLink />
          </MarkerIcon>
          <MarkerContent>{part.title ?? part.url}</MarkerContent>
        </a>
      </Marker>
    );
  }

  return (
    <Marker className="mt-3" variant="border">
      <MarkerIcon>
        <FileText />
      </MarkerIcon>
      <MarkerContent>
        {part.title}
        {part.filename ? ` · ${part.filename}` : ""}
      </MarkerContent>
    </Marker>
  );
}

function RelayImagePart({ image, filename }: ImageMessagePartProps) {
  return (
    <Attachment
      className="my-3 max-w-72"
      orientation="vertical"
      size="sm"
      state="done"
    >
      <AttachmentMedia variant="image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={filename ?? "Generated attachment"} src={image} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{filename ?? "Image"}</AttachmentTitle>
        <AttachmentDescription>Image attachment</AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger asChild>
        <a
          aria-label={`Open ${filename ?? "image"}`}
          href={image}
          rel="noreferrer"
          target="_blank"
        />
      </AttachmentTrigger>
    </Attachment>
  );
}

function RelayFilePart({ data, filename, mimeType }: FileMessagePartProps) {
  const url = attachmentDataUrl(data, mimeType);
  const title = filename ?? "Attachment";

  return (
    <Attachment className="my-3 max-w-72" size="sm" state="done">
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{title}</AttachmentTitle>
        <AttachmentDescription>
          {formatAttachmentType(mimeType)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger asChild>
        <a
          aria-label={`Open ${title}`}
          href={url}
          rel="noreferrer"
          target="_blank"
        />
      </AttachmentTrigger>
    </Attachment>
  );
}

function RelayAttachment({ removable = false }: { removable?: boolean }) {
  const attachment = useAuiState((state) => state.attachment);
  const imagePart = attachment.content?.find(
    (part) => part.type === "image",
  );
  const filePart = attachment.content?.find((part) => part.type === "file");
  const url =
    imagePart?.type === "image"
      ? imagePart.image
      : filePart?.type === "file"
        ? attachmentDataUrl(filePart.data, filePart.mimeType)
        : undefined;
  const isImage =
    attachment.type === "image" ||
    attachment.contentType?.startsWith("image/");
  const state =
    attachment.status.type === "complete"
      ? "done"
      : attachment.status.type === "running"
        ? "uploading"
        : attachment.status.type === "incomplete"
          ? "error"
          : "processing";
  const description =
    attachment.status.type === "running"
      ? `Uploading · ${Math.round(attachment.status.progress * 100)}%`
      : attachment.status.type === "incomplete"
        ? attachment.status.message ?? "Upload failed"
        : attachment.status.type === "requires-action"
          ? "Ready to send"
          : formatAttachmentType(
              attachment.contentType ?? filePart?.mimeType ?? "File",
            );

  return (
    <AttachmentPrimitive.Root>
      <AttachmentGroup
        aria-label={removable ? "Files ready to send" : "Message attachments"}
        className={removable ? "px-1" : "mb-3 justify-end"}
        role="group"
      >
        <Attachment className="max-w-64" size="sm" state={state}>
          <AttachmentMedia variant={isImage && url ? "image" : "icon"}>
            {isImage && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={url} />
            ) : (
              <FileText />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.name}</AttachmentTitle>
            <AttachmentDescription>{description}</AttachmentDescription>
          </AttachmentContent>
          {removable ? (
            <AttachmentActions>
              <AttachmentPrimitive.Remove asChild>
                <AttachmentAction
                  aria-label={`Remove ${attachment.name}`}
                  type="button"
                >
                  <X />
                </AttachmentAction>
              </AttachmentPrimitive.Remove>
            </AttachmentActions>
          ) : null}
          {url ? (
            <AttachmentTrigger asChild>
              <a
                aria-label={`Open ${attachment.name}`}
                href={url}
                rel="noreferrer"
                target="_blank"
              />
            </AttachmentTrigger>
          ) : null}
        </Attachment>
      </AttachmentGroup>
    </AttachmentPrimitive.Root>
  );
}

function attachmentDataUrl(data: string, mimeType: string) {
  return data.startsWith("data:")
    ? data
    : `data:${mimeType};base64,${data}`;
}

function formatAttachmentType(mediaType: string) {
  if (!mediaType.includes("/")) return mediaType;
  const [group, detail] = mediaType.split("/");
  if (!detail) return mediaType;
  if (group === "image") return `${detail.toUpperCase()} image`;
  return detail.replace(/[.+-]/g, " ").toUpperCase();
}

function humanizeToolName(toolName: string) {
  return toolName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
