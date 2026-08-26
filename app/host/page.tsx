import Link from "next/link";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  bookings,
  offerings,
  payoutMethods,
} from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { formatMoney } from "@/shared/utils/money";
import { labelFor, OFFERING_TYPES } from "@/shared/data/offerings";
import { ApiKeysSection } from "@/components/api-keys/api-keys-section";
import { HostPage } from "@/components/host-page";
import { DeleteListingButton } from "./_components/delete-listing-button";
import { deleteOffering } from "./listings/actions";

const STATUS_BADGE: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  draft: "bg-accent/10 text-accent dark:bg-accent/15",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
  in_progress:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  under_review:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

// Friendlier wording for the listings tab than the raw DB status.
const STATUS_LABEL: Record<string, string> = {
  published: "Active",
  draft: "Draft",
  archived: "Paused",
  in_progress: "In progress",
  under_review: "Under review",
  rejected: "Needs changes",
};

function availabilityLabel(days: number): string {
  if (!days) return "No availability set";
  return `Available ${days} day${days === 1 ? "" : "s"}/week`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#fff7f1] p-5 dark:border-white/10 dark:bg-[#1e1a15]">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

export default async function HostDashboard() {
  const { provider } = await requireProvider();

  const listings = await db
    .select()
    .from(offerings)
    .where(eq(offerings.providerId, provider.id))
    .orderBy(desc(offerings.updatedAt));

  const listingIds = listings.map((l) => l.id);

  // Availability summary (distinct weekdays with a schedule) and upcoming
  // reservation counts, fetched in two grouped queries and keyed by listing.
  const availabilityRows = listingIds.length
    ? await db
        .select({
          offeringId: availabilityRules.offeringId,
          days: sql<number>`count(distinct ${availabilityRules.dayOfWeek})`,
        })
        .from(availabilityRules)
        .where(inArray(availabilityRules.offeringId, listingIds))
        .groupBy(availabilityRules.offeringId)
    : [];

  const upcomingRows = listingIds.length
    ? await db
        .select({
          offeringId: bookings.offeringId,
          upcoming: count(),
        })
        .from(bookings)
        .where(
          and(
            inArray(bookings.offeringId, listingIds),
            eq(bookings.status, "confirmed"),
            gte(bookings.appointmentAt, new Date()),
          ),
        )
        .groupBy(bookings.offeringId)
    : [];

  const daysByListing = new Map(
    availabilityRows.map((r) => [r.offeringId, Number(r.days)]),
  );
  const upcomingByListing = new Map(
    upcomingRows.map((r) => [r.offeringId, Number(r.upcoming)]),
  );

  const [payoutMethod] = await db
    .select({ id: payoutMethods.id })
    .from(payoutMethods)
    .where(eq(payoutMethods.providerId, provider.id))
    .limit(1);

  const published = listings.filter((l) => l.status === "published").length;
  const drafts = listings.filter((l) => l.status === "draft").length;

  return (
    <HostPage
      title={provider.displayName}
      description="Manage your listings and availability."
      action={
        <Link
          href="/host/listings/new"
          className="flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90"
        >
          New listing
        </Link>
      }
    >
      {!payoutMethod && (
        <Link
          href="/host/payouts"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/10"
        >
          <div>
            <p className="font-medium text-foreground">
              Add your payout details
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Set a bank account or crypto wallet so you can get paid for
              bookings.
            </p>
          </div>
          <span className="text-sm font-medium text-accent">Set up →</span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Listings" value={listings.length} />
        <Stat label="Published" value={published} />
        <Stat label="Drafts" value={drafts} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your listings
        </h2>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-10 text-center dark:border-orange-900/40 dark:bg-[#1e1a15]">
            <p className="text-zinc-600 dark:text-zinc-400">
              You don&apos;t have any listings yet.
            </p>
            <Link
              href="/host/listings/new"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => {
              const inProgress =
                l.status === "draft" && l.metadata?.inProgress === true;
              const mod = l.metadata?.moderationStatus;
              const underReview =
                !inProgress && l.status === "draft" && mod === "pending";
              const rejected =
                !inProgress && l.status === "draft" && mod === "rejected";
              const badgeKey = inProgress
                ? "in_progress"
                : underReview
                  ? "under_review"
                  : rejected
                    ? "rejected"
                    : l.status;
              const badgeLabel =
                STATUS_LABEL[badgeKey] ?? STATUS_LABEL[l.status] ?? l.status;
              const days = daysByListing.get(l.id) ?? 0;
              const upcoming = upcomingByListing.get(l.id) ?? 0;
              const href = inProgress
                ? `/host/listings/new?draft=${l.id}`
                : `/host/listings/${l.id}`;
              return (
                <article key={l.id} className="group relative flex flex-col">
                  <DeleteListingButton
                    title={l.title}
                    deleteAction={deleteOffering.bind(null, l.id)}
                  />
                  <Link
                    href={href}
                    className="relative block aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                  >
                    {l.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.coverImageUrl}
                        alt={l.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-medium text-zinc-400">
                        {l.category ??
                          l.type.charAt(0).toUpperCase() + l.type.slice(1)}
                      </span>
                    )}
                    <span
                      className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        STATUS_BADGE[badgeKey] ?? STATUS_BADGE.archived
                      }`}
                    >
                      {badgeLabel}
                    </span>
                  </Link>

                  <div className="mt-2.5 flex flex-col gap-0.5">
                    <h3 className="line-clamp-1 font-medium text-foreground">
                      <Link href={href} className="transition-colors hover:underline">
                        {l.title}
                      </Link>
                    </h3>
                    <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {labelFor(OFFERING_TYPES, l.type)}
                      {" · "}
                      {availabilityLabel(days)}
                    </p>
                    <p className="pt-0.5 text-sm text-foreground">
                      <span className="font-semibold">
                        {formatMoney(l.priceCents, l.currency)}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {" · "}
                        {upcoming} upcoming
                      </span>
                    </p>
                    <span className="pt-0.5 text-sm font-medium text-accent">
                      {inProgress ? "Continue →" : "Manage →"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </HostPage>
  );
}
