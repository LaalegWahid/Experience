import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import {
  getAvailabilityRules,
  getOfferingById,
  getServiceAreaCenter,
} from "@/lib/offerings";
import { haversineKm, isWithinTravelLimit, travelHoursForKm } from "@/lib/geo";
import { getMenuItems } from "@/lib/menu";
import { createBooking } from "@/lib/bookings";
import { recordTransaction } from "@/lib/transactions";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customer";
import { getUserCards, type SavedCard } from "@/lib/payment-methods";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SERVICE_FEE_RATE, referralEarningCents } from "@/shared/utils/fees";
import {
  createReferralEarning,
  redeemServiceReferral,
  SERVICE_REFERRAL_COOKIE,
} from "@/lib/referrals";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
function isoWeekday(date: string): number {
  const js = new Date(`${date}T00:00:00`).getDay();
  return js === 0 ? 7 : js;
}

// Creates an embedded Stripe Checkout session for a single service booking.
// Auth is enforced here and the price is taken from trusted server-side data,
// never from the client.
export async function POST(request: Request) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) {
    console.error("[checkout] failed:", sessionResult.error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
  const session = sessionResult.data;
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const bodyResult = await tryCatch(
    request.json() as Promise<{
      serviceId?: string;
      date?: string;
      time?: string;
      menuItemId?: string;
      guestLat?: number;
      guestLng?: number;
    }>,
  );
  if (!bodyResult.ok) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { serviceId, date, time } = bodyResult.data;
  if (!serviceId) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const offeringResult = await tryCatch(getOfferingById(serviceId));
  if (!offeringResult.ok) {
    console.error("[checkout] failed:", offeringResult.error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
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

  // For services where the host travels to the guest, require the guest's
  // location and reject bookings beyond the host's max travel time (~2h).
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
    // Only enforce when the host has set their travel-from point.
    if (
      origin &&
      !isWithinTravelLimit(
        origin,
        { lat: guestLat, lng: guestLng },
        origin.maxTravelMinutes,
      )
    ) {
      const km = haversineKm(origin, { lat: guestLat, lng: guestLng });
      const minutes = Math.round(travelHoursForKm(km) * 60);
      console.log(
        `[checkout] booking rejected — guest is ~${minutes} min (${km.toFixed(
          1,
        )} km) away, over the host's ${origin.maxTravelMinutes} min travel limit.`,
      );
      const hrs = origin.maxTravelMinutes / 60;
      const limit = hrs >= 1 ? `${hrs} hour${hrs === 1 ? "" : "s"}` : `${origin.maxTravelMinutes} minutes`;
      return NextResponse.json(
        {
          error: `You're outside this host's travel range (more than ${limit} away).`,
          reason: "outside_travel_range",
          travelMinutes: minutes,
          maxTravelMinutes: origin.maxTravelMinutes,
        },
        { status: 400 },
      );
    }
  }

  // Validate the chosen appointment falls within the service's availability.
  if (!date || !time || !DATE_RE.test(date) || !TIME_RE.test(time)) {
    return NextResponse.json(
      { error: "Choose a valid date and time." },
      { status: 400 },
    );
  }
  const rulesResult = await tryCatch(getAvailabilityRules(offering.id));
  if (!rulesResult.ok) {
    console.error("[checkout] failed:", rulesResult.error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
  const rule = rulesResult.data.find((r) => r.dayOfWeek === isoWeekday(date));
  if (!rule) {
    return NextResponse.json(
      { error: "The host isn't available on that day." },
      { status: 400 },
    );
  }
  const startMin = toMinutes(time);
  if (
    startMin < toMinutes(rule.startTime) ||
    startMin + offering.durationMinutes > toMinutes(rule.endTime)
  ) {
    return NextResponse.json(
      { error: "That time is outside the service's availability." },
      { status: 400 },
    );
  }
  if (new Date(`${date}T${time}:00`).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Choose a time in the future." },
      { status: 400 },
    );
  }

  // Resolve what's being booked: a specific menu choice (when the service has
  // a menu) or the service itself. Price always comes from trusted server data.
  const menu = await getMenuItems(offering.id);
  let lineName = offering.title;
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
    lineName = `${offering.title} · ${chosen.name}`;
    baseAmount = chosen.priceCents;
    menuItemId = chosen.id;
  }

  // A service fee is added to the original amount before charging.
  const currency = offering.currency.toLowerCase();
  const feeAmount = Math.round(baseAmount * SERVICE_FEE_RATE);

  // Attach a Stripe customer so the guest's saved cards are offered, and any
  // new card can be saved for next time. Falls back to email-only if Stripe
  // is unreachable.
  const customerResult = await tryCatch(
    getOrCreateStripeCustomer({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }),
  );
  const customerId = customerResult.ok ? customerResult.data : null;

  // Total charged = base service price + the 20% fee, in one PaymentIntent.
  // We confirm it from our own custom card UI on the client.
  const totalAmount = baseAmount + feeAmount;
  const intentResult = await tryCatch(
    stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      description: lineName,
      ...(customerId
        ? {
            customer: customerId,
            // Save any new card to the customer for faster future checkouts.
            setup_future_usage: "on_session",
          }
        : { receipt_email: session.user.email }),
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        offeringId: offering.id,
        userId: session.user.id,
        baseAmount: String(baseAmount),
        feeAmount: String(feeAmount),
        appointmentDate: date,
        appointmentTime: time,
        ...(menuItemId ? { menuItemId } : {}),
      },
    }),
  );
  if (!intentResult.ok) {
    console.error("[checkout] failed:", intentResult.error);
    return NextResponse.json(
      { error: intentResult.error.message },
      { status: 500 },
    );
  }

  // The guest's saved cards, offered as quick-pay options in the custom form.
  let savedCards: SavedCard[] = [];
  const cardsResult = await tryCatch(getUserCards(session.user.id));
  if (cardsResult.ok) savedCards = cardsResult.data;

  // Record the appointment. Don't fail the payment if this can't be written
  // (e.g. the bookings table hasn't been migrated yet) — just log it.
  const bookingResult = await tryCatch(
    createBooking({
      userId: session.user.id,
      offeringId: offering.id,
      menuItemId,
      appointmentAt: new Date(`${date}T${time}:00`),
      priceCents: baseAmount,
      currency: offering.currency,
      stripeSessionId: intentResult.data.id,
    }),
  );
  if (!bookingResult.ok) {
    console.error("[checkout] booking not recorded:", bookingResult.error);
  }

  // Log the payment in the unified ledger as `pending`; the Stripe webhook
  // promotes it to `succeeded` once the PaymentIntent settles. Don't fail the
  // checkout if the ledger isn't writable.
  const txResult = await tryCatch(
    recordTransaction({
      userId: session.user.id,
      offeringId: offering.id,
      bookingId: bookingResult.ok ? bookingResult.data[0]?.id : undefined,
      method: "stripe",
      status: "pending",
      amountCents: totalAmount,
      currency: offering.currency,
      reference: intentResult.data.id,
    }),
  );
  if (!txResult.ok) {
    console.error("[checkout] transaction not recorded:", txResult.error);
  }

  // Attribute a referral if the guest arrived through a referral link for this
  // exact service. Claiming the link is single-use and self-referral-guarded; on
  // success we record the referrer's commission as `pending` — the Stripe
  // webhook promotes it to `owed` once payment settles. Best-effort.
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
        bookingId: bookingResult.ok ? bookingResult.data[0]?.id : null,
        offeringId: offering.id,
        amountCents: referralEarningCents(baseAmount),
        currency: offering.currency,
        status: "pending",
        reference: intentResult.data.id,
      });
    })(),
  ).then((r) => {
    if (!r.ok) console.error("[checkout] referral not attributed:", r.error);
  });

  return NextResponse.json({
    clientSecret: intentResult.data.client_secret,
    amount: totalAmount,
    baseAmount,
    currency: offering.currency,
    savedCards,
  });
}
