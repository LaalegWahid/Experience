"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/shared/utils/money";
import { adminKeys } from "@/lib/admin-query-keys";
import {
  AdminPagination,
  adminFilterInput,
} from "@/components/admin/admin-pagination";
import { fetchAdminListings } from "../queries";
import { reviewListing, setOfferingStatus } from "../actions";

export type AdminListingRow = {
  id: string;
  title: string;
  status: string;
  moderationStatus?: string | null;
  priceCents: number;
  currency: string;
  hostName: string;
};

const PER_PAGE = 20;
// "under_review" is a synthetic filter: those listings are stored as drafts
// flagged in metadata, not a real DB status.
const STATUS_OPTIONS = [
  { value: "under_review", label: "Under review" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const STATUS_BADGE: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  draft: "bg-accent/10 text-accent dark:bg-accent/15",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
  under_review:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const actionBtn =
  "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

function StatusButton({
  offeringId,
  status,
  label,
}: {
  offeringId: string;
  status: string;
  label: string;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => setOfferingStatus(offeringId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.listings });
      // The overview's listing counts depend on this too.
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={actionBtn}
    >
      {label}
    </button>
  );
}

function ReviewButton({
  offeringId,
  approve,
  label,
  primary,
}: {
  offeringId: string;
  approve: boolean;
  label: string;
  primary?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => reviewListing(offeringId, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.listings });
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={
        primary
          ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          : actionBtn
      }
    >
      {label}
    </button>
  );
}

export function ListingsTable() {
  const { data: listings = [] } = useQuery({
    queryKey: adminKeys.listings,
    queryFn: fetchAdminListings,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesText =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.hostName.toLowerCase().includes(q);
      const pending = l.moderationStatus === "pending";
      const matchesStatus = !status
        ? true
        : status === "under_review"
          ? pending
          : l.status === status && !pending;
      return matchesText && matchesStatus;
    });
  }, [listings, query, status]);

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
            placeholder="Search by title or host"
            aria-label="Search listings"
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length === listings.length
          ? `${listings.length} listing${listings.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${listings.length} listings`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No listings match your search.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {paged.map((l) => {
            const pending = l.moderationStatus === "pending";
            const rejected =
              l.moderationStatus === "rejected" && l.status === "draft";
            const badgeKey = pending
              ? "under_review"
              : rejected
                ? "rejected"
                : l.status;
            const badgeLabel = pending
              ? "Under review"
              : rejected
                ? "Rejected"
                : l.status;
            return (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium text-foreground">{l.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium capitalize ${
                        STATUS_BADGE[badgeKey] ?? STATUS_BADGE.archived
                      }`}
                    >
                      {badgeLabel}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      by {l.hostName}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatMoney(l.priceCents, l.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pending ? (
                    <>
                      <Link
                        href={`/services/${l.id}`}
                        target="_blank"
                        className={actionBtn}
                      >
                        View
                      </Link>
                      <ReviewButton offeringId={l.id} approve label="Approve" primary />
                      <ReviewButton offeringId={l.id} approve={false} label="Reject" />
                    </>
                  ) : l.status === "published" ? (
                    <StatusButton offeringId={l.id} status="draft" label="Unpublish" />
                  ) : (
                    <StatusButton offeringId={l.id} status="published" label="Publish" />
                  )}
                  {l.status !== "archived" && (
                    <StatusButton offeringId={l.id} status="archived" label="Archive" />
                  )}
                  {l.status === "published" && (
                    <Link href={`/services/${l.id}`} className={actionBtn}>
                      View
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AdminPagination page={safePage} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
