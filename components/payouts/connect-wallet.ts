import type { ChainFamily } from "@/shared/data/payouts";

// Minimal shapes for the injected wallet providers we read an address from.
// We only ever request accounts — no signing, no transactions.
type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};
type SolanaProvider = {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  publicKey?: { toString(): string };
};
type TronLink = { request(args: { method: string }): Promise<unknown> };
type TronWeb = { defaultAddress?: { base58?: string } };

type WalletWindow = Window & {
  ethereum?: Eip1193Provider;
  solana?: SolanaProvider;
  tronLink?: TronLink;
  tronWeb?: TronWeb;
};

/** Human-friendly wallet name to suggest per chain family. */
const SUGGESTED: Record<ChainFamily, string> = {
  evm: "MetaMask",
  solana: "Phantom",
  tron: "TronLink",
};

/**
 * Ask the browser wallet matching `family` for its address. Returns the
 * connected address, or throws an Error with a message safe to show the host
 * (e.g. when no compatible wallet is installed, or they reject the prompt).
 */
export async function connectWallet(family: ChainFamily): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser.");
  }
  const w = window as WalletWindow;

  if (family === "evm") {
    if (!w.ethereum) {
      throw new Error(`No Ethereum wallet found. Install ${SUGGESTED.evm} or enter your address manually.`);
    }
    const accounts = (await w.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[] | undefined;
    const address = accounts?.[0];
    if (!address) throw new Error("Your wallet didn't return an account.");
    return address;
  }

  if (family === "solana") {
    if (!w.solana?.connect) {
      throw new Error(`No Solana wallet found. Install ${SUGGESTED.solana} or enter your address manually.`);
    }
    const res = await w.solana.connect();
    const address = res.publicKey?.toString() ?? w.solana.publicKey?.toString();
    if (!address) throw new Error("Your wallet didn't return an account.");
    return address;
  }

  // tron
  if (!w.tronLink?.request) {
    throw new Error(`No Tron wallet found. Install ${SUGGESTED.tron} or enter your address manually.`);
  }
  await w.tronLink.request({ method: "tron_requestAccounts" });
  const address = w.tronWeb?.defaultAddress?.base58;
  if (!address) {
    throw new Error("Couldn't read your Tron address. Unlock TronLink and try again.");
  }
  return address;
}
