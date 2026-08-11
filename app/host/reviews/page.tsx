import Link from "next/link";
import type { Metadata } from "next";
import { requireProvider } from "@/lib/host";
import { getHostRating, getProviderReviews } from "@/lib/reviews";
import { HostPage } from "@/components/host-page";

export const metadata: Metadata = {
  title: "Reviews · Host studio",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm" aria-label={`${rating} out of 5`}>
      <span className="text-accent">{"★".repeat(rating)}</span>
      <span className="text-zinc-300 dark:text-zinc-600">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

export default async function HostReviewsPage() {
  const { user } = await requireProvider();

  const [reviews, rating] = await Promise.all([
    getProviderReviews(user.id),
    getHostRating(user.id),
  ]);

  return (
    <HostPage
      title="Reviews"
      description="What guests said after their appointments, across all your services."
      action={
        rating.count > 0 ? (
          <div className="flex items-baseline gap-1.5 rounded-full border border-zinc-200 bg-background px-4 py-2 dark:border-zinc-800">
            <span className="text-accent">★</span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {rating.average.toFixed(1)}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              · {rating.count} review{rating.count === 1 ? "" : "s"}
            </span>
          </div>
        ) : null
      }
    >
      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No reviews yet. They appear here once guests review a completed
          appointment.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {r.guestName}
                  </span>
                  <Link
                    href={`/host/listings/${r.offeringId}`}
                    className="text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
                  >
                    {r.offeringTitle}
                  </Link>
                </div>
                <Stars rating={r.rating} />
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
    </HostPage>
  );
}
