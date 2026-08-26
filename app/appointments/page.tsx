import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, CheckCircle2, Ban } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Countdown } from "@/components/countdown";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import {
  cancellationRefundRate,
  getUserBookings,
  markPastBookingsExecuted,
  type BookingView,
} from "@/lib/bookings";
import { CANCELLATION_POLICIES, labelFor } from "@/shared/data/offerings";
import { getReviewsByUser, type UserReview } from "@/lib/reviews";
import { getReportedBookingIds } from "@/lib/reports";
import { formatPrice } from "@/lib/offerings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { getT, getLocale } from "@/lib/i18n";
import type { TranslationKey } from "@/shared/i18n/dictionaries";
import {
  cancelBookingAction,
  completeBookingAction,
  reportHostAction,
  submitReviewAction,
} from "./actions";

type Translator = (key: TranslationKey) => string;

const EMPTY_ICONS = { current: Calendar, done: CheckCircle2, canceled: Ban } as const;

const REPORT_REASONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "no_show", labelKey: "appt.reason.no_show" },
  { value: "inappropriate", labelKey: "appt.reason.inappropriate" },
  { value: "safety", labelKey: "appt.reason.safety" },
  { value: "scam", labelKey: "appt.reason.scam" },
  { value: "other", labelKey: "appt.reason.other" },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("appt.metaTitle") };
}

