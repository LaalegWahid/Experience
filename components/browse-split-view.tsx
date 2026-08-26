"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SearchX, LocateFixed, Loader2 } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { ListingsMap } from "@/components/listings-map";
import { OfferingsSkeleton } from "@/components/offerings-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  fetchOfferings,
  type OfferingFilters,
} from "@/components/offerings-results";
import { formatMoney } from "@/shared/utils/money";
import type { OfferingListItem } from "@/lib/offerings";

// Local copy of lib/offerings' formatDuration — that module pulls in the db,
// so it can't be imported into a client component (see services-carousel.tsx).
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

type GeoStatus = "idle" | "locating" | "denied" | "unsupported";

function ListingRow({
  item,
  active,
  favorited,
  isAuthenticated,
  onHover,
}: {
  item: OfferingListItem;
  active: boolean;
  favorited: boolean;
  isAuthenticated: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <article
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex gap-4 rounded-2xl p-2 transition-colors ${
        active ? "bg-[#fff7f1] dark:bg-white/5" : ""
      }`}
    >
      <Link
        href={`/services/${item.id}`}
        className="relative block h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900"
      >
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium text-zinc-400">
            {item.category ?? item.type}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-medium text-foreground">
            <Link href={`/services/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          </h3>
          <FavoriteButton
            offeringId={item.id}
            isAuthenticated={isAuthenticated}
            initialFavorited={favorited}
          />
        </div>
        {item.category && (
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {item.category}
          </p>
        )}
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          Hosted by {item.hostName}
        </p>
        <p className="mt-auto pt-1 text-sm text-foreground">
          <span className="font-semibold">
            {formatMoney(item.priceCents, item.currency)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {" · "}
            {formatDuration(item.durationMinutes)}
          </span>
        </p>
      </div>
    </article>
  );
}

/**
 * The "See all" destination: a two-pane layout instead of the homepage's
 * grouped carousels — a scrollable list on the left, a map on the right
 * plotting every listing with known coordinates plus the guest's own
 * location (once shared). Hovering a row highlights its pin and vice versa.
 */
export function BrowseSplitView({
  filters,
  favoriteIds,
  isAuthenticated,
}: {
  filters: OfferingFilters;
  favoriteIds: string[];
  isAuthenticated: boolean;
}) {
  const favSet = new Set(favoriteIds);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  function findMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("idle");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["offerings", filters],
    queryFn: () => fetchOfferings(filters),
  });

  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
      {/* Map — a fixed-height preview above the list on phones/tablets (no
          side-by-side room below lg), full sticky column on desktop. Order
          flips so mobile sees the map first, desktop sees list-left/map-right. */}
      <div className="h-64 shrink-0 sm:h-80 lg:order-2 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16">
        <ListingsMap
          listings={data ?? []}
          userLocation={userLocation}
          activeId={hoveredId}
          onSelect={setHoveredId}
        />
      </div>

      {/* Left (desktop) / below the map (mobile): the listing list. */}
      <div className="flex flex-col gap-4 px-6 py-6 lg:order-1 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-foreground">
            {filters.category || "All listings"}
          </h1>
          <button
            type="button"
            onClick={findMyLocation}
            disabled={geoStatus === "locating"}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:hover:bg-zinc-900"
          >
            {geoStatus === "locating" ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
            ) : (
              <LocateFixed className="h-4 w-4 text-accent" aria-hidden="true" />
            )}
            {userLocation ? "Update my location" : "Show my location"}
          </button>
        </div>
        {geoStatus === "denied" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Location access was denied — enable it in your browser settings.
          </p>
        )}
        {geoStatus === "unsupported" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your browser doesn&apos;t support location lookup.
          </p>
        )}

        {isPending ? (
          <OfferingsSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-10 text-center dark:border-orange-900/40 dark:bg-[#1e1a15]">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Something went wrong loading these listings.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-medium text-foreground underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : data.length === 0 ? (
          <EmptyState icon={SearchX} message="No listings match these filters yet." />
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((item) => (
              <ListingRow
                key={item.id}
                item={item}
                active={item.id === hoveredId}
                favorited={favSet.has(item.id)}
                isAuthenticated={isAuthenticated}
                onHover={setHoveredId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
