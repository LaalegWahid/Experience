"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import {
  AdminPagination,
  adminFilterInput,
} from "@/components/admin/admin-pagination";
import { fetchAdminReports } from "../queries";
import { setReportStatus } from "../actions";

export type AdminReportRow = {
  id: string;
  reason: string;
  reporterName: string;
  reporterEmail: string;
  hostName: string;
  offeringId: string;
  offeringTitle: string;
  status: string;
  details: string | null;
  /** ISO strings — serialized for the client boundary. */
  appointmentAt: string;
  createdAt: string;
};

const PER_PAGE = 15;
const STATUSES = ["open", "reviewed", "dismissed"];

const REASON_LABELS: Record<string, string> = {
  no_show: "Host didn't show up",
  inappropriate: "Inappropriate behavior",
  safety: "Safety concern",
  scam: "Scam or fraud",
  other: "Other",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  reviewed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  dismissed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

function StatusButton({
  reportId,
  status,
  label,
}: {
  reportId: string;
  status: string;
  label: string;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => setReportStatus(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports });
      // The overview's open-reports count depends on this too.
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {label}
    </button>
  );
}

export function ReportsList() {
  const { data: reports = [] } = useQuery({
    queryKey: adminKeys.reports,
    queryFn: fetchAdminReports,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      const haystack = [
        REASON_LABELS[r.reason] ?? r.reason,
        r.reporterName,
        r.reporterEmail,
        r.hostName,
        r.offeringTitle,
      ]
        .join(" ")
        .toLowerCase();
      const matchesText = !q || haystack.includes(q);
      const matchesStatus = !status || r.status === status;
      return matchesText && matchesStatus;
    });
  }, [reports, query, status]);

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
            placeholder="Search reporter, host, or service"
            aria-label="Search reports"
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
        {filtered.length === reports.length
          ? `${reports.length} report${reports.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${reports.length} reports`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No reports match your search.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {paged.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {r.reporterName} ({r.reporterEmail}) reported{" "}
                    <span className="font-medium text-foreground">
                      {r.hostName}
                    </span>{" "}
                    over{" "}
                    <Link
                      href={`/services/${r.offeringId}`}
                      className="text-accent transition-opacity hover:opacity-80"
                    >
                      {r.offeringTitle}
                    </Link>
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_BADGE[r.status]}`}
                >
                  {r.status}
                </span>
              </div>

              {r.details && (
                <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
                  {r.details}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
                <span className="text-xs text-zinc-400">
                  Appointment{" "}
                  {new Date(r.appointmentAt).toLocaleDateString()} · reported{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {r.status !== "reviewed" && (
                    <StatusButton
                      reportId={r.id}
                      status="reviewed"
                      label="Mark reviewed"
                    />
                  )}
                  {r.status !== "dismissed" && (
                    <StatusButton
                      reportId={r.id}
                      status="dismissed"
                      label="Dismiss"
                    />
                  )}
                  {r.status !== "open" && (
                    <StatusButton reportId={r.id} status="open" label="Reopen" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminPagination page={safePage} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
