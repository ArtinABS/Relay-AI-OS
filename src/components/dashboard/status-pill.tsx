import { cn } from "@/lib/utils";

const statusStyles = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "google-auth": "border-sky-200 bg-sky-50 text-sky-800",
  "approval-required": "border-amber-200 bg-amber-50 text-amber-800",
  database: "border-violet-200 bg-violet-50 text-violet-800",
} as const;

export function StatusPill({ status }: { status: keyof typeof statusStyles }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
