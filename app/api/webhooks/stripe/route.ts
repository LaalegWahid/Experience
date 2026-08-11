import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/shared/utils/env";
import {
  markBookingPaid,
  recordRefundForPaymentIntent,
} from "@/lib/bookings";
import {
  markTransactionRefunded,
  markTransactionSucceeded,
} from "@/lib/transactions";
import {
  markReferralEarningOwed,
  markReferralEarningReversed,
} from "@/lib/referrals";
import { tryCatch } from "@/shared/utils/TryCatch";

// Stripe needs the raw request body to verify the signature, and the Node
// crypto used by constructEvent — so force the Node runtime, not Edge.
export const runtime = "nodejs";

// Authoritative payment + refund reconciliation from Stripe. Bookings are
// created optimistically at checkout; this endpoint stamps the real payment
// (paidAt) and keeps refund state in sync — including refunds issued straight
// from the Stripe Dashboard.
export async function POST(request: Request) {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const handled = await tryCatch(handleEvent(event));
  if (!handled.ok) {
    // 500 tells Stripe to retry — the event handler is idempotent.
    console.error(`[stripe webhook] error handling ${event.type}:`, handled.error);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await markBookingPaid(pi.id);
      await markTransactionSucceeded(pi.id);
      // Settle any referral commission for this payment.
      await markReferralEarningOwed(pi.id);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);
      if (piId) {
        const fullyRefunded = charge.amount_refunded >= charge.amount;
        await recordRefundForPaymentIntent(
          piId,
          charge.amount_refunded,
          fullyRefunded,
        );
        await markTransactionRefunded(
          piId,
          charge.amount_refunded,
          fullyRefunded,
        );
        // Void the referrer's commission when the booking is refunded.
        if (fullyRefunded) await markReferralEarningReversed(piId);
      }
      break;
    }
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }
}
