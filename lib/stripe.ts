import Stripe from "stripe";
import { env } from "@/shared/utils/env";

// Server-side Stripe client. Never import this into client components.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
