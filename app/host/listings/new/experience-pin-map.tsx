"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// "Is the pin in the right spot?" — a free Leaflet + OpenStreetMap map with a
// fixed centre pin; the host drags the map under it, exactly like Airbnb. The
// pin's coordinate is always the map centre, reported on every move.

const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898]; // Casablanca

export function ExperiencePinMap({
  lat,
  lon,
  onMove,
}: {
  lat?: number;
  lon?: number;
  onMove?: (lat: number, lon: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // Initialise once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const center: [number, number] =
        typeof lat === "number" && typeof lon === "number"
          ? [lat, lon]
          : DEFAULT_CENTER;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView(center, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      map.on("moveend", () => {
        const c = map.getCenter();
        onMoveRef.current?.(c.lat, c.lng);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Init once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when the confirmed address changes upstream.
  useEffect(() => {
    if (mapRef.current && typeof lat === "number" && typeof lon === "number") {
      mapRef.current.setView([lat, lon], 15);
    }
  }, [lat, lon]);

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-2xl" />
      {/* Fixed centre pin (the map moves under it). */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-foreground shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white">
        Drag the map to reposition the pin
      </div>
    </div>
  );
}
