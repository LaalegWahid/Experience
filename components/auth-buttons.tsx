"use client";

import { useAuthModal } from "./auth-modal-provider";
import { useLanguage } from "./language-provider";

/** The logged-out navbar actions — open the auth popup instead of navigating. */
export function AuthButtons() {
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();
  return (
    <>
      <button
        type="button"
        onClick={() => openAuth()}
        className="rounded-full px-4 py-2 text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {t("nav.signIn")}
      </button>
      <button
        type="button"
        onClick={() => openAuth()}
        className="rounded-full bg-accent px-5 py-2.5 text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90"
      >
        {t("nav.getStarted")}
      </button>
    </>
  );
}
