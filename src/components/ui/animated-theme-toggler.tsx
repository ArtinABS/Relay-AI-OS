"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

type ThemeViewTransition = {
  finished?: Promise<void>;
  ready?: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ThemeViewTransition;
};

type AnimatedThemeTogglerProps = ComponentPropsWithoutRef<"button"> & {
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
};

function collapsedPolygon(point: string, vertexCount: number) {
  return `polygon(${Array.from({ length: vertexCount }, () => point).join(", ")})`;
}

function getClipPaths(
  variant: TransitionVariant,
  centerX: number,
  centerY: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  const toX = (value: number) => `${(value / viewportWidth) * 100}%`;
  const toY = (value: number) => `${(value / viewportHeight) * 100}%`;
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`;
  const center = point(centerX, centerY);
  const toRadius = (radius: number) =>
    `${(radius / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  if (variant === "circle") {
    return [
      `circle(0% at ${center})`,
      `circle(${toRadius(maxRadius)} at ${center})`,
    ];
  }

  if (variant === "square" || variant === "rectangle") {
    const halfWidth =
      variant === "square"
        ? Math.max(
            Math.max(centerX, viewportWidth - centerX),
            Math.max(centerY, viewportHeight - centerY),
          ) * 1.05
        : Math.max(centerX, viewportWidth - centerX);
    const halfHeight =
      variant === "square"
        ? halfWidth
        : Math.max(centerY, viewportHeight - centerY);
    const end = [
      point(centerX - halfWidth, centerY - halfHeight),
      point(centerX + halfWidth, centerY - halfHeight),
      point(centerX + halfWidth, centerY + halfHeight),
      point(centerX - halfWidth, centerY + halfHeight),
    ].join(", ");
    return [collapsedPolygon(center, 4), `polygon(${end})`];
  }

  if (variant === "triangle") {
    const scale = maxRadius * 2.2;
    const deltaX = (Math.sqrt(3) / 2) * scale;
    const end = [
      point(centerX, centerY - scale),
      point(centerX + deltaX, centerY + scale * 0.5),
      point(centerX - deltaX, centerY + scale * 0.5),
    ].join(", ");
    return [collapsedPolygon(center, 3), `polygon(${end})`];
  }

  if (variant === "diamond") {
    const radius = maxRadius * Math.SQRT2;
    const end = [
      point(centerX, centerY - radius),
      point(centerX + radius, centerY),
      point(centerX, centerY + radius),
      point(centerX - radius, centerY),
    ].join(", ");
    return [collapsedPolygon(center, 4), `polygon(${end})`];
  }

  if (variant === "hexagon") {
    const radius = maxRadius * Math.SQRT2;
    const end = Array.from({ length: 6 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / 3;
      return point(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle),
      );
    }).join(", ");
    return [collapsedPolygon(center, 6), `polygon(${end})`];
  }

  const radius = maxRadius * Math.SQRT2 * 1.03;
  const starPolygon = (outerRadius: number) => {
    const vertices: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const outerAngle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
      vertices.push(
        point(
          centerX + outerRadius * Math.cos(outerAngle),
          centerY + outerRadius * Math.sin(outerAngle),
        ),
      );
      const innerAngle = outerAngle + Math.PI / 5;
      vertices.push(
        point(
          centerX + outerRadius * 0.42 * Math.cos(innerAngle),
          centerY + outerRadius * 0.42 * Math.sin(innerAngle),
        ),
      );
    }
    return `polygon(${vertices.join(", ")})`;
  };

  return [starPolygon(Math.max(2, radius * 0.025)), starPolygon(radius)];
}

export function AnimatedThemeToggler({
  className,
  duration = 460,
  variant = "circle",
  fromCenter = false,
  theme,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) {
  const controlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const isDark = controlled ? theme === "dark" : internalIsDark;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitioningRef = useRef(false);

  useEffect(() => {
    if (controlled) return;

    const updateTheme = () =>
      setInternalIsDark(document.documentElement.classList.contains("dark"));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [controlled]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    const transitionDocument = document as ViewTransitionDocument;
    if (
      !button ||
      transitioningRef.current ||
      document.documentElement.dataset.magicuiThemeVt === "active"
    ) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bounds = button.getBoundingClientRect();
    const centerX = fromCenter
      ? viewportWidth / 2
      : bounds.left + bounds.width / 2;
    const centerY = fromCenter
      ? viewportHeight / 2
      : bounds.top + bounds.height / 2;
    const maxRadius = Math.hypot(
      Math.max(centerX, viewportWidth - centerX),
      Math.max(centerY, viewportHeight - centerY),
    );
    const clipPath = getClipPaths(
      variant,
      centerX,
      centerY,
      maxRadius,
      viewportWidth,
      viewportHeight,
    );

    const applyTheme = () => {
      const nextTheme = isDark ? "light" : "dark";
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.classList.toggle("light", nextTheme === "light");
      if (controlled) {
        onThemeChange?.(nextTheme);
      } else {
        setInternalIsDark(nextTheme === "dark");
        localStorage.setItem("theme", nextTheme);
      }
    };

    if (
      !transitionDocument.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      applyTheme();
      return;
    }

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${duration}ms`,
    );
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
    transitioningRef.current = true;

    const cleanup = () => {
      transitioningRef.current = false;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };
    const transition = transitionDocument.startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition.finished?.finally(cleanup).catch(() => undefined);
    transition.ready
      ?.then(() => {
        document.documentElement.animate(
          { clipPath },
          {
            duration,
            easing: variant === "star" ? "linear" : "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(cleanup);
  }, [
    controlled,
    duration,
    fromCenter,
    isDark,
    onThemeChange,
    variant,
  ]);

  return (
    <button
      {...props}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={cn(
        "inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl transition",
        className,
      )}
      onClick={toggleTheme}
      ref={buttonRef}
      type="button"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
