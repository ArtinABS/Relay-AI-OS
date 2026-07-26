"use client";

import { Moon, Sun } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/relay-ui";

type ThemeMode = "light" | "dark";

type ViewTransition = {
  ready: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransition;
};

export function AnimatedThemeToggler({
  className,
  onThemeChange,
  theme,
}: {
  className?: string;
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const transitionDocument = document as ViewTransitionDocument;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!transitionDocument.startViewTransition || reducedMotion) {
      onThemeChange(nextTheme);
      return;
    }

    const bounds = buttonRef.current?.getBoundingClientRect();
    if (!bounds) {
      onThemeChange(nextTheme);
      return;
    }

    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const transition = transitionDocument.startViewTransition(() => {
      onThemeChange(nextTheme);
    });

    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 480,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }

  return (
    <Button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={className}
      isIconOnly
      onPress={toggleTheme}
      ref={buttonRef}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      variant="ghost"
    >
      <span className="relative grid h-4 w-4 place-items-center">
        <Sun
          className={`absolute h-4 w-4 transition-all duration-300 ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`absolute h-4 w-4 transition-all duration-300 ${
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
    </Button>
  );
}
