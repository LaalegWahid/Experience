"use client";

import { useMemo, useState } from "react";
import type { AvailabilityWindow } from "@/lib/offerings";
import { useBooking } from "./booking-provider";
import { useLanguage } from "./language-provider";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

const WEEKDAY_KEYS: TranslationKey[] = [
  "calendar.mon",
  "calendar.tue",
  "calendar.wed",
  "calendar.thu",
  "calendar.fri",
  "calendar.sat",
  "calendar.sun",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// JS getDay() (0=Sun…6=Sat) → ISO weekday (1=Mon…7=Sun).
function isoWeekday(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

export function AvailabilityCalendar({
  availability,
  embedded = false,
}: {
  availability: AvailabilityWindow[];
  /** Drop the bordered card chrome when nested inside another card. */
  embedded?: boolean;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const { startBooking, bookable } = useBooking();
  const { t, locale } = useLanguage();

  // One window per weekday (the MVP). Keyed by ISO weekday.
  const byWeekday = useMemo(
    () => new Map(availability.map((w) => [w.dayOfWeek, w])),
    [availability],
  );

  if (availability.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {t("calendar.noAvailability")}
      </p>
    );
  }

  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const monthLabel = view.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = isoWeekday(new Date(year, month, 1)) - 1;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedDate = selectedTime !== null ? new Date(selectedTime) : null;
  const selectedWindow = selectedDate
    ? byWeekday.get(isoWeekday(selectedDate))
    : null;

  return (
    <div
      className={
        embedded
          ? ""
          : "rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800"
      }
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
          disabled={monthOffset === 0}
          aria-label={t("calendar.prevMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-900"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-foreground">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m + 1)}
          aria-label={t("calendar.nextMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
        {WEEKDAY_KEYS.map((k) => (
          <span key={k}>{t(k)}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`b${i}`} />;
          const isPast = date.getTime() < today.getTime();
          const isToday = date.getTime() === today.getTime();
          const available = byWeekday.has(isoWeekday(date)) && !isPast;
          const isSelected = date.getTime() === selectedTime;

          return (
            <button
              key={date.getTime()}
              type="button"
              disabled={!available}
              onClick={() => {
                setSelectedTime(date.getTime());
                if (bookable) startBooking(toKey(date));
              }}
              className={`flex h-9 items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-accent font-semibold text-white"
                  : available
                    ? "bg-accent/10 font-medium text-accent hover:bg-accent/20"
                    : "text-zinc-300 dark:text-zinc-600"
              } ${isToday && !isSelected ? "ring-1 ring-accent" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected day's hours / hint */}
      <div className="mt-4 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800/70">
        {selectedDate && selectedWindow ? (
          <p className="text-foreground">
            <span className="font-medium">
              {selectedDate.toLocaleDateString(locale, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {" "}
              · {selectedWindow.startTime}–{selectedWindow.endTime}
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="inline-block h-3 w-3 rounded bg-accent/10" />
            {t("calendar.hint")}
          </p>
        )}
      </div>
    </div>
  );
}
