// Options for host payout methods. `value`s MUST match the pgEnums in
// db/schema.ts. Shared between the payout form (client) and the save action
// (server), so this file stays free of server-only dependencies.

export type Option<T extends string> = { value: T; label: string };

export const PAYOUT_TYPES = [
  { value: "bank", label: "Bank account (RIB / IBAN)" },
  { value: "crypto", label: "Crypto wallet (stablecoin)" },
] as const satisfies readonly Option<"bank" | "crypto">[];

export type ChainFamily = "evm" | "tron" | "solana";

// Networks we can pay stablecoins on. `family` drives address validation.
export const PAYOUT_CHAINS = [
  { value: "ethereum", label: "Ethereum", family: "evm" },
  { value: "polygon", label: "Polygon", family: "evm" },
  { value: "base", label: "Base", family: "evm" },
  { value: "arbitrum", label: "Arbitrum", family: "evm" },
  { value: "optimism", label: "Optimism", family: "evm" },
  { value: "tron", label: "Tron", family: "tron" },
  { value: "solana", label: "Solana", family: "solana" },
] as const satisfies readonly (Option<string> & { family: ChainFamily })[];

export const STABLECOINS = [
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT" },
] as const satisfies readonly Option<"USDC" | "USDT">[];

/** The address family for a given chain value, or undefined if unknown. */
export function chainFamily(chain: string): ChainFamily | undefined {
  return PAYOUT_CHAINS.find((c) => c.value === chain)?.family;
}
