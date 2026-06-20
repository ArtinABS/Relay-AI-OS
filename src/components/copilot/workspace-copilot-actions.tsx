"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Check, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";

import { toolCatalog } from "@/lib/tools/catalog";

export function WorkspaceCopilotActions() {
  const [lastApproval, setLastApproval] = useState<{
    title: string;
    approved: boolean;
  } | null>(null);

  const dashboardState = useMemo(
    () => ({
      app: "Daily Work Agent",
      connectedSurfaces: toolCatalog.map(({ name, status }) => ({ name, status })),
      approvalPolicy:
        "Ask for confirmation before sending email, changing files, editing shared docs, or changing calendar state.",
      lastApproval,
    }),
    [lastApproval],
  );

  useCopilotReadable({
    description: "Current Daily Work Agent dashboard state and approval policy.",
    value: dashboardState,
  });

  useCopilotAction(
    {
      name: "request_human_approval",
      description:
        "Render a human approval request for a high-impact action before it is executed.",
      parameters: [
        {
          name: "title",
          type: "string",
          description: "Short name of the proposed action.",
          required: true,
        },
        {
          name: "details",
          type: "string",
          description: "Concrete action details the user is approving.",
          required: true,
        },
        {
          name: "riskLevel",
          type: "string",
          description: "Risk label such as low, medium, high, or critical.",
          required: true,
        },
      ],
      render: ({ args, status }) => (
        <div className="my-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-stone-950 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            {args.title ?? "Approval request"}
          </div>
          <p className="mt-2 leading-6 text-stone-700">{args.details}</p>
          <div className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-800">
            {status === "complete" ? "Decision recorded" : args.riskLevel}
          </div>
        </div>
      ),
      handler: async ({ title }) => {
        const approved = window.confirm(`Approve this action?\n\n${title}`);
        setLastApproval({ title, approved });
        return { approved };
      },
    },
    [],
  );

  useCopilotAction(
    {
      name: "show_task_focus",
      description: "Highlight a task or work item in the UI.",
      parameters: [
        {
          name: "task",
          type: "string",
          description: "The task to focus.",
          required: true,
        },
      ],
      render: ({ args }) => (
        <div className="my-3 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <Check className="mt-0.5 h-4 w-4" />
          <span>{args.task}</span>
        </div>
      ),
      handler: async ({ task }) => ({ focused: task }),
    },
    [],
  );

  useCopilotAction(
    {
      name: "show_blocked_action",
      description: "Show that an action is blocked by missing credentials or permissions.",
      parameters: [
        {
          name: "reason",
          type: "string",
          description: "The blocker to show.",
          required: true,
        },
      ],
      render: ({ args }) => (
        <div className="my-3 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
          <X className="mt-0.5 h-4 w-4" />
          <span>{args.reason}</span>
        </div>
      ),
      handler: async ({ reason }) => ({ blocked: true, reason }),
    },
    [],
  );

  return null;
}
