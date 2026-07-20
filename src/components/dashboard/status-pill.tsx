import { Chip } from "@heroui/react";

const statusColors = {
  ready: "success",
  "google-auth": "accent",
  "approval-required": "warning",
  database: "default",
} as const;

export function StatusPill({ status }: { status: keyof typeof statusColors }) {
  return (
    <Chip
      className="text-xs font-medium"
      color={statusColors[status]}
      size="sm"
      variant="soft"
    >
      {status}
    </Chip>
  );
}
