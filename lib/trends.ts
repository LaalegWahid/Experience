// Shared daily-bucketing helpers for admin trend charts (user growth,
// reservations, revenue). Kept dependency-free so both lib/admin.ts and
// lib/transactions.ts can use it without a circular import.

export type TrendPoint = { date: string; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/** The last `days` UTC calendar dates (YYYY-MM-DD), oldest first, ending today. */
export function dailyBuckets(days: number): string[] {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Array.from({ length: days }, (_, i) =>
    new Date(todayUtc - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}

/** Cutoff timestamp for a `days`-long window ending today, for a `gte` filter. */
export function trendCutoff(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/** Bucket a list of timestamps into daily counts across the trailing `days` window. */
export function bucketCounts(dates: Date[], days: number): TrendPoint[] {
  const buckets = dailyBuckets(days);
  const counts = new Map(buckets.map((d) => [d, 0]));
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((date) => ({ date, value: counts.get(date) ?? 0 }));
}
