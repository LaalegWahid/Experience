import { redirect } from "next/navigation";
import { count, desc, eq, inArray, like } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  bookings,
  menuItems,
  messages,
  offerings,
  payoutMethods,
  providers,
  referralEarnings,
  referrerPayoutMethods,
  type ReferralEarningStatus,
} from "@/db/schema";
import type { BookingStatus } from "@/lib/bookings";
import { getSessionUser, type SessionUser } from "@/lib/host";
import { bucketCounts, trendCutoff, type TrendPoint } from "@/lib/trends";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SERVICE_FEE_RATE } from "@/shared/utils/fees";

/** Total a guest is charged for a reservation: base price + the service fee. */
export function reservationTotalCents(priceCents: number): number {
  return priceCents + Math.round(priceCents * SERVICE_FEE_RATE);
}

/** Require a signed-in admin. Guests/hosts are turned away. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login?redirect=/admin");
  if (u.role !== "admin") redirect("/");
  return u;
}

// Demo (seed) content is owned by hosts whose user id starts with "seed_". The
// admin can hide all of it from the public site (and bring it back) in one tap.
const demoProviderIds = () =>
  db
    .select({ id: providers.id })
    .from(providers)
    .where(like(providers.userId, "seed_%"));

/** Whether the demo listings are currently hidden from the marketplace. */
export async function getDemoDataState(): Promise<{
  exists: boolean;
  hidden: boolean;
  total: number;
}> {
  const rows = await db
    .select({ status: offerings.status })
    .from(offerings)
    .where(inArray(offerings.providerId, demoProviderIds()));
  const published = rows.filter((r) => r.status === "published").length;
  return {
    exists: rows.length > 0,
    hidden: rows.length > 0 && published === 0,
    total: rows.length,
  };
}

/** Hide (archive) or show (publish) every demo listing at once. */
export async function setDemoDataHidden(hidden: boolean): Promise<void> {
  await db
    .update(offerings)
    .set({ status: hidden ? "archived" : "published", updatedAt: new Date() })
    .where(inArray(offerings.providerId, demoProviderIds()));
}

export type AdminStats = {
  offeringsByStatus: Record<string, number>;
  totalOfferings: number;
  providers: number;
  messages: number;
};

/** Offering/provider/message counts — user counts now live in getUserOverview(). */
export async function getAdminStats(): Promise<AdminStats> {
  const offeringRows = await db
    .select({ status: offerings.status, value: count() })
    .from(offerings)
    .groupBy(offerings.status);
  const [{ value: providerCount }] = await db
    .select({ value: count() })
    .from(providers);

  // Messages table may not be present in every environment — stay resilient.
  let messageCount = 0;
  const mr = await tryCatch(db.select({ value: count() }).from(messages));
  if (mr.ok) messageCount = Number(mr.data[0]?.value ?? 0);

  const offeringsByStatus: Record<string, number> = {};
  let totalOfferings = 0;
  for (const r of offeringRows) {
    const n = Number(r.value);
    offeringsByStatus[r.status] = n;
    totalOfferings += n;
  }

  return {
    offeringsByStatus,
    totalOfferings,
    providers: Number(providerCount),
    messages: messageCount,
  };
}

export type RecentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type UserOverview = {
  usersByRole: Record<string, number>;
  totalUsers: number;
  recentUsers: RecentUser[];
  userGrowth: TrendPoint[];
};

/**
 * Role counts, the most recent signups, and the trailing-30-day growth trend
 * for the admin overview — all derived from one fetch of the user table
 * instead of three separate queries (role-count / recent-8 / date-filtered
 * growth previously each made their own round trip).
 */
export async function getUserOverview(days = 30): Promise<UserOverview> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const usersByRole: Record<string, number> = {};
  for (const r of rows) {
    usersByRole[r.role] = (usersByRole[r.role] ?? 0) + 1;
  }

  const cutoff = trendCutoff(days);
  const userGrowth = bucketCounts(
    rows.filter((r) => r.createdAt >= cutoff).map((r) => r.createdAt),
    days,
  );

  return {
    usersByRole,
    totalUsers: rows.length,
    recentUsers: rows.slice(0, 8),
    userGrowth,
  };
}

/**
 * Where Gathra sends a host's payout. Mirrors the host's single `payout_methods`
 * row: a bank account (IBAN/RIB) or a stablecoin wallet. Null when the host
 * hasn't set one up yet.
 */
export type HostPayout =
  | {
      type: "bank";
      accountHolderName: string | null;
      iban: string | null;
      bic: string | null;
      bankName: string | null;
      country: string | null;
    }
  | {
      type: "crypto";
      walletAddress: string | null;
      chain: string | null;
      stablecoin: string | null;
    }
  | null;

export type AdminReservation = {
  id: string;
  offeringId: string;
  offeringTitle: string;
  menuItemName: string | null;
  hostName: string;
  guestName: string;
  guestEmail: string;
  appointmentAt: Date;
  createdAt: Date;
  status: BookingStatus;
  /** Base price of the reservation, in minor units. */
  priceCents: number;
  /** Total the guest is charged (base + service fee), in minor units. */
  amountCents: number;
  currency: string;
  /** Whether the guest has actually paid (Stripe webhook / crypto settle). */
  guestPaid: boolean;
  /** When Gathra paid the host their share; null means the payout is unpaid. */
  hostPaidAt: Date | null;
  /** The host's payout details, so the admin knows where to send the money. */
  hostPayout: HostPayout;
};

