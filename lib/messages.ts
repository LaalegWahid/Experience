import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, offerings, type NewMessage } from "@/db/schema";
import { user } from "@/db/auth-schema";

/** All messages in the (offering, guest) conversation, oldest first. */
export async function getConversation(offeringId: string, guestId: string) {
  return db
    .select()
    .from(messages)
    .where(
      and(eq(messages.offeringId, offeringId), eq(messages.guestId, guestId)),
    )
    .orderBy(asc(messages.createdAt));
}

export async function createMessage(values: NewMessage) {
  return db.insert(messages).values(values).returning();
}

export type Conversation = {
  guestId: string;
  guestName: string;
  lastBody: string;
  lastAt: Date;
};

/**
 * One row per guest who has messaged about an offering, with their latest
 * message — the host's inbox for that listing, most recent first. Uses
 * Postgres's `DISTINCT ON` so the database returns one row per guest
 * directly (backed by the `messages_offering_guest_idx` index), instead of
 * pulling every message ever sent for the offering and collapsing it in JS —
 * that used to get slower forever as message history grew.
 */
export async function getOfferingConversations(
  offeringId: string,
): Promise<Conversation[]> {
  const rows = await db
    .selectDistinctOn([messages.guestId], {
      guestId: messages.guestId,
      guestName: user.name,
      lastBody: messages.body,
      lastAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(user, eq(user.id, messages.guestId))
    .where(eq(messages.offeringId, offeringId))
    .orderBy(messages.guestId, desc(messages.createdAt));

  return rows.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export type ProviderConversation = Conversation & {
  offeringId: string;
  offeringTitle: string;
};

/**
 * Every guest conversation across all of a provider's listings — the unified
 * host inbox. One row per (listing, guest) with their latest message, most
 * recent first. `DISTINCT ON (offeringId, guestId)` gets the database to
 * return exactly the rows we need instead of fetching every message across
 * every one of the provider's listings and collapsing it in JS — this is the
 * host's main inbox view, loaded on every visit, so it can't afford to get
 * slower as total message history grows.
 */
export async function getProviderConversations(
  providerId: string,
): Promise<ProviderConversation[]> {
  const rows = await db
    .selectDistinctOn([messages.offeringId, messages.guestId], {
      offeringId: messages.offeringId,
      offeringTitle: offerings.title,
      guestId: messages.guestId,
      guestName: user.name,
      lastBody: messages.body,
      lastAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(offerings, eq(offerings.id, messages.offeringId))
    .innerJoin(user, eq(user.id, messages.guestId))
    .where(eq(offerings.providerId, providerId))
    .orderBy(messages.offeringId, messages.guestId, desc(messages.createdAt));

  return rows.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}
