import { cache } from "react";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  locations,
  offerings,
  providers,
  serviceAreas,
} from "@/db/schema";
import type { LatLng } from "@/lib/geo";

/** A recurring weekly availability window (times as "HH:MM"). */
export type AvailabilityWindow = {
  dayOfWeek: number; // ISO 1 = Monday … 7 = Sunday
  startTime: string;
  endTime: string;
};

/** The offering's recurring weekly availability windows. */
export async function getAvailabilityRules(
  offeringId: string,
): Promise<AvailabilityWindow[]> {
  const rows = await db
    .select({
      dayOfWeek: availabilityRules.dayOfWeek,
      startTime: availabilityRules.startTime,
      endTime: availabilityRules.endTime,
    })
    .from(availabilityRules)
    .where(eq(availabilityRules.offeringId, offeringId))
    .orderBy(asc(availabilityRules.dayOfWeek));
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime.slice(0, 5),
    endTime: r.endTime.slice(0, 5),
  }));
}

export type OfferingCard = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  type: "service" | "experience";
  priceCents: number;
  currency: string;
  durationMinutes: number;
  coverImageUrl: string | null;
};

/** A search result row, including the host's display name and — when known
 *  — its coordinates (fixed location for at-host offerings, service-area
 *  center for at-guest ones), used for "near me" distance sorting. */
export type OfferingListItem = OfferingCard & {
  hostName: string;
  lat: number | null;
  lng: number | null;
  /** ISO weekdays (1 Mon … 7 Sun) with a recurring availability window.
   *  Empty means no weekly schedule is set yet — treated as always open,
   *  same convention as the "When" filter below. Used for "this weekend". */
  availableDays: number[];
};

export type OfferingSearchFilters = {
  /** Free-text match on the service title. */
  q?: string;
  /** Free-text match on the host's display name. */
  host?: string;
  /** Price bounds in major units (USD), inclusive. */
  minPrice?: number;
  maxPrice?: number;
  /** "Where" — broad match on location (city/region/country), title, or host. */
  where?: string;
  /** "When" — a date (YYYY-MM-DD); narrows to listings open that weekday. */
  date?: string;
  /** "What" — exact category match (e.g. "Food and drink"). */
  category?: string;
};

/** ISO-8601 weekday (1 = Monday … 7 = Sunday) for a "YYYY-MM-DD" date. */
function isoWeekday(date: string): number {
  const js = new Date(`${date}T00:00:00`).getDay();
  return js === 0 ? 7 : js;
}

/** All published offerings matching the given filters, newest first. */
export async function searchOfferings(
  filters: OfferingSearchFilters,
): Promise<OfferingListItem[]> {
  const conditions: SQL[] = [eq(offerings.status, "published")];

  if (filters.q) {
    conditions.push(ilike(offerings.title, `%${filters.q}%`));
  }
  if (filters.host) {
    conditions.push(ilike(providers.displayName, `%${filters.host}%`));
  }
  if (filters.minPrice != null) {
    conditions.push(gte(offerings.priceCents, Math.round(filters.minPrice * 100)));
  }
  if (filters.maxPrice != null) {
    conditions.push(lte(offerings.priceCents, Math.round(filters.maxPrice * 100)));
  }

  // "Where" — a single box that matches a place or a keyword.
  if (filters.where) {
    const term = `%${filters.where}%`;
    conditions.push(
      or(
        ilike(offerings.title, term),
        ilike(offerings.category, term),
        ilike(locations.city, term),
        ilike(locations.region, term),
        ilike(locations.country, term),
        ilike(providers.displayName, term),
      )!,
    );
  }

  // "What" — exact category match.
  if (filters.category) {
    conditions.push(eq(offerings.category, filters.category));
  }

  // "When" — listings open on that weekday, or with no weekly schedule set yet
  // (treated as always-bookable, so they aren't hidden).
  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    const dow = isoWeekday(filters.date);
    const openThatDay = db
      .select({ id: availabilityRules.offeringId })
      .from(availabilityRules)
      .where(eq(availabilityRules.dayOfWeek, dow));
    const hasSchedule = db
      .select({ id: availabilityRules.offeringId })
      .from(availabilityRules);
    conditions.push(
      or(
        inArray(offerings.id, openThatDay),
        notInArray(offerings.id, hasSchedule),
      )!,
    );
  }

  const rows = await db
    .select({
      id: offerings.id,
      title: offerings.title,
      description: offerings.description,
      category: offerings.category,
      type: offerings.type,
      priceCents: offerings.priceCents,
      currency: offerings.currency,
      durationMinutes: offerings.durationMinutes,
      coverImageUrl: offerings.coverImageUrl,
      hostName: providers.displayName,
      // Fixed location, for at-host offerings. At-guest (mobile) offerings
      // have no row here — their coordinates come from serviceAreas below.
      lat: locations.lat,
      lng: locations.lng,
    })
    .from(offerings)
    .innerJoin(providers, eq(offerings.providerId, providers.id))
    .leftJoin(locations, eq(offerings.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(offerings.createdAt));

  // Fill in coordinates for at-guest offerings from their service area's
  // center. Looked up separately (rather than joined) since an offering can
  // have more than one service area, which would otherwise duplicate rows.
  const missingIds = rows.filter((r) => r.lat == null).map((r) => r.id);
  if (missingIds.length > 0) {
    const areas = await db
      .select({
        offeringId: serviceAreas.offeringId,
        lat: serviceAreas.centerLat,
        lng: serviceAreas.centerLng,
      })
      .from(serviceAreas)
      .where(inArray(serviceAreas.offeringId, missingIds));
    const centerById = new Map(areas.map((a) => [a.offeringId, a]));
    for (const row of rows) {
      if (row.lat != null) continue;
      const center = centerById.get(row.id);
      if (center) {
        row.lat = center.lat;
        row.lng = center.lng;
      }
    }
  }

  // Weekly availability, for "this weekend" and similar client-side day
  // filters — one batched query rather than a join, since an offering can
  // have several weekday rules (which would otherwise duplicate rows).
  const allIds = rows.map((r) => r.id);
  const daysById = new Map<string, number[]>();
  if (allIds.length > 0) {
    const rules = await db
      .select({
        offeringId: availabilityRules.offeringId,
        dayOfWeek: availabilityRules.dayOfWeek,
      })
      .from(availabilityRules)
      .where(inArray(availabilityRules.offeringId, allIds));
    for (const r of rules) {
      const days = daysById.get(r.offeringId);
      if (days) days.push(r.dayOfWeek);
      else daysById.set(r.offeringId, [r.dayOfWeek]);
    }
  }

  return rows.map((row) => ({
    ...row,
    availableDays: daysById.get(row.id) ?? [],
  }));
}

