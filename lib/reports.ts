import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bookings, offerings, providers, reports, type NewReport } from "@/db/schema";
import { user } from "@/db/auth-schema";

export async function createReport(values: NewReport) {
  // One report per booking — re-reporting is a no-op.
  return db.insert(reports).values(values).onConflictDoNothing().returning();
}

/** Booking ids the user has already reported, to show a "reported" state. */
export async function getReportedBookingIds(
  userId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ bookingId: reports.bookingId })
    .from(reports)
    .where(eq(reports.reporterUserId, userId));
  return new Set(rows.map((r) => r.bookingId));
}

/** The host (user id) behind an offering, to attribute a report to. */
export async function getOfferingHostUserId(
  offeringId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ userId: providers.userId })
    .from(offerings)
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .where(eq(offerings.id, offeringId))
    .limit(1);
  return row?.userId ?? null;
}

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  createdAt: Date;
  reporterName: string;
  reporterEmail: string;
  hostName: string;
  offeringId: string;
  offeringTitle: string;
  appointmentAt: Date;
};

/** All guest reports for the admin moderation queue, newest first. */
export async function getAllReports(): Promise<AdminReport[]> {
  const reporter = alias(user, "reporter");
  const host = alias(user, "host");
  return db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterName: reporter.name,
      reporterEmail: reporter.email,
      hostName: host.name,
      offeringId: reports.offeringId,
      offeringTitle: offerings.title,
      appointmentAt: bookings.appointmentAt,
    })
    .from(reports)
    .innerJoin(reporter, eq(reporter.id, reports.reporterUserId))
    .innerJoin(host, eq(host.id, reports.hostUserId))
    .innerJoin(offerings, eq(offerings.id, reports.offeringId))
    .innerJoin(bookings, eq(bookings.id, reports.bookingId))
    .orderBy(desc(reports.createdAt));
}

/** Count of reports still needing attention — for the admin overview. */
export async function countOpenReports(): Promise<number> {
  const rows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.status, "open"));
  return rows.length;
}
