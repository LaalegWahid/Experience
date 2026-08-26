"use client";

import { useActionState, useState } from "react";
import { setWeeklyAvailability } from "../../actions";
import { emptyFormState } from "@/shared/utils/form";
import { WEEKDAYS } from "@/shared/data/offerings";

export type RuleView = {
  dayOfWeek: number;
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string;
};

type TimeFormat = "24h" | "ampm";

const inputClass =
  "rounded-lg border border-black/10 bg-transparent px-2 py-2 text-sm text-foreground outline-none transition-colors duration-200 ease-out focus:border-accent disabled:opacity-40 dark:border-white/10";

const hhmm = (t: string | undefined, fallback: string) =>
  t ? t.slice(0, 5) : fallback;

const pad = (n: number) => String(n).padStart(2, "0");

/** Minute options in 5-min steps, plus the current value if it's off-step. */
function minuteOptions(current: number): number[] {
  const set = new Set<number>([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  set.add(current);
  return [...set].sort((a, b) => a - b);
}

function to24(hour12: number, period: "AM" | "PM"): number {
  const base = hour12 % 12; // 12 → 0
  return period === "PM" ? base + 12 : base;
}

/**
 * Controlled time picker that always emits a canonical "HH:MM" (24h) value via
 * a hidden input, while rendering in either 24-hour or AM/PM style.
 */
function TimeField({
  name,
  value,
  onChange,
  format,
  disabled,
  ariaLabel,
}: {
  name: string;
  value: string; // "HH:MM" 24h
  onChange: (next: string) => void;
  format: TimeFormat;
  disabled: boolean;
  ariaLabel: string;
}) {
  const [hStr, mStr] = value.split(":");
  const h24 = Number(hStr) || 0;
  const minute = Number(mStr) || 0;
  const minutes = minuteOptions(minute);

  if (format === "ampm") {
    const period: "AM" | "PM" = h24 < 12 ? "AM" : "PM";
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return (
      <div className="flex items-center gap-1">
        <select
          aria-label={`${ariaLabel} hour`}
          value={hour12}
          disabled={disabled}
          onChange={(e) =>
            onChange(`${pad(to24(Number(e.target.value), period))}:${pad(minute)}`)
          }
          className={inputClass}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-400">:</span>
        <select
          aria-label={`${ariaLabel} minute`}
          value={minute}
          disabled={disabled}
          onChange={(e) => onChange(`${pad(h24)}:${pad(Number(e.target.value))}`)}
          className={inputClass}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
        <select
          aria-label={`${ariaLabel} AM or PM`}
          value={period}
          disabled={disabled}
          onChange={(e) =>
            onChange(
              `${pad(to24(hour12, e.target.value as "AM" | "PM"))}:${pad(minute)}`,
            )
          }
          className={inputClass}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <input type="hidden" name={name} value={value} />
      </div>
    );
  }

  // 24-hour
  return (
    <div className="flex items-center gap-1">
      <select
        aria-label={`${ariaLabel} hour`}
        value={h24}
        disabled={disabled}
        onChange={(e) => onChange(`${pad(Number(e.target.value))}:${pad(minute)}`)}
        className={inputClass}
      >
        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
          <option key={h} value={h}>
            {pad(h)}
          </option>
        ))}
      </select>
      <span className="text-sm text-zinc-400">:</span>
      <select
        aria-label={`${ariaLabel} minute`}
        value={minute}
        disabled={disabled}
        onChange={(e) => onChange(`${pad(h24)}:${pad(Number(e.target.value))}`)}
        className={inputClass}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {pad(m)}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function WeeklyScheduleManager({
  offeringId,
  rules,
}: {
  offeringId: string;
  rules: RuleView[];
}) {
  const save = setWeeklyAvailability.bind(null, offeringId);
  const [state, action, pending] = useActionState(save, emptyFormState);

  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  const [enabled, setEnabled] = useState<Set<number>>(
    () => new Set(rules.map((r) => r.dayOfWeek)),
  );
  const [format, setFormat] = useState<TimeFormat>("24h");
  const [times, setTimes] = useState<
    Record<number, { start: string; end: string }>
  >(() => {
    const obj: Record<number, { start: string; end: string }> = {};
    for (const day of WEEKDAYS) {
      const r = byDay.get(day.value);
      obj[day.value] = {
        start: hhmm(r?.startTime, "09:00"),
        end: hhmm(r?.endTime, "17:00"),
      };
    }
    return obj;
  });

  function toggle(day: number, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(day);
      else next.delete(day);
      return next;
    });
  }

  function setTime(day: number, key: "start" | "end", value: string) {
    setTimes((prev) => ({ ...prev, [day]: { ...prev[day], [key]: value } }));
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-5 dark:border-white/10 dark:bg-[#1e1a15]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Pick the days you&apos;re available and the hours for each. This repeats
          every week until you change it.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Time format</span>
          <div className="flex rounded-full border border-black/10 p-0.5 dark:border-white/10">
            {(
              [
                { value: "24h", label: "24-hour" },
                { value: "ampm", label: "AM / PM" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-out ${
                  format === opt.value
                    ? "bg-accent text-accent-foreground"
                    : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {WEEKDAYS.map((day) => {
          const on = enabled.has(day.value);
          const err = state.fieldErrors?.[`day_${day.value}`];
          return (
            <li
              key={day.value}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
            >
              <label className="flex w-32 items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  name={`enabled_${day.value}`}
                  checked={on}
                  onChange={(e) => toggle(day.value, e.target.checked)}
                  className="h-4 w-4"
                />
                {day.label}
              </label>

              <div className="flex items-center gap-2">
                <TimeField
                  name={`start_${day.value}`}
                  value={times[day.value].start}
                  onChange={(v) => setTime(day.value, "start", v)}
                  format={format}
                  disabled={!on}
                  ariaLabel={`${day.label} start`}
                />
                <span className="text-sm text-zinc-400">to</span>
                <TimeField
                  name={`end_${day.value}`}
                  value={times[day.value].end}
                  onChange={(v) => setTime(day.value, "end", v)}
                  format={format}
                  disabled={!on}
                  ariaLabel={`${day.label} end`}
                />
              </div>

              {err && (
                <span className="w-full text-xs text-red-600 dark:text-red-400 sm:w-auto">
                  {err[0]}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {state.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Weekly availability saved.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save weekly availability"}
        </button>
      </div>
    </form>
  );
}
