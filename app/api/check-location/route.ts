import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOfferingById, getServiceAreaCenter } from "@/lib/offerings";
import {
  haversineKm,
  isWithinTravelLimit,
  travelHoursForKm,
} from "@/lib/geo";
import { tryCatch } from "@/shared/utils/TryCatch";

// Confirms whether a guest's location is within an at_guest host's travel
// limit — used by the booking modal as a step before payment.
export async function POST(request: Request) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok || !sessionResult.data?.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await tryCatch(
    request.json() as Promise<{
      serviceId?: string;
      guestLat?: number;
      guestLng?: number;
    }>,
  );
  if (!body.ok) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { serviceId, guestLat, guestLng } = body.data;
  if (
    !serviceId ||
    typeof guestLat !== "number" ||
    typeof guestLng !== "number" ||
    !Number.isFinite(guestLat) ||
    !Number.isFinite(guestLng)
  ) {
    return NextResponse.json({ error: "Share a valid location." }, { status: 400 });
  }

  const offering = await getOfferingById(serviceId);
  if (!offering) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  if (offering.locationType !== "at_guest") {
    return NextResponse.json({ valid: true, reason: "not_required" });
  }

  const origin = await getServiceAreaCenter(serviceId);
  if (!origin) {
    console.log(
      "[check-location] host travel-from point not set — cannot verify, allowing.",
    );
    return NextResponse.json({ valid: true, reason: "host_location_unset" });
  }

  const km = haversineKm(origin, { lat: guestLat, lng: guestLng });
  const minutes = Math.round(travelHoursForKm(km) * 60);
  const valid = isWithinTravelLimit(
    origin,
    { lat: guestLat, lng: guestLng },
    origin.maxTravelMinutes,
  );

  console.log(
    `[check-location] guest ~${minutes} min (${km.toFixed(
      1,
    )} km) away; host max ${origin.maxTravelMinutes} min → ${
      valid ? "VALID" : "TOO FAR"
    }.`,
  );

  return NextResponse.json({
    valid,
    reason: valid ? "within_range" : "outside_travel_range",
    travelMinutes: minutes,
    maxTravelMinutes: origin.maxTravelMinutes,
    host: { lat: origin.lat, lng: origin.lng },
  });
}
