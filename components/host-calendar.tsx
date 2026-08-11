"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/shared/utils/money";

export type CalendarEvent = {
  id: string;
  title: string;
  guestName: string;
  offeringId: string;
  /** ISO timestamp of the appointment. */
  at: string;
  status: "confirmed" | "completed" | "executed" | "canceled";
  priceCents: number;
  currency: string;
};

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const POPOVER_WIDTH = 288; // matches w-72

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// JS getDay() (0=Sun…6=Sat) → ISO weekday (1=Mon…7=Sun).
function isoWeekday(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

function time(at: string): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const CHIP: Record<CalendarEvent["status"], string> = {
  confirmed: "bg-accent/15 text-accent dark:bg-accent/20",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  executed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  canceled:
    "bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-500",
};

const BADGE: Record<CalendarEvent["status"], string> = {
  confirmed: "bg-accent/10 text-accent dark:bg-accent/15",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  executed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

type OpenDay = { key: string; top: number; left: number };

export function HostCalendar({ events }: { events: CalendarEvent[] }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [openDay, setOpenDay] = useState<OpenDay | null>(null);

  // Close the popover on Escape or when the page scrolls/resizes.
  useEffect(() => {
    if (!openDay) return;
    const close = () => setOpenDay(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDay(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openDay]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = dayKey(new Date(e.at));
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    for (const list of map.values()) {
      list.sort((a, z) => new Date(a.at).getTime() - new Date(z.at).getTime());
    }
    return map;
  }, [events]);

  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const monthLabel = view.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = isoWeekday(new Date(year, month, 1)) - 1;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  function toggleDay(key: string, target: HTMLElement) {
    if (openDay?.key === key) {
      setOpenDay(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    // Anchor below the cell, clamped to the viewport's right edge.
    const left = Math.min(
      rect.left,
      window.innerWidth - POPOVER_WIDTH - 8,
    );
    setOpenDay({ key, top: rect.bottom + 6, left: Math.max(8, left) });
  }

  const openEvents = openDay ? (byDay.get(openDay.key) ?? []) : [];
  const openDate = openDay ? new Date(`${openDay.key}T00:00:00`) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMonthOffset((m) => m - 1);
              setOpenDay(null);
            }}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              setMonthOffset(0);
              setOpenDay(null);
            }}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              setMonthOffset((m) => m + 1);
              setOpenDay(null);
            }}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ›
          </button>
        </div>
      </div>

      {/* Month grid */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          {WEEKDAY_HEADERS.map((d) => (
            <span key={d} className="py-2">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`b${i}`}
                  className="min-h-24 border-b border-r border-zinc-100 bg-zinc-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/20"
                />
              );
            }
            const key = dayKey(date);
            const dayEvents = byDay.get(key) ?? [];
            const isToday = date.getTime() === today.getTime();
            const isOpen = openDay?.key === key;

            return (
              <button
                key={key}
                type="button"
                onClick={(e) => toggleDay(key, e.currentTarget)}
                className={`flex min-h-24 flex-col gap-1 border-b border-r border-zinc-100 p-1.5 text-left align-top transition-colors hover:bg-zinc-50 dark:border-zinc-800/70 dark:hover:bg-zinc-900/40 ${
                  isOpen ? "bg-accent/5 dark:bg-accent/10" : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                <span className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`truncate rounded px-1 py-0.5 text-[11px] font-medium ${CHIP[e.status]}`}
                      title={`${time(e.at)} · ${e.title} · ${e.guestName}`}
                    >
                      {time(e.at)} {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[11px] text-zinc-400">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day popover, anchored next to the clicked cell */}
      {openDay && openDate && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenDay(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            style={{ top: openDay.top, left: openDay.left, width: POPOVER_WIDTH }}
            className="fixed z-50 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-background p-3 shadow-xl shadow-zinc-900/10 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {openDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() => setOpenDay(null)}
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {openEvents.length === 0 ? (
              <p className="py-2 text-center text-sm text-zinc-400">
                No appointments this day.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {openEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <Link
                      href={`/host/listings/${e.offeringId}`}
                      className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {time(e.at)} · {e.title}
                    </Link>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {e.guestName}
                    </span>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatMoney(e.priceCents, e.currency)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${BADGE[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
