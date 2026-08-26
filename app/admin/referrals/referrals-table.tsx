"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/shared/utils/money";
import type { HostPayout } from "@/lib/admin";
import { adminKeys } from "@/lib/admin-query-keys";
import {
  AdminPagination,
  adminFilterInput,
} from "@/components/admin/admin-pagination";
import { fetchAdminReferrals } from "../queries";
import { setReferralPaid } from "../actions";

export type AdminReferralRow = {
  id: string;
  /** ISO string — serialized for the client boundary. */
  createdAt: string;
  referrerName: string | null;
  referrerEmail: string | null;
  serviceTitle: string | null;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
  payout: HostPayout;
};

const PER_PAGE = 20;
const STATUSES = ["pending", "owed", "paid", "reversed"];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
  owed: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  reversed: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

function ReferrerPayoutInfo({ payout }: { payout: HostPayout }) {
  if (!payout) {
    return (
      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        No payout method set
      </p>
    );
  }
  if (payout.type === "bank") {
    return (
      <div className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium uppercase tracking-wide text-zinc-400">
          Bank / RIB
        </span>
        {payout.accountHolderName && <span>{payout.accountHolderName}</span>}
        {payout.iban && (
          <span className="font-mono text-foreground">{payout.iban}</span>
        )}
        <span>
          {[payout.bic && `BIC ${payout.bic}`, payout.bankName, payout.country]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
    );
  }
  return (
    <div className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      <span className="font-medium uppercase tracking-wide text-zinc-400">
        {payout.stablecoin ?? "Crypto"}
        {payout.chain ? ` · ${payout.chain}` : ""}
      </span>
      {payout.walletAddress && (
        <span
          title={payout.walletAddress}
          className="max-w-50 truncate font-mono text-foreground"
        >
          {payout.walletAddress}
        </span>
      )}
    </div>
  );
}

function PayoutButton({ earningId, paid }: { earningId: string; paid: boolean }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => setReferralPaid(earningId, !paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.referrals });
      // The overview's referral-owed figures depend on this too.
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={
        paid
          ? "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          : "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-200"
      }
    >
      {paid ? "Mark unpaid" : "Mark paid"}
    </button>
  );
}

export function ReferralsTable() {
  const { data: earnings = [] } = useQuery({
    queryKey: adminKeys.referrals,
    queryFn: fetchAdminReferrals,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return earnings.filter((e) => {
      const haystack = [e.referrerName, e.referrerEmail, e.serviceTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !q || haystack.includes(q);
      const matchesStatus = !status || e.status === status;
      return matchesText && matchesStatus;
    });
  }, [earnings, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search referrer or service"
            aria-label="Search referral earnings"
            className={`${adminFilterInput} w-full pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className={`${adminFilterInput} capitalize`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length === earnings.length
          ? `${earnings.length} commission${earnings.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${earnings.length} commissions`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No referral commissions match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-200 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Referrer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Payout to</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Commission</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/70"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {e.referrerName ?? "—"}
                      </span>
                      {e.referrerEmail && (
                        <span className="text-xs text-zinc-400">
                          {e.referrerEmail}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {e.serviceTitle ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <ReferrerPayoutInfo payout={e.payout} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_BADGE[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                    {formatMoney(e.amountCents, e.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.status === "owed" || e.status === "paid" ? (
                      <PayoutButton
                        earningId={e.id}
                        paid={e.status === "paid"}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination page={safePage} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
