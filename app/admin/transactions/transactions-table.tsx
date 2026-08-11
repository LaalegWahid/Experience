"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/shared/utils/money";
import { adminKeys } from "@/lib/admin-query-keys";
import {
  AdminPagination,
  adminFilterInput,
} from "@/components/admin/admin-pagination";
import { fetchAdminTransactions } from "../queries";

export type AdminTransactionRow = {
  id: string;
  /** ISO string — serialized for the client boundary. */
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  offeringTitle: string | null;
  method: string;
  network: string | null;
  status: string;
  amountCents: number;
  currency: string;
  refundedCents: number;
  reference: string | null;
};

const PER_PAGE = 20;
const STATUSES = ["pending", "succeeded", "failed", "refunded"];

const METHOD_BADGE: Record<string, string> = {
  stripe: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  crypto: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
  succeeded:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  refunded: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

const METHOD_LABEL: Record<string, string> = {
  stripe: "Card",
  crypto: "Crypto",
};

export function TransactionsTable() {
  const { data: transactions = [] } = useQuery({
    queryKey: adminKeys.transactions,
    queryFn: fetchAdminTransactions,
  });

  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      const haystack = [t.userName, t.userEmail, t.offeringTitle, t.reference]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !q || haystack.includes(q);
      const matchesMethod = !method || t.method === method;
      const matchesStatus = !status || t.status === status;
      return matchesText && matchesMethod && matchesStatus;
    });
  }, [transactions, query, method, status]);

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
            placeholder="Search guest, service, or reference"
            aria-label="Search transactions"
            className={`${adminFilterInput} w-full pl-9`}
          />
        </div>
        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by method"
          className={adminFilterInput}
        >
          <option value="">All methods</option>
          <option value="stripe">Card</option>
          <option value="crypto">Crypto</option>
        </select>
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
        {filtered.length === transactions.length
          ? `${transactions.length} payment${transactions.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${transactions.length} payments`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No transactions match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-180 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/70"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(t.createdAt).toLocaleDateString()}{" "}
                    <span className="text-xs text-zinc-400">
                      {new Date(t.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {t.userName ?? "—"}
                      </span>
                      {t.userEmail && (
                        <span className="text-xs text-zinc-400">
                          {t.userEmail}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {t.offeringTitle ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${METHOD_BADGE[t.method]}`}
                    >
                      {METHOD_LABEL[t.method] ?? t.method}
                      {t.network ? ` · ${t.network}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_BADGE[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                    {formatMoney(t.amountCents, t.currency)}
                    {t.refundedCents > 0 && (
                      <span className="block text-xs font-normal text-amber-600 dark:text-amber-400">
                        −{formatMoney(t.refundedCents, t.currency)} refunded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.reference ? (
                      <span
                        title={t.reference}
                        className="block max-w-40 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        {t.reference}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
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
