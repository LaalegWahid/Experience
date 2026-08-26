// Runs once when a Next.js server instance starts (before it serves requests).
// We use it to fail fast on a payment misconfiguration — e.g. live Stripe keys
// in a test deploy, or a mainnet x402 setup missing its CDP credentials.
export async function register() {
  // Node runtime only: the guard reads server secrets and isn't needed on Edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertPaymentConfig } = await import(
      "@/shared/utils/payments-guard"
    );
    assertPaymentConfig();
  }
}
