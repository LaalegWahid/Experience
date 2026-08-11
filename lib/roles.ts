// Shared role definitions — no server-only dependencies, so this can be
// imported from both server code (lib/auth.ts) and client components.
export const ROLES = ["guest", "host", "admin"] as const;
export type Role = (typeof ROLES)[number];

// The default role assigned to a new account.
export const DEFAULT_ROLE: Role = "guest";


export const SELF_REGISTERABLE_ROLES = ["guest"] as const satisfies readonly Role[];
export type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];

export function isSelfRegisterableRole(value: unknown): value is SelfRegisterableRole {
  return (
    typeof value === "string" &&
    (SELF_REGISTERABLE_ROLES as readonly string[]).includes(value)
  );
}
