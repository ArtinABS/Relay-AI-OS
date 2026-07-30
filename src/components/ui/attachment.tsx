import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/relay-ui";

const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border border-separator bg-surface-secondary text-foreground transition-colors focus-within:ring-1 focus-within:ring-[var(--focus)]/30 has-[>a,>button]:hover:bg-surface-tertiary data-[state=error]:border-[color-mix(in_oklab,var(--danger)_35%,transparent)] data-[state=idle]:border-dashed",
  {
    variants: {
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-28 flex-col",
      },
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
    },
  },
);

function Attachment({
  className,
  orientation = "horizontal",
  size = "default",
  state = "done",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: "idle" | "uploading" | "processing" | "error" | "done";
  }) {
  return (
    <div
      className={cn(attachmentVariants({ orientation, size }), className)}
      data-orientation={orientation}
      data-size={size}
      data-slot="attachment"
      data-state={state}
      {...props}
    />
  );
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-tertiary text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-danger-soft group-data-[state=error]/attachment:text-danger [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:h-full *:[img]:w-full *:[img]:object-cover",
      },
    },
  },
);

function AttachmentMedia({
  className,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div
      className={cn(attachmentMediaVariants({ variant }), className)}
      data-slot="attachment-media"
      data-variant={variant}
      {...props}
    />
  );
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:w-full group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      data-slot="attachment-content"
      {...props}
    />
  );
}

function AttachmentTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        className,
      )}
      data-slot="attachment-title"
      {...props}
    />
  );
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "mt-0.5 block max-w-full min-w-0 truncate text-xs text-muted group-data-[state=error]/attachment:text-danger",
        className,
      )}
      data-slot="attachment-description"
      {...props}
    />
  );
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:right-2 group-data-[orientation=vertical]/attachment:top-2 group-data-[orientation=vertical]/attachment:gap-1",
        className,
      )}
      data-slot="attachment-actions"
      {...props}
    />
  );
}

function AttachmentAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-7 w-7 min-w-0 rounded-md border-0 bg-transparent p-0 text-muted hover:bg-surface hover:text-foreground",
        className,
      )}
      data-slot="attachment-action"
      variant="ghost"
      {...props}
    />
  );
}

function AttachmentTrigger({
  asChild = false,
  className,
  type,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
}) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "absolute inset-0 z-10 rounded-[inherit] outline-none",
        className,
      )}
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

function AttachmentGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "scroll-fade-x no-scrollbar flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className,
      )}
      data-slot="attachment-group"
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
