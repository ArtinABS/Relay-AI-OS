import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-xs text-muted [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-4 [a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: "",
        separator:
          "py-1 before:mr-1 before:h-px before:min-w-0 before:flex-1 before:bg-[var(--separator)] after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-[var(--separator)]",
        border: "border-b border-separator pb-3",
      },
    },
  },
);

function Marker({
  asChild = false,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof markerVariants> & {
    asChild?: boolean;
  }) {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      className={cn(markerVariants({ variant, className }))}
      data-slot="marker"
      data-variant={variant}
      {...props}
    />
  );
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="marker-icon"
      {...props}
    />
  );
}

function MarkerContent({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "min-w-0 break-words group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-foreground",
        className,
      )}
      data-slot="marker-content"
      {...props}
    />
  );
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
