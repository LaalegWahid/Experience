import { env } from "@/shared/utils/env";
import { paymentMode, paymentPreset } from "@/shared/utils/payments";

// Server-only cross-field check that the deploy's payment credentials match the
// chosen mode (NEXT_PUBLIC_APP_ENV). It runs once at server startup from
// instrumentation.ts and throws on a dangerous mismatch — e.g. a "production"
// deploy still carrying Stripe TEST keys, or missing the CDP credentials the
// mainnet x402 facilitator needs. Catching this at boot beats discovering it
// when a real payment silently goes to the wrong network.

class PaymentConfigError extends Error {
  constructor(message: string) {
    super(`Payment config (${paymentMode}): ${message}`);
    this.name = "PaymentConfigError";
  }
}

export function assertPaymentConfig(): void {
  const marker = paymentPreset.stripeKeyMarker; // "_live_" | "_test_"
  const otherMarker = marker === "_live_" ? "_test_" : "_live_";

  // 1) Stripe keys must belong to this mode (live for production, test for test).
  for (const [name, value] of [
    ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY],
  ] as const) {
    if (value.includes(otherMarker)) {
      throw new PaymentConfigError(
        `${name} is a ${otherMarker.replace(/_/g, "")} key but this deploy is "${paymentMode}". ` +
          `Use a ${marker.replace(/_/g, "")} Stripe key, or set NEXT_PUBLIC_APP_ENV accordingly.`,
      );
    }
  }

  // 2) The mainnet x402 facilitator needs Coinbase CDP credentials.
  if (paymentPreset.useCdpFacilitator) {
    if (env.X402_PAY_TO && (!env.CDP_API_KEY_ID || !env.CDP_API_KEY_SECRET)) {
      throw new PaymentConfigError(
        "x402 is enabled (X402_PAY_TO set) and the mainnet facilitator requires " +
          "CDP_API_KEY_ID and CDP_API_KEY_SECRET. Set both, or unset X402_PAY_TO to disable agent payments.",
      );
    }
  } else if (env.CDP_API_KEY_ID || env.CDP_API_KEY_SECRET) {
    // Harmless but confusing: CDP keys do nothing in test mode.
    console.warn(
      `[payments] CDP_API_KEY_* are set but ignored in "${paymentMode}" mode ` +
        `(testnet uses the free ${paymentPreset.facilitatorUrl}).`,
    );
  }

  console.log(
    `[payments] mode=${paymentMode} · ${paymentPreset.label} · ` +
      `x402=${env.X402_PAY_TO ? "on" : "off"} · usdc-button=${env.NEXT_PUBLIC_USDC_RECIPIENT_ADDRESS ? "on" : "off"}`,
  );
}
