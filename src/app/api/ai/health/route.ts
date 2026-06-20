import { generateText } from "ai";
import { NextResponse } from "next/server";

import { getAssistantModelConfig } from "@/lib/ai/provider";

export async function POST() {
  const config = getAssistantModelConfig();

  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        provider: config.provider,
        label: config.label,
        modelId: config.modelId,
        message: "No server-side AI API key is configured.",
      },
      { status: 412 },
    );
  }

  try {
    const result = await generateText({
      model: config.model,
      prompt: "Reply with exactly: connected",
      temperature: 0,
    });

    return NextResponse.json({
      ok: true,
      provider: config.provider,
      label: config.label,
      modelId: config.modelId,
      message: result.text.trim() || "connected",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider rejected the health check.";

    return NextResponse.json(
      {
        ok: false,
        provider: config.provider,
        label: config.label,
        modelId: config.modelId,
        message,
      },
      { status: 502 },
    );
  }
}
