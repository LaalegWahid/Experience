import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  offerings,
  transactions,
  type NewTransaction,
  type PaymentMethod,
  type TransactionStatus,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import { dailyBuckets, trendCutoff, type TrendPoint } from "@/lib/trends";

/**
 * Record a payment in the unified ledger. Every guest payment — card (Stripe)
 * or crypto (USDC) — flows through here so the admin has one place to see them.
 * Best-effort: callers wrap this in `tryCatch` and never fail the payment if the
 * ledger write can't be made.
 */
export async function recordTransaction(values: NewTransaction) {
  const [row] = await db.insert(transactions).values(values).returning();
  return row;
}

/**
 * Flip a Stripe transaction to `succeeded` once the PaymentIntent settles (via
 * webhook). Idempotent — only the first pending row for the reference is moved.
 */
export async function markTransactionSucceeded(reference: string) {
  await db
    .update(transactions)
    .set({ status: "succeeded", updatedAt: new Date() })
    .where(
      and(
        eq(transactions.reference, reference),
        eq(transactions.status, "pending"),
      ),
    );
}

/** Record a refund against a transaction (via the Stripe webhook). */
export async function markTransactionRefunded(
  reference: string,
  refundedCents: number,
  fullyRefunded: boolean,
) {
  await db
    .update(transactions)
    .set({
      refundedCents,
      ...(fullyRefunded ? { status: "refunded" as const } : {}),
      updatedAt: new Date(),
    })
    .where(eq(transactions.reference, reference));
}

export type TransactionRow = {
  id: string;
  method: PaymentMethod;
  status: TransactionStatus;
  amountCents: number;
  refundedCents: number;
  currency: string;
  reference: string | null;
  network: string | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
  offeringTitle: string | null;
};

/** Every transaction with its guest + offering, newest first (for admin). */
export async function getRecentTransactions(
  limit = 200,
): Promise<TransactionRow[]> {
  return db
    .select({
      id: transactions.id,
      method: transactions.method,
      status: transactions.status,
      amountCents: transactions.amountCents,
      refundedCents: transactions.refundedCents,
      currency: transactions.currency,
      reference: transactions.reference,
      network: transactions.network,
      createdAt: transactions.createdAt,
      userName: user.name,
      userEmail: user.email,
      offeringTitle: offerings.title,
    })
    .from(transactions)
    .leftJoin(user, eq(user.id, transactions.userId))
    .leftJoin(offerings, eq(offerings.id, transactions.offeringId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export type TransactionStats = {
  total: number;
  byMethod: Record<PaymentMethod, number>;
  /** Gross succeeded volume in minor units, keyed by currency. */
  grossByCurrency: Record<string, number>;
};

export type RevenueTrend = { points: TrendPoint[]; currency: string };

export type TransactionOverview = {
  txStats: TransactionStats;
  revenueTrend: RevenueTrend;
};

/**
 * All-time transaction stats plus the trailing-`days` revenue trend for the
 * admin overview — one fetch of the transactions table instead of two (an
 * all-time stats query and a separately date-filtered trend query).
 */
export async function getTransactionOverview(
  days = 30,
): Promise<TransactionOverview> {
  const rows = await db
    .select({
      method: transactions.method,
      status: transactions.status,
      amountCents: transactions.amountCents,
      refundedCents: transactions.refundedCents,
      currency: transactions.currency,
      createdAt: transactions.createdAt,
    })
    .from(transactions);

  const byMethod: Record<PaymentMethod, number> = { stripe: 0, crypto: 0 };
  const grossByCurrency: Record<string, number> = {};
  for (const r of rows) {
    byMethod[r.method] = (byMethod[r.method] ?? 0) + 1;
    if (r.status === "succeeded" || r.status === "refunded") {
      const net = r.amountCents - r.refundedCents;
      grossByCurrency[r.currency] = (grossByCurrency[r.currency] ?? 0) + net;
    }
  }

  // Daily net revenue (succeeded + refunded, minus refunds) for the trailing
  // `days` window, in the currency with the most volume — a trend line can
  // only hold one scale, so mixed-currency volume is folded into its
  // dominant one (dominance computed within the window, not all-time).
  const cutoff = trendCutoff(days);
  const settled = rows.filter(
    (r) =>
      r.createdAt >= cutoff &&
      (r.status === "succeeded" || r.status === "refunded"),
  );

  const totalsByCurrency: Record<string, number> = {};
  for (const r of settled) {
    totalsByCurrency[r.currency] =
      (totalsByCurrency[r.currency] ?? 0) + (r.amountCents - r.refundedCents);
  }
  const currency =
    Object.entries(totalsByCurrency).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "USD";

  const buckets = dailyBuckets(days);
  const sums = new Map(buckets.map((d) => [d, 0]));
  for (const r of settled) {
    if (r.currency !== currency) continue;
    const key = r.createdAt.toISOString().slice(0, 10);
    if (sums.has(key)) {
      sums.set(key, (sums.get(key) ?? 0) + (r.amountCents - r.refundedCents));
    }
  }

  return {
    txStats: { total: rows.length, byMethod, grossByCurrency },
    revenueTrend: {
      points: buckets.map((date) => ({ date, value: sums.get(date) ?? 0 })),
      currency,
    },
  };
}
