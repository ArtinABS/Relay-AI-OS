"use client";

import { Bot, Send, User } from "lucide-react";
import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, Card } from "@heroui/react";
import { Button, Input } from "@/components/ui/relay-ui";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starterMessages: Message[] = [
  {
    role: "assistant",
    content:
      "I can work without an AI API key for now. Ask me for help, add tasks, save notes, calculate, or check OAuth status.",
  },
];

const quickPrompts = [
  "help",
  "list tasks",
  "list notes",
  "briefing",
  "calculate 24 * 7",
  "OAuth status",
];

export function LocalAgentChat() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch("/api/local-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as Message;
      setMessages((current) => [...current, data]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "The local agent route did not respond. Check the dev server logs.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function sendPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <Card className="overflow-hidden border border-separator bg-surface p-0 shadow-surface">
      <Card.Header className="block border-b border-separator p-5">
        <h2 className="text-lg font-semibold">No-Key Local Agent</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          A limited conversational backend that uses your Google OAuth session.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              className="h-8 rounded-lg px-2.5 text-xs font-medium"
              key={prompt}
              onClick={() => sendPrompt(prompt)}
              type="button"
              variant="secondary"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </Card.Header>

      <Card.Content className="flex max-h-[420px] min-h-[300px] flex-col gap-4 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-auto flex max-w-[85%] flex-row-reverse gap-3"
                : "mr-auto flex max-w-[85%] gap-3"
            }
          >
            <Avatar
              className="shrink-0"
              color="accent"
              size="sm"
              variant={message.role === "user" ? "default" : "soft"}
            >
              <Avatar.Fallback>
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </Avatar.Fallback>
            </Avatar>
            <div
              className={
                message.role === "user"
                  ? "whitespace-pre-wrap rounded-xl bg-accent px-4 py-3 text-sm leading-6 text-accent-foreground"
                  : "rounded-xl border border-separator bg-surface-secondary px-4 py-3 text-sm leading-6 text-foreground"
              }
            >
              {message.role === "user" ? (
                message.content
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card.Content>

      <Card.Footer className="border-t border-separator p-4">
        <form className="flex w-full gap-3" onSubmit={submit}>
          <Input
            className="min-h-10 flex-1 rounded-xl border border-separator bg-surface-secondary px-3 text-sm"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask OAuth status or calendar events..."
            value={input}
          />
          <Button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            type="submit"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card.Footer>
    </Card>
  );
}
