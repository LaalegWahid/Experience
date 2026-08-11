import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { ReferralLinksManager, type ReferralLinkView } from "@/components/referrals/referral-links-manager";
import { ReferrerPayoutForm } from "@/components/referrals/referrer-payout-form";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import {
  getReferrerPayoutMethod,
  listReferralEarningsForUser,
  listServiceReferralsForUser,
  referralEarningsSummary,
  referralStatus,
  referralUrl,
} from "@/lib/referrals";
import { env } from "@/shared/utils/env";
import { formatMoney } from "@/shared/utils/money";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("refer.metaTitle") };
}

export default async function ReferPage(props: PageProps<"/refer">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/refer");
  const userId = session.user.id;

  // Where to send the user after they save a payout method. Only accept a
  // same-origin relative path so this can't be turned into an open redirect.
  const fromParam = (await props.searchParams).from;
  const from = typeof fromParam === "string" ? fromParam : undefined;
  const redirectTo =
    from && /^\/(?!\/)/.test(from) ? from : undefined;

  const t = await getT();
  const [payout, referrals, earnings, summary] = await Promise.all([
    getReferrerPayoutMethod(userId),
    listServiceReferralsForUser(userId),
    listReferralEarningsForUser(userId),
    referralEarningsSummary(userId),
  ]);

  const links: ReferralLinkView[] = referrals.map((r) => {
    const status = referralStatus(r);
    return {
      id: r.id,
      url: status === "active" ? referralUrl(env.BETTER_AUTH_URL, r.token) : null,
      status,
      serviceTitle: r.offeringTitle,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      redeemedAt: r.redeemedAt ? r.redeemedAt.toISOString() : null,
    };
  });

  const owed = Object.entries(summary.owedByCurrency);
  const paid = Object.entries(summary.paidByCurrency);

  return (
    <>
      <Navbar />

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("refer.title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("refer.subtitle")}</p>
        </header>

        {/* Earnings */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("ref.earningsTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("ref.owed")}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {owed.length === 0
                  ? formatMoney(0)
                  : owed
                      .map(([cur, cents]) => formatMoney(cents, cur))
                      .join(" · ")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("ref.paid")}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {paid.length === 0
                  ? formatMoney(0)
                  : paid
                      .map(([cur, cents]) => formatMoney(cents, cur))
                      .join(" · ")}
              </p>
            </div>
          </div>

          {earnings.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("ref.earnEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {earnings.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-background px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {e.offeringTitle ?? "—"}
                    </span>
                    <span className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
                      {t(`ref.earn.${e.status}` as TranslationKey)}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatMoney(e.amountCents, e.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Payout method */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("ref.payoutTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("ref.payoutDesc")}
            </p>
          </div>
          <ReferrerPayoutForm
            defaults={
              payout
                ? {
                    type: payout.type,
                    accountHolderName: payout.accountHolderName ?? undefined,
                    iban: payout.iban ?? undefined,
                    bic: payout.bic ?? undefined,
                    bankName: payout.bankName ?? undefined,
                    country: payout.country ?? undefined,
                    walletAddress: payout.walletAddress ?? undefined,
                    chain: payout.chain ?? undefined,
                    stablecoin: payout.stablecoin ?? undefined,
                  }
                : {}
            }
            redirectTo={redirectTo}
          />
        </section>

        {/* Links */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("ref.linksTitle")}
          </h2>
          <ReferralLinksManager links={links} />
        </section>
      </main>
    </>
  );
}
