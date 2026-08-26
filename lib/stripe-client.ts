import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/shared/utils/env";

// A single shared Stripe.js promise for the browser. Reading only the
// publishable (client) key here is safe to ship to the browser.
export const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
