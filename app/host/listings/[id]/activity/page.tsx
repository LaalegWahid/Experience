import Link from "next/link";
import { requireOwnedOffering } from "@/lib/host";
import { getOfferingReviews } from "@/lib/reviews";
import { getOfferingBookings } from "@/lib/bookings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { HostInbox } from "@/components/host-inbox";

export default async function ListingActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { offering } = await requireOwnedOffering(id);

  const reviewsResult = await tryCatch(getOfferingReviews(offering.id));
  const reviews = reviewsResult.ok ? reviewsResult.data : [];

  const upcomingCount = (await getOfferingBookings(offering.id)).filter(
    (b) => b.status === "confirmed",
  ).length;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/host/listings/${offering.id}`}
          className="w-fit text-sm text-zinc-500 transition-colors duration-200 ease-out hover:text-accent dark:text-zinc-400"
        >
          ← Back to listing
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {offering.title}
          </p>
        </div>
      </div>

      {/* Appointments — full calendar lives on its own page */}
      <Link
        href="/host/calendar"
        className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 dark:border-white/10 dark:bg-[#1e1a15] dark:hover:border-accent/40"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            Appointments
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {upcomingCount} upcoming · view all in your calendar
          </span>
        </div>
        <span className="text-sm font-medium text-accent">Open calendar →</span>
      </Link>

      {/* Guest messages */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Guest messages
          </h2>
          <Link
            href="/host/messages"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            Open full inbox →
          </Link>
        </div>
        <HostInbox offeringId={offering.id} />
      </section>

      {/* Reviews from guests */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Reviews
          </h2>
          {avgRating !== null && (
            <span className="text-sm font-medium text-foreground">
              <span className="text-accent">★</span> {avgRating.toFixed(1)}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({reviews.length})
              </span>
            </span>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-6 text-center text-sm text-zinc-400 dark:border-orange-900/40 dark:bg-[#1e1a15]">
            No reviews yet. They appear here once guests review a completed
            appointment.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-1.5 rounded-2xl border border-black/5 bg-[#fff7f1] p-4 dark:border-white/10 dark:bg-[#1e1a15]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {r.guestName}
                  </span>
                  <span className="text-sm">
                    <span className="text-accent">{"★".repeat(r.rating)}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">
                      {"★".repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {r.comment}
                  </p>
                )}
                <span className="text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
