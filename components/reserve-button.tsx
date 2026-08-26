"use client";

import { useBooking } from "./booking-provider";
import { useLanguage } from "./language-provider";

export function ReserveButton() {
  const { bookable, isAuthenticated, startBooking } = useBooking();
  const { t } = useLanguage();

  if (!bookable) {
    return (
      <span className="flex h-12 cursor-not-allowed items-center justify-center rounded-full bg-zinc-100 px-6 text-sm font-medium text-zinc-400 dark:bg-zinc-900">
        {t("reserve.fullyBooked")}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => startBooking()}
      className="flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
    >
      {isAuthenticated ? t("reserve.reserve") : t("reserve.signInToReserve")}
    </button>
  );
}
