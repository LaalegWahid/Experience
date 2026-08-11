import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Validated, typed environment variables. Import `env` from here instead of
 * reading `process.env` directly so a missing/invalid var fails fast at
 * startup rather than surfacing as a confusing runtime error later.
 *
 * Server vars never reach the browser. Client vars must be prefixed with
 * `NEXT_PUBLIC_` and are inlined into the client bundle by Next.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    STRIPE_SECRET_KEY: z.string().min(1),
    // Signing secret for the Stripe webhook (whsec_…). Optional — the webhook
    // endpoint returns 503 until it's set. From `stripe listen` or the
    // Dashboard's webhook endpoint settings.
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    // Google OAuth. Optional — "Continue with Google" only works once both
    // are set (create credentials in Google Cloud Console).
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Supabase Storage for image uploads. Optional — uploads are disabled
    // until both are set.
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    // Groq (OpenAI-compatible) for AI-generated listing copy. Optional — the
    // "Write with AI" button stays disabled until this is set.
    GROQ_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    // Master switch for sending email via Resend. When not "true", sends are
    // skipped and the message is logged to the console instead (useful in dev).
    RESEND_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),

    // x402 agent payments (HTTP 402). The API booking endpoint requires an
    // on-chain USDC payment only when X402_PAY_TO is set; otherwise it stays
    // free (current behaviour). The network, USDC asset and facilitator are NOT
    // configured here — they are derived from NEXT_PUBLIC_APP_ENV in
    // `shared/utils/payments.ts`, so a deploy can't accidentally mix mainnet and
    // testnet. This is just the wallet that receives the agent's USDC.
    X402_PAY_TO: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a 0x… address")
      .optional(),
    // Coinbase CDP credentials for the mainnet facilitator (production mode
    // only). Required when NEXT_PUBLIC_APP_ENV=production; ignored in test mode,
    // which uses the free https://x402.org/facilitator with no auth.
    // Create at https://portal.cdp.coinbase.com (Secret API Key → id + secret).
    CDP_API_KEY_ID: z.string().optional(),
    CDP_API_KEY_SECRET: z.string().optional(),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    // The single deploy-mode switch. "production" → Base mainnet (real USDC) +
    // live Stripe; "test" → Base Sepolia (test USDC) + Stripe test mode. Every
    // payment network default is derived from this — see shared/utils/payments.ts.
    NEXT_PUBLIC_APP_ENV: z.enum(["production", "test"]),
    // Canonical public origin used for SEO (metadataBase, sitemap, robots,
    // OG/canonical URLs). Optional — falls back to BETTER_AUTH_URL. Set this to
    // the production domain (e.g. https://gathra.app) when deploying.
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    // The wallet that receives on-page "Pay with USDC" transfers. Optional — the
    // wallet pay button stays disabled until it's set. The chain id and USDC
    // token contract are derived from NEXT_PUBLIC_APP_ENV, not set here.
    NEXT_PUBLIC_USDC_RECIPIENT_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a 0x… address")
      .optional(),
  },
  // Client vars are listed explicitly so Next inlines them into the bundle.
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_ENABLED: process.env.RESEND_ENABLED,
    X402_PAY_TO: process.env.X402_PAY_TO,
    CDP_API_KEY_ID: process.env.CDP_API_KEY_ID,
    CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_USDC_RECIPIENT_ADDRESS:
      process.env.NEXT_PUBLIC_USDC_RECIPIENT_ADDRESS,
  },
  // Treat empty strings as missing so a blank var fails validation.
  emptyStringAsUndefined: true,
});
