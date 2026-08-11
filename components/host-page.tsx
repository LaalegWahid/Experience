import type { ReactNode } from "react";

/**
 * Standard frame for host-studio pages: the title and description stay
 * left-aligned at the top, while the page content is centered in the space
 * beside the nav rail (capped so cards don't stretch edge-to-edge).
 */
export function HostPage({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Optional control aligned to the right of the heading (e.g. a CTA). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-1 text-sm font-medium text-accent">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action ?? null}
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {children}
      </div>
    </div>
  );
}
