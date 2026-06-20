import { NextResponse } from "next/server";

import { getAssistantModelConfig } from "@/lib/ai/provider";

export async function GET() {
  const config = getAssistantModelConfig();

  return NextResponse.json({
    provider: config.provider,
    label: config.label,
    modelId: config.modelId,
    configured: config.configured,
    recommendedFreeProvider: "openrouter",
    fallbackFreeProvider: "gemini",
  });
}
