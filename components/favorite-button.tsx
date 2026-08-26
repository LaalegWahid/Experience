"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tryCatch } from "@/shared/utils/TryCatch";
import { useLanguage } from "./language-provider";

type Props = {
  offeringId: string;
  isAuthenticated: boolean;
  initialFavorited: boolean;
  /** Larger tap target for the detail page. */
  size?: "sm" | "md";
  overlay?: boolean;
  /** Just the heart — no border or circle background. */
  plain?: boolean;
};

function HeartIcon({ filled, overlay }: { filled: boolean; overlay?: boolean }) {
  const fill = overlay
    ? filled
      ? "#f43f5e"
      : "rgba(0,0,0,0.45)"
    : filled
      ? "currentColor"
      : "none";
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-full w-full"
      fill={fill}
      stroke={overlay ? "white" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function FavoriteButton({
  offeringId,
  isAuthenticated,
  initialFavorited,
  size = "sm",
  overlay = false,
  plain = false,
}: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  const box = size === "md" ? "h-10 w-10 p-2" : "h-8 w-8 p-1.5";

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (pending) return;

    // Optimistic flip.
    const next = !favorited;
    setFavorited(next);
    setPending(true);

    const result = await tryCatch(
      fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId }),
      }),
    );
    setPending(false);

    if (!result.ok || !result.data.ok) {
      setFavorited(!next); // revert on failure
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? t("favorite.remove") : t("favorite.add")}
      title={favorited ? t("favorite.remove") : t("favorite.add")}
      className={`${box} flex shrink-0 items-center justify-center rounded-full ${
        overlay
          ? "drop-shadow-md transition-transform hover:scale-110 active:scale-95"
          : plain
            ? `transition-transform hover:scale-110 active:scale-95 ${
                favorited ? "text-accent" : "text-zinc-400 hover:text-accent"
              }`
            : `border transition-colors ${
                favorited
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-zinc-300 text-zinc-400 hover:text-accent dark:border-zinc-700"
              }`
      }`}
    >
      <HeartIcon filled={favorited} overlay={overlay} />
    </button>
  );
}
