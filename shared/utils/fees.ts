// Platform economics, in one place so card checkout, crypto checkout, and the
// refund math can never drift apart.

/**
 * The service fee added on top of the base price at checkout. Charged on every
 * booking, referred or not.
 */
export const SERVICE_FEE_RATE = 0.1; // 10%

/**
 * The referrer's cut of a referred booking, as a fraction of the base service
 * price (not the fee). On a $100 service the referrer earns $4; the platform
 * keeps the remaining $6 of the 10% fee.
 */
export const REFERRAL_RATE = 0.04; // 4% of base

/** The referrer's earning for a booking, in minor units. */
export function referralEarningCents(baseCents: number): number {
  return Math.round(baseCents * REFERRAL_RATE);
}
