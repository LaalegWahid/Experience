import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandGraphicAccent } from "./brand-graphic-accent";

/** A dashed empty-state card: an accent-tinted icon badge, a message, and an
 *  optional action — plus the same subtle brand graphic texture used
 *  elsewhere, so these moments aren't just bare text. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  /** A short bold headline above the message, for states that want more than
   *  one line (e.g. "You're all caught up" + a softer explanation). */
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-10 text-center dark:border-orange-900/40 dark:bg-[#1e1a15]">
      <BrandGraphicAccent corner="top-right" />
      <div className="relative flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        {title && <p className="text-sm font-medium text-foreground">{title}</p>}
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        {action}
      </div>
    </div>
  );
}
