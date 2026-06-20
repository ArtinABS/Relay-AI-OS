"use client";

import { Bot, Send, User } from "lucide-react";
import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          content: "The local agent route did not respond. Check the dev server logs.",
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
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-lg font-semibold">No-Key Local Agent</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          A limited conversational backend that uses your Google OAuth session.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
              key={prompt}
              onClick={() => sendPrompt(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-h-[420px] min-h-[300px] flex-col gap-4 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-auto flex max-w-[85%] flex-row-reverse gap-3"
                : "mr-auto flex max-w-[85%] gap-3"
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700 ring-1 ring-stone-200">
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </span>
            <div
              className={
                message.role === "user"
                  ? "whitespace-pre-wrap rounded-lg bg-stone-950 px-4 py-3 text-sm leading-6 text-white"
                  : "rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800"
              }
            >
              {message.role === "user" ? (
                message.content
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="flex gap-3 border-t border-stone-200 p-4" onSubmit={submit}>
        <input
          className="min-h-10 flex-1 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none ring-stone-950 transition focus:ring-2"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask OAuth status or calendar events..."
          value={input}
        />
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-stone-950 text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          type="submit"
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
