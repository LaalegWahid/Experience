"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** Light/dark toggle. `onDark` styles it for a dark (accent) header. */
export function ThemeToggle({
  onDark = false,
  size = "md",
}: {
  onDark?: boolean;
  size?: "md" | "lg";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is unknown during SSR, so render a stable placeholder until mounted.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const buttonSize = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  const base = onDark
    ? "text-white/80 hover:bg-white/10 hover:text-white"
    : "text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle theme"
      className={`flex ${buttonSize} items-center justify-center rounded-full transition-colors ${base}`}
    >
      {!mounted ? (
        <span className={iconSize} />
      ) : isDark ? (
        // sun
        <svg
          viewBox="0 0 24 24"
          className={iconSize}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // moon
        <svg
          viewBox="0 0 24 24"
          className={iconSize}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
