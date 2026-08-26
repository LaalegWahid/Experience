import { and, asc, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  guestReviews,
  menuItems,
  offerings,
  providers,
  type NewBooking,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import { stripe } from "@/lib/stripe";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SERVICE_FEE_RATE } from "@/shared/utils/fees";

export type CancellationPolicy = "flexible" | "moderate" | "strict";

export type BookingStatus =
  | "confirmed"
  | "completed"
  | "executed"
  | "canceled";

export async function createBooking(values: NewBooking) {
  return db.insert(bookings).values(values).returning();
}

/**
 * Record a settled x402 (crypto) payment on a booking. The on-chain settlement
 * tx hash is stored in `stripeSessionId` with an `x402:` prefix so the refund
 * path can tell it apart from a real Stripe PaymentIntent.
 */
export async function recordX402Payment(
  bookingId: string,
  txHash: string | null,
) {
  await db
    .update(bookings)
    .set({
      paidAt: new Date(),
      stripeSessionId: `x402:${txHash ?? "settled"}`,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));
}

/**
 * Mark a booking paid once Stripe confirms the PaymentIntent (via webhook).
 * Idempotent — only stamps `paidAt` the first time.
 */
export async function markBookingPaid(paymentIntentId: string) {
  await db
    .update(bookings)
    .set({ paidAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(bookings.stripeSessionId, paymentIntentId),
        isNull(bookings.paidAt),
      ),
    );
}

/**
 * Reconcile a booking's refund state from Stripe (via webhook). Records the
 * actual refunded amount and cancels the booking once fully refunded.
 */
export async function recordRefundForPaymentIntent(
  paymentIntentId: string,
  refundedCents: number,
  fullyRefunded: boolean,
) {
  await db
    .update(bookings)
    .set({
      refundedCents,
      ...(fullyRefunded ? { status: "canceled" as const } : {}),
      updatedAt: new Date(),
    })
    .where(eq(bookings.stripeSessionId, paymentIntentId));
}

/**
 * Register any confirmed booking whose time has passed as "executed".
 * Cheap idempotent update; run lazily when appointment data is read.
 */
export async function markPastBookingsExecuted() {
  await db
    .update(bookings)
    .set({ status: "executed", updatedAt: new Date() })
    .where(and(eq(bookings.status, "confirmed"), lt(bookings.appointmentAt, new Date())));
}

export async function getBookingForUser(userId: string, bookingId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .limit(1);
  return booking ?? null;
}

export type BookingView = {
  id: string;
  offeringId: string;
  title: string;
  menuItemName: string | null;
  hostName: string;
  appointmentAt: Date;
  status: BookingStatus;
  priceCents: number;
  refundedCents: number;
  currency: string;
  cancellationPolicy: CancellationPolicy;
};

