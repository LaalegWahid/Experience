import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stripeCustomers } from "@/db/schema";
import { stripe } from "@/lib/stripe";

/** The Stripe customer id mapped to a user, or null if none exists yet. */
export async function getStripeCustomerId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: stripeCustomers.stripeCustomerId })
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Returns the user's Stripe customer id, creating (and persisting) one on the
 * first call. Safe against a concurrent insert via onConflictDoNothing.
 */
export async function getOrCreateStripeCustomer(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const existing = await getStripeCustomerId(user.id);
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  await db
    .insert(stripeCustomers)
    .values({ userId: user.id, stripeCustomerId: customer.id })
    .onConflictDoNothing();

  // Re-read in case another request won the race and inserted first.
  const stored = await getStripeCustomerId(user.id);
  return stored ?? customer.id;
}
