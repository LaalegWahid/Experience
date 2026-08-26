"use client";

import { useState } from "react";
import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardFields } from "@/components/stripe-card-fields";
import { formatMoney } from "@/shared/utils/money";
import { tryCatch } from "@/shared/utils/TryCatch";
import type { SavedCard } from "@/lib/payment-methods";
import { useLanguage } from "./language-provider";

function brandLabel(brand: string): string {
  return brand
    .split(/[\s_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function BookingPaymentForm({
  clientSecret,
  savedCards,
  amountCents,
  currency,
  onSuccess,
}: {
  clientSecret: string;
  savedCards: SavedCard[];
  amountCents: number | null;
  currency: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  // Selected payment method: a saved card id, or "new" for the custom fields.
  const [selected, setSelected] = useState<string>(savedCards[0]?.id ?? "new");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe) return;
    setError(null);

    let confirm;
    if (selected === "new") {
      if (!elements) return;
      const card = elements.getElement(CardNumberElement);
      if (!card) return;
      confirm = stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
    } else {
      confirm = stripe.confirmCardPayment(clientSecret, {
        payment_method: selected,
      });
    }

    setSubmitting(true);
    const result = await tryCatch(confirm);
    setSubmitting(false);

    if (!result.ok) {
      setError(t("pay.genericError"));
      return;
    }
    if (result.data.error) {
      setError(result.data.error.message ?? t("pay.failed"));
      return;
    }
    if (result.data.paymentIntent?.status === "succeeded") {
      onSuccess();
      return;
    }
    setError(t("pay.incomplete"));
  }

  const rowClass = (active: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
      active
        ? "border-accent bg-accent/10"
        : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    }`;

  const payLabel =
    amountCents != null
      ? t("pay.payAmount").replace("{amount}", formatMoney(amountCents, currency))
      : t("pay.pay");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {savedCards.length > 0 && (
        <div className="flex flex-col gap-2">
          {savedCards.map((c) => (
            <label key={c.id} className={rowClass(selected === c.id)}>
              <input
                type="radio"
                name="paymentMethod"
                checked={selected === c.id}
                onChange={() => {
                  setSelected(c.id);
                  setError(null);
                }}
              />
              <span className="font-medium text-foreground">
                {brandLabel(c.brand)} •••• {c.last4}
              </span>
              <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                {String(c.expMonth).padStart(2, "0")}/
                {String(c.expYear).slice(-2)}
              </span>
            </label>
          ))}
          <label className={rowClass(selected === "new")}>
            <input
              type="radio"
              name="paymentMethod"
              checked={selected === "new"}
              onChange={() => {
                setSelected("new");
                setError(null);
              }}
            />
            <span className="font-medium text-foreground">
              {t("pay.useNewCard")}
            </span>
          </label>
        </div>
      )}

      {selected === "new" && <StripeCardFields />}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t("pay.processing") : payLabel}
      </button>
      <p className="text-center text-xs text-zinc-400">
        {t("pay.securedByStripe")}
      </p>
    </form>
  );
}