/** Published offerings for the public landing page, newest first. */
export async function getPublishedOfferings(limit = 6): Promise<OfferingCard[]> {
  return db
    .select({
      id: offerings.id,
      title: offerings.title,
      description: offerings.description,
      category: offerings.category,
      type: offerings.type,
      priceCents: offerings.priceCents,
      currency: offerings.currency,
      durationMinutes: offerings.durationMinutes,
      coverImageUrl: offerings.coverImageUrl,
    })
    .from(offerings)
    .where(eq(offerings.status, "published"))
    .orderBy(desc(offerings.createdAt))
    .limit(limit);
}

/** Minimal published-offering rows for the sitemap (public detail pages). */
export async function getOfferingsForSitemap(): Promise<
  { id: string; updatedAt: Date }[]
> {
  return db
    .select({ id: offerings.id, updatedAt: offerings.updatedAt })
    .from(offerings)
    .where(eq(offerings.status, "published"))
    .orderBy(desc(offerings.updatedAt));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A single offering by id, with its provider. Returns `undefined` for an
 * unknown id or a non-UUID string (so callers can 404 without the DB throwing
 * on an invalid uuid input).
 */
export const getOfferingById = cache(async function getOfferingById(
  id: string,
) {
  if (!UUID_RE.test(id)) return undefined;
  return db.query.offerings.findFirst({
    where: eq(offerings.id, id),
    with: {
      // `userId` is used server-side to detect when the viewer is the host.
      provider: {
        columns: {
          id: true,
          userId: true,
          displayName: true,
          isVerified: true,
          avatarUrl: true,
          bio: true,
        },
      },
      // Fixed location (at-host offerings) for the detail-page map.
      location: true,
      // Photo gallery, ordered — the detail-page cover carousel shows the covers.
      media: {
        columns: { url: true, isCover: true, position: true },
        orderBy: (media, { asc }) => [asc(media.position)],
      },
    },
  });
});

export type OfferingDetail = NonNullable<
  Awaited<ReturnType<typeof getOfferingById>>
>;

/**
 * The point an at_guest host travels from plus their chosen max travel time
 * (minutes), or null if the travel-from point isn't set.
 */
export async function getServiceAreaCenter(
  offeringId: string,
): Promise<(LatLng & { maxTravelMinutes: number }) | null> {
  const [row] = await db
    .select({
      lat: serviceAreas.centerLat,
      lng: serviceAreas.centerLng,
      maxTravelMinutes: serviceAreas.maxTravelMinutes,
    })
    .from(serviceAreas)
    .where(eq(serviceAreas.offeringId, offeringId))
    .limit(1);
  if (!row || row.lat == null || row.lng == null) return null;
  return { lat: row.lat, lng: row.lng, maxTravelMinutes: row.maxTravelMinutes };
}

/** Format integer minor units + ISO currency into a display string, e.g. "$100". */
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Minutes → "60 min" / "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}
