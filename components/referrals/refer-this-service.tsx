"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { createServiceReferralLink, type CreateReferralState } from "./actions";
import { CopyButton } from "./copy-button";
import { useLanguage } from "@/components/language-provider";

const initial: CreateReferralState = {};

const pillClass =
  "flex h-10 w-fit items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200";

/**
 * "Refer & earn" control on a service page. Sits beside the Message host button
 * as a compact trigger; the payout prompt / generated link open in a popover so
 * the header stays uncluttered. Any signed-in user with a payout method can mint
 * a single-use link for this service and earn 4% when someone books through it.
 */
export function ReferThisService({
  offeringId,
  isAuthenticated,
  hasPayout,
}: {
  offeringId: string;
  isAuthenticated: boolean;
  hasPayout: boolean;
}) {
  const { t, locale } = useLanguage();
  const [state, action, pending] = useActionState(
    createServiceReferralLink,
    initial,
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale);

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        <Gift className="h-4 w-4" aria-hidden="true" />
        {t("ref.referThis")}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[85vw] rounded-2xl border border-zinc-200 bg-background p-5 shadow-lg dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("ref.referDesc")}
          </p>

          <div className="mt-3">
            {!isAuthenticated ? (
              <Link
                href={`/login?redirect=/services/${offeringId}`}
                className={pillClass}
              >
                {t("ref.signInToRefer")}
              </Link>
            ) : !hasPayout ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("ref.addPayoutFirst")}
                </p>
                <Link
                  href={`/refer?from=/services/${offeringId}`}
                  className={pillClass}
                >
                  {t("ref.setUpPayout")}
                </Link>
              </div>
            ) : (
              <form action={action}>
                <input type="hidden" name="offeringId" value={offeringId} />
                <button type="submit" disabled={pending} className={pillClass}>
                  {pending ? t("ref.generating") : t("ref.getLink")}
                </button>
              </form>
            )}
          </div>

          {state.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          {state.createdLink && (
            <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("ref.newReady")}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {t("ref.shareOnce").replace(
                  "{date}",
                  fmt(state.createdLink.expiresAt),
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-zinc-300 bg-background px-3 py-2 font-mono text-sm dark:border-zinc-700">
                  {state.createdLink.url}
                </code>
                <CopyButton value={state.createdLink.url} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
