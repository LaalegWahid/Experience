"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatThread } from "./chat-thread";
import { useLanguage } from "./language-provider";
import { useLockBodyScroll } from "./use-lock-body-scroll";

type Props = {
  offeringId: string;
  isAuthenticated: boolean;
  isHost: boolean;
  hostName: string;
};

/**
 * A "Message host" button that opens a Twitch-style chat panel docked to the
 * right edge of the screen. Reuses the live message thread; hosts viewing their
 * own service don't see the button (they reply from the host inbox).
 */
export function ServiceChatDrawer({
  offeringId,
  isAuthenticated,
  isHost,
  hostName,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useLockBodyScroll(open);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The host manages replies from their inbox — no self-chat button.
  if (isHost) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {t("chat.title")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* Click-away layer — closes on outside click without dimming the
              page, so the chat reads as a floating widget. */}
          <button
            type="button"
            aria-label={t("booking.close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/20 sm:bg-transparent"
          />

          {/* Panel — docked to the bottom-right, a portion of the height,
              sliding up from the bottom edge. */}
          <div className="absolute inset-x-0 bottom-0 flex h-[70vh] max-h-[32rem] w-full flex-col rounded-t-2xl border border-zinc-200 bg-background pb-[env(safe-area-inset-bottom)] shadow-xl motion-safe:animate-[slideUpIn_0.28s_ease-out] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-full sm:max-w-sm sm:rounded-2xl sm:pb-0 dark:border-zinc-800">
            <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {t("chat.title")}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {hostName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("booking.close")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col p-4">
              {isAuthenticated ? (
                <ChatThread
                  offeringId={offeringId}
                  hostName={hostName}
                  listClassName="flex-1 min-h-0"
                />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <Link
                    href={`/login?redirect=/services/${offeringId}`}
                    className="font-medium text-accent transition-opacity hover:opacity-80"
                  >
                    {t("chat.signIn")}
                  </Link>{" "}
                  {t("chat.askSuffix").replace("{host}", hostName)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
