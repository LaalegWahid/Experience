"use server";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { offerings, providers } from "@/db/schema";
import {
  getAdminStats,
  getAllReferralEarnings,
  getAllReservations,
  getBookingOverview,
  getDemoDataState,
  getRecentReservations,
  getReferralStats,
  getUserOverview,
  requireAdmin,
} from "@/lib/admin";
import { countOpenReports, getAllReports } from "@/lib/reports";
import { getRecentTransactions, getTransactionOverview } from "@/lib/transactions";
import type { AdminOverviewData } from "./overview";
import type { AdminListingRow } from "./listings/listings-table";
import type { AdminReferralRow } from "./referrals/referrals-table";
import type { AdminReportRow } from "./reports/reports-list";
import type { AdminReservationRow } from "./reservations/reservations-table";
import type { AdminTransactionRow } from "./transactions/transactions-table";
import type { AdminUserRow } from "./users/users-table";

// Every fetcher re-checks `requireAdmin()`: they double as callable server
// endpoints (TanStack's `queryFn` invokes them again on the client for
// background refresh after a mutation), so each one guards on its own.
// All Date fields are serialized to ISO strings here so the dehydrated cache
// is plain JSON and rehydrates cleanly across the server → client boundary.

/**
 * Headline metrics + recent activity for the admin overview. Each of these
 * used to be its own query — getAdminStats/getRecentUsers/getUserGrowthTrend
 * all hit `user`, getTransactionStats/getRevenueTrend both hit
 * `transactions`, getReservationStats/getReservationsTrend both hit
 * `bookings` — so they're now merged into one fetch per table
 * (getUserOverview / getTransactionOverview / getBookingOverview) instead of
 * two. That took this from 11 queries down to 8, fetched in two small
 * batches: asking for too many connections at once from Supabase's pooler is
 * what caused the overview page to hang while every other admin page (which
 * only ever asks for one connection at a time) stayed fine.
 */
export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  await requireAdmin();

  const [stats, openReports, users, txOverview] = await Promise.all([
    getAdminStats(),
    countOpenReports(),
    getUserOverview(),
    getTransactionOverview(),
  ]);
  const [bookingOverview, referralStats, recentReservations, demo] =
    await Promise.all([
      getBookingOverview(),
      getReferralStats(),
      getRecentReservations(),
      getDemoDataState(),
    ]);

  return {
    stats: {
      ...stats,
      usersByRole: users.usersByRole,
      totalUsers: users.totalUsers,
    },
    openReports,
    txStats: txOverview.txStats,
    reservationStats: bookingOverview.reservationStats,
    referralStats,
    demo,
    trends: {
      userGrowth: users.userGrowth,
      reservationsTrend: bookingOverview.reservationsTrend,
      revenueTrend: txOverview.revenueTrend,
    },
    recentUsers: users.recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
    recentReservations: recentReservations.map((r) => ({
      id: r.id,
      offeringTitle: r.offeringTitle,
      guestName: r.guestName,
      hostName: r.hostName,
      amountCents: r.amountCents,
      currency: r.currency,
      guestPaid: r.guestPaid,
      hostPaidAt: r.hostPaidAt ? r.hostPaidAt.toISOString() : null,
    })),
  };
}

/** Every user, newest first, for the admin users table. */
export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();

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

  return rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
}

/** Every listing across the marketplace, newest first. */
export async function fetchAdminListings(): Promise<AdminListingRow[]> {
  await requireAdmin();

  return db
    .select({
      id: offerings.id,
      title: offerings.title,
      status: offerings.status,
      moderationStatus: sql<
        string | null
      >`${offerings.metadata} ->> 'moderationStatus'`,
      priceCents: offerings.priceCents,
      currency: offerings.currency,
      hostName: providers.displayName,
    })
    .from(offerings)
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .orderBy(desc(offerings.createdAt));
}

/** Every reservation with guest, host, and payout state. */
export async function fetchAdminReservations(): Promise<AdminReservationRow[]> {
  await requireAdmin();

  const rows = await getAllReservations();
  return rows.map((r) => ({
    ...r,
    appointmentAt: r.appointmentAt.toISOString(),
    hostPaidAt: r.hostPaidAt ? r.hostPaidAt.toISOString() : null,
  }));
}

/** Every card and crypto payment, newest first. */
export async function fetchAdminTransactions(): Promise<AdminTransactionRow[]> {
  await requireAdmin();

  const rows = await getRecentTransactions();
  return rows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
}

/** Every referral commission with its referrer and payout details. */
export async function fetchAdminReferrals(): Promise<AdminReferralRow[]> {
  await requireAdmin();

  const rows = await getAllReferralEarnings();
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
  }));
}

/** Every guest report, for moderation. */
export async function fetchAdminReports(): Promise<AdminReportRow[]> {
  await requireAdmin();

  const rows = await getAllReports();
  return rows.map((r) => ({
    ...r,
    appointmentAt: r.appointmentAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}
