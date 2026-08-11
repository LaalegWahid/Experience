import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getAvailabilityRules, getOfferingById } from "@/lib/offerings";
import { checkAvailability } from "@/lib/availability";

// Keep in sync with the web checkout fee.
const SERVICE_FEE_RATE = 0.2;
const QUOTE_TTL_MS = 15 * 60 * 1000;

const quoteSchema = z.object({
  offeringId: z.string(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
});

// POST /api/v1/quotes — a stateless price + availability quote (brief step 3).
export async function POST(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const body = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(422, "Provide offeringId, date and time.", "validation_error");
  }
  const { offeringId, date, time } = parsed.data;

  const offering = await getOfferingById(offeringId);
  if (!offering || offering.status !== "published") {
    return apiError(404, "Offering not found.", "not_found");
  }

  const rules = await getAvailabilityRules(offering.id);
  const check = checkAvailability(date, time, offering.durationMinutes, rules);
  if (!check.ok) return apiError(409, check.reason, "unavailable");

  const basePriceCents = offering.priceCents;
  const serviceFeeCents = Math.round(basePriceCents * SERVICE_FEE_RATE);

  return apiOk({
    offeringId: offering.id,
    appointmentAt: check.appointmentAt,
    durationMinutes: offering.durationMinutes,
    basePriceCents,
    serviceFeeCents,
    totalCents: basePriceCents + serviceFeeCents,
    currency: offering.currency,
    available: true,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
  });
}
