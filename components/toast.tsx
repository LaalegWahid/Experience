"use client";

/**
 * A confirmation popup pinned to the top-left of the screen, styled to match the
 * site: warm card surface, the brand accent, a large radius and a soft layered
 * shadow. Render it conditionally — the caller controls show/auto-dismiss.
 */
export function Toast({
  message,
  description,
}: {
  message: string;
  description?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-4 top-4 z-80 flex w-[min(22rem,calc(100vw-2rem))] items-center gap-4 rounded-2xl border border-zinc-200 bg-background px-5 py-4 shadow-xl ring-1 ring-black/5 motion-safe:animate-[stepInLeft_0.22s_ease] dark:border-zinc-800 dark:ring-white/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold tracking-tight text-foreground">
          {message}
        </span>
        {description && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
