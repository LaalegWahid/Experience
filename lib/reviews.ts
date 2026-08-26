import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  guestReviews,
  offerings,
  providers,
  reviews,
  type NewReview,
} from "@/db/schema";
import { user } from "@/db/auth-schema";

export async function createReview(values: NewReview) {
  return db.insert(reviews).values(values).onConflictDoNothing().returning();
}

/**
 * Create a review or update the existing one for the booking — lets a guest
 * edit a review they already left. Keyed on the unique booking_id.
 */
export async function upsertReview(values: NewReview) {
  return db
    .insert(reviews)
    .values(values)
    .onConflictDoUpdate({
      target: reviews.bookingId,
      set: { rating: values.rating, comment: values.comment ?? null },
    })
    .returning();
}

export type UserReview = { bookingId: string; rating: number; comment: string | null };

/** The current guest's reviews, keyed by booking, to show what they've left. */
export async function getReviewsByUser(
  userId: string,
): Promise<Map<string, UserReview>> {
  const rows = await db
    .select({
      bookingId: reviews.bookingId,
      rating: reviews.rating,
      comment: reviews.comment,
    })
    .from(reviews)
    .where(eq(reviews.userId, userId));
  return new Map(rows.map((r) => [r.bookingId, r]));
}

export type Rating = { average: number; count: number };

// Average = total stars / number of reviews.
function toRating(sum: number, count: number): Rating {
  return { average: count > 0 ? sum / count : 0, count };
}

/**
 * A host's rating: the average across all reviews guests left on the host's
 * offerings.
 */
export async function getHostRating(userId: string): Promise<Rating> {
  const [row] = await db
    .select({
      sum: sql<number>`coalesce(sum(${reviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .innerJoin(offerings, eq(offerings.id, reviews.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .where(eq(providers.userId, userId));
  return toRating(Number(row?.sum ?? 0), Number(row?.count ?? 0));
}

/**
 * A guest's rating: the average across all reviews hosts left about the guest.
 */
export async function getGuestRating(userId: string): Promise<Rating> {
  const [row] = await db
    .select({
      sum: sql<number>`coalesce(sum(${guestReviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(guestReviews)
    .where(eq(guestReviews.guestUserId, userId));
  return toRating(Number(row?.sum ?? 0), Number(row?.count ?? 0));
}

export type OfferingReview = {
  id: string;
  rating: number;
  comment: string | null;
  guestName: string;
  createdAt: Date;
};

/** Reviews for an offering, newest first — shown to the host. */
export async function getOfferingReviews(
  offeringId: string,
): Promise<OfferingReview[]> {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      guestName: user.name,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(user, eq(user.id, reviews.userId))
    .where(eq(reviews.offeringId, offeringId))
    .orderBy(desc(reviews.createdAt));
}

export type HostReview = OfferingReview & {
  offeringId: string;
  offeringTitle: string;
};

/**
 * Every review across all of a host's offerings, newest first. Carries the
 * service title so the host can see which listing each review is for.
 */
export async function getProviderReviews(
  userId: string,
): Promise<HostReview[]> {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      guestName: user.name,
      createdAt: reviews.createdAt,
      offeringId: offerings.id,
      offeringTitle: offerings.title,
    })
    .from(reviews)
    .innerJoin(offerings, eq(offerings.id, reviews.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .innerJoin(user, eq(user.id, reviews.userId))
    .where(eq(providers.userId, userId))
    .orderBy(desc(reviews.createdAt));
}
