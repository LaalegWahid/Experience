"use client";

import { useState } from "react";
import { createWalletClient, custom, numberToHex, type Hex } from "viem";
import { tryCatch } from "@/shared/utils/TryCatch";

// x402 network id → EVM chain id.
const CHAIN_IDS: Record<string, number> = { base: 8453, "base-sepolia": 84532 };

// Minimal injected-wallet shape (e.g. MetaMask), same as usdc-pay-button.
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type StepKey = "challenge" | "sign" | "settle";
type StepState = "idle" | "active" | "done" | "error";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "challenge", label: "Request booking → receive 402 payment details" },
  { key: "sign", label: "Sign the USDC payment in your wallet" },
  { key: "settle", label: "Settle on-chain & create the booking" },
];

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" +
    [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")) as Hex;
}

const inputClass =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700";

type Result = { status: number; body: string; settle: string | null };

export function X402BookingDemo({
  offeringId: initialOfferingId,
  date: initialDate,
  time: initialTime,
  x402Enabled,
}: {
  offeringId: string;
  date: string;
  time: string;
  x402Enabled: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [offeringId, setOfferingId] = useState(initialOfferingId);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);

  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    challenge: "idle",
    sign: "idle",
    settle: "idle",
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const setStep = (key: StepKey, state: StepState) =>
    setSteps((s) => ({ ...s, [key]: state }));

  async function run() {
    setError(null);
    setResult(null);
    setSteps({ challenge: "idle", sign: "idle", settle: "idle" });

    if (!apiKey.trim()) {
      setError("Paste an API key first (create one above).");
      return;
    }
    const provider = (window as unknown as { ethereum?: Eip1193Provider })
      .ethereum;
    if (!provider) {
      setError("No Ethereum wallet found. Install MetaMask to pay with USDC.");
      return;
    }

    setRunning(true);
    const outcome = await tryCatch(payAndBook(provider));
    setRunning(false);
    if (!outcome.ok) {
      const err = outcome.error as Error & { shortMessage?: string };
      setError(err.shortMessage ?? err.message ?? "Payment failed.");
    }
  }

  async function payAndBook(provider: Eip1193Provider) {
    const url = "/api/v1/bookings";
    const body = JSON.stringify({ offeringId, date, time });
    const baseHeaders: Record<string, string> = {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    };

    // 1) Read the 402 challenge.
    setStep("challenge", "active");
    const res1 = await fetch(url, { method: "POST", headers: baseHeaders, body });
    if (res1.status !== 402) {
      // x402 disabled (free booking) or an error — just show it.
      const text = await res1.text();
      setStep("challenge", res1.ok ? "done" : "error");
      setResult({ status: res1.status, body: pretty(text), settle: null });
      if (!res1.ok) throw new Error(`Expected 402, got ${res1.status}.`);
      return;
    }
    const challenge = await res1.json();
    const req = challenge.accepts?.[0];
    if (!req) throw new Error("402 response had no payment requirements.");
    setStep("challenge", "done");

    // 2) Sign the EIP-3009 USDC authorization with the wallet.
    setStep("sign", "active");
    const chainId = CHAIN_IDS[req.network];
    if (!chainId) throw new Error(`Unknown network "${req.network}".`);

    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    const from = accounts?.[0] as Hex;
    if (!from) throw new Error("No wallet account available.");

    const wantChain = numberToHex(chainId);
    const currentChain = (await provider.request({
      method: "eth_chainId",
    })) as string;
    if (currentChain.toLowerCase() !== wantChain.toLowerCase()) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: wantChain }],
      });
    }

    const validAfter = BigInt(0);
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 600);
    const nonce = randomNonce();

    const wallet = createWalletClient({ account: from, transport: custom(provider) });
    const signature = await wallet.signTypedData({
      account: from,
      domain: {
        name: req.extra?.name,
        version: req.extra?.version,
        chainId,
        verifyingContract: req.asset as Hex,
      },
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from,
        to: req.payTo as Hex,
        value: BigInt(req.maxAmountRequired),
        validAfter,
        validBefore,
        nonce,
      },
    });

    const paymentPayload = {
      x402Version: challenge.x402Version ?? 1,
      scheme: req.scheme,
      network: req.network,
      payload: {
        signature,
        authorization: {
          from,
          to: req.payTo,
          value: req.maxAmountRequired,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };
    const xPayment = btoa(JSON.stringify(paymentPayload));
    setStep("sign", "done");

    // 3) Retry with the payment to settle + book.
    setStep("settle", "active");
    const res2 = await fetch(url, {
      method: "POST",
      headers: { ...baseHeaders, "X-PAYMENT": xPayment },
      body,
    });
    const text2 = await res2.text();
    const settleHeader = res2.headers.get("x-payment-response");
    setStep("settle", res2.ok ? "done" : "error");
    setResult({
      status: res2.status,
      body: pretty(text2),
      settle: settleHeader ? safeAtob(settleHeader) : null,
    });
  }

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800 sm:p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Pay & book with x402
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {x402Enabled
            ? "Run the full agent payment flow from your browser wallet. It fetches the 402 challenge, signs a USDC payment, and books. No private key needed; your wallet signs."
            : "x402 isn't enabled (X402_PAY_TO is unset), so this will book for free. Set it to require USDC payment."}
        </p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        API key
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="lm_live_…"
          spellCheck={false}
          className={`${inputClass} font-mono`}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Offering ID
          <input
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Date
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="2026-07-01"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Time
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="14:00"
            className={inputClass}
          />
        </label>
      </div>

      {/* Live step indicator */}
      <ol className="flex flex-col gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3 text-sm">
            <StepBadge state={steps[s.key]} index={i + 1} />
            <span
              className={
                steps[s.key] === "idle"
                  ? "text-zinc-400"
                  : steps[s.key] === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
              }
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {running ? "Running…" : x402Enabled ? "Pay & book with USDC" : "Book"}
      </button>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs font-semibold ${
              result.status >= 200 && result.status < 300
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            HTTP {result.status}
          </span>
          {result.settle && (
            <pre className="overflow-auto rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              X-PAYMENT-RESPONSE: {result.settle}
            </pre>
          )}
          <pre className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/40">
            {result.body}
          </pre>
        </div>
      )}
    </section>
  );
}

function StepBadge({ state, index }: { state: StepState; index: number }) {
  const base =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold";
  if (state === "done") {
    return (
      <span className={`${base} bg-emerald-500 text-white`}>✓</span>
    );
  }
  if (state === "error") {
    return <span className={`${base} bg-red-500 text-white`}>!</span>;
  }
  if (state === "active") {
    return (
      <span className={`${base} animate-pulse bg-accent text-accent-foreground`}>
        {index}
      </span>
    );
  }
  return (
    <span
      className={`${base} border border-zinc-300 text-zinc-400 dark:border-zinc-600`}
    >
      {index}
    </span>
  );
}

function pretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function safeAtob(b64: string): string {
  try {
    return atob(b64);
  } catch {
    return b64;
  }
}
