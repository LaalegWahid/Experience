import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getBookingForUser } from "@/lib/bookings";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

// POST /api/v1/reviews — review a completed booking (brief step 7).
export async function POST(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid review payload.",
      "validation_error",
    );
  }
  const { bookingId, rating, comment } = parsed.data;
  if (!UUID_RE.test(bookingId)) {
    return apiError(404, "Booking not found.", "not_found");
  }

  const booking = await getBookingForUser(actor.user.id, bookingId);
  if (!booking) return apiError(404, "Booking not found.", "not_found");
  if (booking.status !== "completed" && booking.status !== "executed") {
    return apiError(
      409,
      "You can only review a booking after it's completed.",
      "not_completed",
    );
  }

  // One review per booking.
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .limit(1);
  if (existing) {
    return apiError(409, "This booking has already been reviewed.", "already_reviewed");
  }

  const [review] = await db
    .insert(reviews)
    .values({
      bookingId,
      offeringId: booking.offeringId,
      userId: actor.user.id,
      rating,
      comment: comment ?? null,
    })
    .returning();

  return apiOk(
    {
      id: review.id,
      bookingId: review.bookingId,
      offeringId: review.offeringId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    },
    201,
  );
}
