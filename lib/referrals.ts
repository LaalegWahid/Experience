import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, ne, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  offerings,
  referralEarnings,
  referrerPayoutMethods,
  serviceReferrals,
  type NewReferralEarning,
  type ReferralEarning,
  type ReferrerPayoutMethod,
  type ServiceReferral,
} from "@/db/schema";

// Server-only helpers for service referral links. A user generates a single-use
// link pointing at a specific service; opening it lands the invitee on that
// service's page, and when they pay for it the referrer earns a 4% commission.
// Links expire 24h after creation.

/** How long a freshly created referral link stays valid. */
export const REFERRAL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cookie that carries a referral token across the (popup) sign-up flow so the
 * link can be attributed once the invitee pays. httpOnly — only read
 * server-side, at checkout.
 */
export const SERVICE_REFERRAL_COOKIE = "service_referral_token";

export function generateReferralToken(): string {
  return randomBytes(18).toString("base64url"); // 24 url-safe chars
}

/** Build the shareable invite URL for a token. */
export function referralUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/refer/${token}`;
}

export type ReferralStatus = "active" | "redeemed" | "expired";

/**
 * Derive a referral's display status. Lives here (not in a Server Component) so
 * reading the clock doesn't trip React's render-purity lint.
 */
export function referralStatus(referral: {
  redeemedAt: Date | null;
  expiresAt: Date;
}): ReferralStatus {
  if (referral.redeemedAt) return "redeemed";
  if (referral.expiresAt.getTime() <= Date.now()) return "expired";
  return "active";
}

export async function createServiceReferral(
  referrerUserId: string,
  offeringId: string,
): Promise<ServiceReferral> {
  const [row] = await db
    .insert(serviceReferrals)
    .values({
      referrerUserId,
      offeringId,
      token: generateReferralToken(),
      expiresAt: new Date(Date.now() + REFERRAL_TTL_MS),
    })
    .returning();
  return row;
}

/** A referral that is still claimable: exists, unredeemed, and not yet expired. */
export async function getValidServiceReferralByToken(
  token: string,
): Promise<ServiceReferral | null> {
  if (!token) return null;
  const [row] = await db
    .select()
    .from(serviceReferrals)
    .where(
      and(
        eq(serviceReferrals.token, token),
        isNull(serviceReferrals.redeemedAt),
        gt(serviceReferrals.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Atomically claim a referral for a booking. The WHERE clause re-checks
 * single-use + expiry so two concurrent redemptions can't both win, enforces
 * that the link is being redeemed against the service it actually promotes, and
 * guards against self-referral (the referrer paying through their own link).
 * Returns the claimed referral on success, or `null` if it couldn't be claimed.
 */
export async function redeemServiceReferral(
  token: string,
  redeemedByUserId: string,
  offeringId: string,
): Promise<ServiceReferral | null> {
  if (!token) return null;
  const [row] = await db
    .update(serviceReferrals)
    .set({ redeemedAt: new Date(), redeemedByUserId })
    .where(
      and(
        eq(serviceReferrals.token, token),
        eq(serviceReferrals.offeringId, offeringId),
        isNull(serviceReferrals.redeemedAt),
        gt(serviceReferrals.expiresAt, new Date()),
        ne(serviceReferrals.referrerUserId, redeemedByUserId),
      ),
    )
    .returning();
  return row ?? null;
}

export type ReferralWithOffering = ServiceReferral & {
  offeringTitle: string | null;
};

/** A user's referral links with the service each one promotes, newest first. */
export async function listServiceReferralsForUser(
  userId: string,
): Promise<ReferralWithOffering[]> {
  const rows = await db
    .select({
      referral: serviceReferrals,
      offeringTitle: offerings.title,
    })
    .from(serviceReferrals)
    .leftJoin(offerings, eq(offerings.id, serviceReferrals.offeringId))
    .where(eq(serviceReferrals.referrerUserId, userId))
    .orderBy(desc(serviceReferrals.createdAt));
  return rows.map((r) => ({ ...r.referral, offeringTitle: r.offeringTitle }));
}

// ---------------------------------------------------------------------------
// Earnings — the commission a referrer is owed once a referred booking is paid.
// ---------------------------------------------------------------------------

export async function createReferralEarning(
  values: NewReferralEarning,
): Promise<ReferralEarning> {
  const [row] = await db.insert(referralEarnings).values(values).returning();
  return row;
}

/**
 * Promote a referral earning to `owed` once its payment settles (via webhook or
 * synchronous crypto). Idempotent — only the first pending row for the
 * reference is moved.
 */
export async function markReferralEarningOwed(reference: string): Promise<void> {
  if (!reference) return;
  await db
    .update(referralEarnings)
    .set({ status: "owed", updatedAt: new Date() })
    .where(
      and(
        eq(referralEarnings.reference, reference),
        eq(referralEarnings.status, "pending"),
      ),
    );
}

/**
 * Void a referral earning when its booking is refunded. Only voids earnings that
 * haven't been paid out yet — a `paid` commission is left untouched for an admin
 * to reconcile manually.
 */
export async function markReferralEarningReversed(
  reference: string,
): Promise<void> {
  if (!reference) return;
  await db
    .update(referralEarnings)
    .set({ status: "reversed", updatedAt: new Date() })
    .where(
      and(
        eq(referralEarnings.reference, reference),
        ne(referralEarnings.status, "paid"),
      ),
    );
}

export type ReferralEarningView = {
  id: string;
  offeringTitle: string | null;
  amountCents: number;
  currency: string;
  status: ReferralEarning["status"];
  createdAt: Date;
  paidAt: Date | null;
};

/** A referrer's commissions with the service each came from, newest first. */
export async function listReferralEarningsForUser(
  userId: string,
): Promise<ReferralEarningView[]> {
  return db
    .select({
      id: referralEarnings.id,
      offeringTitle: offerings.title,
      amountCents: referralEarnings.amountCents,
      currency: referralEarnings.currency,
      status: referralEarnings.status,
      createdAt: referralEarnings.createdAt,
      paidAt: referralEarnings.paidAt,
    })
    .from(referralEarnings)
    .leftJoin(offerings, eq(offerings.id, referralEarnings.offeringId))
    .where(eq(referralEarnings.referrerUserId, userId))
    .orderBy(desc(referralEarnings.createdAt));
}

export type EarningsSummary = {
  /** Settled but not yet paid out, in minor units, keyed by currency. */
  owedByCurrency: Record<string, number>;
  /** Already paid out, in minor units, keyed by currency. */
  paidByCurrency: Record<string, number>;
};

/** Owed/paid commission totals for a referrer's dashboard. */
export async function referralEarningsSummary(
  userId: string,
): Promise<EarningsSummary> {
  const rows = await db
    .select({
      status: referralEarnings.status,
      currency: referralEarnings.currency,
      total: sum(referralEarnings.amountCents),
    })
    .from(referralEarnings)
    .where(eq(referralEarnings.referrerUserId, userId))
    .groupBy(referralEarnings.status, referralEarnings.currency);

  const owedByCurrency: Record<string, number> = {};
  const paidByCurrency: Record<string, number> = {};
  for (const r of rows) {
    const cents = Number(r.total ?? 0);
    if (r.status === "owed") owedByCurrency[r.currency] = cents;
    else if (r.status === "paid") paidByCurrency[r.currency] = cents;
  }
  return { owedByCurrency, paidByCurrency };
}

// ---------------------------------------------------------------------------
// Referrer payout methods — where a referrer's commissions are paid. A referrer
// must have one on file before they can create a link.
// ---------------------------------------------------------------------------

export async function getReferrerPayoutMethod(
  userId: string,
): Promise<ReferrerPayoutMethod | null> {
  const [row] = await db
    .select()
    .from(referrerPayoutMethods)
    .where(eq(referrerPayoutMethods.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function hasReferrerPayoutMethod(
  userId: string,
): Promise<boolean> {
  return (await getReferrerPayoutMethod(userId)) !== null;
}
