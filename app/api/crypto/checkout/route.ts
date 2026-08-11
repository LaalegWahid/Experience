import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getAvailabilityRules,
  getOfferingById,
  getServiceAreaCenter,
} from "@/lib/offerings";
import { isWithinTravelLimit } from "@/lib/geo";
import { getMenuItems } from "@/lib/menu";
import { checkAvailability } from "@/lib/availability";
import { createBooking, recordX402Payment } from "@/lib/bookings";
import { recordTransaction } from "@/lib/transactions";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SERVICE_FEE_RATE, referralEarningCents } from "@/shared/utils/fees";
import {
  createReferralEarning,
  redeemServiceReferral,
  SERVICE_REFERRAL_COOKIE,
} from "@/lib/referrals";

// Records an on-page USDC (crypto) payment after the guest's wallet has sent
// the transfer. The transfer itself happens client-side (wallet → recipient);
// this endpoint validates the appointment with trusted server data, creates the
// booking, and writes the payment to the unified ledger so admins/hosts see it.
// The amount is always recomputed server-side — never trusted from the client.
export async function POST(request: Request) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) {
    console.error("[crypto checkout] failed:", sessionResult.error);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }
  const session = sessionResult.data;
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const bodyResult = await tryCatch(
    request.json() as Promise<{
      serviceId?: string;
      date?: string;
      time?: string;
      menuItemId?: string;
      guestLat?: number;
      guestLng?: number;
      txHash?: string;
      network?: string;
    }>,
  );
  if (!bodyResult.ok) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { serviceId, date, time, txHash, network } = bodyResult.data;
  if (!serviceId) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  if (!txHash) {
    return NextResponse.json(
      { error: "Missing transaction hash." },
      { status: 400 },
    );
  }

  const offeringResult = await tryCatch(getOfferingById(serviceId));
  if (!offeringResult.ok) {
    console.error("[crypto checkout] failed:", offeringResult.error);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }
  const offering = offeringResult.data;
  if (!offering) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  if (offering.status !== "published") {
    return NextResponse.json(
      { error: "This service is not available for booking." },
      { status: 409 },
    );
  }

  // For services where the host travels to the guest, enforce the travel limit.
  if (offering.locationType === "at_guest") {
    const { guestLat, guestLng } = bodyResult.data;
    if (
      typeof guestLat !== "number" ||
      typeof guestLng !== "number" ||
      !Number.isFinite(guestLat) ||
      !Number.isFinite(guestLng)
    ) {
      return NextResponse.json(
        { error: "Share your location to book this service." },
        { status: 400 },
      );
    }
    const origin = await getServiceAreaCenter(offering.id);
    if (
      origin &&
      !isWithinTravelLimit(
        origin,
        { lat: guestLat, lng: guestLng },
        origin.maxTravelMinutes,
      )
    ) {
      return NextResponse.json(
        { error: "You're outside this host's travel range." },
        { status: 400 },
      );
    }
  }

  // Validate the appointment falls within the service's availability.
  if (!date || !time) {
    return NextResponse.json(
      { error: "Choose a valid date and time." },
      { status: 400 },
    );
  }
  const rulesResult = await tryCatch(getAvailabilityRules(offering.id));
  if (!rulesResult.ok) {
    console.error("[crypto checkout] failed:", rulesResult.error);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }
  const check = checkAvailability(
    date,
    time,
    offering.durationMinutes,
    rulesResult.data,
  );
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  // Resolve the menu choice (when present) and the trusted base price.
  const menu = await getMenuItems(offering.id);
  let baseAmount = offering.priceCents;
  let menuItemId: string | null = null;
  if (menu.length > 0) {
    const chosen = menu.find((m) => m.id === bodyResult.data.menuItemId);
    if (!chosen) {
      return NextResponse.json(
        { error: "Choose an option from the menu." },
        { status: 400 },
      );
    }
    baseAmount = chosen.priceCents;
    menuItemId = chosen.id;
  }

  const totalAmount = baseAmount + Math.round(baseAmount * SERVICE_FEE_RATE);

  // Record the appointment, stamp it paid, and log the payment in the ledger.
  const bookingResult = await tryCatch(
    createBooking({
      userId: session.user.id,
      offeringId: offering.id,
      menuItemId,
      appointmentAt: check.appointmentAt,
      priceCents: baseAmount,
      currency: offering.currency,
    }),
  );
  let bookingId: string | undefined;
  if (bookingResult.ok) {
    bookingId = bookingResult.data[0]?.id;
    // Marks paidAt and stores the on-chain tx hash (x402:-prefixed), so the
    // refund path treats it as a non-auto-refundable crypto payment.
    if (bookingId) await recordX402Payment(bookingId, txHash);
  } else {
    console.error("[crypto checkout] booking not recorded:", bookingResult.error);
  }

  const txResult = await tryCatch(
    recordTransaction({
      userId: session.user.id,
      offeringId: offering.id,
      bookingId,
      method: "crypto",
      status: "succeeded",
      amountCents: totalAmount,
      currency: offering.currency,
      reference: txHash,
      network: network ?? null,
    }),
  );
  if (!txResult.ok) {
    console.error("[crypto checkout] transaction not recorded:", txResult.error);
    return NextResponse.json(
      { error: "Payment sent but could not be recorded." },
      { status: 500 },
    );
  }

  // Attribute a referral if the guest arrived through a referral link for this
  // exact service. The crypto payment is already settled, so the referrer's
  // commission is recorded as `owed` immediately. Best-effort.
  await tryCatch(
    (async () => {
      const token = (await cookies()).get(SERVICE_REFERRAL_COOKIE)?.value;
      if (!token) return;
      const referral = await redeemServiceReferral(
        token,
        session.user.id,
        offering.id,
      );
      if (!referral) return;
      await createReferralEarning({
        referralId: referral.id,
        referrerUserId: referral.referrerUserId,
        bookingId: bookingId ?? null,
        offeringId: offering.id,
        amountCents: referralEarningCents(baseAmount),
        currency: offering.currency,
        status: "owed",
        reference: txHash,
      });
    })(),
  ).then((r) => {
    if (!r.ok)
      console.error("[crypto checkout] referral not attributed:", r.error);
  });

  return NextResponse.json({ ok: true, bookingId });
}