function formatWhen(d: Date, locale: string): string {
  return d.toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Stars({ rating, t }: { rating: number; t: Translator }) {
  return (
    <span
      className="text-accent"
      aria-label={t("appt.starsAria").replace("{rating}", String(rating))}
    >
      {"★".repeat(rating)}
      <span className="text-zinc-300 dark:text-zinc-600">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

function ReviewForm({
  bookingId,
  review,
  t,
}: {
  bookingId: string;
  review: UserReview | null;
  t: Translator;
}) {
  return (
    <form action={submitReviewAction} className="flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">
          {review ? t("appt.updateRating") : t("appt.howWasIt")}
        </label>
        <select
          name="rating"
          defaultValue={String(review?.rating ?? 5)}
          className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent dark:border-zinc-700"
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
        maxLength={1000}
        defaultValue={review?.comment ?? ""}
        placeholder={t("appt.reviewPlaceholder")}
        className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent dark:border-zinc-700"
      />
      <button
        type="submit"
        className="w-fit rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        {review ? t("appt.updateReview") : t("appt.submitReview")}
      </button>
    </form>
  );
}

function ReportForm({ bookingId, t }: { bookingId: string; t: Translator }) {
  return (
    <form action={reportHostAction} className="mt-2 flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {t("appt.reason")}
        </label>
        <select
          name="reason"
          defaultValue="no_show"
          className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent dark:border-zinc-700"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="details"
        rows={2}
        maxLength={1000}
        placeholder={t("appt.reportPlaceholder")}
        className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent dark:border-zinc-700"
      />
      <button
        type="submit"
        className="w-fit rounded-full border border-red-300 px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        {t("appt.submitReport")}
      </button>
    </form>
  );
}

function Card({
  booking,
  variant,
  canComplete = false,
  review = null,
  reported = false,
  t,
  locale,
}: {
  booking: BookingView;
  variant: "current" | "done" | "canceled";
  canComplete?: boolean;
  review?: UserReview | null;
  reported?: boolean;
  t: Translator;
  locale: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/services/${booking.offeringId}`}
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {booking.title}
          </Link>
          {booking.menuItemName && (
            <span className="text-xs font-medium text-accent">
              {booking.menuItemName}
            </span>
          )}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("service.hostedBy")} {booking.hostName}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {formatPrice(booking.priceCents, booking.currency)}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatWhen(booking.appointmentAt, locale)}
        </span>

        {variant === "current" && (
          <div className="flex flex-wrap items-center gap-3">
            <Countdown target={booking.appointmentAt.toISOString()} />
            {canComplete && (
              <form action={completeBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  {t("appt.markCompleted")}
                </button>
              </form>
            )}
            <form action={cancelBookingAction}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {t("appt.cancel")}
              </button>
            </form>
            <p className="basis-full text-xs text-zinc-400">
              {labelFor(CANCELLATION_POLICIES, booking.cancellationPolicy)}
              {(() => {
                const rate = cancellationRefundRate(
                  booking.cancellationPolicy,
                  booking.appointmentAt,
                );
                const total =
                  booking.priceCents + Math.round(booking.priceCents * 0.2);
                return rate > 0
                  ? t("appt.cancelRefund").replace(
                      "{amount}",
                      formatPrice(Math.round(total * rate), booking.currency),
                    )
                  : t("appt.noRefund");
              })()}
            </p>
          </div>
        )}
        {variant === "done" && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {booking.status === "completed"
              ? t("appt.completed")
              : t("appt.executed")}
          </span>
        )}
        {variant === "canceled" && (
          <div className="flex items-center gap-2">
            {booking.refundedCents > 0 && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {t("appt.refunded").replace(
                  "{amount}",
                  formatPrice(booking.refundedCents, booking.currency),
                )}
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 line-through dark:bg-zinc-900 dark:text-zinc-400">
              {t("appt.canceledBadge")}
            </span>
          </div>
        )}
      </div>

      {/* Review + report — available once the appointment is over or canceled */}
      {(variant === "done" || variant === "canceled") && (
        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
          {review ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {t("appt.yourReview")}
                </span>
                <Stars rating={review.rating} t={t} />
              </div>
              {review.comment && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {review.comment}
                </p>
              )}
              <details className="group">
                <summary className="w-fit cursor-pointer text-xs font-medium text-accent transition-opacity hover:opacity-80">
                  {t("appt.editReview")}
                </summary>
                <div className="mt-2">
                  <ReviewForm bookingId={booking.id} review={review} t={t} />
                </div>
              </details>
            </div>
          ) : (
            <ReviewForm bookingId={booking.id} review={null} t={t} />
          )}

          {reported ? (
            <p className="text-xs text-zinc-400">{t("appt.reportedNote")}</p>
          ) : (
            <details className="group">
              <summary className="w-fit cursor-pointer text-xs font-medium text-red-600 transition-opacity hover:opacity-80 dark:text-red-400">
                {t("appt.reportHost")}
              </summary>
              <ReportForm bookingId={booking.id} t={t} />
            </details>
          )}
        </div>
      )}
    </article>
  );
}

function Section({
  title,
  items,
  variant,
  empty,
  canComplete,
  reviewFor,
  reportedFor,
  t,
  locale,
}: {
  title: string;
  items: BookingView[];
  variant: "current" | "done" | "canceled";
  empty: string;
  canComplete?: (b: BookingView) => boolean;
  reviewFor?: (b: BookingView) => UserReview | null;
  reportedFor?: (b: BookingView) => boolean;
  t: Translator;
  locale: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <EmptyState icon={EMPTY_ICONS[variant]} message={empty} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((b) => (
            <Card
              key={b.id}
              booking={b}
              variant={variant}
              canComplete={canComplete?.(b) ?? false}
              review={reviewFor?.(b) ?? null}
              reported={reportedFor?.(b) ?? false}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AppointmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/appointments");

  const t = await getT();
  const locale = await getLocale();

  // Register any appointment whose time has passed as executed.
  await tryCatch(markPastBookingsExecuted());

  const result = await tryCatch(getUserBookings(session.user.id));
  const bookings = result.ok ? result.data : [];
  const reviewsResult = await tryCatch(getReviewsByUser(session.user.id));
  const reviews = reviewsResult.ok ? reviewsResult.data : new Map();
  const reportedResult = await tryCatch(getReportedBookingIds(session.user.id));
  const reported = reportedResult.ok ? reportedResult.data : new Set<string>();

  const isToday = (d: Date) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return d.getTime() >= start.getTime() && d.getTime() < end.getTime();
  };

  const current = bookings
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => a.appointmentAt.getTime() - b.appointmentAt.getTime());
  const done = bookings
    .filter((b) => b.status === "completed" || b.status === "executed")
    .sort((a, b) => b.appointmentAt.getTime() - a.appointmentAt.getTime());
  const canceled = bookings
    .filter((b) => b.status === "canceled")
    .sort((a, b) => b.appointmentAt.getTime() - a.appointmentAt.getTime());

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("appt.title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("appt.subtitle")}</p>
        </header>

        <div className="mt-8 flex flex-col gap-8">
          <Section
            title={t("appt.current")}
            items={current}
            variant="current"
            canComplete={(b) => isToday(b.appointmentAt)}
            empty={t("appt.emptyCurrent")}
            t={t}
            locale={locale}
          />
          <Section
            title={t("appt.past")}
            items={done}
            variant="done"
            reviewFor={(b) => reviews.get(b.id) ?? null}
            reportedFor={(b) => reported.has(b.id)}
            empty={t("appt.emptyPast")}
            t={t}
            locale={locale}
          />
          <Section
            title={t("appt.canceled")}
            items={canceled}
            variant="canceled"
            reviewFor={(b) => reviews.get(b.id) ?? null}
            reportedFor={(b) => reported.has(b.id)}
            empty={t("appt.emptyCanceled")}
            t={t}
            locale={locale}
          />

          <Link
            href="/refer"
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-background p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                {t("ref.refer")}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("refer.subtitle")}
              </span>
            </div>
            <span aria-hidden className="text-zinc-400">
              →
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}
