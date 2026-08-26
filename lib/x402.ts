import { NextResponse } from "next/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { env } from "@/shared/utils/env";
import { paymentPreset } from "@/shared/utils/payments";
import { tryCatch } from "@/shared/utils/TryCatch";

// Minimal, dependency-free server implementation of the x402 payment protocol
// (https://x402.org). We build the HTTP 402 challenge ourselves and delegate the
// crypto-heavy verify/settle steps to a facilitator's REST API, so this app
// never holds a private key or pays gas.

const X402_VERSION = 1;
// USDC (and the x402 "exact" scheme) uses 6-decimal atomic units.
const USDC_DECIMALS = 6;

/** A facilitator-verifiable payment requirement (the `accepts` entry). */
export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: { name: string; version: string };
};

/** Decoded `X-PAYMENT` header sent by the paying agent. */
export type PaymentPayload = {
  x402Version: number;
  scheme: string;
  network: string;
  payload: unknown;
};

type X402Config = {
  network: string;
  payTo: string;
  asset: string;
  assetName: string;
  assetVersion: string;
  facilitatorUrl: string;
  /** When true, the facilitator URL + per-request JWT auth come from
   * @coinbase/x402 using the CDP keys below (the mainnet path). */
  useCdpFacilitator: boolean;
  /** Coinbase CDP key id/secret, used only when `useCdpFacilitator` is true. */
  cdpApiKeyId?: string;
  cdpApiKeySecret?: string;
};

/**
 * The active x402 config, or `null` when payments aren't configured (no
 * `X402_PAY_TO`) — in which case callers should keep their pre-payment
 * behaviour. Presence of `payTo` is the single on/off switch; the network,
 * asset and facilitator are derived from the deploy mode (see
 * `shared/utils/payments.ts`), so they can't drift from the wallet button.
 */
export function x402Config(): X402Config | null {
  if (!env.X402_PAY_TO) return null;
  return {
    network: paymentPreset.x402Network,
    payTo: env.X402_PAY_TO,
    asset: paymentPreset.usdcToken,
    assetName: paymentPreset.assetName,
    assetVersion: paymentPreset.assetVersion,
    facilitatorUrl: paymentPreset.facilitatorUrl.replace(/\/$/, ""),
    useCdpFacilitator: paymentPreset.useCdpFacilitator,
    cdpApiKeyId: env.CDP_API_KEY_ID,
    cdpApiKeySecret: env.CDP_API_KEY_SECRET,
  };
}

/** Convert an integer USD-cents amount into USDC atomic units (string). */
export function centsToUsdcAtomic(cents: number): string {
  // 1 cent = 0.01 USD = 0.01 * 10^6 = 10^4 atomic units of USDC.
  return (BigInt(Math.round(cents)) * BigInt(10 ** (USDC_DECIMALS - 2))).toString();
}

/** Build the single payment requirement we accept for a given resource/amount. */
export function buildRequirements(
  config: X402Config,
  opts: { resource: string; description: string; amountAtomic: string },
): PaymentRequirements {
  return {
    scheme: "exact",
    network: config.network,
    maxAmountRequired: opts.amountAtomic,
    resource: opts.resource,
    description: opts.description,
    mimeType: "application/json",
    payTo: config.payTo,
    maxTimeoutSeconds: 120,
    asset: config.asset,
    extra: { name: config.assetName, version: config.assetVersion },
  };
}

/** The HTTP 402 challenge response telling the agent how to pay. */
export function paymentRequired(
  requirements: PaymentRequirements,
  error: string,
): NextResponse {
  return NextResponse.json(
    { x402Version: X402_VERSION, error, accepts: [requirements] },
    { status: 402 },
  );
}

/** Decode the base64 `X-PAYMENT` header into a payment payload, or null. */
export function decodePaymentHeader(
  header: string | null,
): PaymentPayload | null {
  if (!header) return null;
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    const parsed = JSON.parse(json) as PaymentPayload;
    if (!parsed || typeof parsed !== "object" || !parsed.scheme) return null;
    return parsed;
  } catch {
    return null;
  }
}

type VerifyResult = { isValid: boolean; invalidReason?: string };
type SettleResult = {
  success: boolean;
  errorReason?: string;
  transaction?: string;
  network?: string;
  payer?: string;
};

/** Resolve the endpoint URL + auth headers for a facilitator call. */
async function resolveEndpoint(
  config: X402Config,
  path: "verify" | "settle",
): Promise<{ url: string; headers: Record<string, string> }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  // Coinbase CDP (production/mainnet): the official helper supplies the
  // facilitator URL and per-request, per-endpoint JWT auth headers.
  if (config.useCdpFacilitator && config.cdpApiKeyId && config.cdpApiKeySecret) {
    const cdp = createFacilitatorConfig(
      config.cdpApiKeyId,
      config.cdpApiKeySecret,
    );
    const base = (cdp.url ?? config.facilitatorUrl).replace(/\/$/, "");
    if (cdp.createAuthHeaders) {
      const auth = await cdp.createAuthHeaders();
      Object.assign(headers, auth[path] ?? {});
    }
    return { url: `${base}/${path}`, headers };
  }

  // Free, unauthenticated facilitator (test/testnet).
  return { url: `${config.facilitatorUrl}/${path}`, headers };
}

async function callFacilitator<T>(
  config: X402Config,
  path: "verify" | "settle",
  payment: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<T | null> {
  const endpoint = await tryCatch(resolveEndpoint(config, path));
  if (!endpoint.ok) return null;

  const res = await tryCatch(
    fetch(endpoint.data.url, {
      method: "POST",
      headers: endpoint.data.headers,
      body: JSON.stringify({
        x402Version: X402_VERSION,
        paymentPayload: payment,
        paymentRequirements: requirements,
      }),
    }),
  );
  if (!res.ok || !res.data.ok) return null;
  const json = await tryCatch(res.data.json());
  return json.ok ? (json.data as T) : null;
}

/** Ask the facilitator whether a payment is valid (no funds move yet). */
export async function verifyPayment(
  config: X402Config,
  payment: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<VerifyResult> {
  const result = await callFacilitator<VerifyResult>(
    config,
    "verify",
    payment,
    requirements,
  );
  if (!result) return { isValid: false, invalidReason: "facilitator_unreachable" };
  return result;
}

/** Ask the facilitator to settle the payment on-chain. */
export async function settlePayment(
  config: X402Config,
  payment: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<SettleResult> {
  const result = await callFacilitator<SettleResult>(
    config,
    "settle",
    payment,
    requirements,
  );
  if (!result) return { success: false, errorReason: "facilitator_unreachable" };
  return result;
}

/** Base64 `X-PAYMENT-RESPONSE` header summarising the settlement. */
export function paymentResponseHeader(settle: SettleResult): string {
  return Buffer.from(
    JSON.stringify({
      success: settle.success,
      transaction: settle.transaction ?? null,
      network: settle.network ?? null,
      payer: settle.payer ?? null,
    }),
  ).toString("base64");
}
