/**
 * Stable TanStack Query keys for the admin dashboard. Shared between each
 * page's server-side prefetch and its client `useQuery`, so the dehydrated
 * cache hydrates onto the matching key (no refetch, no loading flash), and
 * mutations can invalidate exactly what changed.
 */
export const adminKeys = {
  overview: ["admin", "overview"] as const,
  users: ["admin", "users"] as const,
  reservations: ["admin", "reservations"] as const,
  listings: ["admin", "listings"] as const,
  transactions: ["admin", "transactions"] as const,
  referrals: ["admin", "referrals"] as const,
  reports: ["admin", "reports"] as const,
} as const;
