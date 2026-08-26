import { requireProvider } from "@/lib/host";
import {
  getProviderBookings,
  markPastBookingsExecuted,
  type ProviderBooking,
} from "@/lib/bookings";
import { formatPrice } from "@/lib/offerings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { HostPage } from "@/components/host-page";
import { submitGuestReview } from "./actions";

function formatWhen(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-accent" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-zinc-300 dark:text-zinc-600">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

function Row({ b, reviewable }: { b: ProviderBooking; reviewable: boolean }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-[#fff7f1] p-5 dark:border-white/10 dark:bg-[#1e1a15]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{b.offeringTitle}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Guest: {b.guestName} · {formatWhen(b.appointmentAt)}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {formatPrice(b.priceCents, b.currency)}
        </span>
      </div>

      {reviewable &&
        (b.myReview ? (
          <div className="flex flex-col gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">
                Your review of {b.guestName}
              </span>
              <Stars rating={b.myReview.rating} />
            </div>
            {b.myReview.comment && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {b.myReview.comment}
              </p>
            )}
          </div>
        ) : (
          <form
            action={submitGuestReview}
            className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/70"
          >
            <input type="hidden" name="bookingId" value={b.id} />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">
                Rate {b.guestName}
              </label>
              <select
                name="rating"
                defaultValue="5"
                className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors duration-200 ease-out focus:border-accent dark:border-white/10"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} ★
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="comment"
              rows={2}
              maxLength={2000}
              placeholder="How was the guest? (optional)"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors duration-200 ease-out focus:border-accent dark:border-white/10"
            />
            <button
              type="submit"
              className="w-fit rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90"
            >
              Submit review
            </button>
          </form>
        ))}
    </article>
  );
}

function Section({
  title,
  items,
  reviewable = false,
  empty,
}: {
  title: string;
  items: ProviderBooking[];
  reviewable?: boolean;
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-6 text-center text-sm text-zinc-400 dark:border-orange-900/40 dark:bg-[#1e1a15]">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((b) => (
            <Row key={b.id} b={b} reviewable={reviewable} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HostBookingsPage() {
  const { provider } = await requireProvider();
  // Roll any past confirmed bookings to "executed" so they become reviewable.
  await tryCatch(markPastBookingsExecuted());

  const all = await getProviderBookings(provider.id);
  const upcoming = all.filter((b) => b.status === "confirmed");
  const past = all.filter(
    (b) => b.status === "completed" || b.status === "executed",
  );
  const canceled = all.filter((b) => b.status === "canceled");

  return (
    <HostPage
      title="Bookings"
      description="Your incoming bookings. Review the guest once a service is done."
    >
      <Section
        title="Upcoming"
        items={upcoming}
        empty="No upcoming bookings yet."
      />
      <Section
        title="Past"
        items={past}
        reviewable
        empty="No past bookings yet."
      />
      <Section
        title="Canceled"
        items={canceled}
        empty="No canceled bookings."
      />
    </HostPage>
  );
}
