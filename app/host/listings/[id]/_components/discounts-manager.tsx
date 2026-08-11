"use client";

import { useState, useTransition } from "react";
import { clampDiscountPercent } from "@/shared/utils/discount";
import { updateDiscounts } from "../../actions";

type Initial = {
  limitedTime: boolean;
  earlyBird: boolean;
  limitedTimePercent?: number;
  earlyBirdPercent?: number;
};

/** Post-publish editor for the two percentage deals. Mirrors the wizard's
 *  discount step so hosts can start, change, or end a deal any time. */
export function DiscountsManager({
  offeringId,
  initial,
}: {
  offeringId: string;
  initial: Initial;
}) {
  const [limitedTime, setLimitedTime] = useState(initial.limitedTime);
  const [earlyBird, setEarlyBird] = useState(initial.earlyBird);
  const [ltPct, setLtPct] = useState(String(initial.limitedTimePercent ?? 10));
  const [ebPct, setEbPct] = useState(String(initial.earlyBirdPercent ?? 20));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateDiscounts(offeringId, {
        limitedTime,
        earlyBird,
        limitedTimePercent: clampDiscountPercent(Number(ltPct)) || undefined,
        earlyBirdPercent: clampDiscountPercent(Number(ebPct)) || undefined,
      });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Discounts
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Guests see the biggest active deal applied to the price.
        </p>
      </div>

      <DiscountEditRow
        label="Limited-time"
        hint="A deal for the next 90 days."
        enabled={limitedTime}
        onToggle={setLimitedTime}
        percent={ltPct}
        onPercent={setLtPct}
      />
      <DiscountEditRow
        label="Early bird"
        hint="For bookings made more than 2 weeks ahead."
        enabled={earlyBird}
        onToggle={setEarlyBird}
        percent={ebPct}
        onPercent={setEbPct}
      />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save discounts"}
      </button>
    </div>
  );
}

function DiscountEditRow({
  label,
  hint,
  enabled,
  onToggle,
  percent,
  onPercent,
}: {
  label: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  percent: string;
  onPercent: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        </div>
        <Switch checked={enabled} onChange={onToggle} label={`Turn on ${label}`} />
      </div>
      {enabled && (
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input
            type="text"
            inputMode="numeric"
            value={percent}
            onChange={(e) =>
              onPercent(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            aria-label={`${label} discount percentage`}
            className="w-16 rounded-lg border border-zinc-300 px-3 py-1.5 text-center font-semibold outline-none focus:border-foreground dark:border-zinc-700 dark:bg-transparent"
          />
          <span className="text-zinc-500 dark:text-zinc-400">% off</span>
        </label>
      )}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-foreground" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
