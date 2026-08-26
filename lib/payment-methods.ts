import { stripe } from "@/lib/stripe";
import { getStripeCustomerId } from "@/lib/stripe-customer";

export type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

/** A user's saved card payment methods, default first. */
export async function getUserCards(userId: string): Promise<SavedCard[]> {
  const customerId = await getStripeCustomerId(userId);
  if (!customerId) return [];

  const customer = await stripe.customers.retrieve(customerId);
  const defaultPm =
    customer.deleted === true
      ? null
      : typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method?.id ?? null);

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  const cards = methods.data
    .filter((m) => m.card)
    .map((m) => ({
      id: m.id,
      brand: m.card!.brand,
      last4: m.card!.last4,
      expMonth: m.card!.exp_month,
      expYear: m.card!.exp_year,
      isDefault: m.id === defaultPm,
    }));

  // Default card first, then by most recently added (Stripe returns newest first).
  cards.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  return cards;
}

/** Confirms a payment method belongs to the given user's Stripe customer. */
export async function paymentMethodBelongsToUser(
  userId: string,
  paymentMethodId: string,
): Promise<boolean> {
  const customerId = await getStripeCustomerId(userId);
  if (!customerId) return false;
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  return pm.customer === customerId;
}
