import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payoutMethods } from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { PayoutForm, type PayoutDefaults } from "./payout-form";

export default async function PayoutsPage() {
  const { provider } = await requireProvider();

  const [method] = await db
    .select()
    .from(payoutMethods)
    .where(eq(payoutMethods.providerId, provider.id))
    .limit(1);

  const defaults: PayoutDefaults = method
    ? {
        type: method.type,
        accountHolderName: method.accountHolderName ?? "",
        iban: method.iban ?? "",
        bic: method.bic ?? "",
        bankName: method.bankName ?? "",
        country: method.country ?? "",
        walletAddress: method.walletAddress ?? "",
        chain: method.chain ?? "",
        stablecoin: method.stablecoin ?? "",
      }
    : {};

  return (
    <div className="flex flex-col gap-6">
      {/* Title + intro stay at the top-left of the page. */}
      <div className="flex flex-col gap-2">
        <Link
          href="/host"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors duration-200 ease-out hover:text-accent dark:text-zinc-400"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Payout method
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          When a guest pays, we collect the funds (card via Stripe, or
          stablecoin) and send your share here. Add a bank account or a crypto
          wallet so you can get paid.
        </p>
      </div>

      {/* The form itself is centered. */}
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-black/5 bg-[#fff7f1] p-6 shadow-sm dark:border-white/10 dark:bg-[#1e1a15] dark:shadow-none sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-black/5 pb-5 dark:border-white/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" /><path d="M16 12h.01" /></svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Where should we send your earnings?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Pick a method and fill in the details below.</p>
            </div>
          </div>
          <PayoutForm defaults={defaults} />
        </div>
        <div className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          <p>
            Your details are used only to send your payouts. Keep your IBAN or
            wallet address accurate, so payouts go exactly where you specify.
          </p>
        </div>
      </div>
    </div>
  );
}
