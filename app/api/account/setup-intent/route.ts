import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customer";
import { tryCatch } from "@/shared/utils/TryCatch";

// Issues a SetupIntent so the browser can collect and save a card to the
// signed-in user's Stripe customer (no charge).
export async function POST() {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) {
    console.error("[setup-intent] session failed:", sessionResult.error);
    return NextResponse.json({ error: "Could not start." }, { status: 500 });
  }
  const session = sessionResult.data;
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const result = await tryCatch(
    (async () => {
      const customerId = await getOrCreateStripeCustomer({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });
      return stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
      });
    })(),
  );
  if (!result.ok) {
    console.error("[setup-intent] failed:", result.error);
    return NextResponse.json(
      { error: "Could not start adding a card." },
      { status: 500 },
    );
  }

  return NextResponse.json({ clientSecret: result.data.client_secret });
}
