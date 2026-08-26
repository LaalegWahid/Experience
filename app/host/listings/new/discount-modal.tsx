"use client";

import { useState } from "react";
import { applyDiscount, clampDiscountPercent } from "@/shared/utils/discount";
import { CloseButton, ModalShell } from "./listing-wizard";

// Shared discount UI for both wizards (service + experience): a tappable row and
// the Airbnb-style popup where the host sets the percentage themselves.

export const DISCOUNT_COPY = {
  limitedTime: {
    title: "Limited-time discount",
    description:
      "Offer a deal for the next 90 days to encourage your first guests to book.",
  },
  earlyBird: {
    title: "Early bird discount",
    description: "Applies to all bookings made more than 2 weeks in advance.",
  },
} as const;

export function DiscountRow({
  applied,
  percent,
  title,
  subtitle,
  onClick,
}: {
  applied: boolean;
  percent: number;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-colors ${
        applied
          ? "border-foreground ring-1 ring-foreground"
          : "border-zinc-300 hover:border-foreground dark:border-zinc-700"
      }`}
    >
      <span className="flex flex-1 flex-col gap-1">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </span>
      </span>
      {applied && (
        <span className="shrink-0 text-sm font-semibold text-foreground">
          {percent}% off
        </span>
      )}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          applied
            ? "border-foreground bg-foreground text-background"
            : "border-zinc-300 text-foreground dark:border-zinc-600"
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={applied ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          {applied ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}
        </svg>
      </span>
    </button>
  );
}

export function DiscountModal({
  kind,
  applied,
  percent,
  pricePerGuest,
  sym,
  onApply,
  onRemove,
  onCancel,
}: {
  kind: "limitedTime" | "earlyBird";
  applied: boolean;
  percent: number;
  /** A single reference price for the live preview; pass 0 to hide it. */
  pricePerGuest: number;
  sym: string;
  onApply: (percent: number) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const copy = DISCOUNT_COPY[kind];
  const [pct, setPct] = useState(String(percent));
  const clean = clampDiscountPercent(Number(pct));
  const discounted = applyDiscount(pricePerGuest, clean);

  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-center justify-between p-5">
        <CloseButton onClick={onCancel} />
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <span className="w-8" />
      </div>
      <div className="flex flex-col items-center px-8 pb-8 pt-4 text-center">
        {/* Big, editable percentage — the host sets the amount. */}
        <div className="flex items-baseline justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={pct}
            onChange={(e) =>
              setPct(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            aria-label="Discount percentage"
            className="w-[2.5ch] border-b-2 border-foreground bg-transparent text-center text-5xl font-bold tracking-tight text-foreground outline-none sm:text-6xl"
          />
          <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            % off
          </span>
        </div>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {copy.description}
        </p>
        {pricePerGuest > 0 && clean > 0 && (
          <p className="mt-4 text-sm font-medium text-foreground">
            Guests pay {sym}
            {discounted}{" "}
            <span className="text-zinc-400 line-through dark:text-zinc-500">
              {sym}
              {pricePerGuest}
            </span>
          </p>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 p-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {applied && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            disabled={clean < 1}
            onClick={() => onApply(clean)}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {applied ? "Update discount" : "Apply discount"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
