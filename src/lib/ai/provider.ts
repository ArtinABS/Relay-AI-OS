import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AssistantProvider = "gemini" | "openrouter" | "openai" | "anthropic";

export type AssistantModelConfig = {
  provider: AssistantProvider;
  modelId: string;
  model: LanguageModel;
  apiKey?: string;
  configured: boolean;
  label: string;
};

const defaultProvider: AssistantProvider = "openrouter";

function normalizeProvider(value?: string): AssistantProvider {
  const provider = value?.toLowerCase();

  if (
    provider === "openrouter" ||
    provider === "openai" ||
    provider === "anthropic" ||
    provider === "gemini"
  ) {
    return provider;
  }

  return defaultProvider;
}

function stripProviderPrefix(modelId: string) {
  return modelId.includes("/") ? modelId.split("/").slice(1).join("/") : modelId;
}

export function getAssistantModelConfig(): AssistantModelConfig {
  const provider = normalizeProvider(process.env.AI_PROVIDER);

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.OPENROUTER_MODEL ?? process.env.AI_MODEL ?? "openrouter/free";
    const openrouter = createOpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Daily Work Agent",
        "X-Title": "Daily Work Agent",
      },
    });

    return {
      provider,
      modelId,
      model: openrouter(modelId),
      apiKey,
      configured: Boolean(apiKey),
      label: "OpenRouter",
    };
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.OPENAI_MODEL ?? process.env.AI_MODEL ?? "openai/gpt-4.1-mini";

    const openai = createOpenAI({ apiKey });

    return {
      provider,
      modelId,
      model: openai(stripProviderPrefix(modelId)),
      apiKey,
      configured: Boolean(apiKey),
      label: "OpenAI",
    };
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY;
    const modelId =
      process.env.ANTHROPIC_MODEL ??
      process.env.AI_MODEL ??
      "anthropic/claude-3.5-haiku";

    const anthropic = createAnthropic({ apiKey });

    return {
      provider,
      modelId,
      model: anthropic(stripProviderPrefix(modelId)),
      apiKey,
      configured: Boolean(apiKey),
      label: "Anthropic",
    };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.AI_API_KEY;
  const modelId =
    process.env.GEMINI_MODEL ??
    process.env.AI_MODEL ??
    "google/gemini-2.5-flash";
  const google = createGoogleGenerativeAI({ apiKey });

  return {
    provider: "gemini",
    modelId,
    model: google(stripProviderPrefix(modelId)),
    apiKey,
    configured: Boolean(apiKey),
    label: "Google Gemini",
  };
}
