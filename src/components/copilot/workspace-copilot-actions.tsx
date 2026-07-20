"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Check, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, Surface } from "@heroui/react";

import { toolCatalog } from "@/lib/tools/catalog";

export function WorkspaceCopilotActions() {
  const [lastApproval, setLastApproval] = useState<{
    title: string;
    approved: boolean;
  } | null>(null);

  const dashboardState = useMemo(
    () => ({
      app: "Daily Work Agent",
      connectedSurfaces: toolCatalog.map(({ name, status }) => ({
        name,
        status,
      })),
      approvalPolicy:
        "Ask for confirmation before sending email, changing files, editing shared docs, or changing calendar state.",
      lastApproval,
    }),
    [lastApproval],
  );

  useCopilotReadable({
    description:
      "Current Daily Work Agent dashboard state and approval policy.",
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
        <Surface
          className="my-3 rounded-xl border border-warning/30 p-4 text-sm text-foreground shadow-surface"
          variant="secondary"
        >
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-warning" />
            {args.title ?? "Approval request"}
          </div>
          <p className="mt-2 leading-6 text-muted">{args.details}</p>
          <Chip className="mt-3" color="warning" size="sm" variant="soft">
            {status === "complete" ? "Decision recorded" : args.riskLevel}
          </Chip>
        </Surface>
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
        <Surface
          className="my-3 flex items-start gap-3 rounded-xl border border-success/30 p-4 text-sm text-success"
          variant="secondary"
        >
          <Check className="mt-0.5 h-4 w-4" />
          <span>{args.task}</span>
        </Surface>
      ),
      handler: async ({ task }) => ({ focused: task }),
    },
    [],
  );

  useCopilotAction(
    {
      name: "show_blocked_action",
      description:
        "Show that an action is blocked by missing credentials or permissions.",
      parameters: [
        {
          name: "reason",
          type: "string",
          description: "The blocker to show.",
          required: true,
        },
      ],
      render: ({ args }) => (
        <Surface
          className="my-3 flex items-start gap-3 rounded-xl border border-danger/30 p-4 text-sm text-danger"
          variant="secondary"
        >
          <X className="mt-0.5 h-4 w-4" />
          <span>{args.reason}</span>
        </Surface>
      ),
      handler: async ({ reason }) => ({ blocked: true, reason }),
    },
    [],
  );

  return null;
}
