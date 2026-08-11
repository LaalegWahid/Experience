"use client";

import { useState } from "react";

/**
 * Captures a lat/lng via the browser's geolocation API into two hidden form
 * inputs. Used by hosts to set the point they travel from for at_guest
 * services (so we can cap bookings beyond ~2 hours away).
 */
export function LocationCapture({
  latName,
  lngName,
  defaultLat,
  defaultLng,
}: {
  latName: string;
  lngName: string;
  defaultLat?: string;
  defaultLng?: string;
}) {
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function detect() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available in this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLoading(false);
      },
      () => {
        setError("Couldn't get your location. Allow access and try again.");
        setLoading(false);
      },
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={latName} value={coords?.lat ?? ""} />
      <input type="hidden" name={lngName} value={coords?.lng ?? ""} />
      <button
        type="button"
        onClick={detect}
        disabled={loading}
        className="flex w-fit items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        📍 {loading ? "Locating…" : coords ? "Update location" : "Use my current location"}
      </button>
      {coords && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Travel-from point set ({coords.lat}, {coords.lng})
        </span>
      )}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
