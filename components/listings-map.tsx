"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OfferingListItem } from "@/lib/offerings";

// Free, keyless map for the split "See all" view — Leaflet + OpenStreetMap,
// same stack as the host onboarding maps (app/host/listings/new/*-map.tsx).
// One price-pill marker per listing with known coordinates, plus a small
// blue dot for the guest's own location when they've shared it.

const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898]; // Casablanca fallback

const USER_DOT_HTML = `<div style="width:16px;height:16px;border-radius:9999px;background:#4f8ef0;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>`;

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function pillHtml(label: string) {
  return `<div style="display:inline-flex;align-items:center;padding:6px 10px;border-radius:9999px;background:#ffffff;color:#171717;border:1px solid rgba(0,0,0,.12);box-shadow:0 1px 4px rgba(0,0,0,.18);font-size:12px;font-weight:600;white-space:nowrap;">${label}</div>`;
}

// The selected listing gets a small photo card instead of a plain price pill,
// so hovering/selecting one in the list surfaces its actual photo on the map.
function tileHtml(item: OfferingListItem): string {
  const price = `$${Math.max(0, Math.round(item.priceCents / 100))}`;
  const image = item.coverImageUrl
    ? `<img src="${escapeAttr(item.coverImageUrl)}" alt="" style="width:100%;height:64px;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:64px;background:#fdebe0;"></div>`;
  return `<div style="width:104px;border-radius:16px;overflow:hidden;background:#fff;border:2px solid #171717;box-shadow:0 6px 16px rgba(0,0,0,.3);">${image}<div style="padding:5px 8px;font-size:12px;font-weight:700;color:#171717;">${price}</div></div>`;
}

export function ListingsMap({
  listings,
  userLocation,
  activeId,
  onSelect,
}: {
  listings: OfferingListItem[];
  userLocation: { lat: number; lng: number } | null;
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView(DEFAULT_CENTER, 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-sync every marker whenever the listing set, user location, or
  // highlighted card changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      if (cancelled || !map) return;

      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();

      const bounds: [number, number][] = [];
      for (const item of listings) {
        if (item.lat == null || item.lng == null) continue;
        const active = item.id === activeId;
        const icon = active
          ? L.divIcon({
              className: "",
              html: tileHtml(item),
              iconSize: [104, 100],
              iconAnchor: [52, 100],
            })
          : L.divIcon({
              className: "",
              html: pillHtml(`$${Math.max(0, Math.round(item.priceCents / 100))}`),
              iconSize: undefined,
              iconAnchor: [24, 14],
            });
        const marker = L.marker([item.lat, item.lng], {
          icon,
          zIndexOffset: active ? 500 : 0,
        }).addTo(map);
        marker.on("click", () => onSelectRef.current?.(item.id));
        markersRef.current.set(item.id, marker);
        bounds.push([item.lat, item.lng]);
      }

      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (userLocation) {
        const icon = L.divIcon({
          className: "",
          html: USER_DOT_HTML,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon,
          zIndexOffset: 1000,
        }).addTo(map);
        bounds.push([userLocation.lat, userLocation.lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds as LatLngBoundsExpression, {
          padding: [40, 40],
          maxZoom: 14,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listings, userLocation, activeId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
