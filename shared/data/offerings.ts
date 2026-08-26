// Display labels for the offering enums defined in db/schema.ts. Kept in one
// place so the host forms, dashboard, and (later) the public browse UI all read
// from the same source. `value`s MUST match the pgEnum values exactly.

export type Option<T extends string> = { value: T; label: string };

export const OFFERING_TYPES = [
  { value: "experience", label: "Experience" },
  { value: "service", label: "Service" },
] as const satisfies readonly Option<"experience" | "service">[];

export const OFFERING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly Option<"draft" | "published" | "archived">[];

export const OFFERING_FORMATS = [
  { value: "public_group", label: "Public group" },
  { value: "private_group", label: "Private group" },
  { value: "one_on_one", label: "One-on-one" },
  { value: "class_workshop", label: "Class / workshop" },
] as const satisfies readonly Option<
  "public_group" | "private_group" | "one_on_one" | "class_workshop"
>[];

export const LOCATION_TYPES = [
  { value: "at_host", label: "At my location" },
  { value: "at_guest", label: "I travel to the guest" },
  { value: "online", label: "Online" },
] as const satisfies readonly Option<"at_host" | "at_guest" | "online">[];

export const PRICING_TYPES = [
  { value: "per_person", label: "Per person" },
  { value: "per_booking", label: "Per booking (flat)" },
] as const satisfies readonly Option<"per_person" | "per_booking">[];

// The only currencies payments are accepted in.
export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
] as const satisfies readonly Option<"USD" | "EUR">[];
export type Currency = (typeof CURRENCIES)[number]["value"];
export const CURRENCY_VALUES = ["USD", "EUR"] as const;

export const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible: full refund up to 24h before" },
  { value: "moderate", label: "Moderate: full refund up to 5 days before" },
  { value: "strict", label: "Strict: 50% refund up to 7 days before" },
] as const satisfies readonly Option<"flexible" | "moderate" | "strict">[];

// ISO-8601 weekdays (1 = Monday … 7 = Sunday) for the recurring weekly schedule.
export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

// Legacy landing-page category grid. No longer used by the host forms or the
// browse UI (those read the per-type SERVICE_CATEGORIES / EXPERIENCE_CATEGORIES).
// Retained only because an out-of-tree copy still imports it.
export const CATEGORIES = [
  "Activities & tours",
  "Classes & workshops",
  "Wellness",
  "Private dining",
  "Personal services",
  "Studios & agencies",
  "Other",
] as const;

/** Look up a label for a given enum value, falling back to the raw value. */
export function labelFor(
  options: readonly Option<string>[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
