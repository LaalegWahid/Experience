"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthModal } from "./auth-modal-provider";
import { useLanguage } from "./language-provider";

/**
 * The logged-out navbar actions collapsed into a hamburger on small screens
 * (the inline links don't fit on a phone). Shown only below `sm`.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();

  const itemClass =
    "block w-full rounded-xl px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-nav-border/70 bg-nav-surface p-2 shadow-xl">
            <Link href="/services" onClick={() => setOpen(false)} className={itemClass}>
              {t("nav.marketplace")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAuth();
              }}
              className={itemClass}
            >
              {t("nav.signIn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAuth();
              }}
              className="mt-1 block w-full rounded-xl bg-accent px-4 py-3 text-left text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {t("nav.getStarted")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
