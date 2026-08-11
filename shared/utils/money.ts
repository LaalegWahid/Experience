/** Format integer minor units (cents) as a localized currency string. */
export function formatMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Convert a price in major units (e.g. 42.5) to integer cents (4250). */
export function priceToCents(value: number): number {
  return Math.round(value * 100);
}

/** Convert integer cents to a fixed-2 string for a form input default. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
