"use client";

import { useEffect, useRef } from "react";
import type { Circle, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

// A free, keyless service-area map: Leaflet + OpenStreetMap tiles, with a real
// map circle (radius in meters) that's anchored to the geography — so it follows
// zoom/pan and sits under the labels, unlike a CSS overlay. Geocoding the typed
// location uses OpenStreetMap's Nominatim (also free, no key).

const ACCENT = "#be6140";
// Fallback centre (Casablanca) until the location geocodes.
const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898];

const HOME_PIN_HTML = `
<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#171717;color:#fff;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)">
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
</div>`;

export function ServiceAreaMap({
  location,
  radiusKm,
}: {
  location: string;
  radiusKm: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const centerRef = useRef<[number, number]>(DEFAULT_CENTER);
  const radiusRef = useRef(radiusKm);
  radiusRef.current = radiusKm;

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView(centerRef.current, 9);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: HOME_PIN_HTML,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      markerRef.current = L.marker(centerRef.current, { icon }).addTo(map);
      circleRef.current = L.circle(centerRef.current, {
        radius: radiusRef.current * 1000,
        color: ACCENT,
        weight: 2,
        fillColor: ACCENT,
        fillOpacity: 0.18,
      }).addTo(map);

      mapRef.current = map;
      // The modal animates in; make sure Leaflet measures the final size.
      setTimeout(() => {
        map.invalidateSize();
        if (circleRef.current) {
          map.fitBounds(circleRef.current.getBounds(), { padding: [24, 24] });
        }
      }, 60);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Geocode the typed location (debounced) and recentre.
  useEffect(() => {
    const q = location.trim();
    if (!q) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        );
        const data = (await res.json()) as { lat: string; lon: string }[];
        if (!data?.[0]) return;
        const center: [number, number] = [
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ];
        centerRef.current = center;
        markerRef.current?.setLatLng(center);
        circleRef.current?.setLatLng(center);
        if (mapRef.current && circleRef.current) {
          mapRef.current.fitBounds(circleRef.current.getBounds(), {
            padding: [24, 24],
          });
        }
      } catch {
        // Network/geocoding hiccup — keep the last known centre.
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [location]);

  // Resize the circle when the drive time changes, and reframe to fit it.
  useEffect(() => {
    if (!circleRef.current || !mapRef.current) return;
    circleRef.current.setRadius(radiusKm * 1000);
    mapRef.current.fitBounds(circleRef.current.getBounds(), {
      padding: [24, 24],
    });
  }, [radiusKm]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
