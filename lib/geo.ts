// Geospatial helpers for the "host travels to the guest" (at_guest) flow.
// We have no routing provider, so we approximate travel time from the
// straight-line (haversine) distance and an assumed average speed.

const EARTH_RADIUS_KM = 6371;

/** Assumed average travel speed (km/h) used to turn distance into time. */
export const AVG_SPEED_KMH = 60;

/** Hard ceiling on how far a host can choose to travel. */
export const MAX_TRAVEL_HOURS = 2;
export const MAX_TRAVEL_MINUTES = MAX_TRAVEL_HOURS * 60;

export type LatLng = { lat: number; lng: number };

/** Great-circle distance between two points, in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Approximate travel time (hours) for a straight-line distance in km. */
export function travelHoursForKm(km: number): number {
  return km / AVG_SPEED_KMH;
}

/**
 * Whether a guest is within the host's chosen max travel time of an origin.
 * The host's value is always clamped to the platform ceiling (2 hours).
 */
export function isWithinTravelLimit(
  origin: LatLng,
  guest: LatLng,
  maxMinutes: number = MAX_TRAVEL_MINUTES,
): boolean {
  const cap = Math.min(maxMinutes, MAX_TRAVEL_MINUTES);
  const minutes = travelHoursForKm(haversineKm(origin, guest)) * 60;
  return minutes <= cap;
}
