"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminStats, ReferralStats, ReservationStats } from "@/lib/admin";
import type { RevenueTrend, TransactionStats } from "@/lib/transactions";
import type { TrendPoint } from "@/lib/trends";
import { formatMoney } from "@/shared/utils/money";
import { AdminPage } from "@/components/admin/admin-page";
import { TrendChart } from "@/components/admin/trend-chart";
import { adminKeys } from "@/lib/admin-query-keys";
import { fetchAdminOverview } from "./queries";
import { toggleDemoData } from "./actions";

/** Serialized overview payload — Dates are ISO strings across the boundary. */
export type AdminOverviewData = {
  stats: AdminStats & { usersByRole: Record<string, number>; totalUsers: number };
  openReports: number;
  txStats: TransactionStats;
  reservationStats: ReservationStats;
  referralStats: ReferralStats;
  demo: { exists: boolean; hidden: boolean; total: number };
  trends: {
    userGrowth: TrendPoint[];
    reservationsTrend: TrendPoint[];
    revenueTrend: RevenueTrend;
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
  recentReservations: {
    id: string;
    offeringTitle: string;
    guestName: string;
    hostName: string;
    amountCents: number;
    currency: string;
    guestPaid: boolean;
    hostPaidAt: string | null;
  }[];
};

const ROLE_BADGE: Record<string, string> = {
  admin:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  host: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  guest: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

function Metric({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  href?: string;
}) {
  const card = (
    <div
      className={`flex h-full flex-col gap-1 rounded-2xl border p-5 transition-colors ${
        accent
          ? "border-accent/30 bg-accent/5"
          : "border-zinc-200 bg-background hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      <div
        className={`text-2xl font-semibold tracking-tight ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-auto pt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

function SectionHeader({
  title,
  href,
  cta,
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {href && cta && (
        <Link
          href={href}
          className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

/** Hide/show all demo listings, then refresh the cached views it affects. */
function DemoToggle({ hidden, total }: { hidden: boolean; total: number }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => toggleDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
      queryClient.invalidateQueries({ queryKey: adminKeys.listings });
    },
  });

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      title={
        hidden
          ? "Make the demo listings visible on the site again"
          : "Hide all demo listings from the public site"
      }
      className="flex h-10 items-center gap-2 rounded-full border border-zinc-300 px-4 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {hidden ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
          <path d="M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
          <path d="m2 2 20 20" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      )}
      {hidden ? `Show demo data (${total})` : `Hide demo data (${total})`}
    </button>
  );
}

/** Sum a per-currency map into a human label, falling back to a zero amount. */
function moneyLabel(byCurrency: Record<string, number>): string {
  return (
    Object.entries(byCurrency)
      .map(([currency, cents]) => formatMoney(cents, currency))
      .join(" · ") || formatMoney(0)
  );
}

export function AdminOverview() {
  // Data is prefetched on the server and hydrated into this key, so it's
  // present on first render — no loading state needed here.
  const { data } = useQuery({
    queryKey: adminKeys.overview,
    queryFn: fetchAdminOverview,
  });

  if (!data) return null;

  const {
    stats,
    openReports,
    txStats,
    reservationStats,
    referralStats,
    recentUsers,
    recentReservations,
    demo,
    trends,
  } = data;

  const grossLabel = moneyLabel(txStats.grossByCurrency);
  const owedLabel = moneyLabel(reservationStats.owedByCurrency);
  const referralOwedLabel = moneyLabel(referralStats.owedByCurrency);

  return (
    <AdminPage
      title="Overview"
      description="A snapshot of the Gathra marketplace."
      action={
        demo.exists ? (
          <DemoToggle hidden={demo.hidden} total={demo.total} />
        ) : null
      }
    >
      <div className="flex flex-col gap-10">
        {/* Headline metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric
            label="Users"
            value={stats.totalUsers}
            hint={`${stats.usersByRole.host ?? 0} hosts · ${stats.usersByRole.guest ?? 0} guests`}
            href="/admin/users"
          />
          <Metric
            label="Published listings"
            value={stats.offeringsByStatus.published ?? 0}
            hint={`${stats.totalOfferings} total · ${stats.providers} providers`}
            href="/admin/listings"
          />
          <Metric
            label="Reservations"
            value={reservationStats.total}
            hint={`${txStats.total} transactions`}
            href="/admin/reservations"
          />
          <Metric
            label="Host payout owed"
            value={owedLabel}
            hint={`${reservationStats.payoutOwed} awaiting payout`}
            accent
            href="/admin/reservations"
          />
        </div>

        {/* Trends */}
        <section className="flex flex-col gap-3">
          <SectionHeader title="Trends" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrendChart
              title="New users"
              hint="Last 30 days"
              points={trends.userGrowth}
              formatValue={(v) => v.toLocaleString()}
            />
            <TrendChart
              title="Reservations"
              hint="Last 30 days"
              points={trends.reservationsTrend}
              formatValue={(v) => v.toLocaleString()}
            />
            <TrendChart
              title="Revenue"
              hint={`Last 30 days · ${trends.revenueTrend.currency}`}
              points={trends.revenueTrend.points}
              formatValue={(v) => formatMoney(v, trends.revenueTrend.currency)}
            />
          </div>
        </section>

        {/* Payments + activity */}
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Payments"
            href="/admin/transactions"
            cta="View transactions"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Gross volume" value={grossLabel} hint="Net of refunds" />
            <Metric label="Card payments" value={txStats.byMethod.stripe} />
            <Metric label="Crypto payments" value={txStats.byMethod.crypto} />
            <Metric label="Open reports" value={openReports} href="/admin/reports" />
          </div>
        </section>

        {/* Referrals */}
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Referrals"
            href="/admin/referrals"
            cta="View referrals"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Referral payout owed"
              value={referralOwedLabel}
              hint={`${referralStats.owedCount} awaiting payout`}
              accent
              href="/admin/referrals"
            />
            <Metric
              label="Total commissions"
              value={referralStats.total}
              href="/admin/referrals"
            />
          </div>
        </section>

        {/* Recent signups + reservations */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <SectionHeader title="Recent signups" href="/admin/users" cta="All users" />
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              {recentUsers.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-400">
                  No users yet.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {recentUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 bg-background px-4 py-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent">
                        {u.name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          {u.name}
                        </div>
                        <div className="truncate text-xs text-zinc-400">
                          {u.email}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[u.role] ?? ROLE_BADGE.guest}`}
                      >
                        {u.role}
                      </span>
                      <span className="hidden whitespace-nowrap text-xs text-zinc-400 sm:block">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Recent reservations"
              href="/admin/reservations"
              cta="All reservations"
            />
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              {recentReservations.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-400">
                  No reservations yet.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {recentReservations.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 bg-background px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          {r.offeringTitle}
                        </div>
                        <div className="truncate text-xs text-zinc-400">
                          {r.guestName} → {r.hostName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">
                          {formatMoney(r.amountCents, r.currency)}
                        </div>
                        <div className="text-xs">
                          {r.hostPaidAt ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Paid out
                            </span>
                          ) : r.guestPaid ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              Payout owed
                            </span>
                          ) : (
                            <span className="text-zinc-400">Unpaid</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminPage>
  );
}
