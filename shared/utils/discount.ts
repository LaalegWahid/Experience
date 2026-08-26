// Discount helpers shared by the host wizard, the manage-listing page, and the
// public listing page so the price math stays identical everywhere.

export type ListingDiscounts = {
  limitedTime?: boolean;
  earlyBird?: boolean;
  limitedTimePercent?: number;
  earlyBirdPercent?: number;
  largeGroup?: { minGuests: number; percent: number }[];
};

/** Percentages are host-entered; keep them a whole number within a sane range. */
export function clampDiscountPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(90, Math.round(percent)));
}

/**
 * The single best discount to apply to a listing's price. A deal counts only
 * when it's switched on AND has an explicit percentage, so legacy listings that
 * merely toggled a discount (no percent) keep their full price. When both apply
 * we surface the larger one, matching "biggest savings for guests".
 */
export function effectiveDiscountPercent(
  discounts?: ListingDiscounts | null,
): number {
  if (!discounts) return 0;
  const limited =
    discounts.limitedTime && discounts.limitedTimePercent
      ? discounts.limitedTimePercent
      : 0;
  const early =
    discounts.earlyBird && discounts.earlyBirdPercent
      ? discounts.earlyBirdPercent
      : 0;
  return clampDiscountPercent(Math.max(limited, early));
}

/** Apply a whole-number percent discount to a cents (or major-unit) amount. */
export function applyDiscount(amount: number, percent: number): number {
  if (!percent) return amount;
  return Math.round(amount * (1 - clampDiscountPercent(percent) / 100));
}
