import type { ChainFamily } from "@/shared/data/payouts";

/** Strip spaces and uppercase an IBAN for storage/validation. */
export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/**
 * Validate an IBAN structurally and with the ISO 7064 mod-97 checksum.
 * Accepts spaced input (normalize first).
 */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  // Move the first four chars to the end, then replace letters with digits
  // (A=10 … Z=35) and compute the running remainder mod 97.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const chunk =
      ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const digit of chunk) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder === 1;
}

const BIC_RE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** Validate a BIC/SWIFT code (8 or 11 chars). */
export function isValidBic(raw: string): boolean {
  return BIC_RE.test(raw.replace(/\s+/g, "").toUpperCase());
}

/** Light, per-network sanity check for a wallet address. */
export function isValidWalletAddress(
  address: string,
  family: ChainFamily,
): boolean {
  const a = address.trim();
  switch (family) {
    case "evm":
      return /^0x[a-fA-F0-9]{40}$/.test(a);
    case "tron":
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a);
    case "solana":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  }
}
