"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { offerings, reports } from "@/db/schema";
import {
  getDemoDataState,
  requireAdmin,
  setDemoDataHidden,
  setReferralEarningPaid,
  setReservationHostPaid,
} from "@/lib/admin";
import { ROLES, type Role } from "@/lib/roles";

const OFFERING_STATUSES = ["draft", "published", "archived"] as const;
type OfferingStatus = (typeof OFFERING_STATUSES)[number];

const REPORT_STATUSES = ["open", "reviewed", "dismissed"] as const;
type ReportStatus = (typeof REPORT_STATUSES)[number];

// These run as server actions invoked from the admin tables via TanStack
// `useMutation`. They only write — the client invalidates the relevant query
// on success to refresh the cache, so there's no per-route `revalidatePath`
// here (except for the public `/services` page, which TanStack doesn't manage).

/** Change a user's role. Admins can't demote themselves (avoids lockout). */
export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();

  if (!userId || !ROLES.includes(role as Role)) return;
  if (userId === admin.id && role !== "admin") return;

  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

/** Moderate any listing's visibility (publish / unpublish / archive). */
export async function setOfferingStatus(offeringId: string, status: string) {
  await requireAdmin();

  if (!offeringId || !OFFERING_STATUSES.includes(status as OfferingStatus)) {
    return;
  }

  await db
    .update(offerings)
    .set({
      status: status as OfferingStatus,
      updatedAt: new Date(),
      ...(status === "published" ? { publishedAt: new Date() } : {}),
    })
    .where(eq(offerings.id, offeringId));
}

/**
 * Approve or reject a listing that a host submitted for review. Approving
 * publishes it (and stamps `publishedAt`); rejecting sends it back to the host
 * as a draft they can edit and resubmit.
 */
export async function reviewListing(offeringId: string, approve: boolean) {
  await requireAdmin();
  if (!offeringId) return;

  const [row] = await db
    .select({ metadata: offerings.metadata })
    .from(offerings)
    .where(eq(offerings.id, offeringId))
    .limit(1);
  if (!row) return;

  await db
    .update(offerings)
    .set({
      status: approve ? "published" : "draft",
      publishedAt: approve ? new Date() : null,
      metadata: {
        ...row.metadata,
        moderationStatus: approve ? "approved" : "rejected",
      },
      updatedAt: new Date(),
    })
    .where(eq(offerings.id, offeringId));

  // The public marketplace isn't a TanStack-managed view, so refresh it here.
  revalidatePath("/services");
}

/** Move a guest report through the moderation lifecycle. */
export async function setReportStatus(reportId: string, status: string) {
  await requireAdmin();

  if (!reportId || !REPORT_STATUSES.includes(status as ReportStatus)) return;

  await db
    .update(reports)
    .set({ status: status as ReportStatus })
    .where(eq(reports.id, reportId));
}

/** Hide or show all demo (seed) listings across the public site in one tap. */
export async function toggleDemoData() {
  await requireAdmin();

  const { hidden } = await getDemoDataState();
  await setDemoDataHidden(!hidden);

  // The public marketplace isn't a TanStack-managed view, so refresh it here.
  revalidatePath("/services");
}

/** Record (or revert) Gathra's payout to the host for a reservation. */
export async function setHostPaid(bookingId: string, paid: boolean) {
  await requireAdmin();

  if (!bookingId) return;

  await setReservationHostPaid(bookingId, paid);
}

/** Record (or revert) Gathra's commission payout to a referrer. */
export async function setReferralPaid(earningId: string, paid: boolean) {
  await requireAdmin();

  if (!earningId) return;

  await setReferralEarningPaid(earningId, paid);
}
