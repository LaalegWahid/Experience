import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getBookingForUser } from "@/lib/bookings";
import { serializeBookingRow } from "@/lib/api-serializers";

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/v1/bookings/{id} — a single booking owned by the caller.
export async function GET(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  if (!UUID_RE.test(id)) return apiError(404, "Booking not found.", "not_found");
  const booking = await getBookingForUser(actor.user.id, id);
  if (!booking) return apiError(404, "Booking not found.", "not_found");

  return apiOk(serializeBookingRow(booking));
}
