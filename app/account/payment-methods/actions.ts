"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getStripeCustomerId } from "@/lib/stripe-customer";
import { paymentMethodBelongsToUser } from "@/lib/payment-methods";
import { tryCatch } from "@/shared/utils/TryCatch";

type ActionResult = { ok: boolean; error?: string };

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/** Detach a saved card from the signed-in user's Stripe customer. */
export async function removePaymentMethod(
  paymentMethodId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const owns = await tryCatch(
    paymentMethodBelongsToUser(userId, paymentMethodId),
  );
  if (!owns.ok || !owns.data) {
    return { ok: false, error: "Card not found." };
  }

  const detached = await tryCatch(stripe.paymentMethods.detach(paymentMethodId));
  if (!detached.ok) {
    console.error("[payment-methods] detach failed:", detached.error);
    return { ok: false, error: "Could not remove that card." };
  }

  revalidatePath("/account/payment-methods");
  return { ok: true };
}

/** Make a saved card the customer's default for future checkouts. */
export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const owns = await tryCatch(
    paymentMethodBelongsToUser(userId, paymentMethodId),
  );
  if (!owns.ok || !owns.data) {
    return { ok: false, error: "Card not found." };
  }

  const customerId = await getStripeCustomerId(userId);
  if (!customerId) return { ok: false, error: "Card not found." };

  const updated = await tryCatch(
    stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    }),
  );
  if (!updated.ok) {
    console.error("[payment-methods] set default failed:", updated.error);
    return { ok: false, error: "Could not update your default card." };
  }

  revalidatePath("/account/payment-methods");
  return { ok: true };
}
