import { createAnthropic } from "@ai-sdk/anthropic-v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google-v3";
import { createOpenAI } from "@ai-sdk/openai-v3";
import type { LanguageModel } from "ai-v6";

type CopilotProvider = "gemini" | "openrouter" | "openai" | "anthropic";

export type CopilotModelConfig = {
  model: LanguageModel;
  apiKey?: string;
};

function providerName(value?: string): CopilotProvider {
  const normalized = value?.toLowerCase();
  if (
    normalized === "gemini" ||
    normalized === "openrouter" ||
    normalized === "openai" ||
    normalized === "anthropic"
  ) {
    return normalized;
  }
  return "openrouter";
}

function stripProviderPrefix(modelId: string) {
  return modelId.includes("/") ? modelId.split("/").slice(1).join("/") : modelId;
}

function safeBaseUrl(value: string | undefined) {
  const fallback = "https://openrouter.ai/api/v1";
  const raw = (value ?? fallback).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

/**
 * CopilotKit 1.x currently runs on AI SDK 6. Keep its provider objects on that
 * generation while Relay's primary chat uses AI SDK 7.
 */
export function getCopilotModelConfig(): CopilotModelConfig {
  const provider = providerName(process.env.AI_PROVIDER);

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.OPENROUTER_MODEL ?? process.env.AI_MODEL ?? "openrouter/free";
    const openrouter = createOpenAI({
      apiKey,
      baseURL: safeBaseUrl(process.env.OPENROUTER_BASE_URL),
      name: "openrouter",
      headers: {
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Daily Work Agent",
        "X-Title": "Daily Work Agent",
      },
    });
    return { model: openrouter.chat(modelId), apiKey };
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.OPENAI_MODEL ?? process.env.AI_MODEL ?? "openai/gpt-4.1-mini";
    return {
      model: createOpenAI({ apiKey })(stripProviderPrefix(modelId)),
      apiKey,
    };
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.ANTHROPIC_MODEL ??
      process.env.AI_MODEL ??
      "anthropic/claude-3.5-haiku";
    return {
      model: createAnthropic({ apiKey })(stripProviderPrefix(modelId)),
      apiKey,
    };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.AI_API_KEY;
  const modelId =
    process.env.GEMINI_MODEL ??
    process.env.AI_MODEL ??
    "google/gemini-2.5-flash";
  return {
    model: createGoogleGenerativeAI({ apiKey })(stripProviderPrefix(modelId)),
    apiKey,
  };
}