type ReservationRaw = {
  id: string;
  offeringId: string;
  offeringTitle: string;
  menuItemName: string | null;
  hostName: string;
  guestName: string;
  guestEmail: string;
  appointmentAt: Date;
  createdAt: Date;
  status: BookingStatus;
  priceCents: number;
  currency: string;
  paidAt: Date | null;
  hostPaidAt: Date | null;
  payoutType: "bank" | "crypto" | null;
  accountHolderName: string | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  country: string | null;
  walletAddress: string | null;
  chain: string | null;
  stablecoin: string | null;
};

function mapHostPayout(r: ReservationRaw): HostPayout {
  if (r.payoutType === "bank") {
    return {
      type: "bank",
      accountHolderName: r.accountHolderName,
      iban: r.iban,
      bic: r.bic,
      bankName: r.bankName,
      country: r.country,
    };
  }
  if (r.payoutType === "crypto") {
    return {
      type: "crypto",
      walletAddress: r.walletAddress,
      chain: r.chain,
      stablecoin: r.stablecoin,
    };
  }
  return null;
}

function mapReservation(r: ReservationRaw): AdminReservation {
  return {
    id: r.id,
    offeringId: r.offeringId,
    offeringTitle: r.offeringTitle,
    menuItemName: r.menuItemName,
    hostName: r.hostName,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    appointmentAt: r.appointmentAt,
    createdAt: r.createdAt,
    status: r.status,
    priceCents: r.priceCents,
    amountCents: reservationTotalCents(r.priceCents),
    currency: r.currency,
    guestPaid: r.paidAt != null,
    hostPaidAt: r.hostPaidAt,
    hostPayout: mapHostPayout(r),
  };
}

const reservationColumns = {
  id: bookings.id,
  offeringId: bookings.offeringId,
  offeringTitle: offerings.title,
  menuItemName: menuItems.name,
  hostName: providers.displayName,
  guestName: user.name,
  guestEmail: user.email,
  appointmentAt: bookings.appointmentAt,
  createdAt: bookings.createdAt,
  status: bookings.status,
  priceCents: bookings.priceCents,
  currency: bookings.currency,
  paidAt: bookings.paidAt,
  hostPaidAt: bookings.hostPaidAt,
  payoutType: payoutMethods.type,
  accountHolderName: payoutMethods.accountHolderName,
  iban: payoutMethods.iban,
  bic: payoutMethods.bic,
  bankName: payoutMethods.bankName,
  country: payoutMethods.country,
  walletAddress: payoutMethods.walletAddress,
  chain: payoutMethods.chain,
  stablecoin: payoutMethods.stablecoin,
};

/**
 * Every reservation across the marketplace — the guest who booked, the host who
 * provides it, the price/amount, whether the guest paid, and Gathra's payout
 * state to the host. Newest bookings first.
 */
export async function getAllReservations(
  limit = 200,
): Promise<AdminReservation[]> {
  const rows = await db
    .select(reservationColumns)
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .innerJoin(user, eq(user.id, bookings.userId))
    .leftJoin(menuItems, eq(menuItems.id, bookings.menuItemId))
    .leftJoin(payoutMethods, eq(payoutMethods.providerId, providers.id))
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
  return rows.map(mapReservation);
}

/** A short list of the latest reservations, for the admin overview. */
export async function getRecentReservations(
  limit = 6,
): Promise<AdminReservation[]> {
  return getAllReservations(limit);
}

export type ReservationStats = {
  total: number;
  /** Reservations the guest has paid for but the host hasn't been paid out. */
  payoutOwed: number;
  /** Owed payout volume to hosts (net base price), keyed by currency. */
  owedByCurrency: Record<string, number>;
};

export type BookingOverview = {
  reservationStats: ReservationStats;
  reservationsTrend: TrendPoint[];
};

/**
 * Headline reservation/payout figures plus the trailing-30-day booking trend
 * for the admin overview — one fetch of the bookings table instead of two
 * (an all-time stats query and a separately date-filtered trend query).
 */
