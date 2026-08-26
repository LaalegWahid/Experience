"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, guestReviews, offerings } from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { str } from "@/shared/utils/form";

/** Host leaves a review of the guest after a completed/executed booking. */
export async function submitGuestReview(formData: FormData) {
  const { user, provider } = await requireProvider();

  const bookingId = str(formData, "bookingId");
  const rating = Number(str(formData, "rating"));
  const comment = str(formData, "comment");
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return;
  }

  // The booking must belong to one of this host's offerings and have happened.
  const [row] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      offeringId: bookings.offeringId,
      guestUserId: bookings.userId,
    })
    .from(bookings)
    .innerJoin(offerings, eq(offerings.id, bookings.offeringId))
    .where(
      and(eq(bookings.id, bookingId), eq(offerings.providerId, provider.id)),
    )
    .limit(1);

  if (!row) return;
  if (row.status !== "completed" && row.status !== "executed") return;

  await db
    .insert(guestReviews)
    .values({
      bookingId: row.id,
      offeringId: row.offeringId,
      guestUserId: row.guestUserId,
      hostUserId: user.id,
      rating,
      comment: comment || null,
    })
    .onConflictDoNothing(); // one host review per booking

  revalidatePath("/host/bookings");
}
