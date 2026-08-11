import { createHash, randomBytes } from "node:crypto";

// Live keys look like `lm_live_<32 url-safe chars>`. Only the SHA-256 hash is
// ever stored; the raw value is shown to the developer exactly once.
const KEY_PREFIX = "lm_live_";

export type GeneratedApiKey = {
  /** The full secret — returned to the user once, never persisted. */
  raw: string;
  /** A short, non-sensitive identifier stored for display in the dashboard. */
  prefix: string;
  /** SHA-256 hex of the raw key — the only copy kept in the database. */
  hash: string;
};

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("base64url"); // 32 chars
  const raw = `${KEY_PREFIX}${secret}`;
  return {
    raw,
    prefix: raw.slice(0, KEY_PREFIX.length + 4), // e.g. "lm_live_a1b2"
    hash: hashApiKey(raw),
  };
}
