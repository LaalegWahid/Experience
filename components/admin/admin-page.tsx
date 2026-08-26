import type { ReactNode } from "react";

/**
 * Admin page frame: heading, action, and content share one centered container
 * so every edge lines up across the admin pages.
 */
export function AdminPage({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Optional control aligned to the right of the heading (e.g. a CTA). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action ?? null}
      </div>
      <div>{children}</div>
    </div>
  );
}
