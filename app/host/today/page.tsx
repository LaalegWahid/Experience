import Link from "next/link";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { offerings } from "@/db/schema";
import { hasPayoutMethod, requireProvider } from "@/lib/host";
import {
  getProviderBookings,
  markPastBookingsExecuted,
  type ProviderBooking,
} from "@/lib/bookings";
import { getProviderConversations } from "@/lib/messages";
import { formatPrice } from "@/lib/offerings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { HostPage } from "@/components/host-page";

export const metadata: Metadata = {
  title: "Today · Host studio",
};

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-accent/10 text-accent dark:bg-accent/15",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  executed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatWhen(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStamp(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-6 text-center text-sm text-zinc-400 dark:border-orange-900/40 dark:bg-[#1e1a15]">
      {children}
    </p>
  );
}

function ReservationRow({
  b,
  highlightTime = false,
}: {
  b: ProviderBooking;
  highlightTime?: boolean;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-4 dark:border-white/10 dark:bg-[#1e1a15]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground">
          {b.offeringTitle}
        </span>
        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {b.guestName} · {highlightTime ? formatTime(b.appointmentAt) : formatWhen(b.appointmentAt)}
        </span>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground">
        {formatPrice(b.priceCents, b.currency)}
      </span>
    </article>
  );
}

export default async function HostTodayPage() {
  const { user, provider } = await requireProvider();
  // Roll any past confirmed bookings to "executed" before we read them.
  await tryCatch(markPastBookingsExecuted());

  const [allBookings, conversations, payoutOk, draftRows] = await Promise.all([
    getProviderBookings(provider.id),
    getProviderConversations(provider.id),
    hasPayoutMethod(provider.id),
    db
      .select({ id: offerings.id })
      .from(offerings)
      .where(
        and(
          eq(offerings.providerId, provider.id),
          eq(offerings.status, "draft"),
        ),
      ),
  ]);

  // Time windows (server-local): everything from now until midnight is "today".
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(0, 0, 0, 0);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const confirmed = allBookings.filter((b) => b.status === "confirmed");
  const todays = confirmed
    .filter((b) => b.appointmentAt < endOfToday)
    .sort((a, b) => a.appointmentAt.getTime() - b.appointmentAt.getTime());
  const upcoming = confirmed
    .filter((b) => b.appointmentAt >= endOfToday)
    .sort((a, b) => a.appointmentAt.getTime() - b.appointmentAt.getTime())
    .slice(0, 6);

  const pendingReviews = allBookings.filter(
    (b) =>
      (b.status === "executed" || b.status === "completed") && !b.myReview,
  );

  const recent = [...allBookings]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const messages = conversations.slice(0, 5);

  // Reminders & actions — only surface the ones that actually apply.
  const reminders: { href: string; title: string; body: string }[] = [];
  if (!payoutOk) {
    reminders.push({
      href: "/host/payouts",
      title: "Add your payout details",
      body: "Set a bank account or wallet so you can get paid for bookings.",
    });
  }
  if (pendingReviews.length > 0) {
    reminders.push({
      href: "/host/bookings",
      title: `Review ${pendingReviews.length} past guest${pendingReviews.length === 1 ? "" : "s"}`,
      body: "Leave a review for guests whose appointments have finished.",
    });
  }
  if (draftRows.length > 0) {
    reminders.push({
      href: "/host",
      title: `Finish ${draftRows.length} draft listing${draftRows.length === 1 ? "" : "s"}`,
      body: "Publish your drafts so guests can find and book them.",
    });
  }

  const firstName = user.name.trim().split(" ")[0] || user.name;
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <HostPage
      eyebrow={dateLabel}
      title={`Good day, ${firstName}`}
      description={
        todays.length > 0
          ? `You have ${todays.length} reservation${todays.length === 1 ? "" : "s"} left today.`
          : "No more reservations today. Here's what's next."
      }
    >
      {/* Today's reservations */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Today&apos;s reservations ({todays.length})
        </h2>
        {todays.length === 0 ? (
          <EmptyCard>No reservations scheduled for the rest of today.</EmptyCard>
        ) : (
          <div className="flex flex-col gap-3">
            {todays.map((b) => (
              <ReservationRow key={b.id} b={b} highlightTime />
            ))}
          </div>
        )}
      </section>

      {/* Reminders & actions */}
      {reminders.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Reminders &amp; actions
          </h2>
          <div className="flex flex-col gap-3">
            {reminders.map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/10"
              >
                <div>
                  <p className="font-medium text-foreground">{r.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {r.body}
                  </p>
                </div>
                <span className="text-sm font-medium text-accent">
                  Take action →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming reservations */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Upcoming reservations
          </h2>
          <Link
            href="/host/bookings"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyCard>Nothing booked beyond today yet.</EmptyCard>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <ReservationRow key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>

      {/* Messages needing attention */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Messages needing attention
          </h2>
          <Link
            href="/host/messages"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            Open inbox →
          </Link>
        </div>
        {messages.length === 0 ? (
          <EmptyCard>No guest messages right now.</EmptyCard>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((c) => (
              <Link
                key={`${c.offeringId}:${c.guestId}`}
                href="/host/messages"
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-50 dark:border-white/10 dark:bg-[#1e1a15] dark:hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.guestName}
                    </span>
                    <span className="truncate text-xs font-medium text-accent">
                      {c.offeringTitle}
                    </span>
                  </span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {c.lastBody}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {formatStamp(c.lastAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent booking activity */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recent booking activity
        </h2>
        {recent.length === 0 ? (
          <EmptyCard>No bookings yet.</EmptyCard>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-4 dark:border-white/10 dark:bg-[#1e1a15]"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {b.guestName} booked {b.offeringTitle}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    for {formatWhen(b.appointmentAt)}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_BADGE[b.status] ?? STATUS_BADGE.canceled
                    }`}
                  >
                    {b.status}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {formatStamp(b.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </HostPage>
  );
}
