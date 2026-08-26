"use client";

import { CopyButton } from "./copy-button";
import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

export type ReferralLinkView = {
  id: string;
  /** The shareable URL — only present while the link is still active. */
  url: string | null;
  status: "active" | "redeemed" | "expired";
  serviceTitle: string | null;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
};

const STATUS_BADGE: Record<ReferralLinkView["status"], string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  redeemed: "bg-accent/10 text-accent dark:bg-accent/15",
  expired: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

/** A referrer's existing links: status, the service each promotes, and copy. */
export function ReferralLinksManager({
  links,
}: {
  links: ReferralLinkView[];
}) {
  const { t, locale } = useLanguage();
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale);

  if (links.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t("ref.linksEmpty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {links.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-background px-4 py-3 dark:border-zinc-800"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[r.status]}`}
              >
                {t(`ref.status.${r.status}` as TranslationKey)}
              </span>
              {r.serviceTitle && (
                <span className="truncate text-foreground">
                  {t("ref.forService").replace("{service}", r.serviceTitle)}
                </span>
              )}
            </span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {r.status === "redeemed"
                ? t("ref.used").replace(
                    "{date}",
                    r.redeemedAt ? fmt(r.redeemedAt) : "",
                  )
                : t("ref.expires").replace("{date}", fmt(r.expiresAt))}
            </span>
          </div>
          {r.url && (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
              <code className="hidden max-w-[18rem] truncate rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-foreground dark:border-zinc-800 dark:bg-zinc-900/40 sm:block">
                {r.url}
              </code>
              <CopyButton value={r.url} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
