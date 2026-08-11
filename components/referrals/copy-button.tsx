"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

/** Copies a value to the clipboard, flashing a confirmation label. */
export function CopyButton({ value }: { value: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
    >
      {copied ? t("ref.copied") : t("ref.copy")}
    </button>
  );
}
