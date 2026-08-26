"use client";

import { useState } from "react";
import { useLanguage } from "./language-provider";

/**
 * Overlay share button for a photo backdrop (matches FavoriteButton's
 * `overlay` styling: no circle background, just a drop-shadowed icon so it
 * reads on any photo). Uses the native share sheet where available, falling
 * back to copying the link.
 */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label={t("service.share")}
        title={t("service.share")}
        className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-white drop-shadow-md transition-transform hover:scale-110 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-full w-full"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
      </button>
      {copied && (
        <span className="absolute right-0 top-full mt-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md">
          {t("service.linkCopied")}
        </span>
      )}
    </span>
  );
}
