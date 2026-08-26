import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  offerings,
  payoutMethods,
  providers,
  type Offering,
  type Provider,
} from "@/db/schema";

// Server-only host/provider access helpers. These all read the session via
// `next/headers`, so importing them only makes sense on the server. Every
// Server Action that mutates host data MUST go through one of the `require*`
// guards — Server Actions are reachable by direct POST, not just the UI.

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Cached per request — generateMetadata, the page component, and the navbar
// all need the session, and this de-dupes those into a single lookup.
export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  return { id: u.id, name: u.name, email: u.email, role: u.role ?? "guest" };
});

/** Require a signed-in user with host (or admin) privileges. */
export async function requireHostUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "host" && user.role !== "admin") redirect("/");
  return user;
}

export async function getProviderForUser(
  userId: string,
): Promise<Provider | null> {
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userId))
    .limit(1);
  return provider ?? null;
}

/**
 * Require a host who has completed provider onboarding. Redirects to the
 * onboarding form when the host has no provider profile yet.
 */
export async function requireProvider(): Promise<{
  user: SessionUser;
  provider: Provider;
}> {
  const user = await requireHostUser();
  const provider = await getProviderForUser(user.id);
  if (!provider) redirect("/become-a-host");
  return { user, provider };
}

/**
 * Whether the provider has set up a payout method (bank or crypto). A host
 * cannot publish a listing without one — there'd be no way to pay them.
 */
export async function hasPayoutMethod(providerId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: payoutMethods.id })
    .from(payoutMethods)
    .where(eq(payoutMethods.providerId, providerId))
    .limit(1);
  return Boolean(row);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Non-redirecting ownership check for API routes. Returns the offering only if
 * the current user is the host who owns it, otherwise `null` (so callers can
 * respond with a JSON 403/404 instead of redirecting like the page guard).
 */
export async function getOwnedOfferingForApi(
  offeringId: string,
): Promise<{ user: SessionUser; offering: Offering } | null> {
  if (!UUID_RE.test(offeringId)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const provider = await getProviderForUser(user.id);
  if (!provider) return null;
  const [offering] = await db
    .select()
    .from(offerings)
    .where(
      and(eq(offerings.id, offeringId), eq(offerings.providerId, provider.id)),
    )
    .limit(1);
  if (!offering) return null;
  return { user, offering };
}

/**
 * Load an offering and assert it belongs to the current host's provider.
 * Redirects to the dashboard if it doesn't exist or isn't owned by this host.
 */
export async function requireOwnedOffering(offeringId: string): Promise<{
  user: SessionUser;
  provider: Provider;
  offering: Offering;
}> {
  const { user, provider } = await requireProvider();
  const [offering] = await db
    .select()
    .from(offerings)
    .where(
      and(eq(offerings.id, offeringId), eq(offerings.providerId, provider.id)),
    )
    .limit(1);
  if (!offering) redirect("/host");
  return { user, provider, offering };
}