export async function getBookingOverview(days = 30): Promise<BookingOverview> {
  const rows = await db
    .select({
      priceCents: bookings.priceCents,
      currency: bookings.currency,
      paidAt: bookings.paidAt,
      hostPaidAt: bookings.hostPaidAt,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings);

  let payoutOwed = 0;
  const owedByCurrency: Record<string, number> = {};
  for (const r of rows) {
    // The host is owed once the guest has paid, the booking isn't canceled, and
    // Gathra hasn't paid out yet.
    if (r.paidAt && !r.hostPaidAt && r.status !== "canceled") {
      payoutOwed += 1;
      owedByCurrency[r.currency] =
        (owedByCurrency[r.currency] ?? 0) + r.priceCents;
    }
  }

  const cutoff = trendCutoff(days);
  const reservationsTrend = bucketCounts(
    rows.filter((r) => r.createdAt >= cutoff).map((r) => r.createdAt),
    days,
  );

  return {
    reservationStats: { total: rows.length, payoutOwed, owedByCurrency },
    reservationsTrend,
  };
}

/** Mark Gathra's payout to the host as paid (or revert it) for a reservation. */
export async function setReservationHostPaid(
  bookingId: string,
  paid: boolean,
) {
  await db
    .update(bookings)
    .set({ hostPaidAt: paid ? new Date() : null, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
}

// ---------------------------------------------------------------------------
// Referral earnings — the commissions referrers are owed, for the admin to
// review and (manually) pay out. The referrer's payout details ride along so
// the admin knows where to send the money.
// ---------------------------------------------------------------------------

export type AdminReferralEarning = {
  id: string;
  createdAt: Date;
  referrerName: string | null;
  referrerEmail: string | null;
  serviceTitle: string | null;
  amountCents: number;
  currency: string;
  status: ReferralEarningStatus;
  paidAt: Date | null;
  /** The referrer's payout details (reuses the bank/crypto shape). */
  payout: HostPayout;
};

type ReferralEarningRaw = {
  id: string;
  createdAt: Date;
  referrerName: string | null;
  referrerEmail: string | null;
  serviceTitle: string | null;
  amountCents: number;
  currency: string;
  status: ReferralEarningStatus;
  paidAt: Date | null;
  payoutType: "bank" | "crypto" | null;
  accountHolderName: string | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  country: string | null;
  walletAddress: string | null;
  chain: string | null;
  stablecoin: string | null;
};

function mapReferrerPayout(r: ReferralEarningRaw): HostPayout {
  if (r.payoutType === "bank") {
    return {
      type: "bank",
      accountHolderName: r.accountHolderName,
      iban: r.iban,
      bic: r.bic,
      bankName: r.bankName,
      country: r.country,
    };
  }
  if (r.payoutType === "crypto") {
    return {
      type: "crypto",
      walletAddress: r.walletAddress,
      chain: r.chain,
      stablecoin: r.stablecoin,
    };
  }
  return null;
}

/** Every referral commission with its referrer, service, and payout details. */
export async function getAllReferralEarnings(
  limit = 200,
): Promise<AdminReferralEarning[]> {
  const rows = await db
    .select({
      id: referralEarnings.id,
      createdAt: referralEarnings.createdAt,
      referrerName: user.name,
      referrerEmail: user.email,
      serviceTitle: offerings.title,
      amountCents: referralEarnings.amountCents,
      currency: referralEarnings.currency,
      status: referralEarnings.status,
      paidAt: referralEarnings.paidAt,
      payoutType: referrerPayoutMethods.type,
      accountHolderName: referrerPayoutMethods.accountHolderName,
      iban: referrerPayoutMethods.iban,
      bic: referrerPayoutMethods.bic,
      bankName: referrerPayoutMethods.bankName,
      country: referrerPayoutMethods.country,
      walletAddress: referrerPayoutMethods.walletAddress,
      chain: referrerPayoutMethods.chain,
      stablecoin: referrerPayoutMethods.stablecoin,
    })
    .from(referralEarnings)
    .leftJoin(user, eq(user.id, referralEarnings.referrerUserId))
    .leftJoin(offerings, eq(offerings.id, referralEarnings.offeringId))
    .leftJoin(
      referrerPayoutMethods,
      eq(referrerPayoutMethods.userId, referralEarnings.referrerUserId),
    )
    .orderBy(desc(referralEarnings.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    referrerName: r.referrerName,
    referrerEmail: r.referrerEmail,
    serviceTitle: r.serviceTitle,
    amountCents: r.amountCents,
    currency: r.currency,
    status: r.status,
    paidAt: r.paidAt,
    payout: mapReferrerPayout(r),
  }));
}

export type ReferralStats = {
  total: number;
  /** Commissions settled but not yet paid to the referrer. */
  owedCount: number;
  /** Owed commission volume, keyed by currency. */
  owedByCurrency: Record<string, number>;
};

/** Headline referral figures for the admin overview. */
export async function getReferralStats(): Promise<ReferralStats> {
  const rows = await db
    .select({
      amountCents: referralEarnings.amountCents,
      currency: referralEarnings.currency,
      status: referralEarnings.status,
    })
    .from(referralEarnings);

  let owedCount = 0;
  const owedByCurrency: Record<string, number> = {};
  for (const r of rows) {
    if (r.status === "owed") {
      owedCount += 1;
      owedByCurrency[r.currency] =
        (owedByCurrency[r.currency] ?? 0) + r.amountCents;
    }
  }

  return { total: rows.length, owedCount, owedByCurrency };
}

/** Mark a referral commission as paid to the referrer (or revert it). */
export async function setReferralEarningPaid(
  earningId: string,
  paid: boolean,
) {
  await db
    .update(referralEarnings)
    .set({
      status: paid ? "paid" : "owed",
      paidAt: paid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(referralEarnings.id, earningId));
}
