import { env } from "@/shared/utils/env";

// The single source of truth for which payment network the whole app talks to.
// Flipping NEXT_PUBLIC_APP_ENV between "production" and "test" switches BOTH
// crypto paths (the on-page "Pay with USDC" button and the x402 agent API) plus
// the expected Stripe key mode together — so a deploy can never end up half on
// mainnet and half on testnet. Per-deploy secrets (Stripe keys, the receiving
// wallet, CDP credentials) are still set individually; only the network
// identity is derived here.

export type PaymentMode = "production" | "test";

/** The active deploy mode, read from the one switch. */
export const paymentMode: PaymentMode = env.NEXT_PUBLIC_APP_ENV;

type PaymentPreset = {
  /** Human label for logs/guards. */
  label: string;
  /** x402 network id used in the 402 challenge + facilitator calls. */
  x402Network: string;
  /** EVM chain id the wallet must be on for the on-page USDC transfer. */
  usdcChainId: number;
  /** USDC token contract on that chain (6 decimals everywhere). */
  usdcToken: string;
  /** EIP-712 domain of the USDC contract, used to sign the transfer/auth. */
  assetName: string;
  assetVersion: string;
  /** Facilitator base URL for verify/settle. */
  facilitatorUrl: string;
  /** Mainnet uses the authenticated Coinbase CDP facilitator (JWT); testnet
   * uses the free x402.org facilitator with no auth. */
  useCdpFacilitator: boolean;
  /** Substring every Stripe key for this mode contains (sk_/pk_/rk_…_test_/_live_). */
  stripeKeyMarker: "_test_" | "_live_";
};

export const PAYMENT_PRESETS: Record<PaymentMode, PaymentPreset> = {
  production: {
    label: "Base mainnet (real USDC)",
    x402Network: "base",
    usdcChainId: 8453,
    // Circle's native USDC on Base mainnet.
    usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    assetName: "USD Coin",
    assetVersion: "2",
    facilitatorUrl: "https://api.cdp.coinbase.com/platform/v2/x402",
    useCdpFacilitator: true,
    stripeKeyMarker: "_live_",
  },
  test: {
    label: "Base Sepolia (test USDC)",
    x402Network: "base-sepolia",
    usdcChainId: 84532,
    // Circle's USDC on Base Sepolia testnet.
    usdcToken: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    assetName: "USDC",
    assetVersion: "2",
    facilitatorUrl: "https://x402.org/facilitator",
    useCdpFacilitator: false,
    stripeKeyMarker: "_test_",
  },
};

/** The network preset for the active mode. */
export const paymentPreset = PAYMENT_PRESETS[paymentMode];

/**
 * Config for the on-page "Pay with USDC" button, or `null` when no receiving
 * wallet is set (button stays disabled). Chain + token come from the mode.
 */
export function usdcClientConfig(): {
  chainId: number;
  token: string;
  recipient: string;
} | null {
  const recipient = env.NEXT_PUBLIC_USDC_RECIPIENT_ADDRESS;
  if (!recipient) return null;
  return {
    chainId: paymentPreset.usdcChainId,
    token: paymentPreset.usdcToken,
    recipient,
  };
}
