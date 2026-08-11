import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getAvailabilityRules, getOfferingById } from "@/lib/offerings";
import { checkAvailability } from "@/lib/availability";
import {
  cancelBooking,
  createBooking,
  getUserBookings,
  recordX402Payment,
} from "@/lib/bookings";
import { recordTransaction } from "@/lib/transactions";
import { SERVICE_FEE_RATE } from "@/shared/utils/fees";
import { tryCatch } from "@/shared/utils/TryCatch";
import {
  buildRequirements,
  centsToUsdcAtomic,
  decodePaymentHeader,
  paymentRequired,
  paymentResponseHeader,
  settlePayment,
  verifyPayment,
  x402Config,
} from "@/lib/x402";
import {
  serializeBookingRow,
  serializeBookingView,
} from "@/lib/api-serializers";

const bookingSchema = z.object({
  offeringId: z.string(),
  date: z.string(),
  time: z.string(),
});

// GET /api/v1/bookings — the caller's own bookings.
export async function GET(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const bookings = await getUserBookings(actor.user.id);
  return apiOk(bookings.map(serializeBookingView));
}

// POST /api/v1/bookings — book an offering at a time. When x402 is configured
// the caller must pay first: a payment-less request returns HTTP 402 with the
// payment requirements, and the retry must carry a valid `X-PAYMENT` header
// (USDC via the x402 protocol). Without x402 config it books for free, as before.
export async function POST(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
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

  const newBooking = {
    userId: actor.user.id,
    offeringId: offering.id,
    appointmentAt: check.appointmentAt,
    priceCents: offering.priceCents,
    currency: offering.currency,
  };

  const x402 = x402Config();
  if (x402) {
    // The agent pays the base price plus the service fee, in USDC.
    const totalCents =
      offering.priceCents + Math.round(offering.priceCents * SERVICE_FEE_RATE);
    const url = new URL(request.url);
    const requirements = buildRequirements(x402, {
      resource: `${url.origin}${url.pathname}`,
      description: `Booking: ${offering.title}`,
      amountAtomic: centsToUsdcAtomic(totalCents),
    });

    // No proof of payment yet → challenge the caller with HTTP 402.
    const payment = decodePaymentHeader(request.headers.get("x-payment"));
    if (!payment) {
      return paymentRequired(requirements, "X-PAYMENT header is required.");
    }

    // Verify the signature/funds before reserving anything (no funds move yet).
    const verify = await verifyPayment(x402, payment, requirements);
    if (!verify.isValid) {
      return paymentRequired(
        requirements,
        verify.invalidReason ?? "Payment verification failed.",
      );
    }

    // Reserve the slot, then settle on-chain. If settlement fails, release it
    // so we never hold a slot we didn't get paid for.
    const [booking] = await createBooking(newBooking);
    const settle = await settlePayment(x402, payment, requirements);
    if (!settle.success) {
      await cancelBooking(actor.user.id, booking.id);
      return paymentRequired(
        requirements,
        settle.errorReason ?? "Payment settlement failed.",
      );
    }

    await recordX402Payment(booking.id, settle.transaction ?? null);

    // Mirror the settled USDC payment into the unified ledger for the admin.
    await tryCatch(
      recordTransaction({
        userId: actor.user.id,
        offeringId: offering.id,
        bookingId: booking.id,
        method: "crypto",
        status: "succeeded",
        amountCents: totalCents,
        currency: offering.currency,
        reference: settle.transaction ?? null,
        network: settle.network ?? x402.network,
      }),
    );

    const response = apiOk(serializeBookingRow(booking), 201);
    response.headers.set("X-PAYMENT-RESPONSE", paymentResponseHeader(settle));
    return response;
  }

  // x402 not configured — record the booking immediately, as before.
  const [booking] = await createBooking(newBooking);
  return apiOk(serializeBookingRow(booking), 201);
}
