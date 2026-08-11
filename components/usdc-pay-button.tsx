"use client";

import { useState } from "react";
import {
  encodeFunctionData,
  erc20Abi,
  numberToHex,
  parseUnits,
  type Hex,
} from "viem";
import { usdcClientConfig } from "@/shared/utils/payments";
import { SERVICE_FEE_RATE } from "@/shared/utils/fees";
import { tryCatch } from "@/shared/utils/TryCatch";
import { useLanguage } from "./language-provider";

// USDC uses 6 decimals on every chain it's deployed to.
const USDC_DECIMALS = 6;

type Props = {
  priceCents: number;
  /** Booking context, sent to the server to record the payment + appointment. */
  serviceId: string;
  date: string;
  time: string;
  menuItemId?: string;
  guestLat?: number;
  guestLng?: number;
  /** Called once the USDC transfer is sent (e.g. to show a confirmation). */
  onSuccess?: () => void;
};

// Minimal shape of an EIP-1193 injected wallet (e.g. MetaMask).
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

// Connects the wallet, ensures the right chain, and sends a USDC transfer.
// Throws on any failure so the caller can wrap it with `tryCatch`.
async function sendUsdcTransfer(
  provider: Eip1193Provider,
  opts: { chainId: number; recipient: string; token: string; amount: bigint },
): Promise<string> {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  const from = accounts?.[0];
  if (!from) throw new Error("No wallet account available.");

  // Make sure the wallet is on the configured chain.
  const wantChain = numberToHex(opts.chainId);
  const currentChain = (await provider.request({
    method: "eth_chainId",
  })) as string;
  if (currentChain.toLowerCase() !== wantChain.toLowerCase()) {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: wantChain }],
    });
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [opts.recipient as Hex, opts.amount],
  });

  return (await provider.request({
    method: "eth_sendTransaction",
    params: [{ from, to: opts.token, data }],
  })) as string;
}

type Status = "idle" | "working" | "success";

export function UsdcPayButton({
  priceCents,
  serviceId,
  date,
  time,
  menuItemId,
  guestLat,
  guestLng,
  onSuccess,
}: Props) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const usdc = usdcClientConfig();
  const configured = usdc !== null;

  // Total charged, in USD units, including the service fee.
  const totalUsd = (priceCents * (1 + SERVICE_FEE_RATE)) / 100;

  async function pay() {
    setError(null);

    if (!usdc) {
      setError(t("usdc.notConfigured"));
      return;
    }

    const provider = (window as unknown as { ethereum?: Eip1193Provider })
      .ethereum;
    if (!provider) {
      setError(t("usdc.noWallet"));
      return;
    }

    setStatus("working");
    const amount = parseUnits(totalUsd.toFixed(USDC_DECIMALS), USDC_DECIMALS);
    const result = await tryCatch(
      sendUsdcTransfer(provider, {
        chainId: usdc.chainId,
        recipient: usdc.recipient,
        token: usdc.token,
        amount,
      }),
    );

    if (!result.ok) {
      const err = result.error as Error & { shortMessage?: string };
      setError(err.shortMessage ?? err.message ?? t("usdc.failed"));
      setStatus("idle");
      return;
    }

    // The transfer went through — record the booking + payment server-side so
    // it shows up for the host and in the admin transactions ledger.
    const recorded = await tryCatch(
      fetch("/api/crypto/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time,
          menuItemId: menuItemId || undefined,
          guestLat,
          guestLng,
          txHash: result.data,
          network: String(usdc.chainId),
        }),
      }),
    );
    if (!recorded.ok || !recorded.data.ok) {
      // The funds moved but we couldn't persist it — surface it rather than
      // showing a false "confirmed", so the guest can contact support.
      setError(t("usdc.recordError"));
      setTxHash(result.data);
      setStatus("idle");
      return;
    }

    setTxHash(result.data);
    setStatus("success");
    onSuccess?.();
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-1 rounded-full bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        {t("usdc.sent")}
        {txHash && (
          <span className="truncate text-xs font-normal opacity-80">
            {txHash}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={pay}
        disabled={status === "working" || !configured}
        className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 px-6 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        {status === "working"
          ? t("usdc.confirmWallet")
          : t("usdc.payWith").replace("{amount}", `$${totalUsd.toFixed(2)}`)}
      </button>
      {!configured && (
        <p className="text-center text-xs text-zinc-400">
          {t("usdc.notConfigured")}
        </p>
      )}
      {error && (
        <p className="text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
