"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/host";
import {
  cancelBookingWithRefund,
  completeBooking,
  getBookingForUser,
} from "@/lib/bookings";
import { upsertReview } from "@/lib/reviews";
import { createReport, getOfferingHostUserId } from "@/lib/reports";
import type { NewReport } from "@/db/schema";

// A guest may review or report a booking once the service is over — whether it
// completed or was canceled.
const REVIEWABLE = new Set(["completed", "executed", "canceled"]);
const REPORTABLE = new Set(["completed", "executed", "canceled"]);
const REPORT_REASONS = new Set([
  "no_show",
  "inappropriate",
  "safety",
  "scam",
  "other",
]);

export async function cancelBookingAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  // Cancels and issues any refund owed by the offering's cancellation policy.
  await cancelBookingWithRefund(user.id, bookingId);
  revalidatePath("/appointments");
}

export async function completeBookingAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  // completeBooking only succeeds when the appointment is today.
  await completeBooking(user.id, bookingId);
  revalidatePath("/appointments");
}

export async function submitReviewAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;

  const bookingId = String(formData.get("bookingId") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return;
  }

  // Only the owner can review, once the appointment is over (done or canceled).
  // upsert lets them edit a review they already left.
  const booking = await getBookingForUser(user.id, bookingId);
  if (!booking || !REVIEWABLE.has(booking.status)) {
    return;
  }

  await upsertReview({
    bookingId,
    offeringId: booking.offeringId,
    userId: user.id,
    rating,
    comment: comment || null,
  });
  revalidatePath("/appointments");
}

export async function reportHostAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;

  const bookingId = String(formData.get("bookingId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim();
  if (!bookingId || !REPORT_REASONS.has(reason)) return;

  // Must be the guest's own booking, and a past/canceled one.
  const booking = await getBookingForUser(user.id, bookingId);
  if (!booking || !REPORTABLE.has(booking.status)) return;

  const hostUserId = await getOfferingHostUserId(booking.offeringId);
  if (!hostUserId) return;

  await createReport({
    bookingId,
    offeringId: booking.offeringId,
    reporterUserId: user.id,
    hostUserId,
    reason: reason as NewReport["reason"],
    details: details || null,
  });
  revalidatePath("/appointments");
}