/** A guest's bookings with the offering + host, soonest first. */
export async function getUserBookings(userId: string): Promise<BookingView[]> {
  return db
    .select({
      id: bookings.id,
      offeringId: bookings.offeringId,
      title: offerings.title,
      menuItemName: menuItems.name,
      hostName: providers.displayName,
      appointmentAt: bookings.appointmentAt,
      status: bookings.status,
      priceCents: bookings.priceCents,
      refundedCents: bookings.refundedCents,
      currency: bookings.currency,
      cancellationPolicy: offerings.cancellationPolicy,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .leftJoin(menuItems, eq(menuItems.id, bookings.menuItemId))
    .where(eq(bookings.userId, userId))
    .orderBy(asc(bookings.appointmentAt));
}

export type InvoiceView = {
  id: string;
  offeringId: string;
  title: string;
  menuItemName: string | null;
  hostName: string;
  appointmentAt: Date;
  paidAt: Date;
  priceCents: number;
  currency: string;
  status: BookingStatus;
};

/**
 * A guest's payments — one per booking they checked out — newest first.
 * `priceCents` is the base service amount; the service fee and total are
 * derived where the invoices are displayed.
 */
export async function getUserInvoices(userId: string): Promise<InvoiceView[]> {
  return db
    .select({
      id: bookings.id,
      offeringId: bookings.offeringId,
      title: offerings.title,
      menuItemName: menuItems.name,
      hostName: providers.displayName,
      appointmentAt: bookings.appointmentAt,
      paidAt: bookings.createdAt,
      priceCents: bookings.priceCents,
      currency: bookings.currency,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .leftJoin(menuItems, eq(menuItems.id, bookings.menuItemId))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));
}

/** A single invoice for the guest, or null if it isn't theirs. */
export async function getUserInvoice(
  userId: string,
  bookingId: string,
): Promise<InvoiceView | null> {
  const [row] = await db
    .select({
      id: bookings.id,
      offeringId: bookings.offeringId,
      title: offerings.title,
      menuItemName: menuItems.name,
      hostName: providers.displayName,
      appointmentAt: bookings.appointmentAt,
      paidAt: bookings.createdAt,
      priceCents: bookings.priceCents,
      currency: bookings.currency,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .leftJoin(menuItems, eq(menuItems.id, bookings.menuItemId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Cancel a guest's own booking. */
export async function cancelBooking(userId: string, bookingId: string) {
  await db
    .update(bookings)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)));
}

/**
 * The refund fraction (0–1) owed under a cancellation policy, given how far
 * ahead of the appointment the guest is canceling. Mirrors the labels in
 * shared/data/offerings.ts (CANCELLATION_POLICIES).
 */
export function cancellationRefundRate(
  policy: CancellationPolicy,
  appointmentAt: Date,
  now: Date = new Date(),
): number {
  const hoursUntil = (appointmentAt.getTime() - now.getTime()) / 3_600_000;
  switch (policy) {
    case "flexible": // full refund up to 24h before
      return hoursUntil >= 24 ? 1 : 0;
    case "moderate": // full refund up to 5 days before
      return hoursUntil >= 24 * 5 ? 1 : 0;
    case "strict": // 50% refund up to 7 days before
      return hoursUntil >= 24 * 7 ? 0.5 : 0;
    default:
      return 0;
  }
}

export type CancelResult = { ok: boolean; refundedCents: number };

/**
 * Cancel a guest's confirmed booking and issue any refund the offering's
 * cancellation policy owes. Card payments are refunded through Stripe; crypto
 * (USDC) payments aren't auto-refundable, so they're recorded as canceled with
 * no refund and must be handled manually.
 */
export async function cancelBookingWithRefund(
  userId: string,
  bookingId: string,
): Promise<CancelResult> {
  const [row] = await db
    .select({
      status: bookings.status,
      appointmentAt: bookings.appointmentAt,
      priceCents: bookings.priceCents,
      stripeSessionId: bookings.stripeSessionId,
      policy: offerings.cancellationPolicy,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .limit(1);

  if (!row || row.status !== "confirmed") {
    return { ok: false, refundedCents: 0 };
  }

  const rate = cancellationRefundRate(
    row.policy as CancellationPolicy,
    row.appointmentAt,
  );
  const totalPaid =
    row.priceCents + Math.round(row.priceCents * SERVICE_FEE_RATE);
  const refundCents = Math.round(totalPaid * rate);

  // Issue the refund first; only record what actually went through. Crypto
  // (x402) payments carry an `x402:`-prefixed id and aren't auto-refundable —
  // they're canceled with no refund and handled manually.
  let refundedCents = 0;
  if (
    refundCents > 0 &&
    row.stripeSessionId &&
    !row.stripeSessionId.startsWith("x402:")
  ) {
    const refund = await tryCatch(
      stripe.refunds.create({
        payment_intent: row.stripeSessionId,
        amount: refundCents,
      }),
    );
    if (refund.ok) refundedCents = refundCents;
    else console.error("[cancel] refund failed:", refund.error);
  }

  await db
    .update(bookings)
    .set({ status: "canceled", refundedCents, updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)));

  return { ok: true, refundedCents };
}

/**
 * Mark a guest's confirmed booking as completed — but only if the appointment
 * is today. The date window is enforced in SQL, so a non-today request is a
 * no-op even if the client tries to bypass the UI.
 */
export async function completeBooking(userId: string, bookingId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  await db
    .update(bookings)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, userId),
        eq(bookings.status, "confirmed"),
        gte(bookings.appointmentAt, startOfToday),
        lt(bookings.appointmentAt, startOfTomorrow),
      ),
    );
}

export type ProviderBooking = {
  id: string;
  offeringId: string;
  offeringTitle: string;
  guestUserId: string;
  guestName: string;
  appointmentAt: Date;
  status: BookingStatus;
  priceCents: number;
  currency: string;
  /** When the guest booked — used for the "recent activity" feed. */
  createdAt: Date;
  /** The host's own review of this guest, if they've left one. */
  myReview: { rating: number; comment: string | null } | null;
};

/** All bookings across a provider's offerings, soonest-past first. */
export async function getProviderBookings(
  providerId: string,
): Promise<ProviderBooking[]> {
  const rows = await db
    .select({
      id: bookings.id,
      offeringId: bookings.offeringId,
      offeringTitle: offerings.title,
      guestUserId: bookings.userId,
      guestName: user.name,
      appointmentAt: bookings.appointmentAt,
      status: bookings.status,
      priceCents: bookings.priceCents,
      currency: bookings.currency,
      createdAt: bookings.createdAt,
      reviewRating: guestReviews.rating,
      reviewComment: guestReviews.comment,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .innerJoin(user, eq(user.id, bookings.userId))
    .leftJoin(guestReviews, eq(guestReviews.bookingId, bookings.id))
    .where(eq(offerings.providerId, providerId))
    .orderBy(desc(bookings.appointmentAt));

  return rows.map((r) => ({
    id: r.id,
    offeringId: r.offeringId,
    offeringTitle: r.offeringTitle,
    guestUserId: r.guestUserId,
    guestName: r.guestName,
    appointmentAt: r.appointmentAt,
    status: r.status,
    priceCents: r.priceCents,
    currency: r.currency,
    createdAt: r.createdAt,
    myReview:
      r.reviewRating != null
        ? { rating: r.reviewRating, comment: r.reviewComment }
        : null,
  }));
}

export type OfferingBooking = {
  id: string;
  guestName: string;
  menuItemName: string | null;
  appointmentAt: Date;
  status: BookingStatus;
  priceCents: number;
  currency: string;
};

/** Every appointment booked on a single offering, soonest first. */
export async function getOfferingBookings(
  offeringId: string,
): Promise<OfferingBooking[]> {
  return db
    .select({
      id: bookings.id,
      guestName: user.name,
      menuItemName: menuItems.name,
      appointmentAt: bookings.appointmentAt,
      status: bookings.status,
      priceCents: bookings.priceCents,
      currency: bookings.currency,
    })
    .from(bookings)
    .innerJoin(user, eq(user.id, bookings.userId))
    .leftJoin(menuItems, eq(menuItems.id, bookings.menuItemId))
    .where(eq(bookings.offeringId, offeringId))
    .orderBy(asc(bookings.appointmentAt));
}
