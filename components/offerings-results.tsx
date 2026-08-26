"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchX, LocateFixed, Loader2 } from "lucide-react";
import { ServicesCarousel } from "@/components/services-carousel";
import { OfferingsSkeleton } from "@/components/offerings-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLanguage } from "@/components/language-provider";
import { SERVICE_CATEGORIES } from "@/shared/data/service-categories";
import { EXPERIENCE_CATEGORIES } from "@/shared/data/experience-categories";
import { haversineKm, type LatLng } from "@/lib/geo";
import type { OfferingListItem } from "@/lib/offerings";

export type OfferingFilters = {
  where: string;
  when: string;
  category: string;
};

const UNCATEGORIZED = "Other";

// Each category's row is capped at this many cards when browsing all
// categories at once; the rest are reachable via the row's "See all" card,
// which links to the same page filtered down to just that category (where
// the cap no longer applies, since there's only one section to show).
const MAX_PER_ROW = 6;

type GeoStatus = "idle" | "locating" | "denied" | "unsupported";

/** Offerings within this many km count as "near" the user. */
const NEAR_RADIUS_KM = 50;
/** How many of the nearest listings to show in the row. */
const MAX_NEAR = 8;

/** Build the `/api/offerings` query string from the active filters. */
export function toQueryString(filters: OfferingFilters): string {
  const params = new URLSearchParams();
  if (filters.where) params.set("where", filters.where);
  if (filters.when) params.set("when", filters.when);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

export async function fetchOfferings(
  filters: OfferingFilters,
): Promise<OfferingListItem[]> {
  const qs = toQueryString(filters);
  const res = await fetch(`/api/offerings${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load services");
  return res.json();
}

/**
 * Group offerings by category, ordering sections by the tab's own category set
 * (services vs experiences, or both when no type is selected), then any
 * unrecognized categories, with the catch-all "Other" bucket last.
 */
function groupByCategory(
  results: OfferingListItem[],
  type: "experience" | "service" | null,
): [string, OfferingListItem[]][] {
  const known = (
    type === "experience"
      ? EXPERIENCE_CATEGORIES
      : type === "service"
        ? SERVICE_CATEGORIES
        : [...EXPERIENCE_CATEGORIES, ...SERVICE_CATEGORIES]
  ).map((c) => c.value);
  const knownSet = new Set(known);

  const grouped = new Map<string, OfferingListItem[]>();
  for (const o of results) {
    const cat = o.category?.trim();
    // Only this tab's own categories get their own section. Empty values and
    // any legacy category (e.g. "Wellness") fall into the "Other" bucket.
    const key = cat && knownSet.has(cat) ? cat : UNCATEGORIZED;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(o);
    else grouped.set(key, [o]);
  }

  const order = [
    // "Other" is also a value in the category set, so exclude it here to avoid
    // emitting the section twice — it's appended last below.
    ...known.filter((c) => c !== UNCATEGORIZED && grouped.has(c)),
    ...(grouped.has(UNCATEGORIZED) ? [UNCATEGORIZED] : []),
  ];

  return order.map((category) => [category, grouped.get(category)!]);
}

export function OfferingsResults({
  type,
  filters,
  favoriteIds,
  isAuthenticated,
}: {
  /** Which offering type to show, or `null` to show both. The fetch returns
   *  both; we filter in place. */
  type: "experience" | "service" | null;
  filters: OfferingFilters;
  favoriteIds: string[];
  isAuthenticated: boolean;
}) {
  const { t } = useLanguage();
  const hasFilters = Boolean(filters.where || filters.when || filters.category);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  function findNearMe() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("idle");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  const { data, isPending, isError, refetch } = useQuery({
    // Keyed on the filters so each distinct search is cached independently and
    // served instantly on revisit (back/forward or repeated filters).
    queryKey: ["offerings", filters],
    queryFn: () => fetchOfferings(filters),
  });

  if (isPending) {
    return (
      <>
        <p className="mt-8 h-5 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <OfferingsSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-10 text-center dark:border-orange-900/40 dark:bg-[#1e1a15]">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("home.loadError")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-foreground underline underline-offset-4"
        >
          {t("home.tryAgain")}
        </button>
      </div>
    );
  }

  const results = type ? data.filter((o) => o.type === type) : data;
  const groups = groupByCategory(results, type);

  // Nearest listings within NEAR_RADIUS_KM, closest first. Only offerings
  // with known coordinates (a fixed location or a service area center) can
  // be placed — others are silently excluded rather than guessed at.
  const nearby = coords
    ? results
        .flatMap((o) =>
          o.lat != null && o.lng != null
            ? [{ item: o, km: haversineKm(coords, { lat: o.lat, lng: o.lng }) }]
            : [],
        )
        .filter((r) => r.km <= NEAR_RADIUS_KM)
        .sort((a, b) => a.km - b.km)
        .slice(0, MAX_NEAR)
        .map((r) => r.item)
    : [];

  // Open Saturday or Sunday — offerings with no weekly schedule set yet count
  // too (no schedule means no restriction, same convention the "When" search
  // filter uses).
  const weekendAvailable = results
    .filter(
      (o) =>
        o.availableDays.length === 0 ||
        o.availableDays.includes(6) ||
        o.availableDays.includes(7),
    )
    .slice(0, MAX_NEAR);

  const noun =
    type === "experience"
      ? results.length === 1
        ? t("home.experience")
        : t("home.experiences")
      : type === "service"
        ? results.length === 1
          ? t("home.service")
          : t("home.services")
        : results.length === 1
          ? t("home.result")
          : t("home.results");

  return (
    <>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        {results.length} {noun}{" "}
        {hasFilters ? t("home.matchFilters") : t("home.available")}
      </p>

      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={SearchX} message={t("home.noResults")} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-12">
          {/* Near you — always shown, like any other category section. Its
              content depends on whether we have the user's location yet. */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Near you
            </h2>

            {coords ? (
              nearby.length > 0 ? (
                <ServicesCarousel
                  items={nearby}
                  favoriteIds={favoriteIds}
                  isAuthenticated={isAuthenticated}
                />
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Nothing within {NEAR_RADIUS_KM} km of you yet.
                </p>
              )
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-6 dark:border-orange-900/40 dark:bg-[#1e1a15]">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {geoStatus === "denied"
                    ? "Location access was denied — enable it in your browser settings to see listings near you."
                    : geoStatus === "unsupported"
                      ? "Your browser doesn't support location lookup."
                      : "Turn on your location to see what's bookable nearby."}
                </p>
                <button
                  type="button"
                  onClick={findNearMe}
                  disabled={geoStatus === "locating"}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-50 disabled:pointer-events-none disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
                >
                  {geoStatus === "locating" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
                  ) : (
                    <LocateFixed className="h-4 w-4 text-accent" aria-hidden="true" />
                  )}
                  {geoStatus === "locating" ? "Locating…" : "Use my location"}
                </button>
              </div>
            )}
          </section>

          {/* Available This Weekend — same "always its own section" treatment
              as Near you, just computed straight from the fetched results
              (no extra permission/interaction needed to be useful). */}
          {weekendAvailable.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Available this weekend
              </h2>
              <ServicesCarousel
                items={weekendAvailable}
                favoriteIds={favoriteIds}
                isAuthenticated={isAuthenticated}
              />
            </section>
          )}

          {groups.map(([category, items]) => {
            // Already viewing a single category (via its own "See all" link,
            // or a direct category search) — show everything, no cap/link.
            const capped = !filters.category && items.length > MAX_PER_ROW;
            const visible = capped ? items.slice(0, MAX_PER_ROW) : items;
            const seeAllHref = capped
              ? `/services/browse?${toQueryString({ ...filters, category })}`
              : undefined;

            return (
              <section key={category} className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {category}
                </h2>
                <ServicesCarousel
                  items={visible}
                  favoriteIds={favoriteIds}
                  isAuthenticated={isAuthenticated}
                  seeAllHref={seeAllHref}
                />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
