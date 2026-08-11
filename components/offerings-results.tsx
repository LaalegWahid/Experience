"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { ServicesCarousel } from "@/components/services-carousel";
import { OfferingsSkeleton } from "@/components/offerings-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLanguage } from "@/components/language-provider";
import { SERVICE_CATEGORIES } from "@/shared/data/service-categories";
import { EXPERIENCE_CATEGORIES } from "@/shared/data/experience-categories";
import type { OfferingListItem } from "@/lib/offerings";

export type OfferingFilters = {
  where: string;
  when: string;
  category: string;
};

const UNCATEGORIZED = "Other";

/** Build the `/api/offerings` query string from the active filters. */
function toQueryString(filters: OfferingFilters): string {
  const params = new URLSearchParams();
  if (filters.where) params.set("where", filters.where);
  if (filters.when) params.set("when", filters.when);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

async function fetchOfferings(
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
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center dark:border-zinc-700">
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
          {groups.map(([category, items]) => (
            <section key={category} className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {category}
              </h2>
              <ServicesCarousel
                items={items}
                favoriteIds={favoriteIds}
                isAuthenticated={isAuthenticated}
              />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
