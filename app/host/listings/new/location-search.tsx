"use client";

import { useEffect, useState } from "react";

// Free, keyless address autocomplete + reverse geocoding via OpenStreetMap's
// Nominatim (already used by service-area-map.tsx). Debounced and limited to a
// few results to stay within Nominatim's usage policy.

export type GeoPlace = {
  /** Primary line (e.g. "Casablanca" or a street). */
  label: string;
  /** Secondary line (e.g. "Casablanca, Morocco"). */
  sub?: string;
  street?: string;
  city?: string;
  postal?: string;
  country?: string;
  lat: number;
  lon: number;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
};

function toPlace(r: NominatimResult): GeoPlace {
  const a = r.address ?? {};
  const city =
    a.city || a.town || a.village || a.municipality || a.county || "";
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const primary =
    r.name || street || city || r.display_name.split(",")[0]?.trim() || "";
  const sub = r.display_name.split(",").slice(1).join(",").trim();
  return {
    label: primary,
    sub,
    street: street || undefined,
    city: city || undefined,
    postal: a.postcode || undefined,
    country: a.country || undefined,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  };
}

/** Debounced address/city suggestions for the typed query. */
export function useGeoSuggestions(query: string) {
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: "json",
          addressdetails: "1",
          limit: "6",
          q,
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { headers: { Accept: "application/json" } },
        );
        const data = (await res.json()) as NominatimResult[];
        setResults(Array.isArray(data) ? data.map(toPlace) : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  return { results, loading };
}

/** Reverse-geocode a coordinate into an address (for "Use my current location"). */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<GeoPlace | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json" } },
    );
    const r = (await res.json()) as NominatimResult;
    return r?.lat ? toPlace(r) : null;
  } catch {
    return null;
  }
}

export function PinGlyph({ className = "h-5 w-5 text-zinc-400" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * A search box with live address suggestions (and optionally "Use my current
 * location"). Used by the experience onboarding city modal and the listing
 * "Where should guests meet you?" step. Calls `onSelect` with the chosen place.
 */
export function LocationSearchPanel({
  placeholder = "Enter a city",
  showCurrentLocation = false,
  autoFocus = false,
  cityMode = false,
  onSelect,
}: {
  placeholder?: string;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
  /** Show a city-style row (name + country) instead of a full address. */
  cityMode?: boolean;
  onSelect: (place: GeoPlace) => void;
}) {
  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const { results, loading } = useGeoSuggestions(q);

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const place = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setLocating(false);
        if (place) onSelect(place);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-300 px-4 py-3.5 focus-within:border-foreground dark:border-zinc-700">
        <SearchGlyph />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-zinc-400"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear"
            className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="mt-2">
        {showCurrentLocation && q.length < 2 && (
          <button
            type="button"
            onClick={useCurrentLocation}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z" /></svg>
            </span>
            <span className="text-sm font-medium text-foreground">
              {locating ? "Locating…" : "Use my current location"}
            </span>
          </button>
        )}

        {q.length >= 2 && (
          <>
            <p className="px-2 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {loading ? "Searching…" : "Suggested"}
            </p>
            {results.map((p, i) => {
              const primary = cityMode ? p.city || p.label : p.label;
              const secondary = cityMode ? p.country : p.sub;
              return (
                <button
                  key={`${p.lat}-${p.lon}-${i}`}
                  type="button"
                  onClick={() => onSelect(p)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <PinGlyph className="h-5 w-5 text-foreground" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-medium text-foreground">{primary}</span>
                    {secondary && (
                      <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">{secondary}</span>
                    )}
                  </span>
                </button>
              );
            })}
            {!loading && results.length === 0 && (
              <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">No matches found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Inline suggestions dropdown anchored under a text field (used for the
 * residential "Street address" input). Renders nothing until there are results.
 */
export function InlineSuggestions({
  query,
  onPick,
  onDismiss,
}: {
  query: string;
  onPick: (place: GeoPlace) => void;
  onDismiss: () => void;
}) {
  const { results, loading } = useGeoSuggestions(query);
  if (query.trim().length < 2 || (!loading && results.length === 0)) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-xl dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {loading ? "Searching…" : "Suggestions"}
        </span>
        <button type="button" onClick={onDismiss} className="text-sm font-medium text-foreground underline-offset-2 hover:underline">
          Dismiss
        </button>
      </div>
      {results.map((p, i) => (
        <button
          key={`${p.lat}-${p.lon}-${i}`}
          type="button"
          onClick={() => onPick(p)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <PinGlyph className="h-5 w-5 text-foreground" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{p.label}</span>
            {p.sub && <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{p.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
