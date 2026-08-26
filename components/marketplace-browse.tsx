"use client";

import {
  OfferingsResults,
  type OfferingFilters,
} from "@/components/offerings-results";

/**
 * Lays out the marketplace: just the results. The search bar itself lives in
 * the hero above this (see /services page).
 */
export function MarketplaceBrowse({
  filters,
  favoriteIds,
  isAuthenticated,
}: {
  filters: OfferingFilters;
  favoriteIds: string[];
  isAuthenticated: boolean;
}) {
  return (
    <OfferingsResults
      type={null}
      filters={filters}
      favoriteIds={favoriteIds}
      isAuthenticated={isAuthenticated}
    />
  );
}
