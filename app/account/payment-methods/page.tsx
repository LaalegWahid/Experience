import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { PaymentMethodsManager } from "@/components/payment-methods-manager";
import { auth } from "@/lib/auth";
import { getUserCards, type SavedCard } from "@/lib/payment-methods";
import { tryCatch } from "@/shared/utils/TryCatch";

export const metadata: Metadata = {
  title: "Payment methods · Local Experiences",
};

export default async function PaymentMethodsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/account/payment-methods");

  // Resilient to Stripe being unreachable — falls back to an empty list.
  let cards: SavedCard[] = [];
  const result = await tryCatch(getUserCards(session.user.id));
  if (result.ok) cards = result.data;

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Payment methods
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Save a card for faster checkout. Cards are stored securely by Stripe,
            so we never see your full number.
          </p>
        </header>

        <div className="mt-8">
          <PaymentMethodsManager cards={cards} />
        </div>
      </main>
    </>
  );
}
