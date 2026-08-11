"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { StripeCardFields } from "@/components/stripe-card-fields";
import { tryCatch } from "@/shared/utils/TryCatch";
import {
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/app/account/payment-methods/actions";
import type { SavedCard } from "@/lib/payment-methods";

function CardBrand({ brand }: { brand: string }) {
  const label = brand
    .split(/[\s_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return (
    <span className="flex h-9 w-12 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {label.slice(0, 6)}
    </span>
  );
}

function AddCardForm({
  clientSecret,
  onDone,
  onCancel,
}: {
  clientSecret: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardNumberElement);
    if (!card) return;
    setSubmitting(true);
    setError(null);

    const result = await tryCatch(
      stripe.confirmCardSetup(clientSecret, {
        payment_method: { card },
      }),
    );
    setSubmitting(false);

    if (!result.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }
    if (result.data.error) {
      setError(result.data.error.message ?? "Could not save that card.");
      return;
    }
    if (result.data.setupIntent?.status === "succeeded") onDone();
    else setError("Could not save that card. Please try again.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-background p-6 shadow-sm dark:border-zinc-800 dark:shadow-none"
    >
      <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <CardIcon />
        </span>
        <h2 className="text-base font-semibold text-foreground">Add a card</h2>
      </div>
      <StripeCardFields />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <LockIcon />
        Secured by Stripe. We never see your full card number.
      </p>
    </form>
  );
}

export function PaymentMethodsManager({ cards }: { cards: SavedCard[] }) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function startAdd() {
    setStarting(true);
    setError(null);
    const res = await tryCatch(
      fetch("/api/account/setup-intent", { method: "POST" }),
    );
    if (!res.ok || !res.data.ok) {
      setStarting(false);
      setError("Could not start adding a card. Please try again.");
      return;
    }
    const parsed = await tryCatch(
      res.data.json() as Promise<{ clientSecret?: string }>,
    );
    setStarting(false);
    if (!parsed.ok || !parsed.data.clientSecret) {
      setError("Could not start adding a card. Please try again.");
      return;
    }
    setClientSecret(parsed.data.clientSecret);
  }

  function finishAdd() {
    setClientSecret(null);
    router.refresh();
  }

  function handleRemove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removePaymentMethod(id);
      if (!result.ok) setError(result.error ?? "Could not remove that card.");
      else router.refresh();
    });
  }

  function handleSetDefault(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await setDefaultPaymentMethod(id);
      if (!result.ok) setError(result.error ?? "Could not update default.");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {cards.length > 0 && (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-background p-4 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <CardBrand brand={card.brand} />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-foreground">
                    •••• {card.last4}
                    {card.isDefault && (
                      <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent/15">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Expires{" "}
                    {String(card.expMonth).padStart(2, "0")}/
                    {String(card.expYear).slice(-2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!card.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(card.id)}
                    disabled={pending}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(card.id)}
                  disabled={pending}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-zinc-800"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {clientSecret ? (
        <Elements stripe={stripePromise}>
          <AddCardForm
            clientSecret={clientSecret}
            onDone={finishAdd}
            onCancel={() => setClientSecret(null)}
          />
        </Elements>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <CardIcon big />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No cards saved yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Add a card to check out faster next time. You can remove it whenever
            you like.
          </p>
          <button
            type="button"
            onClick={startAdd}
            disabled={starting}
            className="mt-6 flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <PlusIcon />
            {starting ? "Loading…" : "Add a card"}
          </button>
          <p className="mt-5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <LockIcon />
            Secured by Stripe. We never see your full card number.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          disabled={starting}
          className="flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <PlusIcon />
          {starting ? "Loading…" : "Add another card"}
        </button>
      )}
    </div>
  );
}

function CardIcon({ big }: { big?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={big ? "h-7 w-7" : "h-6 w-6"} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
