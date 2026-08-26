import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { getUserInvoices, type BookingStatus } from "@/lib/bookings";
import { formatMoney } from "@/shared/utils/money";

export const metadata: Metadata = {
  title: "Invoices · Local Experiences",
};

// Matches the service fee added at checkout (app/api/checkout/route.ts).
const SERVICE_FEE_RATE = 0.2;

const STATUS_BADGE: Record<BookingStatus, string> = {
  confirmed: "bg-accent/10 text-accent dark:bg-accent/15",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  executed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function InvoicesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/account/invoices");

  const invoices = await getUserInvoices(session.user.id);

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Invoices
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Payments you&apos;ve made when booking services.
          </p>
        </header>

        {invoices.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Receipt}
              message="You haven't paid for any bookings yet."
              action={
                <Link
                  href="/services"
                  className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  Browse services
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {invoices.map((inv) => {
              const fee = Math.round(inv.priceCents * SERVICE_FEE_RATE);
              const total = inv.priceCents + fee;
              return (
                <li
                  key={inv.id}
                  className="animate-rise rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-zinc-400">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Link
                        href={`/services/${inv.offeringId}`}
                        className="font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {inv.title}
                      </Link>
                      {inv.menuItemName && (
                        <span className="text-xs font-medium text-accent">
                          {inv.menuItemName}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Hosted by {inv.hostName}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_BADGE[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800/70">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Paid on
                    </dt>
                    <dd className="text-right text-foreground">
                      {formatDate(inv.paidAt)}
                    </dd>
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Appointment
                    </dt>
                    <dd className="text-right text-foreground">
                      {formatDateTime(inv.appointmentAt)}
                    </dd>
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Service
                    </dt>
                    <dd className="text-right text-foreground">
                      {formatMoney(inv.priceCents, inv.currency)}
                    </dd>
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Service fee (20%)
                    </dt>
                    <dd className="text-right text-foreground">
                      {formatMoney(fee, inv.currency)}
                    </dd>
                    <dt className="font-medium text-foreground">Total paid</dt>
                    <dd className="text-right font-semibold text-foreground">
                      {formatMoney(total, inv.currency)}
                    </dd>
                  </dl>

                  {inv.status === "completed" && (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={`/account/invoices/${inv.id}/download`}
                        download
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M12 15V3" />
                        </svg>
                        Download invoice
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
