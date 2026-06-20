import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { workAgentPrompt } from "@/lib/agent/prompt";
import { agentTools } from "@/lib/agent/tools";
import { getAssistantModelConfig } from "@/lib/ai/provider";

const assistantModel = getAssistantModelConfig();

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: assistantModel.model,
      apiKey: assistantModel.apiKey,
      prompt: workAgentPrompt,
      maxSteps: 6,
      tools: [...agentTools],
      forwardSystemMessages: true,
      forwardDeveloperMessages: true,
    }),
  },
  a2ui: { enabled: true },
  openGenerativeUI: true,
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
