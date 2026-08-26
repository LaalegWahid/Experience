"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { emptyFormState, type FormState } from "@/shared/utils/form";
import {
  chainFamily,
  PAYOUT_CHAINS,
  PAYOUT_TYPES,
  STABLECOINS,
  type ChainFamily,
} from "@/shared/data/payouts";
import { connectWallet } from "./connect-wallet";

export type PayoutDefaults = Partial<{
  type: string;
  accountHolderName: string;
  iban: string;
  bic: string;
  bankName: string;
  country: string;
  walletAddress: string;
  chain: string;
  stablecoin: string;
}>;

type PayoutAction = (prev: FormState, formData: FormData) => Promise<FormState>;

const inputClass =
  "rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground dark:border-zinc-700 dark:focus:border-zinc-300";
const labelClass =
  "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <span className="text-xs font-normal text-red-600 dark:text-red-400">
      {messages[0]}
    </span>
  );
}

/**
 * The shared bank/wallet payout fields. The submit `action`, button labels, and
 * field labels are injected so the same form serves both host payouts and
 * referrer payouts.
 */
export function PayoutMethodForm({
  action,
  defaults = {},
  labels,
  redirectTo,
}: {
  action: PayoutAction;
  defaults?: PayoutDefaults;
  /** When set, navigate here after a successful save (e.g. back to the service). */
  redirectTo?: string;
  labels: {
    method: string;
    accountHolder: string;
    iban: string;
    bicOptional: string;
    countryOptional: string;
    bankNameOptional: string;
    network: string;
    stablecoin: string;
    walletAddress: string;
    walletHint: string;
    submit: string;
    submitting: string;
    saved: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const [type, setType] = useState(defaults.type ?? "bank");
  const [stablecoin, setStablecoin] = useState(defaults.stablecoin ?? "USDC");
  const [chain, setChain] = useState(defaults.chain ?? "ethereum");
  const family = chainFamily(chain) ?? "evm";

  // Wallet connection: the address comes from the host's browser wallet, with a
  // manual-entry fallback for chains/wallets that can't be connected.
  const [walletAddress, setWalletAddress] = useState(defaults.walletAddress ?? "");
  const [connectedFamily, setConnectedFamily] = useState<ChainFamily | null>(
    defaults.walletAddress ? chainFamily(defaults.chain ?? "ethereum") ?? null : null,
  );
  const [manualEntry, setManualEntry] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  async function handleConnect() {
    setWalletError(null);
    setConnecting(true);
    try {
      const addr = await connectWallet(family);
      setWalletAddress(addr);
      setConnectedFamily(family);
      setManualEntry(false);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Couldn't connect your wallet.");
    } finally {
      setConnecting(false);
    }
  }

  function resetWallet() {
    setWalletAddress("");
    setConnectedFamily(null);
    setWalletError(null);
  }

  const errs = state.fieldErrors;
  const router = useRouter();

  // Once the save succeeds, return the user to where they came from (if asked).
  useEffect(() => {
    if (state.ok && redirectTo) router.push(redirectTo);
  }, [state.ok, redirectTo, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className={labelClass}>
        <span>{labels.method}</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAYOUT_TYPES.map((opt) => {
            const selected = type === opt.value;
            const m = opt.label.match(/^(.+?)\s*\((.+)\)$/);
            const title = m?.[1] ?? opt.label;
            const subtitle = m ? m[2].charAt(0).toUpperCase() + m[2].slice(1) : "";
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                  selected
                    ? "border-foreground bg-accent/5 ring-1 ring-foreground"
                    : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => setType(e.target.value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-accent/15 text-accent"
                      : "bg-zinc-100 text-foreground dark:bg-zinc-800"
                  }`}
                >
                  {opt.value === "bank" ? <BankIcon /> : <CoinIcon />}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                  {subtitle && (
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {subtitle}
                    </span>
                  )}
                </span>
                <span
                  className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected && <CheckIcon />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {type === "bank" ? (
        <div className="flex flex-col gap-5">
          <label className={labelClass}>
            {labels.accountHolder}
            <input
              name="accountHolderName"
              defaultValue={defaults.accountHolderName}
              className={inputClass}
            />
            <FieldError messages={errs?.accountHolderName} />
          </label>
          <label className={labelClass}>
            {labels.iban}
            <input
              name="iban"
              defaultValue={defaults.iban}
              placeholder="FR76 3000 6000 0112 3456 7890 189"
              className={`${inputClass} font-mono`}
            />
            <FieldError messages={errs?.iban} />
          </label>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              {labels.bicOptional}
              <input
                name="bic"
                defaultValue={defaults.bic}
                className={`${inputClass} font-mono`}
              />
              <FieldError messages={errs?.bic} />
            </label>
            <label className={labelClass}>
              {labels.countryOptional}
              <input
                name="country"
                defaultValue={defaults.country}
                className={inputClass}
              />
            </label>
          </div>
          <label className={labelClass}>
            {labels.bankNameOptional}
            <input
              name="bankName"
              defaultValue={defaults.bankName}
              className={inputClass}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <label className={labelClass}>
            {labels.network}
            <select
              name="chain"
              value={chain}
              onChange={(e) => {
                const next = e.target.value;
                setChain(next);
                // A connected address is only valid for its own chain family;
                // drop it when switching to an incompatible network.
                if (connectedFamily && chainFamily(next) !== connectedFamily) {
                  resetWallet();
                }
              }}
              className={inputClass}
            >
              {PAYOUT_CHAINS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <FieldError messages={errs?.chain} />
          </label>

          <fieldset className={labelClass}>
            <span>{labels.stablecoin}</span>
            <div className="grid grid-cols-2 gap-2">
              {STABLECOINS.map((s) => {
                const selected = stablecoin === s.value;
                return (
                  <label
                    key={s.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                      selected
                        ? "border-foreground bg-accent/5 ring-1 ring-foreground"
                        : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="stablecoin"
                      value={s.value}
                      checked={selected}
                      onChange={() => setStablecoin(s.value)}
                      className="sr-only"
                    />
                    <CoinBadge symbol={s.value} />
                    <span className="text-sm font-semibold text-foreground">{s.label}</span>
                  </label>
                );
              })}
            </div>
            <FieldError messages={errs?.stablecoin} />
          </fieldset>
          <div className={labelClass}>
            <span>{labels.walletAddress}</span>
            {/* The submitted value — set by Connect or manual entry below. */}
            <input type="hidden" name="walletAddress" value={walletAddress} />

            {walletAddress && !manualEntry ? (
              <div className="flex items-center gap-3 rounded-xl border border-foreground bg-accent/5 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <WalletIcon />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Wallet connected
                  </span>
                  <span className="truncate font-mono text-sm text-foreground">
                    {shortAddress(walletAddress)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetWallet}
                  className="ml-auto shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : manualEntry ? (
              <>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x… / T… / base58"
                  className={`${inputClass} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setManualEntry(false);
                    setWalletAddress("");
                  }}
                  className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  Connect a wallet instead
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/5 disabled:opacity-60"
                >
                  <WalletIcon />
                  {connecting ? "Connecting…" : "Connect wallet"}
                </button>
                <button
                  type="button"
                  onClick={() => setManualEntry(true)}
                  className="self-start text-sm font-medium text-zinc-500 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
                >
                  Enter address manually
                </button>
              </>
            )}

            {walletError && (
              <span className="text-xs font-normal text-red-600 dark:text-red-400">
                {walletError}
              </span>
            )}
            <FieldError messages={errs?.walletAddress} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {labels.walletHint}
          </p>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {labels.saved}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}

/** Truncate a long wallet address for display (full value still submitted). */
function shortAddress(a: string): string {
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
      <path d="M16 12h.01" />
    </svg>
  );
}
function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V10M9.5 21V10M14.5 21V10M19 21V10" />
      <path d="M3 10h18L12 4 3 10Z" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
/** A small brand-coloured coin chip for the supported stablecoins. */
function CoinBadge({ symbol }: { symbol: string }) {
  const color = symbol === "USDC" ? "#2775CA" : "#26A17B";
  const glyph = symbol === "USDC" ? "$" : "₮";
  return (
    <span
      style={{ backgroundColor: color }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
