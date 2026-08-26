import type { AvailabilityWindow } from "@/lib/offerings";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidDate = (d: string) => DATE_RE.test(d);
export const isValidTime = (t: string) => TIME_RE.test(t);

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** ISO-8601 weekday (1 = Monday … 7 = Sunday) for a "YYYY-MM-DD" date. */
export function isoWeekday(date: string): number {
  const js = new Date(`${date}T00:00:00`).getDay();
  return js === 0 ? 7 : js;
}

export type AvailabilityCheck =
  | { ok: true; appointmentAt: Date }
  | { ok: false; reason: string };

export function checkAvailability(
  date: string,
  time: string,
  durationMinutes: number,
  rules: AvailabilityWindow[],
): AvailabilityCheck {
  if (!isValidDate(date) || !isValidTime(time)) {
    return { ok: false, reason: "Provide a valid date (YYYY-MM-DD) and time (HH:MM)." };
  }
  const rule = rules.find((r) => r.dayOfWeek === isoWeekday(date));
  if (!rule) {
    return { ok: false, reason: "The host isn't available on that weekday." };
  }
  const startMin = toMinutes(time);
  if (
    startMin < toMinutes(rule.startTime) ||
    startMin + durationMinutes > toMinutes(rule.endTime)
  ) {
    return { ok: false, reason: "That time is outside the offering's availability." };
  }
  const appointmentAt = new Date(`${date}T${time}:00`);
  if (appointmentAt.getTime() <= Date.now()) {
    return { ok: false, reason: "Choose a time in the future." };
  }
  return { ok: true, appointmentAt };
}
