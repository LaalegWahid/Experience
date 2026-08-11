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
import { fetchAdminReservations } from "../queries";
import { setHostPaid } from "../actions";

export type AdminReservationRow = {
  id: string;
  offeringTitle: string;
  menuItemName: string | null;
  /** ISO string — serialized for the client boundary. */
  appointmentAt: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  priceCents: number;
  currency: string;
  amountCents: number;
  status: string;
  guestPaid: boolean;
  hostPayout: HostPayout;
  hostPaidAt: string | null;
};

const PER_PAGE = 20;
const STATUSES = ["confirmed", "completed", "executed", "canceled"];

const STATUS_BADGE: Record<string, string> = {
  confirmed:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  executed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

function HostPayoutInfo({ payout }: { payout: HostPayout }) {
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

function PayoutButton({ bookingId, paid }: { bookingId: string; paid: boolean }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => setHostPaid(bookingId, !paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reservations });
      // The overview's payout-owed figures depend on this too.
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

export function ReservationsTable() {
  const { data: reservations = [] } = useQuery({
    queryKey: adminKeys.reservations,
    queryFn: fetchAdminReservations,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [payout, setPayout] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      const haystack = [
        r.offeringTitle,
        r.menuItemName,
        r.hostName,
        r.guestName,
        r.guestEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !q || haystack.includes(q);
      const matchesStatus = !status || r.status === status;
      const matchesPayout =
        !payout ||
        (payout === "paid" ? r.hostPaidAt != null : r.hostPaidAt == null);
      return matchesText && matchesStatus && matchesPayout;
    });
  }, [reservations, query, status, payout]);

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
            placeholder="Search service, host, or guest"
            aria-label="Search reservations"
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
        <select
          value={payout}
          onChange={(e) => {
            setPayout(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by host payout"
          className={adminFilterInput}
        >
          <option value="">All payouts</option>
          <option value="unpaid">Host unpaid</option>
          <option value="paid">Host paid</option>
        </select>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length === reservations.length
          ? `${reservations.length} reservation${reservations.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${reservations.length} reservations`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No reservations match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-215 border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reservation</th>
                <th className="px-4 py-3 font-medium">Host payment info</th>
                <th className="px-4 py-3 font-medium">Gathra → host</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {paged.map((r) => (
                <tr key={r.id} className="bg-background align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {r.offeringTitle}
                    </div>
                    {r.menuItemName && (
                      <div className="text-xs text-zinc-400">
                        {r.menuItemName}
                      </div>
                    )}
                    <div className="text-xs text-zinc-400">
                      {new Date(r.appointmentAt).toLocaleDateString()}{" "}
                      {new Date(r.appointmentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.hostName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.guestName}</div>
                    <div className="text-xs text-zinc-400">{r.guestEmail}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                    {formatMoney(r.priceCents, r.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                    {formatMoney(r.amountCents, r.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_BADGE[r.status] ?? STATUS_BADGE.canceled}`}
                    >
                      {r.status}
                    </span>
                    <div className="mt-1 text-xs">
                      {r.guestPaid ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ Guest paid
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          Awaiting payment
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <HostPayoutInfo payout={r.hostPayout} />
                  </td>
                  <td className="px-4 py-3">
                    {r.hostPaidAt ? (
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        Unpaid
                      </span>
                    )}
                    {r.hostPaidAt && (
                      <div className="mt-1 text-xs text-zinc-400">
                        {new Date(r.hostPaidAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PayoutButton bookingId={r.id} paid={r.hostPaidAt != null} />
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
