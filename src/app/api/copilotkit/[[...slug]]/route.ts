import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { workAgentPrompt } from "@/lib/agent/prompt";
import { agentTools } from "@/lib/agent/tools";
import { getCopilotModelConfig } from "@/lib/ai/copilot-provider";

const assistantModel = getCopilotModelConfig();

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: assistantModel.model,
      apiKey: assistantModel.apiKey,
      prompt: workAgentPrompt,
      maxSteps: 12,
      tools: [...agentTools],
      forwardSystemMessages: true,
      forwardDeveloperMessages: true,
    }),
  },
  a2ui: { enabled: true },
  openGenerativeUI: true,
});

const singleRouteHandler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

const multiRouteHandler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "multi-route",
});

function isBaseRuntimeRequest(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");
  return pathname === "/api/copilotkit";
}

export const GET = multiRouteHandler;
export const PATCH = multiRouteHandler;
export const DELETE = multiRouteHandler;
export const POST = (request: Request) =>
  isBaseRuntimeRequest(request)
    ? singleRouteHandler(request)
    : multiRouteHandler(request);
export const OPTIONS = singleRouteHandler;
