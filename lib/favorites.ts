import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites, offerings } from "@/db/schema";
import type { OfferingCard } from "@/lib/offerings";
import { providers } from "@/db/schema";

export async function addFavorite(userId: string, offeringId: string) {
  await db
    .insert(favorites)
    .values({ userId, offeringId })
    .onConflictDoNothing();
}

export async function removeFavorite(userId: string, offeringId: string) {
  await db
    .delete(favorites)
    .where(
      and(eq(favorites.userId, userId), eq(favorites.offeringId, offeringId)),
    );
}

export async function countFavorites(userId: string): Promise<number> {
  const rows = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return rows.length;
}

/** Set of offering ids the user has favorited (for marking cards). */
export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ offeringId: favorites.offeringId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return new Set(rows.map((r) => r.offeringId));
}

/** The user's favorited offerings as cards, most recently saved first. */
export async function getFavoriteOfferings(
  userId: string,
): Promise<(OfferingCard & { hostName: string })[]> {
  return db
    .select({
      id: offerings.id,
      title: offerings.title,
      description: offerings.description,
      category: offerings.category,
      type: offerings.type,
      priceCents: offerings.priceCents,
      currency: offerings.currency,
      durationMinutes: offerings.durationMinutes,
      coverImageUrl: offerings.coverImageUrl,
      hostName: providers.displayName,
    })
    .from(favorites)
    .innerJoin(offerings, eq(offerings.id, favorites.offeringId))
    .innerJoin(providers, eq(providers.id, offerings.providerId))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}
