import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { cancelBooking, getBookingForUser } from "@/lib/bookings";
import { serializeBookingRow } from "@/lib/api-serializers";

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/v1/bookings/{id}/cancel — cancel the caller's own booking.
export async function POST(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  if (!UUID_RE.test(id)) return apiError(404, "Booking not found.", "not_found");

  const booking = await getBookingForUser(actor.user.id, id);
  if (!booking) return apiError(404, "Booking not found.", "not_found");

  await cancelBooking(actor.user.id, id);
  const updated = await getBookingForUser(actor.user.id, id);
  return apiOk(
    updated ? serializeBookingRow(updated) : { id, status: "canceled" },
  );
}
